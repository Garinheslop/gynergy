-- Social Sharing Schema
-- Share cards for social media sharing of DGAs and achievements

-- Share card types
CREATE TYPE share_card_type AS ENUM (
    'dga_completion',
    'streak_7',
    'streak_14',
    'streak_21',
    'streak_30',
    'streak_45',
    'badge_earned',
    'milestone_reached',
    'journey_complete',
    'graduation'
);

-- Share cards table
CREATE TABLE IF NOT EXISTS "share_cards" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    card_type share_card_type NOT NULL,
    card_data JSONB NOT NULL,              -- Content data for card generation
    image_url TEXT,                        -- Generated image URL (stored in Supabase Storage)
    share_token TEXT UNIQUE NOT NULL,      -- Unique token for public share URLs
    share_count INTEGER DEFAULT 0,
    platforms_shared TEXT[],               -- ['instagram', 'twitter', 'facebook', etc.]
    expires_at TIMESTAMPTZ,                -- Optional expiration
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Share analytics table
CREATE TABLE IF NOT EXISTS "share_analytics" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    share_card_id UUID REFERENCES share_cards(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,                -- 'instagram', 'twitter', 'facebook', 'copy_link', 'download'
    action TEXT NOT NULL,                  -- 'initiated', 'completed', 'viewed'
    viewer_ip_hash TEXT,                   -- Hashed IP for unique view counting
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE share_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_cards
CREATE POLICY "Users can view own share cards" ON share_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view by share token" ON share_cards
    FOR SELECT USING (
        share_token IS NOT NULL AND
        (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    );

CREATE POLICY "Users can create own share cards" ON share_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own share cards" ON share_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own share cards" ON share_cards
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for share_analytics
CREATE POLICY "Users can view analytics for own shares" ON share_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM share_cards
            WHERE share_cards.id = share_analytics.share_card_id
            AND share_cards.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create analytics" ON share_analytics
    FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_share_cards_user ON share_cards(user_id, created_at DESC);
CREATE INDEX idx_share_cards_token ON share_cards(share_token);
CREATE INDEX idx_share_cards_type ON share_cards(card_type);
CREATE INDEX idx_share_analytics_card ON share_analytics(share_card_id, created_at DESC);
CREATE INDEX idx_share_analytics_platform ON share_analytics(platform, action);

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random 12-character alphanumeric token
        token := encode(gen_random_bytes(9), 'base64');
        token := replace(replace(replace(token, '+', 'x'), '/', 'y'), '=', '');
        token := substring(token from 1 for 12);

        -- Check if token already exists
        SELECT COUNT(*) INTO exists_count FROM share_cards WHERE share_token = token;

        IF exists_count = 0 THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share token
CREATE OR REPLACE FUNCTION set_share_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_token IS NULL THEN
        NEW.share_token := generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS share_cards_token_trigger ON share_cards;
CREATE TRIGGER share_cards_token_trigger
    BEFORE INSERT ON share_cards
    FOR EACH ROW
    EXECUTE FUNCTION set_share_token();

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_share_count(card_id UUID, platform TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE share_cards
    SET
        share_count = share_count + 1,
        platforms_shared = CASE
            WHEN platforms_shared IS NULL THEN ARRAY[platform]
            WHEN NOT (platform = ANY(platforms_shared)) THEN array_append(platforms_shared, platform)
            ELSE platforms_shared
        END
    WHERE id = card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
