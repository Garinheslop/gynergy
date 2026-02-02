-- Gamification System Schema
-- Badges, achievements, multipliers, and points tracking

-- Badge rarity enum
CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Badge category enum
CREATE TYPE badge_category AS ENUM ('consistency', 'completion', 'speed', 'social', 'milestone', 'special');

-- Badge definitions table
CREATE TABLE IF NOT EXISTS "badges" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,              -- 'morning-streak-7', 'perfect-week'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,                    -- Icon class suffix for gng-{icon}
    category badge_category NOT NULL,
    rarity badge_rarity NOT NULL,
    unlock_condition JSONB NOT NULL,       -- {"type": "streak", "activity": "morning", "count": 7}
    animation_type TEXT DEFAULT 'confetti',
    points_reward INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User badges (earned)
CREATE TABLE IF NOT EXISTS "user_badges" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_showcased BOOLEAN DEFAULT FALSE,    -- User can showcase up to 3 badges
    is_new BOOLEAN DEFAULT TRUE,           -- For "new badge" indicator
    UNIQUE(user_id, badge_id, session_id)
);

-- Multiplier type enum
CREATE TYPE multiplier_type AS ENUM ('streak', 'combo', 'time', 'special');

-- Multiplier configs table
CREATE TABLE IF NOT EXISTS "multiplier_configs" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    multiplier_type multiplier_type NOT NULL,
    condition JSONB NOT NULL,              -- {"min_streak": 7, "max_streak": 13}
    multiplier_value DECIMAL(3,2) NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Points transaction log (for audit trail and history)
CREATE TABLE IF NOT EXISTS "points_transactions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,           -- 'morning_journal', 'evening_journal', 'dga', etc.
    base_points INTEGER NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    bonus_points INTEGER DEFAULT 0,
    final_points INTEGER NOT NULL,
    source_id UUID,                        -- Reference to the source record (journal_id, action_log_id, etc.)
    source_type TEXT,                      -- 'journal', 'action_log', 'badge', etc.
    metadata JSONB,                        -- Additional context
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read badge definitions" ON badges
    FOR SELECT USING (true);

CREATE POLICY "Users can read own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view badges of cohort members" ON user_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cohort_memberships cm1
            JOIN cohort_memberships cm2 ON cm1.cohort_id = cm2.cohort_id
            WHERE cm1.user_id = auth.uid()
            AND cm2.user_id = user_badges.user_id
        )
    );

CREATE POLICY "System can insert user badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON user_badges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read multiplier configs" ON multiplier_configs
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can read own point transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert point transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_rarity ON badges(rarity);
CREATE INDEX idx_user_badges_user ON user_badges(user_id, session_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_new ON user_badges(user_id, is_new) WHERE is_new = TRUE;
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id, session_id, created_at DESC);
CREATE INDEX idx_points_transactions_activity ON points_transactions(user_id, activity_type, created_at DESC);

-- Insert default badge definitions
INSERT INTO badges (key, name, description, icon, category, rarity, unlock_condition, points_reward, sort_order) VALUES
-- Consistency Badges
('morning-streak-7', 'Morning Maven', 'Complete 7 consecutive morning journals', 'sun', 'consistency', 'common', '{"type": "streak", "activity": "morning", "count": 7}', 15, 1),
('evening-streak-7', 'Evening Expert', 'Complete 7 consecutive evening journals', 'moon', 'consistency', 'common', '{"type": "streak", "activity": "evening", "count": 7}', 15, 2),
('gratitude-streak-7', 'Gratitude Guru', 'Complete 7 consecutive DGAs', 'heart', 'consistency', 'common', '{"type": "streak", "activity": "gratitude", "count": 7}', 15, 3),
('combined-streak-7', 'Week Warrior', 'Complete all activities for 7 consecutive days', 'shield', 'consistency', 'uncommon', '{"type": "streak", "activity": "all", "count": 7}', 25, 4),
('combined-streak-14', 'Fortnight Force', 'Complete all activities for 14 consecutive days', 'lightning', 'consistency', 'rare', '{"type": "streak", "activity": "all", "count": 14}', 50, 5),
('combined-streak-21', 'Habit Hero', 'Complete all activities for 21 consecutive days', 'trophy', 'consistency', 'rare', '{"type": "streak", "activity": "all", "count": 21}', 75, 6),
('combined-streak-30', 'Month Master', 'Complete all activities for 30 consecutive days', 'crown', 'consistency', 'epic', '{"type": "streak", "activity": "all", "count": 30}', 100, 7),
('combined-streak-45', 'Journey Champion', 'Complete all activities for the full 45-day journey', 'diamond', 'consistency', 'legendary', '{"type": "streak", "activity": "all", "count": 45}', 250, 8),
('weekly-streak-4', 'Reflection Rockstar', 'Complete 4 consecutive weekly reflections', 'book', 'consistency', 'rare', '{"type": "streak", "activity": "weekly", "count": 4}', 75, 9),

