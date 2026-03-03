-- ============================================
-- MIGRATION 012: PROVISION INFRASTRUCTURE
-- ============================================
-- Adds tables for gynergy.com → gynergy.app integration:
--   1. onboarding_tokens — one-time magic links for provisioned users
--   2. referral_credits — credits issued by gynergy.com for sharing
--   3. provision_events — deduplication + audit trail
--   4. gender column on users table
-- Date: 2026-02-28
-- Context: Sprint 1 of gynergy.com integration
-- ============================================

-- ============================================
-- STEP 1: ONBOARDING TOKENS
-- One-time tokens for auto-login after gynergy.com purchase
-- ============================================

CREATE TABLE IF NOT EXISTS "onboarding_tokens" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup by token (the primary access pattern)
CREATE INDEX idx_onboarding_tokens_token ON onboarding_tokens(token) WHERE used_at IS NULL;

-- Cleanup: find expired unused tokens
CREATE INDEX idx_onboarding_tokens_expires ON onboarding_tokens(expires_at) WHERE used_at IS NULL;

-- RLS: Only service role can manage tokens
ALTER TABLE onboarding_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages onboarding tokens"
    ON onboarding_tokens FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- STEP 2: REFERRAL CREDITS
-- Credits issued by gynergy.com, displayed in gynergy.app
-- ============================================

CREATE TABLE IF NOT EXISTS "referral_credits" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,                             -- e.g., "A3B7K2"
    share_url TEXT NOT NULL,                        -- e.g., "https://gynergy.com/gift/A3B7K2"

    -- Credit options (stored as JSONB array)
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Each option: { creditType, creditAmountCents, friendPaysCents }

    -- Lifecycle
    redeemed_at TIMESTAMPTZ,
    redeemer_email TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Lookup by user (dashboard display)
CREATE INDEX idx_referral_credits_user ON referral_credits(user_id);

-- Lookup by slug (for redeemed webhook)
CREATE UNIQUE INDEX idx_referral_credits_slug ON referral_credits(slug);

-- RLS
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral credits" ON referral_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages referral credits" ON referral_credits
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- STEP 3: PROVISION EVENTS (Deduplication)
-- Prevents double-provisioning from retried requests
-- ============================================

CREATE TABLE IF NOT EXISTS "provision_events" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,          -- Dedup key
    email TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'completed', 'failed')),
    onboarding_url TEXT,                             -- Cached for idempotent returns
    payload JSONB,                                   -- Full request body for audit
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_provision_events_stripe ON provision_events(stripe_session_id);
CREATE INDEX idx_provision_events_email ON provision_events(email);

-- RLS: Only service role
ALTER TABLE provision_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages provision events"
    ON provision_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- STEP 4: ADD GENDER TO USERS TABLE
-- gynergy.com is co-ed; gynergy.app needs gender field
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

-- ============================================
-- STEP 5: CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM onboarding_tokens
    WHERE expires_at < NOW()
    AND used_at IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
