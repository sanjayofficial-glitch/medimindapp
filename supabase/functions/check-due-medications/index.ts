import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DoseLogWithMedicine {
  id: string;
  user_id: string;
  medicine_id: string;
  medicine_name: string;
  scheduled_time: string;
  date: string;
  status: string;
  medicines: {
    name: string;
    dosage: string;
    reminder_enabled: boolean;
    reminder_minutes_before: number;
  }[];
}

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
      throw new Error('OneSignal not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date();
    const currentHour = currentTime.getHours().toString().padStart(2, '0');
    const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
    const currentTime24 = `${currentHour}:${currentMinute}`;

    const { data: dueDoses, error: doseError } = await supabase
      .from('dose_logs')
      .select(`
        id,
        user_id,
        medicine_id,
        medicine_name,
        scheduled_time,
        date,
        status,
        medicines (
          name,
          dosage,
          reminder_enabled,
          reminder_minutes_before
        )
      `)
      .eq('date', today)
      .eq('status', 'partial')
      .lte('scheduled_time', currentTime24);

    if (doseError) throw doseError;

    const dosesWithReminders = (dueDoses as unknown as DoseLogWithMedicine[])
      .filter(dose => dose.medicines?.[0]?.reminder_enabled !== false);

    console.log(`[check-due-medications] Found ${dosesWithReminders.length} due doses with reminders enabled`);

    const sentNotifications: string[] = [];
    const failedNotifications: string[] = [];

    for (const dose of dosesWithReminders) {
      const medicine = dose.medicines[0];
      if (!medicine) continue;

      const { data: subscriptions, error: subError } = await supabase
        .from('onesignal_subscriptions')
        .select('player_id')
        .eq('user_id', dose.user_id)
        .eq('is_active', true);

      if (subError || !subscriptions?.length) {
        console.log(`[check-due-medications] No subscriptions for user ${dose.user_id}`);
        continue;
      }

      const playerIds = subscriptions.map((s: { player_id: string }) => s.player_id);
      const message = medicine.dosage
        ? `Time to take ${medicine.name} (${medicine.dosage})`
        : `Time to take ${medicine.name}`;

      const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          contents: { en: message },
          headings: { en: '💊 Medication Reminder' },
          data: {
            action: 'medication_reminder',
            medicine_id: dose.medicine_id,
            dose_log_id: dose.id,
            scheduled_time: dose.scheduled_time,
          },
          priority: 10,
          ttl: 3600,
        }),
      });

      const result = await oneSignalResponse.json();

      if (result.id) {
        sentNotifications.push(dose.id);
        console.log(`[check-due-medications] Sent notification for dose ${dose.id}`);
      } else {
        failedNotifications.push(dose.id);
        console.log(`[check-due-medications] Failed for dose ${dose.id}:`, result);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: dosesWithReminders.length,
        sent: sentNotifications.length,
        failed: failedNotifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[check-due-medications] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});