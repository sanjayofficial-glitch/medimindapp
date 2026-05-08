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

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      throw new Error('OneSignal not configured');
    }

    const { user_id, medicine_name, dosage, scheduled_time, medicine_id, dose_log_id } = await req.json();

    if (!user_id || !medicine_name) {
      throw new Error('Missing required fields');
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('onesignal_subscriptions')
      .select('player_id')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[send-medication-notification] No active subscriptions for user:', user_id);
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playerIds = subscriptions.map((s: { player_id: string }) => s.player_id);
    const message = dosage 
      ? `Time to take ${medicine_name} (${dosage})` 
      : `Time to take ${medicine_name}`;

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications?c=push', {
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
        headings: { en: '💊 Medication Reminder' },
        data: {
          action: 'medication_reminder',
          medicine_id,
          dose_log_id,
          scheduled_time,
        },
        priority: 10,
        ttl: 86400,
      }),
    });

    const result = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      throw new Error(`OneSignal error: ${JSON.stringify(result)}`);
    }

    console.log('[send-medication-notification] Sent to:', playerIds, 'Response:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients: playerIds.length,
        onesignal_response: result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-medication-notification] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