-- Completion Badges
('first-morning', 'First Light', 'Complete your first morning journal', 'sunrise', 'completion', 'common', '{"type": "first", "activity": "morning"}', 10, 10),
('first-evening', 'Night Owl', 'Complete your first evening journal', 'stars', 'completion', 'common', '{"type": "first", "activity": "evening"}', 10, 11),
('first-dga', 'Action Hero', 'Complete your first Daily Gratitude Action', 'rocket', 'completion', 'common', '{"type": "first", "activity": "dga"}', 10, 12),
('perfect-day', 'Perfect Day', 'Complete all daily tasks in a single day', 'check-circle', 'completion', 'uncommon', '{"type": "combo", "activities": ["morning", "evening", "dga"], "count": 1}', 30, 13),
('perfect-week', 'Perfect Week', 'Complete all tasks for 7 consecutive days', 'calendar-check', 'completion', 'rare', '{"type": "combo", "activities": ["morning", "evening", "dga"], "count": 7}', 100, 14),
('vision-complete', 'Vision Visionary', 'Complete all vision board sections', 'eye', 'completion', 'uncommon', '{"type": "complete", "activity": "visions"}', 50, 15),
('journey-complete', 'Journey Mapper', 'Complete your journey table', 'map', 'completion', 'uncommon', '{"type": "complete", "activity": "journey"}', 50, 16),
('graduate', 'Graduate', 'Complete the full 45-day journey', 'graduation-cap', 'completion', 'legendary', '{"type": "graduate"}', 500, 17),

-- Speed Badges
('early-bird', 'Early Bird', 'Complete morning journal before 7am', 'alarm', 'speed', 'common', '{"type": "time", "activity": "morning", "before": "07:00"}', 15, 18),
('dawn-patrol', 'Dawn Patrol', 'Complete 5 morning journals before 7am', 'coffee', 'speed', 'uncommon', '{"type": "time", "activity": "morning", "before": "07:00", "count": 5}', 35, 19),
('sunrise-specialist', 'Sunrise Specialist', 'Complete 15 morning journals before 7am', 'sun-rising', 'speed', 'rare', '{"type": "time", "activity": "morning", "before": "07:00", "count": 15}', 75, 20),
('speed-demon', 'Speed Demon', 'Complete all daily tasks before noon', 'bolt', 'speed', 'epic', '{"type": "time", "activities": ["morning", "evening", "dga"], "before": "12:00"}', 50, 21),
('night-journaler', 'Midnight Journaler', 'Journal between 12am and 1am', 'moon-stars', 'speed', 'rare', '{"type": "time", "activity": "any", "after": "00:00", "before": "01:00"}', 25, 22),

-- Social Badges
('first-share', 'First Share', 'Share your first DGA on social media', 'share', 'social', 'common', '{"type": "share", "count": 1}', 10, 23),
('joy-spreader', 'Spreader of Joy', 'Share 5 DGAs on social media', 'megaphone', 'social', 'uncommon', '{"type": "share", "count": 5}', 25, 24),
('ambassador', 'Gratitude Ambassador', 'Share 15 DGAs on social media', 'flag', 'social', 'rare', '{"type": "share", "count": 15}', 50, 25),
('encourager', 'Encourager', 'Send 5 encouragements to cohort members', 'hands-clapping', 'social', 'uncommon', '{"type": "encourage", "count": 5}', 25, 26),
('community-pillar', 'Community Pillar', 'Send 10 encouragements to cohort members', 'users', 'social', 'rare', '{"type": "encourage", "count": 10}', 50, 27),

-- Milestone Badges
('milestone-1', 'Basecamp', 'Reach milestone 1 (Day 9)', 'flag-1', 'milestone', 'common', '{"type": "milestone", "number": 1}', 25, 28),
('milestone-2', 'Adventurer', 'Reach milestone 2 (Day 18)', 'flag-2', 'milestone', 'uncommon', '{"type": "milestone", "number": 2}', 50, 29),
('milestone-3', 'Explorer', 'Reach milestone 3 (Day 27)', 'flag-3', 'milestone', 'uncommon', '{"type": "milestone", "number": 3}', 75, 30),
('milestone-4', 'Trailblazer', 'Reach milestone 4 (Day 36)', 'flag-4', 'milestone', 'rare', '{"type": "milestone", "number": 4}', 100, 31),
('milestone-5', 'Summit Seeker', 'Reach milestone 5 (Day 45)', 'mountain', 'milestone', 'legendary', '{"type": "milestone", "number": 5}', 200, 32),

-- Special/Hidden Badges
('comeback-kid', 'Comeback Kid', 'Return to journaling after 3+ days away', 'refresh', 'special', 'uncommon', '{"type": "comeback", "days_away": 3}', 30, 33),
('weekend-warrior', 'Weekend Warrior', 'Complete all tasks on both Saturday and Sunday', 'calendar-weekend', 'special', 'uncommon', '{"type": "weekend", "complete": true}', 40, 34),
('mood-improver', 'Mood Improver', 'Show mood improvement for 5 days', 'trending-up', 'special', 'rare', '{"type": "mood", "improvement": true, "count": 5}', 50, 35)
ON CONFLICT (key) DO NOTHING;

-- Insert default multiplier configs
INSERT INTO multiplier_configs (name, multiplier_type, condition, multiplier_value, bonus_points) VALUES
('Streak 7-13', 'streak', '{"min_streak": 7, "max_streak": 13}', 1.20, 0),
('Streak 14-29', 'streak', '{"min_streak": 14, "max_streak": 29}', 1.50, 0),
('Streak 30+', 'streak', '{"min_streak": 30, "max_streak": null}', 2.00, 0),
('Daily Combo', 'combo', '{"activities": ["morning", "evening", "dga"]}', 1.00, 10),
('Perfect Week Bonus', 'combo', '{"type": "perfect_week"}', 1.00, 50),
('Early Bird Bonus', 'time', '{"activity": "morning", "before": "08:00"}', 1.00, 5)
ON CONFLICT DO NOTHING;
