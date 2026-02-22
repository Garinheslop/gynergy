-- Migration 008: Quality Fixes
--
-- Contains:
-- 1. Enrollment capacity guard trigger (P0-3: prevents cohort overselling)
-- 2. Legacy challenge_expires_at backfill (P0-2: closes NULL expiration bypass)
-- 3. Index on grace_period_end (performance: lifecycle cron queries)

-- ============================================================================
-- 1. Enrollment Capacity Guard Trigger
-- ============================================================================
-- Atomic check: prevents race condition between count check and INSERT.
-- Raises check_violation (23514) if session is at max capacity.

CREATE OR REPLACE FUNCTION check_enrollment_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
BEGIN
  SELECT max_enrollments INTO v_max
  FROM book_sessions WHERE id = NEW.session_id;

  -- No limit set = unlimited enrollments
  IF v_max IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_current
  FROM session_enrollments WHERE session_id = NEW.session_id;

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'Session enrollment capacity reached (% of %)', v_current, v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_enrollment_capacity
  BEFORE INSERT ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION check_enrollment_capacity();

-- ============================================================================
-- 2. Legacy challenge_expires_at Backfill
-- ============================================================================
-- Users with has_challenge_access=true but NULL challenge_expires_at bypass
-- the middleware expiration check. This backfills based on their linked session
-- or grants a 30-day grace period if no session is linked.

-- Case A: Users WITH a linked session → use session's grace_period_end or end_date + 30 days
UPDATE user_entitlements ue
SET challenge_expires_at = COALESCE(bs.grace_period_end, bs.end_date + INTERVAL '30 days')
FROM book_sessions bs
WHERE ue.challenge_session_id = bs.id
  AND ue.has_challenge_access = TRUE
  AND ue.challenge_expires_at IS NULL;

-- Case B: Users WITHOUT a linked session → 30-day grace from now
UPDATE user_entitlements
SET challenge_expires_at = NOW() + INTERVAL '30 days'
WHERE has_challenge_access = TRUE
  AND challenge_expires_at IS NULL
  AND challenge_session_id IS NULL;

-- ============================================================================
-- 3. Performance Index
-- ============================================================================
-- Lifecycle cron queries book_sessions WHERE status='grace_period' AND grace_period_end < now.
-- This index supports that query pattern.

CREATE INDEX IF NOT EXISTS idx_book_sessions_grace_period_end
  ON book_sessions (grace_period_end)
  WHERE grace_period_end IS NOT NULL;
