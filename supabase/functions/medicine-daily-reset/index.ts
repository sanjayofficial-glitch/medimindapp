import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Mark all pending dose_logs as 'missed' for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayDate = `${yyyy}-${mm}-${dd}`;

    const { error: missError } = await supabase
      .from('dose_logs')
      .update({ status: 'missed' })
      .eq('date', yesterdayDate)
      .eq('status', 'pending');

    if (missError) throw missError;
    console.log(`[medicine-daily-reset] Marked pending as missed for ${yesterdayDate}`);

    // 2. Get all users with active medicines that have no dose_log for today
    const today = new Date();
    const todayYYYY = today.getFullYear();
    const todayMM = String(today.getMonth() + 1).padStart(2, '0');
    const todayDD = String(today.getDate()).padStart(2, '0');
    const todayDate = `${todayYYYY}-${todayMM}-${todayDD}`;

    const { data: existingTodayLogs, error: existingError } = await supabase
      .from('dose_logs')
      .select('user_id, medicine_id, scheduled_time')
      .eq('date', todayDate);

    if (existingError) throw existingError;

    const { data: allMedicines, error: medicinesError } = await supabase
      .from('medicines')
      .select('id, user_id, family_member_id, name, times')
      .or('end_date.is.null,end_date.gte.' + todayDate);

    if (medicinesError) throw medicinesError;

    const existingKeys = new Set(
      (existingTodayLogs || []).map(
        (l: { user_id: string; medicine_id: string; scheduled_time: string }) =>
          `${l.user_id}-${l.medicine_id}-${l.scheduled_time}`
      )
    );

    const toInsert = ((allMedicines || []) as Array<{
      id: string;
      user_id: string;
      family_member_id: string;
      name: string;
      times: string[];
    }>).flatMap((med) =>
      (med.times || [])
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .filter((scheduledTime) => !existingKeys.has(`${med.user_id}-${med.id}-${scheduledTime}`))
        .map((scheduledTime) => ({
          id: crypto.randomUUID(),
          user_id: med.user_id,
          family_member_id: med.family_member_id,
          medicine_id: med.id,
          medicine_name: med.name,
          scheduled_time: scheduledTime,
          actual_time: null,
          date: todayDate,
          status: 'pending',
          notification_sent_at: null,
          notification_error: null,
        }))
    );

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('dose_logs').insert(toInsert);
      if (insertError) throw insertError;
      console.log(`[medicine-daily-reset] Created ${toInsert.length} dose logs for ${todayDate}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        missedCount: existingTodayLogs?.filter((l: { status: string }) => l.status === 'pending').length || 0,
        createdCount: toInsert.length,
        date: todayDate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[medicine-daily-reset] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});