-- Notifications Schema
-- Push notifications, in-app notifications, and user preferences

-- Notification categories
CREATE TYPE notification_category AS ENUM (
    'reminder',
    'achievement',
    'social',
    'system',
    'encouragement'
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Push notification settings
    push_enabled BOOLEAN DEFAULT TRUE,

    -- Reminder settings
    morning_reminder_enabled BOOLEAN DEFAULT TRUE,
    morning_reminder_time TIME DEFAULT '07:00:00',
    evening_reminder_enabled BOOLEAN DEFAULT TRUE,
    evening_reminder_time TIME DEFAULT '18:00:00',
    streak_warning_enabled BOOLEAN DEFAULT TRUE,
    streak_warning_time TIME DEFAULT '21:00:00',

    -- Category preferences
    achievement_notifications BOOLEAN DEFAULT TRUE,
    social_notifications BOOLEAN DEFAULT TRUE,
    encouragement_notifications BOOLEAN DEFAULT TRUE,

    -- Delivery preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    weekly_digest_enabled BOOLEAN DEFAULT TRUE,
    weekly_digest_day INTEGER DEFAULT 0 CHECK (weekly_digest_day >= 0 AND weekly_digest_day <= 6), -- 0 = Sunday
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',

    -- Timezone for scheduling
    timezone TEXT DEFAULT 'UTC',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User notifications table (in-app notification center)
CREATE TABLE IF NOT EXISTS "user_notifications" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category notification_category NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,                             -- Icon class for display
    action_type TEXT,                      -- 'navigate', 'open_modal', 'external_link'
    action_data JSONB,                     -- {"route": "/journal", "params": {"day": 5}}
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                -- Optional expiration for time-sensitive notifications
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Push notification tokens table
CREATE TABLE IF NOT EXISTS "push_tokens" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);

-- Scheduled notifications table (for reminder system)
CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,       -- 'morning_reminder', 'evening_reminder', 'streak_warning'
    scheduled_for TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can view own preferences" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON user_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON user_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for push_tokens
CREATE POLICY "Users can view own tokens" ON push_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tokens" ON push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_notification_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_user_notifications_category ON user_notifications(user_id, category, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id, is_active);
CREATE INDEX idx_push_tokens_platform ON push_tokens(platform, is_active);
CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scheduled_notifications_user ON scheduled_notifications(user_id, status);

-- Function to create default notification preferences on user creation
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences (connect to users table)
DROP TRIGGER IF EXISTS user_notification_preferences_trigger ON users;
CREATE TRIGGER user_notification_preferences_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
    UPDATE user_notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM user_notifications
    WHERE user_id = auth.uid()
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for badge unlock
CREATE OR REPLACE FUNCTION create_badge_notification()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
BEGIN
    SELECT * INTO badge_record FROM badges WHERE id = NEW.badge_id;

    INSERT INTO user_notifications (user_id, category, title, body, icon, action_type, action_data)
    VALUES (
        NEW.user_id,
        'achievement',
        'Badge Unlocked!',
        format('You earned the "%s" badge: %s', badge_record.name, badge_record.description),
        badge_record.icon,
        'open_modal',
        jsonb_build_object('modal', 'badge_detail', 'badge_id', NEW.badge_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for badge notifications
DROP TRIGGER IF EXISTS badge_notification_trigger ON user_badges;
CREATE TRIGGER badge_notification_trigger
    AFTER INSERT ON user_badges
    FOR EACH ROW
    EXECUTE FUNCTION create_badge_notification();

-- Function to create notification for encouragement
CREATE OR REPLACE FUNCTION create_encouragement_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    message_text TEXT;
BEGIN
    -- Get sender name
    SELECT name INTO sender_name FROM users WHERE id = NEW.sender_id;

    -- Determine message
    message_text := CASE NEW.message_type
        WHEN 'keep_going' THEN 'Keep going! You''ve got this!'
        WHEN 'great_job' THEN 'Great job on your progress!'
        WHEN 'youve_got_this' THEN 'You''ve got this! Stay strong!'
        WHEN 'proud_of_you' THEN 'So proud of your dedication!'
        WHEN 'custom' THEN NEW.custom_message
        ELSE 'sent you encouragement!'
    END;

    INSERT INTO user_notifications (user_id, category, title, body, icon, action_type, action_data)
    VALUES (
        NEW.recipient_id,
        'encouragement',
        format('%s cheered you on!', COALESCE(sender_name, 'Someone')),
        message_text,
        'hands-clapping',
        'navigate',
        jsonb_build_object('route', '/community', 'section', 'encouragements')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for encouragement notifications
DROP TRIGGER IF EXISTS encouragement_notification_trigger ON encouragements;
CREATE TRIGGER encouragement_notification_trigger
    AFTER INSERT ON encouragements
    FOR EACH ROW
    EXECUTE FUNCTION create_encouragement_notification();
