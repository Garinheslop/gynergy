-- ============================================================================
-- MIGRATION 016: PROVISION ENDPOINT — External User Provisioning Support
-- ============================================================================
-- Adds schema support for the POST /api/onboarding/provision endpoint.
-- This endpoint is called by gynergy.com / lvl5life.com after a purchase
-- to create user accounts in the portal.
--
-- Changes:
--   1. Add `gender` column to users table
--   2. Create `external_assessments` table (stores assessment data from gynergy.com)
--   3. Update drip_campaigns CHECK to include friend_codes_issued trigger
-- Date: 2026-03-02
-- Context: Sprint 4 — Integration
-- ============================================================================

-- ============================================================================
-- STEP 1: Add gender column to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;

-- ============================================================================
-- STEP 2: Create external_assessments table
-- ============================================================================
-- Stores assessment data from gynergy.com's ascension assessment.
-- Separate from portal's own assessment_results (different scale/fields).

CREATE TABLE IF NOT EXISTS external_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL DEFAULT 'gynergy.com',

  -- Pillar scores (0-100 scale from external assessment)
  pillar_scores JSONB,

  -- Ascension data
  ascension_level INTEGER,
  qualification_tier TEXT,
  leverage_point JSONB,
  maslow JSONB,

  -- Full raw payload for future use
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE external_assessments ENABLE ROW LEVEL SECURITY;

-- Service role can manage all records
CREATE POLICY "service_role_manage_external_assessments" ON external_assessments
  FOR ALL USING (true) WITH CHECK (true);

-- Users can read their own assessments
CREATE POLICY "users_read_own_external_assessments" ON external_assessments
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 3: Update drip_campaigns trigger_event CHECK constraint
-- ============================================================================
-- Add friend_codes_issued if not already present (needed for provision drip enrollment)

ALTER TABLE drip_campaigns DROP CONSTRAINT IF EXISTS drip_campaigns_trigger_event_check;
ALTER TABLE drip_campaigns ADD CONSTRAINT drip_campaigns_trigger_event_check
  CHECK (trigger_event IN (
    'webinar_registered',
    'assessment_completed',
    'purchase_completed',
    'cart_abandoned',
    'user_inactive',
    'referral_credit_issued',
    'community_activated',
    'challenge_completed_purchaser',
    'challenge_completed_referral',
    'trial_ending_soon',
    'bridge_month_started',
    'friend_codes_issued'
  ));
