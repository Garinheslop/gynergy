-- ==============================================
-- GYNERGY DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/lhpmebczgzizqlypzwcj/sql
-- ==============================================

-- Payments & Subscriptions System Schema
-- Handles $997 challenge purchases, friend codes, and $19.97/month journal subscriptions

-- Purchase status enum
CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'trialing');

-- Purchase type enum
CREATE TYPE purchase_type AS ENUM ('challenge', 'challenge_friend_code');

-- Purchases table (for $997 one-time challenge purchases)
CREATE TABLE IF NOT EXISTS "purchases" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Stripe data
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_customer_id TEXT,

    -- Purchase details
    purchase_type purchase_type NOT NULL DEFAULT 'challenge',
    amount_cents INTEGER NOT NULL,              -- 99700 for $997.00
    currency TEXT DEFAULT 'usd',
    status purchase_status NOT NULL DEFAULT 'pending',

    -- Metadata
    email TEXT,                                 -- Email used for purchase (in case user not created yet)
    metadata JSONB,                             -- Additional Stripe metadata

    -- Timestamps
    purchased_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Friend codes table
CREATE TABLE IF NOT EXISTS "friend_codes" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Code details
    code TEXT UNIQUE NOT NULL,                  -- e.g., "FRIEND-ABC123"

    -- Ownership
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,

    -- Usage
    used_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,

    -- Validation
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,                     -- Optional expiration

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (for $19.97/month journal)
CREATE TABLE IF NOT EXISTS "subscriptions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Stripe subscription data
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,

    -- Subscription details
    status subscription_status NOT NULL DEFAULT 'active',
    amount_cents INTEGER NOT NULL,              -- 1997 for $19.97
    currency TEXT DEFAULT 'usd',
    interval TEXT DEFAULT 'month',              -- 'month' or 'year'

    -- Billing period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,

    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User entitlements view (computed access based on purchases/friend codes/subscriptions)
-- This determines what features a user can access
CREATE TABLE IF NOT EXISTS "user_entitlements" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Challenge access
    has_challenge_access BOOLEAN DEFAULT FALSE,
    challenge_access_type TEXT CHECK (challenge_access_type IN ('purchased', 'friend_code', NULL)),
    challenge_access_granted_at TIMESTAMPTZ,
    challenge_expires_at TIMESTAMPTZ,           -- NULL = lifetime access

    -- Journal subscription access
    has_journal_access BOOLEAN DEFAULT FALSE,
    journal_subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Community access (granted after challenge completion)
    has_community_access BOOLEAN DEFAULT FALSE,
    community_access_granted_at TIMESTAMPTZ,

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases" ON purchases
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for friend_codes
CREATE POLICY "Users can view own created friend codes" ON friend_codes
    FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = used_by_id);

CREATE POLICY "Anyone can validate a friend code" ON friend_codes
    FOR SELECT USING (is_active = TRUE AND used_by_id IS NULL);

CREATE POLICY "Service role can manage friend codes" ON friend_codes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_entitlements
CREATE POLICY "Users can view own entitlements" ON user_entitlements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entitlements" ON user_entitlements
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_checkout_session_id);
CREATE INDEX idx_purchases_stripe_payment ON purchases(stripe_payment_intent_id);
CREATE INDEX idx_purchases_status ON purchases(status);

CREATE INDEX idx_friend_codes_code ON friend_codes(code);
CREATE INDEX idx_friend_codes_creator ON friend_codes(creator_id);
CREATE INDEX idx_friend_codes_active ON friend_codes(is_active, used_by_id) WHERE is_active = TRUE AND used_by_id IS NULL;

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_user_entitlements_user ON user_entitlements(user_id);
CREATE INDEX idx_user_entitlements_challenge ON user_entitlements(has_challenge_access) WHERE has_challenge_access = TRUE;

