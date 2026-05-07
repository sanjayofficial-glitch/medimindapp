-- =============================================
-- MEDIMIND PUSH NOTIFICATIONS SETUP
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Users can manage own subscription" ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- 4. Create scheduled_reminders table for tracking
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL,
  medicine_name TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own reminders" ON scheduled_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Add user_id column to dose_logs if not exists
-- Run this separately if dose_logs doesn't have user_id
-- ALTER TABLE dose_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);