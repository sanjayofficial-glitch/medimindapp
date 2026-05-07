-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions (adjust for your security requirements)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the scheduled job to check due medications every 5 minutes
SELECT cron.schedule(
  'check-due-medications-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT 
    supabase.invoke(
      'check-due-medications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'
    );
  $$
);

-- Alternative: Manually trigger the function via webhook
-- You can create a database webhook that calls the function periodically

-- List scheduled jobs
-- SELECT * FROM cron.job;