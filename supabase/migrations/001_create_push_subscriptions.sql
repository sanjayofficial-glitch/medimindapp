-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own subscription
CREATE POLICY "Users can manage own subscription" ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create function to handle medication reminders
CREATE OR REPLACE FUNCTION schedule_medication_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called when a dose_log is created or updated
  -- It can trigger a background job or call an edge function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a table to store scheduled reminders
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

CREATE POLICY "Users can insert own reminders" ON scheduled_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON scheduled_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);