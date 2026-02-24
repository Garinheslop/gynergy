-- Content Ratings Schema
-- User ratings and reviews for content items

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

-- Enable RLS
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_ratings
CREATE POLICY "Users can view own content ratings" ON content_ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can rate content" ON content_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON content_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_content_ratings_content ON content_ratings(content_type, content_id);
CREATE INDEX idx_content_ratings_favorites ON content_ratings(user_id) WHERE is_favorite = TRUE;
