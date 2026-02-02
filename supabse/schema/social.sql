-- Social/Activity System Schema
-- Activity feed, reactions, and direct messages for cohort communication

-- Activity event types
CREATE TYPE activity_event_type AS ENUM (
    'streak_milestone',
    'badge_earned',
    'journal_complete',
    'dga_complete',
    'vision_complete',
    'journey_complete',
    'milestone_reached',
    'perfect_day',
    'encouragement_sent',
    'joined_cohort'
);

-- Visibility levels
CREATE TYPE activity_visibility AS ENUM ('private', 'cohort', 'public');

-- Activity feed events table
CREATE TABLE IF NOT EXISTS "activity_events" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    event_type activity_event_type NOT NULL,
    event_data JSONB NOT NULL,             -- Flexible data based on event type
    visibility activity_visibility DEFAULT 'cohort',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reaction types
CREATE TYPE reaction_type AS ENUM ('cheer', 'clap', 'fire', 'heart');

-- Activity reactions table
CREATE TABLE IF NOT EXISTS "activity_reactions" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_id UUID REFERENCES activity_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reaction_type reaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id, reaction_type)
);

-- Direct messages table for cohort member communication
CREATE TABLE IF NOT EXISTS "direct_messages" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Encouragements table (quick positive messages within cohort)
CREATE TABLE IF NOT EXISTS "encouragements" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('keep_going', 'great_job', 'youve_got_this', 'proud_of_you', 'custom')),
    custom_message TEXT,                   -- Only if message_type is 'custom'
    related_activity_id UUID REFERENCES activity_events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_events
CREATE POLICY "Users can view own activities" ON activity_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Cohort members can view cohort activities" ON activity_events
    FOR SELECT USING (
        visibility = 'cohort' AND
        EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = activity_events.cohort_id
            AND cohort_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view public activities" ON activity_events
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can create own activities" ON activity_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_reactions
CREATE POLICY "Users can view reactions on visible activities" ON activity_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_events ae
            WHERE ae.id = activity_reactions.activity_id
            AND (
                ae.user_id = auth.uid() OR
                ae.visibility = 'public' OR
                (ae.visibility = 'cohort' AND EXISTS (
                    SELECT 1 FROM cohort_memberships cm
                    WHERE cm.cohort_id = ae.cohort_id
                    AND cm.user_id = auth.uid()
                ))
            )
        )
    );

CREATE POLICY "Users can add reactions" ON activity_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON activity_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view their messages" ON direct_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages to cohort members" ON direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        (
            cohort_id IS NULL OR
            (
                EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_id = direct_messages.cohort_id AND user_id = auth.uid()) AND
                EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_id = direct_messages.cohort_id AND user_id = recipient_id)
            )
        )
    );

CREATE POLICY "Users can update own received messages" ON direct_messages
    FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for encouragements
CREATE POLICY "Users can view received encouragements" ON encouragements
    FOR SELECT USING (
        auth.uid() = recipient_id OR auth.uid() = sender_id
    );

CREATE POLICY "Users can send encouragements to cohort members" ON encouragements
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        (
            cohort_id IS NULL OR
            (
                EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_id = encouragements.cohort_id AND user_id = auth.uid()) AND
                EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_id = encouragements.cohort_id AND user_id = recipient_id)
            )
        )
    );

-- Indexes for performance
CREATE INDEX idx_activity_events_user ON activity_events(user_id, created_at DESC);
CREATE INDEX idx_activity_events_cohort ON activity_events(cohort_id, created_at DESC);
CREATE INDEX idx_activity_events_type ON activity_events(event_type, created_at DESC);
CREATE INDEX idx_activity_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX idx_activity_reactions_user ON activity_reactions(user_id);
CREATE INDEX idx_direct_messages_recipient ON direct_messages(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_direct_messages_cohort ON direct_messages(cohort_id, created_at DESC);
CREATE INDEX idx_encouragements_recipient ON encouragements(recipient_id, created_at DESC);
CREATE INDEX idx_encouragements_sender ON encouragements(sender_id, created_at DESC);

-- Function to create activity event on journal completion
CREATE OR REPLACE FUNCTION create_journal_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_cohort_id UUID;
BEGIN
    -- Only trigger on completion
    IF NEW.is_completed = TRUE AND (OLD IS NULL OR OLD.is_completed = FALSE) THEN
        -- Get user's active cohort
        SELECT cm.cohort_id INTO user_cohort_id
        FROM cohort_memberships cm
        JOIN cohorts c ON c.id = cm.cohort_id
        WHERE cm.user_id = NEW.user_id
        AND c.is_active = TRUE
        ORDER BY cm.joined_at DESC
        LIMIT 1;

        INSERT INTO activity_events (user_id, cohort_id, event_type, event_data, visibility)
        VALUES (
            NEW.user_id,
            user_cohort_id,
            'journal_complete',
            jsonb_build_object(
                'journal_type', NEW.journal_type,
                'journal_id', NEW.id,
                'entry_date', NEW.entry_date
            ),
            'cohort'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for journal completions
DROP TRIGGER IF EXISTS journal_activity_trigger ON journals;
CREATE TRIGGER journal_activity_trigger
    AFTER INSERT OR UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION create_journal_activity();

-- Function to create activity event on DGA completion
CREATE OR REPLACE FUNCTION create_dga_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_cohort_id UUID;
BEGIN
    -- Only trigger on DGA completion
    IF NEW.is_completed = TRUE AND NEW.action_type = 'gratitude' AND (OLD IS NULL OR OLD.is_completed = FALSE) THEN
        -- Get user's active cohort
        SELECT cm.cohort_id INTO user_cohort_id
        FROM cohort_memberships cm
        JOIN cohorts c ON c.id = cm.cohort_id
        WHERE cm.user_id = NEW.user_id
        AND c.is_active = TRUE
        ORDER BY cm.joined_at DESC
        LIMIT 1;

        INSERT INTO activity_events (user_id, cohort_id, event_type, event_data, visibility)
        VALUES (
            NEW.user_id,
            user_cohort_id,
            'dga_complete',
            jsonb_build_object(
                'action_log_id', NEW.id,
                'entry_date', NEW.entry_date,
                'reflection', LEFT(NEW.reflection, 100)  -- Preview only
            ),
            'cohort'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for DGA completions
DROP TRIGGER IF EXISTS dga_activity_trigger ON action_logs;
CREATE TRIGGER dga_activity_trigger
    AFTER INSERT OR UPDATE ON action_logs
    FOR EACH ROW
    EXECUTE FUNCTION create_dga_activity();
