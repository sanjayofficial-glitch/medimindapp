-- ============================================================================
-- COMPLETE MEDICINE REMINDER SYSTEM - FRESH START
-- Run this in your Supabase SQL Editor to reset and fix all issues
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- ============================================================================
-- STEP 1: DROP EXISTING OBJECTS (Clean Slate)
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_create_scheduled_notification ON public.dose_logs;
DROP TRIGGER IF EXISTS trigger_medicine_daily_reset ON public.medicines;

-- Drop functions
DROP FUNCTION IF EXISTS create_scheduled_notification_for_dose();
DROP FUNCTION IF EXISTS trigger_scheduled_notifications();
DROP FUNCTION IF EXISTS trigger_medicine_daily_reset();

-- Drop scheduled notifications table
DROP TABLE IF EXISTS public.scheduled_notifications;

-- Drop old cron jobs (if any)
SELECT cron.unschedule('scheduled-notifications');
SELECT cron.unschedule('medicine-daily-reset');
SELECT cron.unschedule('check-due-medications');

-- ============================================================================
-- STEP 2: FIX dose_logs TABLE
-- ============================================================================

-- Ensure status column accepts all required values
DO $$
BEGIN
    -- Drop existing constraint if it exists (may have different name)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname LIKE '%dose_logs%status%'
        AND conrelid = 'public.dose_logs'::regclass
    ) THEN
        ALTER TABLE public.dose_logs DROP CONSTRAINT IF EXISTS dose_logs_status_check;
    END IF;
END
$$;

-- Add new constraint with all statuses
ALTER TABLE public.dose_logs
ADD CONSTRAINT dose_logs_status_check
CHECK (status = ANY (ARRAY['pending'::text, 'taken'::text, 'missed'::text, 'partial'::text]));

-- Add missing columns if they don't exist
ALTER TABLE public.dose_logs
ADD COLUMN IF NOT EXISTS notification_error text;

ALTER TABLE public.dose_logs
ADD COLUMN IF NOT EXISTS snooze_duration_minutes integer DEFAULT 10;

-- Add indexes for better performance
DROP INDEX IF EXISTS idx_dose_logs_date_status;
DROP INDEX IF EXISTS idx_dose_logs_notification;
DROP INDEX IF EXISTS idx_dose_logs_pending_date;

CREATE INDEX IF NOT EXISTS idx_dose_logs_date_status
ON public.dose_logs(date, status)
WHERE status IN ('pending', 'partial');

CREATE INDEX IF NOT EXISTS idx_dose_logs_notification
ON public.dose_logs(notification_sent_at)
WHERE notification_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dose_logs_pending_date
ON public.dose_logs(user_id, date)
WHERE status = 'pending';

-- ============================================================================
-- STEP 3: FIX medicines TABLE
-- ============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true;

ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS reminder_minutes_before integer DEFAULT 5;

ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS end_date DATE;

-- ============================================================================
-- STEP 4: CREATE scheduled_notifications TABLE (Fresh)
-- ============================================================================

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

