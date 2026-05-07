-- Create OneSignal subscriptions table
CREATE TABLE IF NOT EXISTS onesignal_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  device_type TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

-- Enable RLS
ALTER TABLE onesignal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own subscriptions"
  ON onesignal_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- Add reminder columns to medicines table
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 5;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_dose_logs_date_status 
ON dose_logs(date, status) 
WHERE status = 'partial';

CREATE INDEX IF NOT EXISTS idx_medicines_reminder_enabled 
ON medicines(user_id) 
WHERE reminder_enabled = true;