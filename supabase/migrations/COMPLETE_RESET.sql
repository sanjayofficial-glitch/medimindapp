-- ============================================================================
-- COMPLETE MEDICINE REMINDER SYSTEM - FULL SETUP
-- Run this in your Supabase SQL Editor to create everything from scratch
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- ============================================================================
-- TABLE 1: FAMILY MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);

-- ============================================================================
-- TABLE 2: MEDICINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.medicines (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
    name text NOT NULL,
    dosage text,
    times jsonb DEFAULT '[]'::jsonb,
    frequency text,
    additional_text text,
    stock integer DEFAULT 0,
    refill_at timestamp with time zone,
    reminder_enabled boolean DEFAULT true,
    reminder_minutes_before integer DEFAULT 5,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicines_user ON public.medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_family_member ON public.medicines(family_member_id);

-- ============================================================================
-- TABLE 3: DOSE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dose_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    family_member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE,
    medicine_name text NOT NULL,
    scheduled_time text NOT NULL,
    actual_time text,
    date date NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'partial')),
    notification_sent_at timestamp with time zone,
    notification_error text,
    snooze_duration_minutes integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now()
);

-- Add constraint if table already exists and column was added before
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dose_logs' AND column_name = 'status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dose_logs_status_check' AND conrelid = 'public.dose_logs'::regclass) THEN
            ALTER TABLE public.dose_logs ADD CONSTRAINT dose_logs_status_check CHECK (status = ANY (ARRAY['pending'::text, 'taken'::text, 'missed'::text, 'partial'::text]));
        END IF;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_dose_logs_user_date ON public.dose_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_dose_logs_date_status ON public.dose_logs(date, status) WHERE status IN ('pending', 'partial');
CREATE INDEX IF NOT EXISTS idx_dose_logs_notification ON public.dose_logs(notification_sent_at) WHERE notification_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dose_logs_pending_date ON public.dose_logs(user_id, date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_dose_logs_medicine ON public.dose_logs(medicine_id);

-- ============================================================================
-- TABLE 4: ONESIGNAL SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.onesignal_subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    player_id text NOT NULL,
    timezone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onesignal_subscriptions_user ON public.onesignal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_subscriptions_player ON public.onesignal_subscriptions(player_id);

-- ============================================================================
-- TABLE 5: SCHEDULED NOTIFICATIONS
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

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending ON public.scheduled_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON public.scheduled_notifications(user_id, status);

-- ============================================================================
-- TRIGGER FUNCTION: Auto-create scheduled notification when dose_log is created
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_scheduled_notification ON public.dose_logs;
CREATE TRIGGER trigger_create_scheduled_notification
AFTER INSERT ON public.dose_logs
FOR EACH ROW
EXECUTE FUNCTION create_scheduled_notification_for_dose();

-- ============================================================================
-- CLEANUP: Fix any existing data issues
-- ============================================================================

-- Clear notification flags for pending doses so they can be re-notified
UPDATE public.dose_logs
SET notification_sent_at = NULL
WHERE status = 'pending'
AND notification_sent_at IS NOT NULL;

-- ============================================================================
-- CRON JOBS: Schedule background tasks
-- ============================================================================

-- Remove old jobs if they exist (ignore errors if they don't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('scheduled-notifications');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('medicine-daily-reset');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('check-due-medications');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function to call scheduled-notifications edge function
CREATE OR REPLACE FUNCTION trigger_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- Function to call medicine-daily-reset edge function
CREATE OR REPLACE FUNCTION trigger_medicine_daily_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
-- VERIFY: Check that everything was created
-- ============================================================================

SELECT 
    'family_members' as table_name, count(*) as row_count FROM public.family_members
UNION ALL
SELECT 'medicines', count(*) FROM public.medicines
UNION ALL
SELECT 'dose_logs', count(*) FROM public.dose_logs
UNION ALL
SELECT 'onesignal_subscriptions', count(*) FROM public.onesignal_subscriptions
UNION ALL
SELECT 'scheduled_notifications', count(*) FROM public.scheduled_notifications;

-- Check cron jobs
SELECT jobname, schedule, active FROM cron.job 
WHERE jobname IN ('scheduled-notifications', 'medicine-daily-reset');

SELECT 'Database setup complete!' as status;