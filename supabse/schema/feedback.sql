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
