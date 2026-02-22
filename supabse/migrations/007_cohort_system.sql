-- Migration 007: Cohort System Foundation
--
-- Adds columns and triggers needed for real cohort separation:
-- 1. book_sessions gets status tracking, cohort label, grace period, max enrollments, personal session support
-- 2. user_entitlements gets challenge_session_id to link purchases to specific sessions
-- 3. Auto-create cohort when a book_session is created (trigger)
-- 4. cohort_transitions table for lifecycle tracking
-- 5. Update grant_challenge_access() to accept session_id and set expiration
--
-- This is additive only — no existing data is modified, no columns removed.

-- ============================================================================
-- 1. book_sessions: Add cohort lifecycle columns
-- ============================================================================

ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS cohort_label TEXT;

ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('upcoming', 'active', 'grace_period', 'completed'));

ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ;

ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS max_enrollments INTEGER DEFAULT 15;

-- Personal session support (for standalone journal subscribers)
ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE;
ALTER TABLE book_sessions ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Index for finding active/upcoming sessions
CREATE INDEX IF NOT EXISTS idx_book_sessions_status ON book_sessions(status);
CREATE INDEX IF NOT EXISTS idx_book_sessions_dates ON book_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_book_sessions_personal ON book_sessions(owner_user_id) WHERE is_personal = TRUE;

-- ============================================================================
-- 2. user_entitlements: Link to specific challenge session
-- ============================================================================

ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS challenge_session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_entitlements_session ON user_entitlements(challenge_session_id);

-- ============================================================================
-- 3. Auto-create cohort when book_session is inserted (non-personal only)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_cohort_for_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create cohorts for non-personal sessions
  IF NEW.is_personal = TRUE THEN
    RETURN NEW;
  END IF;

  INSERT INTO cohorts (name, slug, session_id, start_date, end_date, max_members, is_active, is_public)
  VALUES (
    COALESCE(NEW.cohort_label, 'Cohort ' || to_char(NEW.start_date, 'Mon YYYY')),
    'cohort-' || to_char(NEW.start_date, 'YYYY-MM-DD'),
    NEW.id,
    NEW.start_date::DATE,
    NEW.end_date::DATE,
    COALESCE(NEW.max_enrollments, 15),
    TRUE,
    TRUE
  );

  -- Auto-set grace_period_end if not provided (end_date + 30 days)
  IF NEW.grace_period_end IS NULL THEN
    UPDATE book_sessions
    SET grace_period_end = NEW.end_date + INTERVAL '30 days'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_create_cohort ON book_sessions;
CREATE TRIGGER trg_auto_create_cohort
  AFTER INSERT ON book_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_cohort_for_session();

-- ============================================================================
-- 4. cohort_transitions: Track lifecycle events per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cohort_transitions" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  from_session_id UUID REFERENCES book_sessions(id) ON DELETE SET NULL,
  transition_type TEXT NOT NULL CHECK (transition_type IN (
    'challenge_started',
    'challenge_completed',
    'grace_period_started',
    'grace_period_ended',
    'converted_to_subscription',
    'churned',
    'alumni_granted'
  )),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cohort_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transitions" ON cohort_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transitions" ON cohort_transitions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_cohort_transitions_user ON cohort_transitions(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_transitions_session ON cohort_transitions(from_session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_transitions_type ON cohort_transitions(transition_type);

-- ============================================================================
-- 5. Update grant_challenge_access() to accept session_id and set expiration
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_challenge_access(
    p_user_id UUID,
    p_access_type TEXT,
    p_session_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_grace_end TIMESTAMPTZ;
BEGIN
    -- Calculate expiration: session end_date + 30 day grace period
    IF p_session_id IS NOT NULL THEN
        SELECT COALESCE(grace_period_end, end_date + INTERVAL '30 days')
        INTO v_grace_end
        FROM book_sessions WHERE id = p_session_id;
    END IF;

    INSERT INTO user_entitlements (
        user_id, has_challenge_access, challenge_access_type,
        challenge_access_granted_at, challenge_expires_at, challenge_session_id
    )
    VALUES (p_user_id, TRUE, p_access_type, NOW(), v_grace_end, p_session_id)
    ON CONFLICT (user_id) DO UPDATE SET
        has_challenge_access = TRUE,
        challenge_access_type = p_access_type,
        challenge_access_granted_at = COALESCE(user_entitlements.challenge_access_granted_at, NOW()),
        challenge_expires_at = COALESCE(v_grace_end, user_entitlements.challenge_expires_at),
        challenge_session_id = COALESCE(p_session_id, user_entitlements.challenge_session_id),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Backfill: Set existing mega-session status and link existing users
-- ============================================================================

-- Mark the existing mega-session as 'active' with status column
UPDATE book_sessions
SET status = 'active',
    cohort_label = 'Founding Members',
    grace_period_end = end_date + INTERVAL '30 days'
WHERE id = '3ae42bc9-1f98-4aa3-8304-6bb75844bfd0';

-- Backfill existing user_entitlements to link to the mega-session
UPDATE user_entitlements
SET challenge_session_id = '3ae42bc9-1f98-4aa3-8304-6bb75844bfd0'
WHERE has_challenge_access = TRUE
  AND challenge_session_id IS NULL;

-- ============================================================================
-- 7. Alumni cohort (permanent, not time-bound)
-- ============================================================================

INSERT INTO cohorts (name, slug, start_date, end_date, max_members, is_active, is_public)
VALUES (
  'Gynergy Alumni',
  'alumni',
  '2025-01-01',
  '2099-12-31',
  999999,
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 8. Subscriber referral system
-- ============================================================================

CREATE TABLE IF NOT EXISTS "referral_links" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    credits_earned_cents INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "referral_events" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    referred_email TEXT NOT NULL,
    referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('clicked', 'signed_up', 'subscribed', 'challenge_purchased')),
    credit_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral links" ON referral_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages referral links" ON referral_links
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own referral events" ON referral_events
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Service role manages referral events" ON referral_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE INDEX IF NOT EXISTS idx_referral_links_user ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_link ON referral_events(referral_link_id);
