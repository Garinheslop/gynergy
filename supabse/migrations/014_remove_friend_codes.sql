-- ============================================
-- MIGRATION 014: REMOVE FRIEND CODE SYSTEM
-- ============================================
-- Friend codes replaced by gynergy.com referral credit system.
-- Referral credits are managed by gynergy.com and stored in
-- referral_credits table (created in migration 012).
-- Date: 2026-03-02
-- Context: Sprint 2 — friend code → referral credit transition
-- ============================================

-- ============================================
-- STEP 1: DROP TRIGGER (must be before functions)
-- ============================================

DROP TRIGGER IF EXISTS create_friend_code_trigger ON purchases;

-- ============================================
-- STEP 2: DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS create_friend_code_for_purchase();
DROP FUNCTION IF EXISTS redeem_friend_code(TEXT, UUID);
DROP FUNCTION IF EXISTS generate_friend_code();
DROP FUNCTION IF EXISTS get_friend_code_expiration();

-- ============================================
-- STEP 3: DROP INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_friend_codes_code;
DROP INDEX IF EXISTS idx_friend_codes_creator;
DROP INDEX IF EXISTS idx_friend_codes_active;

-- ============================================
-- STEP 4: DROP RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own created friend codes" ON friend_codes;
DROP POLICY IF EXISTS "Anyone can validate a friend code" ON friend_codes;
DROP POLICY IF EXISTS "Service role can manage friend codes" ON friend_codes;

-- ============================================
-- STEP 5: DROP TABLE
-- ============================================

DROP TABLE IF EXISTS friend_codes;

-- ============================================
-- STEP 6: CLEAN UP purchase_type ENUM
-- Remove 'challenge_friend_code' value.
-- PostgreSQL doesn't support DROP VALUE from enums natively,
-- so we recreate via a temp column approach.
-- ============================================

-- Add new column with clean type
ALTER TABLE purchases ADD COLUMN purchase_type_new TEXT
  DEFAULT 'challenge'
  CHECK (purchase_type_new IN ('challenge'));

-- Copy existing data (map friend_code purchases to challenge)
UPDATE purchases SET purchase_type_new = 'challenge';

-- Drop old column and rename
ALTER TABLE purchases DROP COLUMN purchase_type;
ALTER TABLE purchases RENAME COLUMN purchase_type_new TO purchase_type;

-- ============================================
-- STEP 7: UPDATE challenge_access_type CHECK
-- Remove 'friend_code' from allowed values
-- ============================================

ALTER TABLE user_entitlements DROP CONSTRAINT IF EXISTS user_entitlements_challenge_access_type_check;
ALTER TABLE user_entitlements ADD CONSTRAINT user_entitlements_challenge_access_type_check
  CHECK (challenge_access_type IN ('purchased', NULL));

-- Migrate existing friend_code access to purchased
UPDATE user_entitlements
  SET challenge_access_type = 'purchased'
  WHERE challenge_access_type = 'friend_code';

-- ============================================
-- STEP 8: RENAME DRIP CAMPAIGN TRIGGER EVENTS
-- friend_codes_issued → referral_credit_issued
-- challenge_completed_friend_code → challenge_completed_referral
-- ============================================

-- Update existing campaign rows
UPDATE drip_campaigns
  SET trigger_event = 'referral_credit_issued',
      name = 'Referral Credit Reminders',
      description = 'Remind users to share their referral credit link. Enrolled after purchase when credit is generated.'
  WHERE trigger_event = 'friend_codes_issued';

UPDATE drip_campaigns
  SET trigger_event = 'challenge_completed_referral',
      name = 'Challenge Completed (Referral)',
      description = 'Post-challenge drip for users who joined via referral credit. Celebration + subscribe CTA.'
  WHERE trigger_event = 'challenge_completed_friend_code';

-- Update the CHECK constraint to use new trigger event names
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
    'trial_ending_soon'
  ));
