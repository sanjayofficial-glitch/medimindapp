-- Create table for tracking exact-time scheduled notifications
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dose_log_id uuid REFERENCES public.dose_logs(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  snoozed_until timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'snoozed', 'failed')),
  notification_type text DEFAULT 'reminder' CHECK (notification_type IN ('reminder', 'snooze', 'missed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for efficient queries on pending notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
ON public.scheduled_notifications(scheduled_for) 
WHERE status = 'pending';

-- Index by user for targeted queries
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
ON public.scheduled_notifications(user_id, status);

-- Add snooze_duration_minutes to dose_logs for default snooze time
ALTER TABLE public.dose_logs 
ADD COLUMN IF NOT EXISTS snooze_duration_minutes integer DEFAULT 10;

-- Create trigger to auto-create scheduled notifications when dose_logs are created
CREATE OR REPLACE FUNCTION create_scheduled_notification_for_dose()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.scheduled_notifications (
      dose_log_id,
      medicine_id,
      user_id,
      scheduled_for,
      status,
      notification_type
    ) VALUES (
      NEW.id,
      NEW.medicine_id,
      NEW.user_id,
      (NEW.date::text || ' ' || NEW.scheduled_time)::timestamp with time zone,
      'pending',
      'reminder'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_create_scheduled_notification ON public.dose_logs;

-- Create the trigger
CREATE TRIGGER trigger_create_scheduled_notification
AFTER INSERT ON public.dose_logs
FOR EACH ROW
EXECUTE FUNCTION create_scheduled_notification_for_dose();

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;