-- ============================================================================
-- User Notifications Schema
-- ============================================================================
-- In-app notification system for milestone celebrations, community engagement,
-- streak warnings, referral prompts, and system messages.
-- ============================================================================

-- Table: user_notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('reminder', 'achievement', 'social', 'system', 'encouragement')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  action_type TEXT CHECK (action_type IN ('navigate', 'url', 'action', NULL)),
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON user_notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON user_notifications (user_id, created_at DESC);

-- RLS policies
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (from API routes)
CREATE POLICY "Service can insert notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for live notification delivery
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;

-- Table: user_notification_preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  streak_warning_enabled BOOLEAN DEFAULT true,
  milestone_enabled BOOLEAN DEFAULT true,
  social_enabled BOOLEAN DEFAULT true,
  system_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
