import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIFICATION_WINDOW_MINUTES = 30;

interface PushSubscription {
  user_id: string;
  player_id?: string;
  timezone?: string | null;
}

interface MedicineSchedule {
  id: string;
  user_id: string;
  family_member_id: string;
  name: string;
  times: string[];
}

interface MedicineDetails {
  name: string;
  dosage: string | null;
  reminder_enabled: boolean | null;
}

interface DoseLogWithMedicine {
  id: string;
  user_id: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_time: string;
  date: string;
  status: string;
  notification_sent_at: string | null;
  medicines: MedicineDetails | MedicineDetails[] | null;
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

const getZonedDateTime = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '00';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
};

const to24HourTime = (time: string): string => {
  if (!time) return '00:00';
  
  // Already in 24h format
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  
  const trimmed = time.trim();
  const [timePart, period = 'AM'] = trimmed.split(' ');
  const [hourPart, minute = '00'] = timePart.split(':');
  
  let hour = Number(hourPart);
  if (Number.isNaN(hour)) return '08:00'; // Default fallback
  
  // Handle period
  const periodUpper = period.toUpperCase();
  if (periodUpper === 'PM' && hour < 12) hour += 12;
  if (periodUpper === 'AM' && hour === 12) hour = 0;
  
  // Handle single digit hour without period (e.g., "8:00" should be 08:00)
  if (hourPart.length === 1 && !period) {
    hour = Number(hourPart);
  }
  
  return `${hour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const getMedicine = (dose: DoseLogWithMedicine) => {
  if (Array.isArray(dose.medicines)) return dose.medicines[0] || null;
  return dose.medicines;
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

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      throw new Error('OneSignal not configured (missing ONESIGNAL_APP_ID or ONESIGNAL_API_KEY env vars)');
    }

    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from('onesignal_subscriptions')
      .select('user_id, player_id, timezone')
      .eq('is_active', true);

    if (subscriptionError) throw subscriptionError;

    const subscriptions = (activeSubscriptions || []) as PushSubscription[];
    console.log(`[check-due-medications] Active subscriptions: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, checked: 0, sent: 0, failed: 0, message: 'No active push subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userTimezones = new Map<string, string>();
    for (const subscription of subscriptions) {
      if (!userTimezones.has(subscription.user_id)) {
        userTimezones.set(subscription.user_id, normalizeTimezone(subscription.timezone));
      }
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - NOTIFICATION_WINDOW_MINUTES * 60 * 1000);
    const sentNotifications: string[] = [];
    const failedNotifications: string[] = [];
    let checkedCount = 0;

    for (const [userId, timezone] of userTimezones.entries()) {
      const localNow = getZonedDateTime(now, timezone);
      const localWindowStart = getZonedDateTime(windowStart, timezone);
      const crossesMidnight = localWindowStart.date !== localNow.date;

      // Get medicines with reminder enabled (or default to true if column doesn't exist)
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('id, user_id, family_member_id, name, times, reminder_enabled')
        .eq('user_id', userId);

      if (medicinesError) throw medicinesError;
      
      // Filter to only medicines with reminders enabled (default to true if null)
      const activeMedicines = ((medicines || []) as (MedicineSchedule & { reminder_enabled: boolean | null })[])
        .filter(m => m.reminder_enabled !== false);

      const { data: existingLogs, error: existingLogsError } = await supabase
        .from('dose_logs')
        .select('medicine_id, scheduled_time')
        .eq('user_id', userId)
        .eq('date', localNow.date);

      if (existingLogsError) throw existingLogsError;

      const existingDoseKeys = new Set(
        (existingLogs || []).map(
          (log: { medicine_id: string; scheduled_time: string }) =>
            `${log.medicine_id}-${log.scheduled_time}`
        )
      );

      const missingDoseLogs = (activeMedicines).flatMap((medicine) =>
        (medicine.times || [])
          .map((t) => to24HourTime(t || '08:00'))
          .filter((scheduledTime) => !existingDoseKeys.has(`${medicine.id}-${scheduledTime}`))
          .map((scheduledTime) => ({
            id: crypto.randomUUID(),
            user_id: medicine.user_id,
            family_member_id: medicine.family_member_id,
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            scheduled_time: scheduledTime,
            actual_time: null as string | null,
            date: localNow.date,
            status: 'pending',
            notification_sent_at: null as string | null,
            notification_error: null as string | null,
          }))
      );

      if (missingDoseLogs.length > 0) {
        const { error: insertLogsError } = await supabase.from('dose_logs').insert(missingDoseLogs);
        if (insertLogsError) throw insertLogsError;
        console.log(`[check-due-medications] Created ${missingDoseLogs.length} dose logs for user ${userId} on ${localNow.date}`);
      }

      let dueDoseQuery = supabase
        .from('dose_logs')
        .select(`
          id,
          user_id,
          medicine_id,
          medicine_name,
          scheduled_time,
          date,
          status,
          notification_sent_at,
          medicines (
            name,
            dosage,
            reminder_enabled
          )
        `)
        .eq('user_id', userId)
        .eq('date', localNow.date)
        .eq('status', 'pending')
        .is('notification_sent_at', null)
        .lte('scheduled_time', localNow.time);

      if (!crossesMidnight) {
        dueDoseQuery = dueDoseQuery.gte('scheduled_time', localWindowStart.time);
      }

      const { data: dueDoses, error: doseError } = await dueDoseQuery;
      if (doseError) throw doseError;

      const dosesWithReminders = ((dueDoses || []) as unknown as DoseLogWithMedicine[])
        .filter((dose) => getMedicine(dose)?.reminder_enabled !== false);

      console.log(
        `[check-due-medications] User ${userId} (${timezone}): ${localNow.date} ${localNow.time} — ${dosesWithReminders.length} due doses`
      );

      checkedCount += dosesWithReminders.length;

      for (const dose of dosesWithReminders) {
        const medicine = getMedicine(dose);
        const userSubscriptions = subscriptions
          .filter((subscription) => subscription.user_id === dose.user_id && subscription.player_id)
          .map((subscription) => subscription.player_id as string);

        if (userSubscriptions.length === 0) {
          console.log(`[check-due-medications] No active subscriptions for user ${dose.user_id}`);
          continue;
        }

        const medicineName = medicine?.name || dose.medicine_name;
        const dosage = medicine?.dosage;
        const message = dosage
          ? `Time to take ${medicineName} (${dosage})`
          : `Time to take ${medicineName}`;

        console.log(`[check-due-medications] Sending push for dose ${dose.id} (${medicineName})`);

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
              include_subscription_ids: userSubscriptions,
              target_channel: 'push',
              contents: { en: message },
              headings: { en: 'MediMind Reminder' },
              data: {
                action: 'medication_reminder',
                medicine_id: dose.medicine_id,
                dose_log_id: dose.id,
                scheduled_time: dose.scheduled_time,
                medicine_name: medicineName,
              },
              priority: 10,
              ttl: 86400,
            }),
          }
        );

        const result = await oneSignalResponse.json().catch(() => ({}));

        if (oneSignalResponse.ok && result.id) {
          sentNotifications.push(dose.id);
          await supabase
            .from('dose_logs')
            .update({
              notification_sent_at: new Date().toISOString(),
              notification_error: null,
            })
            .eq('id', dose.id);
          console.log(`[check-due-medications] Sent and marked dose ${dose.id}`);
        } else {
          failedNotifications.push(dose.id);
          await supabase
            .from('dose_logs')
            .update({ notification_error: JSON.stringify(result) })
            .eq('id', dose.id);
          console.log(`[check-due-medications] Failed for dose ${dose.id}:`, JSON.stringify(result));
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: checkedCount,
        sent: sentNotifications.length,
        failed: failedNotifications.length,
        sentIds: sentNotifications,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[check-due-medications] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});