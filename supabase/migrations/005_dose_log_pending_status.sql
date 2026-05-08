-- Document the dose log status lifecycle:
--   pending  → dose is scheduled but not yet due (before scheduled time)
--   partial  → notification sent, awaiting user action (user has seen it)
--   taken    → user marked as taken
--   missed   → past midnight without being taken

-- Ensure the status column accepts these values (no constraint changes needed for text)
-- Add start_date and end_date to medicines for time-bounded courses
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Store times consistently in 24-hour format (HH:MM)
-- Times are stored as 24h strings in the medicines.times JSONB array
-- scheduled_time in dose_logs is also stored as HH:MM (24h)

-- Clear any orphaned notification flags so pending doses can be re-notified
UPDATE public.dose_logs
SET notification_sent_at = NULL
WHERE status = 'pending'
  AND notification_sent_at IS NOT NULL;

-- Add index for efficient pending dose queries by date
CREATE INDEX IF NOT EXISTS idx_dose_logs_pending_date
  ON public.dose_logs(user_id, date)
  WHERE status = 'pending';