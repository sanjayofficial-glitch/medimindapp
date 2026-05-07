-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enable HTTP extension for calling edge functions
CREATE EXTENSION IF NOT EXISTS http;

-- Create a function to check and send due medication notifications
CREATE OR REPLACE FUNCTION check_due_medications_and_notify()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  response RECORD;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE NOTICE 'Supabase settings not configured';
    RETURN;
  END IF;

  -- Call the edge function via HTTP
  SELECT * INTO response
  FROM http_post(
    supabase_url || '/functions/v1/check-due-medications',
    '{}',
    'application/json',
    format('Bearer %s', service_role_key)
  );

  RAISE NOTICE 'Check due medications function called';
END;
$$;

-- Schedule the job to run every 5 minutes
-- Note: This may need adjustments based on your Supabase plan
SELECT cron.schedule(
  'check-due-medications',
  '*/5 * * * *',
  $$
  SELECT check_due_medications_and_notify();
  $$
);

-- Uncomment to test:
-- SELECT check_due_medications_and_notify();