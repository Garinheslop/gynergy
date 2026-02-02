-- Video Calls Schema for 100ms Integration
-- Supports: Cohort calls, 1:1 coaching, community check-ins, accountability pods

-- Room type enum
DO $$ BEGIN
    CREATE TYPE video_room_type AS ENUM (
        'cohort_call',
        'one_on_one',
        'community_checkin',
        'accountability_pod'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Video rooms table
CREATE TABLE IF NOT EXISTS "video_rooms" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,              -- 100ms room ID
    room_type video_room_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    host_id UUID REFERENCES users(id) NOT NULL,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    max_participants INTEGER DEFAULT 100,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,                      -- iCal RRULE format
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Room participants table
CREATE TABLE IF NOT EXISTS "video_room_participants" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES video_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
    rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')),
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    connection_quality TEXT,
    UNIQUE(room_id, user_id)
);

-- Call notes table (for coaching sessions)
CREATE TABLE IF NOT EXISTS "video_call_notes" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES video_rooms(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,           -- Only visible to author
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Video room templates (for recurring meeting types)
CREATE TABLE IF NOT EXISTS "video_room_templates" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    room_type video_room_type NOT NULL,
    default_duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 100,
    recording_enabled BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Room invitations table
CREATE TABLE IF NOT EXISTS "video_room_invitations" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES video_rooms(id) ON DELETE CASCADE NOT NULL,
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,
    UNIQUE(room_id, invitee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_rooms_cohort ON video_rooms(cohort_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_video_rooms_host ON video_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_status ON video_rooms(status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_video_rooms_scheduled ON video_rooms(scheduled_start) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_video_participants_room ON video_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_video_participants_user ON video_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_video_invitations_invitee ON video_room_invitations(invitee_id, status);

-- RLS Policies
ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_room_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_room_invitations ENABLE ROW LEVEL SECURITY;

-- Video rooms policies
CREATE POLICY "Users can view rooms they host" ON video_rooms
    FOR SELECT USING (host_id = auth.uid());

CREATE POLICY "Users can view rooms they participate in" ON video_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_room_participants
            WHERE video_room_participants.room_id = video_rooms.id
            AND video_room_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view cohort rooms they're members of" ON video_rooms
    FOR SELECT USING (
        cohort_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM cohort_memberships
            WHERE cohort_memberships.cohort_id = video_rooms.cohort_id
            AND cohort_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage their rooms" ON video_rooms
    FOR ALL USING (host_id = auth.uid());

-- Participants policies
CREATE POLICY "Users can view participants in their rooms" ON video_room_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_rooms
            WHERE video_rooms.id = video_room_participants.room_id
            AND (
                video_rooms.host_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM video_room_participants p2
                    WHERE p2.room_id = video_room_participants.room_id
                    AND p2.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage own participation" ON video_room_participants
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Hosts can manage participants" ON video_room_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM video_rooms
            WHERE video_rooms.id = video_room_participants.room_id
            AND video_rooms.host_id = auth.uid()
        )
    );

-- Call notes policies
CREATE POLICY "Authors can manage own notes" ON video_call_notes
    FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Hosts can view all notes in their rooms" ON video_call_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_rooms
            WHERE video_rooms.id = video_call_notes.room_id
            AND video_rooms.host_id = auth.uid()
        )
    );

-- Templates policies
CREATE POLICY "Anyone can view active templates" ON video_room_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Creators can manage their templates" ON video_room_templates
    FOR ALL USING (created_by = auth.uid());

-- Invitations policies
CREATE POLICY "Users can view their invitations" ON video_room_invitations
    FOR SELECT USING (invitee_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Users can respond to their invitations" ON video_room_invitations
    FOR UPDATE USING (invitee_id = auth.uid());

CREATE POLICY "Hosts can send invitations" ON video_room_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM video_rooms
            WHERE video_rooms.id = video_room_invitations.room_id
            AND video_rooms.host_id = auth.uid()
        )
    );

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_video_rooms_updated_at ON video_rooms;
CREATE TRIGGER update_video_rooms_updated_at
    BEFORE UPDATE ON video_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_video_updated_at();

DROP TRIGGER IF EXISTS update_video_call_notes_updated_at ON video_call_notes;
CREATE TRIGGER update_video_call_notes_updated_at
    BEFORE UPDATE ON video_call_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_video_updated_at();

-- Helper function to get upcoming rooms for a user
CREATE OR REPLACE FUNCTION get_user_upcoming_rooms(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    room_id TEXT,
    room_type video_room_type,
    title TEXT,
    description TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    status TEXT,
    host_name TEXT,
    participant_count BIGINT,
    user_rsvp_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vr.id,
        vr.room_id,
        vr.room_type,
        vr.title,
        vr.description,
        vr.scheduled_start,
        vr.scheduled_end,
        vr.status,
        u.name as host_name,
        (SELECT COUNT(*) FROM video_room_participants WHERE video_room_participants.room_id = vr.id) as participant_count,
        vrp.rsvp_status as user_rsvp_status
    FROM video_rooms vr
    LEFT JOIN users u ON vr.host_id = u.id
    LEFT JOIN video_room_participants vrp ON vr.id = vrp.room_id AND vrp.user_id = p_user_id
    WHERE (
        vr.host_id = p_user_id OR
        EXISTS (SELECT 1 FROM video_room_participants WHERE video_room_participants.room_id = vr.id AND video_room_participants.user_id = p_user_id) OR
        (vr.cohort_id IS NOT NULL AND EXISTS (SELECT 1 FROM cohort_memberships WHERE cohort_memberships.cohort_id = vr.cohort_id AND cohort_memberships.user_id = p_user_id))
    )
    AND vr.status IN ('scheduled', 'live')
    AND (vr.scheduled_start IS NULL OR vr.scheduled_start >= CURRENT_TIMESTAMP - INTERVAL '1 hour')
    ORDER BY vr.scheduled_start ASC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