-- Function to generate unique friend code
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: FRIEND-XXXXXX (6 alphanumeric characters)
        new_code := 'FRIEND-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM friend_codes WHERE code = new_code) INTO code_exists;

        -- Exit loop if unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to grant challenge access after successful purchase
CREATE OR REPLACE FUNCTION grant_challenge_access(
    p_user_id UUID,
    p_access_type TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_entitlements (user_id, has_challenge_access, challenge_access_type, challenge_access_granted_at)
    VALUES (p_user_id, TRUE, p_access_type, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        has_challenge_access = TRUE,
        challenge_access_type = p_access_type,
        challenge_access_granted_at = COALESCE(user_entitlements.challenge_access_granted_at, NOW()),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create friend codes after purchase (2 codes per purchase = Accountability Trio)
CREATE OR REPLACE FUNCTION create_friend_code_for_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create friend codes for completed challenge purchases
    IF NEW.status = 'completed' AND NEW.purchase_type = 'challenge' AND OLD.status != 'completed' THEN
        -- Create TWO friend codes per purchase (Accountability Trio model)
        -- This creates optimal group dynamics: purchaser + 2 friends = trio
        INSERT INTO friend_codes (code, creator_id, purchase_id)
        VALUES
            (generate_friend_code(), NEW.user_id, NEW.id),
            (generate_friend_code(), NEW.user_id, NEW.id);

        -- Grant challenge access to purchaser
        PERFORM grant_challenge_access(NEW.user_id, 'purchased');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create friend code on purchase completion
DROP TRIGGER IF EXISTS create_friend_code_trigger ON purchases;
CREATE TRIGGER create_friend_code_trigger
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_friend_code_for_purchase();

-- Function to redeem friend code
CREATE OR REPLACE FUNCTION redeem_friend_code(
    p_code TEXT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_friend_code RECORD;
    v_result JSONB;
BEGIN
    -- Find and lock the friend code
    SELECT * INTO v_friend_code
    FROM friend_codes
    WHERE code = upper(p_code)
    AND is_active = TRUE
    AND used_by_id IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Invalid or already used friend code'
        );
    END IF;

    -- Check if user is trying to use their own code
    IF v_friend_code.creator_id = p_user_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'You cannot use your own friend code'
        );
    END IF;

    -- Mark code as used
    UPDATE friend_codes
    SET used_by_id = p_user_id,
        used_at = NOW()
    WHERE id = v_friend_code.id;

    -- Grant challenge access to the user
    PERFORM grant_challenge_access(p_user_id, 'friend_code');

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Friend code redeemed successfully! Welcome to the 45-Day Awakening Challenge.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant community access (called when user completes challenge)
CREATE OR REPLACE FUNCTION grant_community_access(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_entitlements
    SET has_community_access = TRUE,
        community_access_granted_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update journal access based on subscription status
CREATE OR REPLACE FUNCTION update_journal_access()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE user_entitlements
        SET has_journal_access = TRUE,
            journal_subscription_id = NEW.id,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.status IN ('canceled', 'unpaid', 'past_due') THEN
        UPDATE user_entitlements
        SET has_journal_access = FALSE,
            journal_subscription_id = NULL,
            updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND journal_subscription_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update journal access on subscription changes
DROP TRIGGER IF EXISTS update_journal_access_trigger ON subscriptions;
CREATE TRIGGER update_journal_access_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_access();

-- Instructors & Coaching System Schema
-- Enables multiple cohorts with different instructors and comprehensive feedback

-- Instructor status enum
CREATE TYPE instructor_status AS ENUM ('pending', 'approved', 'suspended', 'inactive');

-- Instructor specialization enum
CREATE TYPE instructor_specialization AS ENUM (
    'gratitude_coaching',
    'mindfulness',
    'accountability',
    'life_coaching',
    'group_facilitation',
    'wellness',
    'spiritual_growth'
);

-- Instructors table
CREATE TABLE IF NOT EXISTS "instructors" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Profile
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    title TEXT,                                    -- e.g., "Lead Coach", "Gratitude Guide"

    -- Qualifications
    specializations instructor_specialization[] DEFAULT '{}',
    certifications TEXT[],
    years_experience INTEGER DEFAULT 0,

    -- Status
    status instructor_status DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),

    -- Settings
    max_cohorts INTEGER DEFAULT 3,                 -- Max concurrent cohorts
    accepts_new_cohorts BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'America/New_York',

    -- Social links
    linkedin_url TEXT,
    website_url TEXT,

    -- Metrics (denormalized for performance)
    total_cohorts_led INTEGER DEFAULT 0,
    total_participants_coached INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cohort-Instructor assignment (allows multiple instructors per cohort)
CREATE TABLE IF NOT EXISTS "cohort_instructors" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,

    -- Role within the cohort
    role TEXT CHECK (role IN ('lead', 'assistant', 'guest')) DEFAULT 'lead',

    -- Assignment details
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(cohort_id, instructor_id)
);

