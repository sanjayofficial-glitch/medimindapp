-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enable HTTP extension for calling edge functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to check and send due medication notifications
CREATE OR REPLACE FUNCTION check_due_medications_and_notify()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call the edge function via HTTP
  SELECT net.http_post(
    url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/check-due-medications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Check due medications function called: %', request_id;
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

-- Also schedule every minute for faster notification delivery
-- Note: This may need adjustments based on your Supabase plan
SELECT cron.schedule(
  'check-due-medications-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/check-due-medications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
