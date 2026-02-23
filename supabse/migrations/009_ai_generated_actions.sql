-- ============================================================================
-- Migration 009: AI-Generated Actions for Post-Day-45 Subscribers
-- ============================================================================
-- After the 45-day challenge, Aria generates personalized Daily Gratitude
-- Actions based on the user's journal patterns. This table caches one
-- generated action per user per day so subsequent loads are instant.
-- ============================================================================

-- 1. Generated actions cache table
CREATE TABLE IF NOT EXISTS "generated_actions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,

    -- Same fields as static actions for API compatibility
    period INTEGER NOT NULL,
    title TEXT NOT NULL,
    tip TEXT,

    is_self BOOLEAN DEFAULT FALSE,
    is_draw BOOLEAN DEFAULT FALSE,
    is_list BOOLEAN DEFAULT FALSE,

    action_type actionType NOT NULL DEFAULT 'daily',

    -- AI metadata
    source TEXT NOT NULL DEFAULT 'ai',   -- 'ai' or 'fallback'

    generation_date DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- One generated action per user per day per type
    UNIQUE(user_id, generation_date, action_type)
);

-- RLS
ALTER TABLE generated_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generated actions"
    ON generated_actions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage generated actions"
    ON generated_actions FOR ALL USING (true);

-- Index for fast lookups
CREATE INDEX idx_generated_actions_user_date
    ON generated_actions(user_id, generation_date, action_type);

-- 2. Allow action_logs to reference generated actions
--    Drop FK constraint so generated action UUIDs can be stored in action_id
ALTER TABLE action_logs DROP CONSTRAINT IF EXISTS action_logs_action_id_fkey;

-- Add source column to distinguish static vs AI-generated action logs
ALTER TABLE action_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'static';
