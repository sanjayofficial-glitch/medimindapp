-- Add a unique constraint to prevent duplicate dose logs for the same medicine at the same time/date
-- This ensures that even if multiple sync processes run, only one log entry can exist.
ALTER TABLE public.dose_logs 
ADD CONSTRAINT unique_dose_log_entry UNIQUE (user_id, medicine_id, date, scheduled_time);