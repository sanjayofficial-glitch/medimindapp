-- ============================================================================
-- MEDICINE REMINDER SYSTEM - MINIMAL FIX
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- ============================================================================
-- STEP 1: Fix dose_logs status constraint
-- ============================================================================

DO $$
BEGIN
    -- Drop existing constraint if it exists
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

-- ============================================================================
-- STEP 2: Create scheduled_notifications table (if not exists)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
ON public.scheduled_notifications(scheduled_for) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user 
ON public.scheduled_notifications(user_id, status);

-- ============================================================================
-- STEP 3: Create trigger function (simple version)
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Create trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_create_scheduled_notification ON public.dose_logs;

CREATE TRIGGER trigger_create_scheduled_notification
AFTER INSERT ON public.dose_logs
FOR EACH ROW
EXECUTE FUNCTION create_scheduled_notification_for_dose();

-- ============================================================================
-- STEP 5: Clean up orphaned notifications
-- ============================================================================

DELETE FROM public.scheduled_notifications sn
WHERE NOT EXISTS (
    SELECT 1 FROM public.medicines m WHERE m.id = sn.medicine_id
);

DELETE FROM public.scheduled_notifications sn
WHERE NOT EXISTS (
    SELECT 1 FROM public.dose_logs dl WHERE dl.id = sn.dose_log_id
);

-- Clear notification flags for pending doses
UPDATE public.dose_logs
SET notification_sent_at = NULL
WHERE status = 'pending'
AND notification_sent_at IS NOT NULL;

-- ============================================================================
-- STEP 6: Setup Cron Jobs
-- ============================================================================

SELECT cron.unschedule('scheduled-notifications');
SELECT cron.unschedule('medicine-daily-reset');

CREATE OR REPLACE FUNCTION trigger_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id bigint;
BEGIN
    PERFORM net.http_post(
        url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/scheduled-notifications',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
    );
EXCEPTION WHEN OTHERS THEN
    NULL;
END
$$;

CREATE OR REPLACE FUNCTION trigger_medicine_daily_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id bigint;
BEGIN
    PERFORM net.http_post(
        url := 'https://tokndrkhxgmckuffbtrd.supabase.co/functions/v1/medicine-daily-reset',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb
    );
EXCEPTION WHEN OTHERS THEN
    NULL;
END
$$;

SELECT cron.schedule('scheduled-notifications', '* * * * *', $$SELECT trigger_scheduled_notifications();$$);
SELECT cron.schedule('medicine-daily-reset', '0 0 * * *', $$SELECT trigger_medicine_daily_reset();$$);

-- Done!
SELECT 'Medicine reminder system fixed!' as status;