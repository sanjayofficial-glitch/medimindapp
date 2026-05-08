import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const to24HourTime = (time: string): string => {
  if (!time) return '08:00';
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  const trimmed = time.trim();
  const [timePart, period = 'AM'] = trimmed.split(' ');
  const [hourPart, minute = '00'] = timePart.split(':');
  let hour = Number(hourPart);
  if (Number.isNaN(hour)) return '08:00';
  const periodUpper = period.toUpperCase();
  if (periodUpper === 'PM' && hour < 12) hour += 12;
  if (periodUpper === 'AM' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Get all users and their timezones
    const { data: subscriptions, error: subError } = await supabase
      .from('onesignal_subscriptions')
      .select('user_id, timezone')
      .eq('is_active', true);

    if (subError) throw subError;

    const userTimezones = new Map<string, string>();
    subscriptions?.forEach(s => {
      if (!userTimezones.has(s.user_id)) userTimezones.set(s.user_id, s.timezone || 'UTC');
    });

    // 2. Process each user based on their local date
    for (const [userId, timezone] of userTimezones.entries()) {
      const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
      const yesterdayDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(Date.now() - 86400000));

      // Mark yesterday's pending as missed
      await supabase
        .from('dose_logs')
        .update({ status: 'missed' })
        .eq('user_id', userId)
        .eq('date', yesterdayDate)
        .eq('status', 'pending');

      // Create today's logs if they don't exist
      const { data: meds } = await supabase.from('medicines').select('*').eq('user_id', userId);
      const { data: existing } = await supabase.from('dose_logs').select('medicine_id, scheduled_time').eq('user_id', userId).eq('date', localDate);

      const existingKeys = new Set(existing?.map(e => `${e.medicine_id}-${e.scheduled_time}`));
      
      const toInsert = (meds || []).flatMap(med => 
        (med.times || []).map(t => to24HourTime(t))
          .filter(time => !existingKeys.has(`${med.id}-${time}`))
          .map(time => ({
            user_id: userId,
            family_member_id: med.family_member_id,
            medicine_id: med.id,
            medicine_name: med.name,
            scheduled_time: time,
            date: localDate,
            status: 'pending'
          }))
      );

      if (toInsert.length > 0) {
        await supabase.from('dose_logs').insert(toInsert);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});