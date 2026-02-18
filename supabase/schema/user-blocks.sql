-- User Blocks Schema
-- Bidirectional blocking: neither user sees the other's posts, comments, or profile
-- Apple Guideline 1.2 + Google UGC policy requirement

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Prevent duplicate blocks
  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
  -- Prevent self-blocking
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Indexes for fast lookup in both directions
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- RLS policies
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (both directions)
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can block others"
  ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock (delete their own blocks)
CREATE POLICY "Users can unblock"
  ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Helper function: Get all blocked user IDs for a user (BIDIRECTIONAL)
-- Returns user IDs where current user blocked them OR they blocked current user
CREATE OR REPLACE FUNCTION get_blocked_user_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT blocked_id FROM user_blocks WHERE blocker_id = uid
  UNION
  SELECT blocker_id FROM user_blocks WHERE blocked_id = uid;
$$;
