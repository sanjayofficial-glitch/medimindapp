-- Midnight job: reset pending doses and create next day's logs
-- Runs at 00:01 every day

DO $$
BEGIN
  PERFORM cron.unschedule('medicine-daily-reset');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
  'medicine-daily-reset',
  '1 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/medicine-daily-reset',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);