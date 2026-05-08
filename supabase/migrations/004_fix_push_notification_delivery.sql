-- Store the user's browser timezone with their push subscription.
ALTER TABLE public.onesignal_subscriptions
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Track delivery so reminders are not repeatedly pushed every cron run.
ALTER TABLE public.dose_logs
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_error TEXT;

CREATE INDEX IF NOT EXISTS idx_dose_logs_due_notifications
ON public.dose_logs(user_id, date, status, scheduled_time)
WHERE notification_sent_at IS NULL;

-- Recreate the scheduled job with pg_net. The function has verify_jwt=false and
-- reads service-role credentials from Edge Function secrets, so this HTTP call
-- does not need to expose a secret in the database.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('check-due-medications');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
  'check-due-medications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/check-due-medications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