-- Indexes for efficient queries
DROP INDEX IF EXISTS idx_scheduled_notifications_pending;
DROP INDEX IF EXISTS idx_scheduled_notifications_user;

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending
ON public.scheduled_notifications(scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user
ON public.scheduled_notifications(user_id, status);

-- ============================================================================
-- STEP 5: CREATE TRIGGER FUNCTION (Fixed Time Format Handling)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_scheduled_notification_for_dose()
RETURNS TRIGGER AS $$
DECLARE
    scheduled_timestamp timestamp with time zone;
    time_24h text;
    hour_int integer;
    minute_str text;
BEGIN
    IF NEW.status != 'pending' THEN
        RETURN NEW;
    END IF;

    -- Ensure scheduled_time is in 24-hour format (HH:MM)
    -- Handle both 12h and 24h formats
    time_24h := trim(NEW.scheduled_time);

    -- If time contains AM/PM, convert to 24h
    IF position(' ' in time_24h) > 0 THEN
        hour_int := split_part(split_part(time_24h, ' ', 1), ':', 1)::integer;
        minute_str := split_part(split_part(time_24h, ' ', 1), ':', 2);

        IF split_part(time_24h, ' ', 2) = 'PM' AND hour_int < 12 THEN
            hour_int := hour_int + 12;
        ELSIF split_part(time_24h, ' ', 2) = 'AM' AND hour_int = 12 THEN
            hour_int := 0;
        END IF;

        time_24h := lpad(hour_int::text, 2, '0') || ':' || lpad(minute_str, 2, '0');
    END IF;

    -- Build the scheduled timestamp
    scheduled_timestamp := (NEW.date::text || ' ' || time_24h)::timestamp with time zone;

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
        scheduled_timestamp,
        'pending',
        'reminder'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER trigger_create_scheduled_notification
AFTER INSERT ON public.dose_logs
FOR EACH ROW
EXECUTE FUNCTION create_scheduled_notification_for_dose();

-- ============================================================================
-- STEP 7: CLEAN UP ORPHANED NOTIFICATIONS
-- ============================================================================

-- Delete scheduled notifications for medicines that no longer exist
DELETE FROM public.scheduled_notifications sn
WHERE NOT EXISTS (
    SELECT 1 FROM public.medicines m WHERE m.id = sn.medicine_id
);

-- Delete scheduled notifications for dose logs that no longer exist
DELETE FROM public.scheduled_notifications sn
WHERE NOT EXISTS (
    SELECT 1 FROM public.dose_logs dl WHERE dl.id = sn.dose_log_id
);

-- Clear notification flags for pending doses so they can be re-notified
UPDATE public.dose_logs
SET notification_sent_at = NULL
WHERE status = 'pending'
AND notification_sent_at IS NOT NULL;

-- ============================================================================
-- STEP 8: SETUP CRON JOBS (Using Edge Functions)
-- ============================================================================

-- Function to call scheduled-notifications edge function
CREATE OR REPLACE FUNCTION trigger_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id bigint;
    supabase_url text;
BEGIN
    supabase_url := COALESCE(
        current_setting('app.settings.supabase_url', true),
        'https://tokndrkhxgmckuffbtrd.supabase.co'
    );

    SELECT net.http_post(
        url := supabase_url || '/functions/v1/scheduled-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Scheduled notifications function called: %', request_id;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to call scheduled notifications: %', SQLERRM;
END
$$;

-- Function to call medicine-daily-reset edge function
CREATE OR REPLACE FUNCTION trigger_medicine_daily_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id bigint;
    supabase_url text;
BEGIN
    supabase_url := COALESCE(
        current_setting('app.settings.supabase_url', true),
        'https://tokndrkhxgmckuffbtrd.supabase.co'
    );

    SELECT net.http_post(
        url := supabase_url || '/functions/v1/medicine-daily-reset',
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    ) INTO request_id;

    RAISE NOTICE 'Medicine daily reset called: %', request_id;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to call medicine daily reset: %', SQLERRM;
END
$$;

-- Schedule: Run every minute for precise notification timing
SELECT cron.schedule(
    'scheduled-notifications',
    '* * * * *',
    $$SELECT trigger_scheduled_notifications();$$
);

-- Schedule: Run daily at midnight for creating new dose logs
SELECT cron.schedule(
    'medicine-daily-reset',
    '0 0 * * *',
    $$SELECT trigger_medicine_daily_reset();$$
);

-- ============================================================================
-- STEP 9: VERIFY SETUP
-- ============================================================================

-- Check cron jobs
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('scheduled-notifications', 'medicine-daily-reset');

-- Verify tables exist
SELECT 'dose_logs' as table_name, count(*) as row_count FROM public.dose_logs
UNION ALL
SELECT 'medicines', count(*) FROM public.medicines
UNION ALL
SELECT 'scheduled_notifications', count(*) FROM public.scheduled_notifications;

-- Check for any remaining issues
SELECT
    'Pending doses without notifications' as check_name,
    count(*) as count
FROM public.dose_logs
WHERE status = 'pending'
AND notification_sent_at IS NULL;

RAISE NOTICE 'Medicine reminder system reset complete!';