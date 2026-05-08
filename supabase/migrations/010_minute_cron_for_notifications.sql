-- Run scheduled-notifications every minute for exact-time notification delivery
-- This replaces the 5-minute interval with 1-minute precision

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA cron TO postgres;

-- First, unschedule existing jobs
SELECT cron.unschedule('check-due-medications');
SELECT cron.unschedule('scheduled-notifications');

-- Create function to call scheduled-notifications edge function
CREATE OR REPLACE FUNCTION trigger_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Get supabase URL from settings or use default
  SELECT net.http_post(
    url := COALESCE(
      current_setting('app.settings.supabase_url', true),
      'https://tokndrkhxgmckuffbtrd.supabase.co'
    ) || '/functions/v1/scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Scheduled notifications function called: %', request_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call scheduled notifications: %', SQLERRM;
END;
$$;

-- Schedule to run every minute for precise notification timing
SELECT cron.schedule(
  'scheduled-notifications',
  '* * * * *',
  $$
  SELECT trigger_scheduled_notifications();
  $$
);

-- Also keep the daily reset for creating new dose logs
SELECT cron.unschedule('medicine-daily-reset');

CREATE OR REPLACE FUNCTION trigger_medicine_daily_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := COALESCE(
      current_setting('app.settings.supabase_url', true),
      'https://tokndrkhxgmckuffbtrd.supabase.co'
    ) || '/functions/v1/medicine-daily-reset',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Medicine daily reset called: %', request_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call medicine daily reset: %', SQLERRM;
END;
$$;

-- Run daily reset at midnight
SELECT cron.schedule(
  'medicine-daily-reset',
  '0 0 * * *',
  $$
  SELECT trigger_medicine_daily_reset();
  $$
);

-- Verify jobs
SELECT jobname, schedule, active FROM cron.job WHERE jobname IN ('scheduled-notifications', 'medicine-daily-reset');