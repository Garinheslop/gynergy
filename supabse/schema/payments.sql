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

-- Default expiration for friend codes (90 days)
-- This can be configured via environment or adjusted here
CREATE OR REPLACE FUNCTION get_friend_code_expiration()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- Default: 90 days from creation
    RETURN NOW() + INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to create friend codes after purchase (2 codes per purchase = Accountability Trio)
CREATE OR REPLACE FUNCTION create_friend_code_for_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create friend codes for completed challenge purchases with a user_id
    -- Handle both INSERT (new completed purchase) and UPDATE (status changed to completed)
    IF NEW.status = 'completed' AND NEW.purchase_type = 'challenge' AND NEW.user_id IS NOT NULL THEN
        -- For UPDATE: only trigger if status actually changed to completed
        -- For INSERT: always trigger for completed purchases
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed') THEN
            -- Create TWO friend codes per purchase (Accountability Trio model)
            -- This creates optimal group dynamics: purchaser + 2 friends = trio
            -- Each code expires in 90 days by default
            INSERT INTO friend_codes (code, creator_id, purchase_id, expires_at)
            VALUES
                (generate_friend_code(), NEW.user_id, NEW.id, get_friend_code_expiration()),
                (generate_friend_code(), NEW.user_id, NEW.id, get_friend_code_expiration());

            -- Grant challenge access to purchaser
            PERFORM grant_challenge_access(NEW.user_id, 'purchased');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create friend code on purchase completion (fires on both INSERT and UPDATE)
DROP TRIGGER IF EXISTS create_friend_code_trigger ON purchases;
CREATE TRIGGER create_friend_code_trigger
    AFTER INSERT OR UPDATE ON purchases
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

-- ============================================================================
-- Webhook Events Table (Deduplication + Dead Letter Queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "webhook_events" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',     -- processing, processed, failed
    payload JSONB,
    error_message TEXT,
    attempts INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_failed_at TIMESTAMPTZ
);

-- Index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
-- Index for finding failed events (dead letter queue)
CREATE INDEX IF NOT EXISTS idx_webhook_events_failed ON webhook_events(status) WHERE status = 'failed';

-- RLS: Only service role can access webhook events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages webhook events"
    ON webhook_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Auto-cleanup: Remove processed events older than 30 days
-- (Run via cron or manual cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events
    WHERE status = 'processed'
    AND processed_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
