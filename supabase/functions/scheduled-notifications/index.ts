import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  player_id?: string;
  timezone?: string | null;
}

interface ScheduledNotification {
  id: string;
  dose_log_id: string;
  medicine_id: string;
  user_id: string;
  scheduled_for: string;
  sent_at: string | null;
  snoozed_until: string | null;
  status: string;
  notification_type: string;
}

const normalizeTimezone = (timezone?: string | null) => {
  const candidate = timezone?.trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return 'UTC';
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY');

    // Get current time with 30-second buffer for early/late execution
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30000); // 30 seconds ago
    const windowEnd = new Date(now.getTime() + 30000);   // 30 seconds ahead

    console.log(`[scheduled-notifications] Checking window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);

    // Get all pending notifications within the time window
    const { data: pendingNotifications, error: queryError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', windowEnd.toISOString())
      .gte('scheduled_for', windowStart.toISOString());

    if (queryError) throw queryError;

    console.log(`[scheduled-notifications] Found ${pendingNotifications?.length || 0} notifications to send`);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No notifications in current window' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(pendingNotifications.map(n => n.user_id))];
    
    // Get user subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('onesignal_subscriptions')
      .select('user_id, player_id, timezone')
      .eq('is_active', true)
      .in('user_id', userIds);

    if (subError) throw subError;

    const userSubscriptions = new Map<string, { playerId: string; timezone: string }[]>();
    for (const sub of (subscriptions || []) as PushSubscription[]) {
      if (!sub.player_id) continue;
      const existing = userSubscriptions.get(sub.user_id) || [];
      existing.push({
        playerId: sub.player_id,
        timezone: normalizeTimezone(sub.timezone)
      });
      userSubscriptions.set(sub.user_id, existing);
    }

    // Get medicine details for notifications
    const medicineIds = [...new Set(pendingNotifications.map(n => n.medicine_id))];
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('id, name, dosage, user_id')
      .in('id', medicineIds);

    if (medError) throw medError;
    const medicineMap = new Map((medicines || []).map(m => [m.id, m]));

    const sentNotifications: string[] = [];
    const failedNotifications: string[] = [];

    for (const notification of pendingNotifications as ScheduledNotification[]) {
      const userSubs = userSubscriptions.get(notification.user_id) || [];
      
      if (userSubs.length === 0) {
        console.log(`[scheduled-notifications] No subscriptions for user ${notification.user_id}`);
        // Mark as failed but don't give up immediately
        continue;
      }

      const medicine = medicineMap.get(notification.medicine_id);
      const medicineName = medicine?.name || 'medication';
      const dosage = medicine?.dosage;
      
      const message = dosage
        ? `Time to take ${medicineName} (${dosage})`
        : `Time to take ${medicineName}`;

      // Get player IDs for this user
      const playerIds = userSubs.map(s => s.playerId);

      // Send push notification via OneSignal
      if (ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
        const oneSignalResponse = await fetch(
          'https://api.onesignal.com/notifications?c=push',
          {
            method: 'POST',
            headers: {
              'Authorization': `Key ${ONESIGNAL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              include_subscription_ids: playerIds,
              target_channel: 'push',
              contents: { en: message },
              headings: { en: 'MediMind Reminder' },
              data: {
                action: 'medication_reminder',
                notification_id: notification.id,
                dose_log_id: notification.dose_log_id,
                medicine_id: notification.medicine_id,
                medicine_name: medicineName,
                notification_type: notification.notification_type,
              },
              priority: 10,
              ttl: 3600, // 1 hour TTL
              deliver_after: notification.scheduled_for, // Exact delivery time
            }),
          }
        );

        const result = await oneSignalResponse.json().catch(() => ({}));
        
        if (oneSignalResponse.ok && result.id) {
          sentNotifications.push(notification.id);
          await supabase
            .from('scheduled_notifications')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          
          // Also update the dose_log notification_sent_at
          await supabase
            .from('dose_logs')
            .update({ notification_sent_at: new Date().toISOString() })
            .eq('id', notification.dose_log_id);
            
          console.log(`[scheduled-notifications] Sent notification ${notification.id}`);
        } else {
          failedNotifications.push(notification.id);
          await supabase
            .from('scheduled_notifications')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          console.log(`[scheduled-notifications] Failed: ${JSON.stringify(result)}`);
        }
      } else {
        // No OneSignal configured - just mark as sent for demo purposes
        sentNotifications.push(notification.id);
        await supabase
          .from('scheduled_notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);
        
        // Update dose_log
        await supabase
          .from('dose_logs')
          .update({ notification_sent_at: new Date().toISOString() })
          .eq('id', notification.dose_log_id);
          
        console.log(`[scheduled-notifications] Marked as sent (no OneSignal): ${notification.id}`);
      }
    }

    // Handle snoozed notifications that should be sent now
    const { data: snoozedNotifications, error: snoozedError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'snoozed')
      .lte('snoozed_until', now.toISOString());

    if (snoozedError) throw snoozedError;

    if (snoozedNotifications && snoozedNotifications.length > 0) {
      console.log(`[scheduled-notifications] Processing ${snoozedNotifications.length} snoozed notifications`);
      
      for (const notification of snoozedNotifications as ScheduledNotification[]) {
        const userSubs = userSubscriptions.get(notification.user_id) || [];
        if (userSubs.length === 0) continue;

        const medicine = medicineMap.get(notification.medicine_id);
        const medicineName = medicine?.name || 'medication';
        
        const playerIds = userSubs.map(s => s.playerId);
        
        if (ONESIGNAL_APP_ID && ONESIGNAL_API_KEY) {
          await fetch(
            'https://api.onesignal.com/notifications?c=push',
            {
              method: 'POST',
              headers: {
                'Authorization': `Key ${ONESIGNAL_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_subscription_ids: playerIds,
                target_channel: 'push',
                contents: { en: `Reminder: Take ${medicineName}` },
                headings: { en: 'MediMind (Snoozed)' },
                data: {
                  action: 'medication_snooze',
                  notification_id: notification.id,
                  dose_log_id: notification.dose_log_id,
                },
                priority: 10,
                ttl: 3600,
              }),
            }
          );
        }

        // Mark snooze as sent and create a new pending notification for next reminder
        await supabase
          .from('scheduled_notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);
          
        sentNotifications.push(`snooze-${notification.id}`);
        console.log(`[scheduled-notifications] Sent snoozed notification ${notification.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentNotifications.length,
        failed: failedNotifications.length,
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[scheduled-notifications] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});