-- Instructor availability for scheduling
CREATE TABLE IF NOT EXISTS "instructor_availability" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,

    -- Recurring availability (e.g., "every Monday 9am-12pm")
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Or specific date availability
    specific_date DATE,

    -- Whether this is available or blocked
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_availability CHECK (
        (day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (day_of_week IS NULL AND specific_date IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructors
CREATE POLICY "Anyone can view approved instructors" ON instructors
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view own instructor profile" ON instructors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own instructor profile" ON instructors
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage instructors" ON instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for cohort_instructors
CREATE POLICY "Anyone can view cohort instructors" ON cohort_instructors
    FOR SELECT USING (TRUE);

CREATE POLICY "Service role can manage cohort instructors" ON cohort_instructors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for instructor_availability
CREATE POLICY "Anyone can view instructor availability" ON instructor_availability
    FOR SELECT USING (TRUE);

CREATE POLICY "Instructors can manage own availability" ON instructor_availability
    FOR ALL USING (
        instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
    );

-- Indexes
CREATE INDEX idx_instructors_user ON instructors(user_id);
CREATE INDEX idx_instructors_status ON instructors(status) WHERE status = 'approved';
CREATE INDEX idx_instructors_rating ON instructors(average_rating DESC) WHERE status = 'approved';
CREATE INDEX idx_cohort_instructors_cohort ON cohort_instructors(cohort_id);
CREATE INDEX idx_cohort_instructors_instructor ON cohort_instructors(instructor_id);
CREATE INDEX idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX idx_instructor_availability_day ON instructor_availability(day_of_week) WHERE is_available = TRUE;

-- Function to update instructor metrics
CREATE OR REPLACE FUNCTION update_instructor_metrics(p_instructor_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE instructors
    SET
        total_cohorts_led = (
            SELECT COUNT(DISTINCT cohort_id)
            FROM cohort_instructors
            WHERE instructor_id = p_instructor_id AND is_active = TRUE
        ),
        total_participants_coached = (
            SELECT COUNT(DISTINCT cm.user_id)
            FROM cohort_instructors ci
            JOIN cohort_memberships cm ON ci.cohort_id = cm.cohort_id
            WHERE ci.instructor_id = p_instructor_id
        ),
        updated_at = NOW()
    WHERE id = p_instructor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update metrics when cohort instructor changes
CREATE OR REPLACE FUNCTION trigger_update_instructor_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_instructor_metrics(NEW.instructor_id);
    END IF;
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        PERFORM update_instructor_metrics(OLD.instructor_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_instructor_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cohort_instructors
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_instructor_metrics();

-- Feedback & Ratings System Schema
-- Comprehensive feedback system for instructors, content, peers, and experiences

-- Feedback type enum
CREATE TYPE feedback_type AS ENUM (
    'instructor_rating',
    'cohort_rating',
    'peer_encouragement_rating',
    'video_call_rating',
    'ai_conversation_rating',
    'journal_feedback',
    'action_feedback',
    'content_rating',
    'app_feedback'
);

-- Feedback sentiment enum
CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative');

-- Main feedback table (unified feedback system)
CREATE TABLE IF NOT EXISTS "feedback" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Who is giving feedback
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Type and target
    feedback_type feedback_type NOT NULL,
    target_id UUID NOT NULL,                       -- ID of the entity being rated
    target_type TEXT NOT NULL,                     -- Table name for clarity

    -- Rating (1-5 stars)
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),

    -- Detailed feedback
    comment TEXT,
    sentiment feedback_sentiment,

    -- Specific feedback dimensions (optional, depends on type)
    dimensions JSONB,                              -- e.g., {"clarity": 5, "helpfulness": 4, "engagement": 5}

    -- Context
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    session_id UUID,

    -- Flags
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,            -- For testimonials
    is_verified BOOLEAN DEFAULT FALSE,            -- Verified purchase/completion

    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Instructor ratings (specialized view/table for quick lookups)
CREATE TABLE IF NOT EXISTS "instructor_ratings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,

    -- Overall rating
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5) NOT NULL,

    -- Dimension ratings
    knowledge_rating INTEGER CHECK (knowledge_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    engagement_rating INTEGER CHECK (engagement_rating BETWEEN 1 AND 5),
    supportiveness_rating INTEGER CHECK (supportiveness_rating BETWEEN 1 AND 5),

    -- Written feedback
    review_text TEXT,
    would_recommend BOOLEAN,

    -- Testimonial approval
    can_use_as_testimonial BOOLEAN DEFAULT FALSE,
    testimonial_approved BOOLEAN DEFAULT FALSE,

    -- Context
    completed_challenge BOOLEAN DEFAULT FALSE,    -- Did they complete the 45-day challenge?

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- One rating per user per cohort
    UNIQUE(instructor_id, user_id, cohort_id)
);

-- Video call ratings
CREATE TABLE IF NOT EXISTS "video_call_ratings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id TEXT NOT NULL,                        -- References video_rooms.room_id
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Ratings
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5) NOT NULL,
    content_rating INTEGER CHECK (content_rating BETWEEN 1 AND 5),
    technical_quality INTEGER CHECK (technical_quality BETWEEN 1 AND 5),

    -- Feedback
    highlights TEXT,
    improvements TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(room_id, user_id)
);

-- Peer feedback (for encouragements and interactions)
CREATE TABLE IF NOT EXISTS "peer_feedback" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Who is giving/receiving
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    -- Context
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    related_activity_id UUID,                     -- Optional: related to specific activity

    -- Feedback type
    feedback_category TEXT CHECK (feedback_category IN (
        'encouragement_helpful',
        'great_insight',
        'inspiring_progress',
        'supportive_comment',
        'accountability_partner'
    )),

    -- Simple thumbs up/down or rating
    is_positive BOOLEAN DEFAULT TRUE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),

    -- Optional message
    message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate feedback
    UNIQUE(from_user_id, to_user_id, related_activity_id)
);

