-- Fix dose_logs status constraint to include 'pending'
-- This is the root cause of dose logs not being created

-- First, drop the existing constraint (it might have a different name)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dose_logs_status_check' 
        AND conrelid = 'public.dose_logs'::regclass
    ) THEN
        ALTER TABLE public.dose_logs DROP CONSTRAINT dose_logs_status_check;
    END IF;
END
$$;

-- Add new constraint including 'pending' status
ALTER TABLE public.dose_logs 
ADD CONSTRAINT dose_logs_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'taken'::text, 'missed'::text, 'partial'::text]));

-- Add notification_error column if not exists
ALTER TABLE public.dose_logs 
ADD COLUMN IF NOT EXISTS notification_error text;

-- Add reminder_enabled column to medicines if not exists
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true;

-- Add reminder_minutes_before column to medicines if not exists
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS reminder_minutes_before integer DEFAULT 5;

-- Add index for efficient queries on date and status
CREATE INDEX IF NOT EXISTS idx_dose_logs_date_status 
ON public.dose_logs(date, status) 
WHERE status IN ('pending', 'partial');

-- Add index for notification_sent_at queries
CREATE INDEX IF NOT EXISTS idx_dose_logs_notification 
ON public.dose_logs(notification_sent_at) 
WHERE notification_sent_at IS NULL;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;