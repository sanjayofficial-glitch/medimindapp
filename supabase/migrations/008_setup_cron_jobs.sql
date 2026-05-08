-- Setup pg_cron jobs for medication notifications
-- This migration ensures the cron jobs are properly configured

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- First, unschedule any existing jobs with these names to avoid conflicts
SELECT cron.unschedule('check-due-medications');
SELECT cron.unschedule('medicine-daily-reset');

-- Create a function to safely call edge functions
CREATE OR REPLACE FUNCTION call_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  supabase_url text;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- Supabase projects use the project ID in the URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://tokndrkhxgmckuffbtrd.supabase.co';
  END IF;
  
  -- Call the edge function via HTTP
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Called edge function %: %', function_name, request_id;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the job
  RAISE WARNING 'Failed to call edge function %: %', function_name, SQLERRM;
END;
$$;

-- Schedule check-due-medications to run every 5 minutes
-- This checks for due medications and sends notifications
SELECT cron.schedule(
  'check-due-medications',
  '*/5 * * * *',
  $$
  SELECT call_edge_function('check-due-medications');
  $$
);

-- Schedule medicine-daily-reset to run once at midnight
-- This creates dose logs for the new day
SELECT cron.schedule(
  'medicine-daily-reset',
  '0 0 * * *',
  $$
  SELECT call_edge_function('medicine-daily-reset');
  $$
);

-- Also run daily reset at 6 AM to catch any missed days
SELECT cron.schedule(
  'medicine-daily-reset-morning',
  '0 6 * * *',
  $$
  SELECT call_edge_function('medicine-daily-reset');
  $$
);

-- Verify the jobs are scheduled
SELECT jobname, schedule, active FROM cron.job;