-- Content effectiveness tracking
CREATE TABLE IF NOT EXISTS "content_ratings" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Content reference
    content_type TEXT CHECK (content_type IN ('quote', 'action', 'journal_prompt', 'meditation', 'video')),
    content_id UUID NOT NULL,

    -- Rating
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    is_helpful BOOLEAN,
    is_favorite BOOLEAN DEFAULT FALSE,

    -- Optional feedback
    feedback TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, content_type, content_id)
);

-- NPS (Net Promoter Score) surveys
CREATE TABLE IF NOT EXISTS "nps_surveys" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- NPS score (0-10)
    score INTEGER CHECK (score BETWEEN 0 AND 10) NOT NULL,

    -- Context
    survey_trigger TEXT,                          -- e.g., 'day_15', 'day_30', 'day_45', 'post_completion'
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,

    -- Follow-up
    feedback TEXT,
    would_recommend_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
CREATE POLICY "Users can view non-anonymous feedback" ON feedback
    FOR SELECT USING (is_anonymous = FALSE OR user_id = auth.uid());

CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feedback" ON feedback
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for instructor_ratings
CREATE POLICY "Anyone can view instructor ratings" ON instructor_ratings
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can create instructor ratings" ON instructor_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON instructor_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for video_call_ratings
CREATE POLICY "Users can view video call ratings" ON video_call_ratings
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can rate calls they attended" ON video_call_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for peer_feedback
CREATE POLICY "Users can view feedback about themselves" ON peer_feedback
    FOR SELECT USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Users can give peer feedback" ON peer_feedback
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies for content_ratings
CREATE POLICY "Users can view own content ratings" ON content_ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can rate content" ON content_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON content_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for nps_surveys
CREATE POLICY "Users can view own NPS responses" ON nps_surveys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit NPS" ON nps_surveys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_target ON feedback(target_type, target_id);
CREATE INDEX idx_feedback_cohort ON feedback(cohort_id);
CREATE INDEX idx_feedback_featured ON feedback(is_featured) WHERE is_featured = TRUE;

