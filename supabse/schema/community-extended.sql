-- Extended Community Schema
-- Adds user-generated posts, social connections, referral tracking, and enhanced engagement

-- ============================================================================
-- USER POSTS (Wins, Reflections, Shares)
-- ============================================================================

-- Post types enum
DO $$ BEGIN
    CREATE TYPE community_post_type AS ENUM (
        'win',              -- Personal achievement/win
        'reflection',       -- Gratitude reflection share
        'milestone',        -- Auto-generated milestone
        'encouragement',    -- Encouraging others
        'question',         -- Asking for support
        'celebration'       -- Celebrating others
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Community posts table (user-generated content)
CREATE TABLE IF NOT EXISTS "community_posts" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,

    -- Content
    post_type community_post_type NOT NULL DEFAULT 'win',
    title TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',           -- Array of image/video URLs

    -- Optional links
    linked_journal_id UUID REFERENCES journals(id) ON DELETE SET NULL,
    linked_action_id UUID REFERENCES action_logs(id) ON DELETE SET NULL,
    linked_badge_id UUID REFERENCES user_badges(id) ON DELETE SET NULL,

    -- Engagement metrics (denormalized for performance)
    reaction_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- Visibility
    visibility TEXT DEFAULT 'cohort' CHECK (visibility IN ('private', 'cohort', 'public')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    reported_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Post comments table
CREATE TABLE IF NOT EXISTS "post_comments" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Post reactions table (extended from activity_reactions)
CREATE TABLE IF NOT EXISTS "post_reactions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('cheer', 'fire', 'heart', 'celebrate', 'inspire', 'support')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Comment reactions
CREATE TABLE IF NOT EXISTS "comment_reactions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'support')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- SOCIAL CONNECTIONS
-- ============================================================================

-- Social platform enum
DO $$ BEGIN
    CREATE TYPE social_platform AS ENUM (
        'twitter',
        'instagram',
        'linkedin',
        'facebook',
        'tiktok'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User social connections
CREATE TABLE IF NOT EXISTS "social_connections" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    platform social_platform NOT NULL,
    platform_username TEXT NOT NULL,
    platform_user_id TEXT,                    -- External platform's user ID
    profile_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,           -- Show on profile
    connected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- Social shares tracking (when users share to social media)
CREATE TABLE IF NOT EXISTS "social_shares" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
    share_type TEXT NOT NULL CHECK (share_type IN ('post', 'badge', 'streak', 'referral', 'journey')),
    platform social_platform NOT NULL,
    share_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REFERRAL SYSTEM
-- ============================================================================

-- Referral codes table (separate from friend codes for tracking)
CREATE TABLE IF NOT EXISTS "referral_codes" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    code TEXT UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS "referrals" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
    points_awarded INTEGER DEFAULT 0,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Referral milestones (for gamification)
CREATE TABLE IF NOT EXISTS "referral_milestones" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    referrals_required INTEGER NOT NULL,
    points_bonus INTEGER DEFAULT 0,
    badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
    reward_description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- User referral milestone achievements
CREATE TABLE IF NOT EXISTS "user_referral_milestones" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES referral_milestones(id) ON DELETE CASCADE NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, milestone_id)
);

-- ============================================================================
-- MEMBER PROFILES (Extended)
-- ============================================================================

-- Public profile settings
CREATE TABLE IF NOT EXISTS "profile_settings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Visibility
    show_streak BOOLEAN DEFAULT TRUE,
    show_points BOOLEAN DEFAULT TRUE,
    show_badges BOOLEAN DEFAULT TRUE,
    show_social_links BOOLEAN DEFAULT TRUE,
    show_cohort BOOLEAN DEFAULT TRUE,

    -- Bio
    bio TEXT,
    location TEXT,
    timezone TEXT,

    -- Preferences
    allow_direct_messages BOOLEAN DEFAULT TRUE,
    allow_encouragements BOOLEAN DEFAULT TRUE,
    email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('never', 'daily', 'weekly')),

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WEEKLY HIGHLIGHTS
-- ============================================================================

