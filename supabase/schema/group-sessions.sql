-- ============================================================================
-- GROUP SESSIONS: Group Coaching, Hot Seat, Breakout Rooms
-- ============================================================================
-- Supports interactive many-to-many WebRTC sessions via 100ms SDK
-- Tables: group_sessions, session_participants, hand_raises, breakout_rooms, session_chat

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE session_type AS ENUM (
        'group_coaching',
        'hot_seat',
        'workshop'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hand_raise_status AS ENUM (
        'raised',
        'acknowledged',
        'active',
        'completed',
        'dismissed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE breakout_assignment_method AS ENUM (
        'random',
        'manual',
        'self_select'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE breakout_status AS ENUM (
        'pending',
        'active',
        'returning',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: group_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Basic Info
    title TEXT NOT NULL,
    description TEXT,
    session_type session_type NOT NULL DEFAULT 'group_coaching',

    -- Scheduling
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    timezone TEXT DEFAULT 'America/Los_Angeles',

    -- 100ms Integration (main room)
    hms_room_id TEXT,
    hms_template_id TEXT,

    -- Host
    host_id UUID REFERENCES auth.users(id) NOT NULL,
    co_host_ids UUID[] DEFAULT '{}',

    -- Capacity
    max_participants INTEGER DEFAULT 25,

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'draft', 'scheduled', 'live', 'ended', 'cancelled'
    )),

    -- Feature Flags
    chat_enabled BOOLEAN DEFAULT true,
    qa_enabled BOOLEAN DEFAULT false,
    hot_seat_enabled BOOLEAN DEFAULT true,
    breakout_enabled BOOLEAN DEFAULT true,
    recording_enabled BOOLEAN DEFAULT true,

    -- Hot Seat Settings
    hot_seat_duration_seconds INTEGER DEFAULT 300,
    hot_seat_auto_rotate BOOLEAN DEFAULT false,

    -- Recording
    recording_url TEXT,

    -- Linkage (optional tie to a cohort/program)
    cohort_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_sessions_host ON group_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_status ON group_sessions(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_group_sessions_hms ON group_sessions(hms_room_id);

-- ============================================================================
-- TABLE: session_participants
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role within session
    role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),

    -- RSVP
    rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')),

    -- Attendance
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,

    -- Breakout placement (null = main room)
    current_breakout_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);

-- ============================================================================
-- TABLE: hand_raises
-- ============================================================================

CREATE TABLE IF NOT EXISTS hand_raises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Status
    status hand_raise_status DEFAULT 'raised',

    -- Queue positioning
    raised_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    active_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Hot seat timing
    hot_seat_duration_seconds INTEGER,
    hot_seat_started_at TIMESTAMPTZ,
    hot_seat_ended_at TIMESTAMPTZ,
    time_extended_seconds INTEGER DEFAULT 0,

    -- User display info (denormalized for Realtime performance)
    user_name TEXT,
    user_avatar TEXT,

    -- Topic (optional)
    topic TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_hand_raises_session ON hand_raises(session_id, status);
CREATE INDEX IF NOT EXISTS idx_hand_raises_queue ON hand_raises(session_id, raised_at)
    WHERE status IN ('raised', 'acknowledged');

-- ============================================================================
-- TABLE: breakout_rooms
-- ============================================================================

CREATE TABLE IF NOT EXISTS breakout_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,

    -- Room info
    name TEXT NOT NULL,
    topic TEXT,
    room_number INTEGER NOT NULL,

    -- 100ms Integration (each breakout = separate 100ms room)
    hms_room_id TEXT,

    -- Status
    status breakout_status DEFAULT 'pending',

    -- Configuration
    max_participants INTEGER DEFAULT 8,
    assignment_method breakout_assignment_method DEFAULT 'random',

    -- Timing
    duration_seconds INTEGER DEFAULT 600,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breakout_rooms_session ON breakout_rooms(session_id);
CREATE INDEX IF NOT EXISTS idx_breakout_rooms_status ON breakout_rooms(session_id, status);

-- ============================================================================
-- TABLE: session_chat
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,

    -- Message
    message TEXT NOT NULL,
    sent_by_user_id UUID REFERENCES auth.users(id),
    sent_by_name TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),

    -- Context
    breakout_room_id UUID REFERENCES breakout_rooms(id) ON DELETE CASCADE,
    is_host_message BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_session_chat_session ON session_chat(session_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_chat_breakout ON session_chat(breakout_room_id, sent_at DESC)
    WHERE breakout_room_id IS NOT NULL;

-- ============================================================================
-- FOREIGN KEYS (added after all tables exist)
-- ============================================================================

ALTER TABLE session_participants
    ADD CONSTRAINT fk_session_participants_breakout
    FOREIGN KEY (current_breakout_id) REFERENCES breakout_rooms(id) ON DELETE SET NULL;

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE hand_raises;
ALTER PUBLICATION supabase_realtime ADD TABLE breakout_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE session_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_raises ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakout_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_chat ENABLE ROW LEVEL SECURITY;

-- group_sessions: hosts manage, participants view
CREATE POLICY "Hosts can manage sessions"
    ON group_sessions FOR ALL TO authenticated
    USING (host_id = auth.uid() OR auth.uid() = ANY(co_host_ids));

CREATE POLICY "Participants can view their sessions"
    ON group_sessions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM session_participants
        WHERE session_participants.session_id = group_sessions.id
        AND session_participants.user_id = auth.uid()
    ));

CREATE POLICY "Service role full access sessions"
    ON group_sessions FOR ALL TO service_role USING (true);

-- session_participants
CREATE POLICY "Users view participants in their sessions"
    ON session_participants FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM session_participants sp2
        WHERE sp2.session_id = session_participants.session_id
        AND sp2.user_id = auth.uid()
    ));

CREATE POLICY "Users manage own participation"
    ON session_participants FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role full access participants"
    ON session_participants FOR ALL TO service_role USING (true);

-- hand_raises
CREATE POLICY "Participants view hand raises"
    ON hand_raises FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM session_participants
        WHERE session_participants.session_id = hand_raises.session_id
        AND session_participants.user_id = auth.uid()
    ));

CREATE POLICY "Users raise own hand"
    ON hand_raises FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access hand raises"
    ON hand_raises FOR ALL TO service_role USING (true);

-- breakout_rooms
CREATE POLICY "Participants view breakout rooms"
    ON breakout_rooms FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM session_participants
        WHERE session_participants.session_id = breakout_rooms.session_id
        AND session_participants.user_id = auth.uid()
    ));

CREATE POLICY "Service role full access breakout rooms"
    ON breakout_rooms FOR ALL TO service_role USING (true);

-- session_chat
CREATE POLICY "Participants view session chat"
    ON session_chat FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM session_participants
        WHERE session_participants.session_id = session_chat.session_id
        AND session_participants.user_id = auth.uid()
    ));

CREATE POLICY "Participants send chat messages"
    ON session_chat FOR INSERT TO authenticated
    WITH CHECK (sent_by_user_id = auth.uid());

CREATE POLICY "Service role full access session chat"
    ON session_chat FOR ALL TO service_role USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on group_sessions
CREATE OR REPLACE FUNCTION update_group_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_sessions_updated_at
    BEFORE UPDATE ON group_sessions
    FOR EACH ROW EXECUTE FUNCTION update_group_sessions_updated_at();

-- Auto-calculate duration on session_participants when left_at is set
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_participant_duration
    BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION calculate_session_duration();
