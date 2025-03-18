-- Create user_settings table to store user preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  new_cards_per_day INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies to protect user settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own settings
CREATE POLICY "Users can view their own settings"
ON user_settings
FOR SELECT
USING (auth.uid() = id);

-- Allow users to create their own settings
CREATE POLICY "Users can create their own settings"
ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
USING (auth.uid() = id);