-- Weekly featured content
CREATE TABLE IF NOT EXISTS "weekly_highlights" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    -- Featured content
    top_posts UUID[] DEFAULT '{}',            -- Array of post IDs
    top_contributors UUID[] DEFAULT '{}',     -- Array of user IDs
    total_journals_completed INTEGER DEFAULT 0,
    total_wins_shared INTEGER DEFAULT 0,
    community_streak INTEGER DEFAULT 0,       -- Days with active posts

    -- AI-generated summary
    weekly_summary TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cohort_id, week_start)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_cohort ON community_posts(cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility ON community_posts(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user ON social_shares(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_highlights ENABLE ROW LEVEL SECURITY;

-- Community posts policies
CREATE POLICY "Users can view public posts" ON community_posts
    FOR SELECT USING (visibility = 'public' AND is_approved = TRUE);

CREATE POLICY "Users can view cohort posts" ON community_posts
    FOR SELECT USING (
        visibility = 'cohort' AND is_approved = TRUE AND
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = community_posts.cohort_id
            AND cohort_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own posts" ON community_posts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create posts" ON community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on visible posts" ON post_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_posts p
            WHERE p.id = post_comments.post_id
            AND (p.user_id = auth.uid() OR p.visibility = 'public' OR
                (p.visibility = 'cohort' AND EXISTS (
                    SELECT 1 FROM cohort_memberships WHERE cohort_id = p.cohort_id AND user_id = auth.uid()
                )))
        )
    );

CREATE POLICY "Users can create comments" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Users can view reactions" ON post_reactions
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can add reactions" ON post_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON post_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Social connections policies
CREATE POLICY "Users can view public social connections" ON social_connections
    FOR SELECT USING (is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can manage own connections" ON social_connections
    FOR ALL USING (auth.uid() = user_id);

-- Social shares policies
CREATE POLICY "Users can view own shares" ON social_shares
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares" ON social_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referral policies
CREATE POLICY "Users can view own referral code" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes" ON referral_codes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Profile settings policies
CREATE POLICY "Users can view public profile settings" ON profile_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own settings" ON profile_settings
    FOR ALL USING (auth.uid() = user_id);

-- Weekly highlights policies
CREATE POLICY "Cohort members can view highlights" ON weekly_highlights
    FOR SELECT USING (
        cohort_id IS NULL OR
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = weekly_highlights.cohort_id
            AND cohort_memberships.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique referral code for user
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    user_name TEXT;
BEGIN
    -- Get user's first name for personalized code
    SELECT UPPER(SUBSTRING(first_name, 1, 4)) INTO user_name
    FROM users WHERE id = p_user_id;

    IF user_name IS NULL OR LENGTH(user_name) < 2 THEN
        user_name := 'GYN';
    END IF;

    LOOP
        -- Generate code: NAME + 4 random alphanumeric
        new_code := user_name || '-' || upper(substr(md5(random()::text), 1, 4));

        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create referral code for new user
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO referral_codes (user_id, code)
    VALUES (NEW.id, generate_referral_code(NEW.id))
    ON CONFLICT (user_id) DO NOTHING;

    -- Also create default profile settings
    INSERT INTO profile_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create referral code on user creation
DROP TRIGGER IF EXISTS create_referral_code_trigger ON users;
CREATE TRIGGER create_referral_code_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_referral_code();

-- Update reaction counts on post
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET reaction_count = reaction_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET reaction_count = GREATEST(reaction_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_reaction_count_trigger ON post_reactions;
CREATE TRIGGER update_post_reaction_count_trigger
    AFTER INSERT OR DELETE ON post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_post_reaction_count();

-- Update comment counts on post
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET comment_count = comment_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET comment_count = GREATEST(comment_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON post_comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Process referral conversion
CREATE OR REPLACE FUNCTION process_referral_conversion(p_referred_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_referral RECORD;
    v_points_to_award INTEGER := 100;  -- Points for successful referral
    v_referrer_total INTEGER;
BEGIN
    -- Find pending referral
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_id = p_referred_id AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No pending referral found');
    END IF;

    -- Update referral status
    UPDATE referrals
    SET status = 'converted',
        points_awarded = v_points_to_award,
        converted_at = CURRENT_TIMESTAMP
    WHERE id = v_referral.id;

    -- Update referral code stats
    UPDATE referral_codes
    SET uses_count = uses_count + 1,
        total_points_earned = total_points_earned + v_points_to_award
    WHERE user_id = v_referral.referrer_id;

    -- Award points to referrer (via points_transactions)
    INSERT INTO points_transactions (user_id, points, action_type, description)
    VALUES (v_referral.referrer_id, v_points_to_award, 'referral_bonus', 'Referral bonus - friend joined the challenge');

    -- Get referrer's total referrals for milestone check
    SELECT uses_count INTO v_referrer_total
    FROM referral_codes WHERE user_id = v_referral.referrer_id;

    -- Check and award milestones
    INSERT INTO user_referral_milestones (user_id, milestone_id)
    SELECT v_referral.referrer_id, rm.id
    FROM referral_milestones rm
    WHERE rm.referrals_required <= v_referrer_total
    AND rm.is_active = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM user_referral_milestones urm
        WHERE urm.user_id = v_referral.referrer_id AND urm.milestone_id = rm.id
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'points_awarded', v_points_to_award,
        'referrer_total', v_referrer_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Referral Milestones
-- ============================================================================

INSERT INTO referral_milestones (name, description, referrals_required, points_bonus, reward_description) VALUES
    ('First Referral', 'Welcome your first friend to the journey', 1, 100, 'Referral Champion badge'),
    ('Trio Complete', 'Build your accountability trio', 2, 250, 'Accountability Leader badge'),
    ('Community Builder', 'Bring 5 friends to the challenge', 5, 500, 'Community Builder badge + bonus points'),
    ('Influence Leader', 'Refer 10 people to transform their lives', 10, 1000, 'Influence Leader badge + premium features'),
    ('Movement Maker', 'Create a movement with 25 referrals', 25, 2500, 'Movement Maker badge + lifetime access')
ON CONFLICT DO NOTHING;
