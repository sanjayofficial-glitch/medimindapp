import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTIFICATION_WINDOW_MINUTES = 3;

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

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '00';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
};

const to24HourTime = (time: string) => {
  if (/^\d{2}:\d{2}$/.test(time)) return time;

  const [timePart, period = 'AM'] = time.trim().split(' ');
  const [hourPart, minute = '00'] = timePart.split(':');
  let hour = Number(hourPart);
  if (Number.isNaN(hour)) return time;

  if (period.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;

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
      throw new Error('OneSignal not configured');
    }

    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from('onesignal_subscriptions')
      .select('user_id, player_id, timezone')
      .eq('is_active', true);

    if (subscriptionError) throw subscriptionError;

    const subscriptions = (activeSubscriptions || []) as PushSubscription[];
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

      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('id, user_id, family_member_id, name, times')
        .eq('user_id', userId)
        .eq('reminder_enabled', true);

      if (medicinesError) throw medicinesError;

      const { data: existingLogs, error: existingLogsError } = await supabase
        .from('dose_logs')
        .select('medicine_id, scheduled_time')
        .eq('user_id', userId)
        .eq('date', localNow.date);

      if (existingLogsError) throw existingLogsError;

      const existingDoseKeys = new Set(
        (existingLogs || []).map((log: { medicine_id: string; scheduled_time: string }) => `${log.medicine_id}-${log.scheduled_time}`),
      );

      const missingDoseLogs = ((medicines || []) as MedicineSchedule[]).flatMap((medicine) =>
        (medicine.times || [])
          .map(to24HourTime)
          .filter((scheduledTime) => !existingDoseKeys.has(`${medicine.id}-${scheduledTime}`))
          .map((scheduledTime) => ({
            id: crypto.randomUUID(),
            user_id: medicine.user_id,
            family_member_id: medicine.family_member_id,
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            scheduled_time: scheduledTime,
            actual_time: null,
            date: localNow.date,
            status: 'partial',
            notification_sent_at: null,
            notification_error: null,
          }))
      );

      if (missingDoseLogs.length > 0) {
        const { error: insertLogsError } = await supabase
          .from('dose_logs')
          .insert(missingDoseLogs);

        if (insertLogsError) throw insertLogsError;
        console.log(`[check-due-medications] Created ${missingDoseLogs.length} daily dose logs for user ${userId}`);
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
          medicines (
            name,
            dosage,
            reminder_enabled
          )
        `)
        .eq('user_id', userId)
        .eq('date', localNow.date)
        .eq('status', 'partial')
        .is('notification_sent_at', null)
        .lte('scheduled_time', localNow.time);

      if (!crossesMidnight) {
        dueDoseQuery = dueDoseQuery.gte('scheduled_time', localWindowStart.time);
      }

      const { data: dueDoses, error: doseError } = await dueDoseQuery;
      if (doseError) throw doseError;

      const dosesWithReminders = ((dueDoses || []) as unknown as DoseLogWithMedicine[])
        .filter((dose) => getMedicine(dose)?.reminder_enabled !== false);

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
        const message = medicine?.dosage
          ? `Time to take ${medicineName} (${medicine.dosage})`
          : `Time to take ${medicineName}`;

        const oneSignalResponse = await fetch('https://api.onesignal.com/notifications?c=push', {
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
            headings: { en: 'Medication Reminder' },
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

        const result = await oneSignalResponse.json().catch(() => ({}));

        if (oneSignalResponse.ok && result.id) {
          sentNotifications.push(dose.id);
          await supabase
            .from('dose_logs')
            .update({ notification_sent_at: new Date().toISOString(), notification_error: null })
            .eq('id', dose.id);
          console.log(`[check-due-medications] Sent notification for dose ${dose.id}`);
        } else {
          failedNotifications.push(dose.id);
          await supabase
            .from('dose_logs')
            .update({ notification_error: JSON.stringify(result) })
            .eq('id', dose.id);
          console.log(`[check-due-medications] Failed for dose ${dose.id}:`, result);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: checkedCount,
        sent: sentNotifications.length,
        failed: failedNotifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[check-due-medications] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