CREATE INDEX idx_instructor_ratings_instructor ON instructor_ratings(instructor_id);
CREATE INDEX idx_instructor_ratings_cohort ON instructor_ratings(cohort_id);
CREATE INDEX idx_instructor_ratings_rating ON instructor_ratings(overall_rating);

CREATE INDEX idx_video_call_ratings_room ON video_call_ratings(room_id);
CREATE INDEX idx_peer_feedback_to ON peer_feedback(to_user_id);
CREATE INDEX idx_peer_feedback_cohort ON peer_feedback(cohort_id);
CREATE INDEX idx_content_ratings_content ON content_ratings(content_type, content_id);
CREATE INDEX idx_content_ratings_favorites ON content_ratings(user_id) WHERE is_favorite = TRUE;
CREATE INDEX idx_nps_surveys_user ON nps_surveys(user_id);
CREATE INDEX idx_nps_surveys_trigger ON nps_surveys(survey_trigger);

-- Function to update instructor average rating
CREATE OR REPLACE FUNCTION update_instructor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE instructors
    SET
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM instructor_ratings
            WHERE instructor_id = COALESCE(NEW.instructor_id, OLD.instructor_id)
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM instructor_ratings
            WHERE instructor_id = COALESCE(NEW.instructor_id, OLD.instructor_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.instructor_id, OLD.instructor_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_instructor_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON instructor_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_instructor_rating();

-- View for instructor leaderboard
CREATE OR REPLACE VIEW instructor_leaderboard AS
SELECT
    i.id,
    i.display_name,
    i.avatar_url,
    i.title,
    i.specializations,
    i.average_rating,
    i.total_ratings,
    i.total_cohorts_led,
    i.total_participants_coached,
    RANK() OVER (ORDER BY i.average_rating DESC, i.total_ratings DESC) as rank
FROM instructors i
WHERE i.status = 'approved'
ORDER BY i.average_rating DESC, i.total_ratings DESC;

-- View for cohort feedback summary
CREATE OR REPLACE VIEW cohort_feedback_summary AS
SELECT
    c.id as cohort_id,
    c.name as cohort_name,
    COUNT(DISTINCT ir.id) as total_instructor_ratings,
    AVG(ir.overall_rating) as avg_instructor_rating,
    COUNT(DISTINCT vcr.id) as total_call_ratings,
    AVG(vcr.overall_rating) as avg_call_rating,
    COUNT(DISTINCT nps.id) as total_nps_responses,
    AVG(nps.score) as avg_nps_score
FROM cohorts c
LEFT JOIN instructor_ratings ir ON c.id = ir.cohort_id
LEFT JOIN video_rooms vr ON c.id = vr.cohort_id
LEFT JOIN video_call_ratings vcr ON vr.room_id = vcr.room_id
LEFT JOIN nps_surveys nps ON c.id = nps.cohort_id
GROUP BY c.id, c.name;
