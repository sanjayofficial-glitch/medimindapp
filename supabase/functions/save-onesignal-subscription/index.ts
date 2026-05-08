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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { player_id, device_type, timezone } = await req.json();

    if (!player_id) {
      throw new Error('Missing player_id');
    }

    let subscriptionTimezone = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: subscriptionTimezone }).format(new Date());
    } catch {
      subscriptionTimezone = 'UTC';
    }

    const { data: existingSub, error: existingError } = await supabase
      .from('onesignal_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('player_id', player_id)
      .maybeSingle();

    if (existingError) throw existingError;

    let result;
    if (existingSub) {
      const { data, error } = await supabase
        .from('onesignal_subscriptions')
        .update({ 
          is_active: true, 
          timezone: subscriptionTimezone,
          device_type: device_type || 'web',
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingSub.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('onesignal_subscriptions')
        .insert({
          user_id: user.id,
          player_id,
          device_type: device_type || 'web',
          timezone: subscriptionTimezone,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('[save-onesignal-subscription] Subscription saved for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[save-onesignal-subscription] Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
