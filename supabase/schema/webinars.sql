-- ============================================
-- WEBINAR HOSTING SCHEMA
-- ============================================
-- Supports live webinar broadcasting via 100ms HLS
-- Tracks webinars, registrations, attendance, Q&A, and replays

-- ============================================
-- WEBINARS TABLE (must be first - other tables reference it)
-- ============================================
-- Core webinar events with 100ms room integration

CREATE TABLE IF NOT EXISTS webinars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,

  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Los_Angeles',

  -- 100ms Integration
  hms_room_id TEXT,
  hms_room_code TEXT,
  hms_template_id TEXT,
  hls_stream_url TEXT,
  hls_recording_url TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'draft',
    'scheduled',
    'live',
    'ended',
    'cancelled'
  )),

  -- Capacity & Registration
  max_attendees INTEGER DEFAULT 500,
  registration_required BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMPTZ,

  -- Host Info
  host_user_id UUID REFERENCES auth.users(id),
  co_host_user_ids UUID[] DEFAULT '{}',

  -- Content
  thumbnail_url TEXT,
  replay_available BOOLEAN DEFAULT false,
  replay_url TEXT,

  -- Settings
  chat_enabled BOOLEAN DEFAULT true,
  qa_enabled BOOLEAN DEFAULT true,
  recording_enabled BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_webinars_slug ON webinars(slug);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_webinars_status ON webinars(status);

-- Index for scheduled start (upcoming webinars)
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled ON webinars(scheduled_start);

-- Index for 100ms room lookups
CREATE INDEX IF NOT EXISTS idx_webinars_hms_room ON webinars(hms_room_id);

-- ============================================
-- WEBINAR REGISTRATIONS TABLE
-- ============================================
-- Lead capture from landing page (before the webinar)

CREATE TABLE IF NOT EXISTS webinar_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contact Info
  email TEXT NOT NULL,
  first_name TEXT,

  -- Webinar Info
  webinar_date DATE NOT NULL,
  webinar_id UUID REFERENCES webinars(id) ON DELETE SET NULL,

  -- Tracking
  source TEXT DEFAULT 'landing_page',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Assessment Data (from Five Pillar Assessment)
  assessment_completed BOOLEAN DEFAULT false,
  assessment_score INTEGER,
  assessment_scores JSONB,
  assessment_completed_at TIMESTAMPTZ,

  -- Engagement
  reminder_sent BOOLEAN DEFAULT false,
  calendar_added BOOLEAN DEFAULT false,

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(email, webinar_date)
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON webinar_registrations(email);

-- Index for webinar date
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_date ON webinar_registrations(webinar_date);

-- ============================================
-- WEBINAR ATTENDANCE TABLE
-- ============================================
-- Track who joined and when

CREATE TABLE IF NOT EXISTS webinar_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

  -- Attendee Info
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,

  -- Registration
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registration_source TEXT DEFAULT 'landing_page',

  -- Attendance
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  watch_duration_seconds INTEGER DEFAULT 0,
  attended_live BOOLEAN DEFAULT false,
  watched_replay BOOLEAN DEFAULT false,

  -- Engagement
  questions_asked INTEGER DEFAULT 0,
  chat_messages_sent INTEGER DEFAULT 0,

  -- Conversion Tracking
  converted_to_challenge BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  UNIQUE(webinar_id, email)
);

-- Index for webinar lookups
CREATE INDEX IF NOT EXISTS idx_webinar_attendance_webinar ON webinar_attendance(webinar_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_webinar_attendance_user ON webinar_attendance(user_id);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_webinar_attendance_email ON webinar_attendance(email);

-- ============================================
-- WEBINAR Q&A TABLE
-- ============================================
-- Questions submitted during live webinar

CREATE TABLE IF NOT EXISTS webinar_qa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

  -- Question Info
  question TEXT NOT NULL,
  asked_by_email TEXT NOT NULL,
  asked_by_name TEXT,
  asked_by_user_id UUID REFERENCES auth.users(id),
  asked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'answered',
    'dismissed'
  )),

  -- Answer
  answered_at TIMESTAMPTZ,
  answered_by_user_id UUID REFERENCES auth.users(id),
  answer_text TEXT,

  -- Engagement
  upvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for webinar Q&A lookups
CREATE INDEX IF NOT EXISTS idx_webinar_qa_webinar ON webinar_qa(webinar_id);

-- Index for Q&A status filtering
CREATE INDEX IF NOT EXISTS idx_webinar_qa_status ON webinar_qa(webinar_id, status);

-- ============================================
-- WEBINAR CHAT MESSAGES TABLE
-- ============================================
-- Live chat during webinar

CREATE TABLE IF NOT EXISTS webinar_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,

  -- Message Info
  message TEXT NOT NULL,
  sent_by_email TEXT NOT NULL,
  sent_by_name TEXT,
  sent_by_user_id UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Moderation
  is_host_message BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by_user_id UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Index for webinar chat lookups
CREATE INDEX IF NOT EXISTS idx_webinar_chat_webinar ON webinar_chat(webinar_id);

-- Index for recent messages
CREATE INDEX IF NOT EXISTS idx_webinar_chat_sent_at ON webinar_chat(webinar_id, sent_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_chat ENABLE ROW LEVEL SECURITY;

-- Webinars: Public read for published, admin full access
CREATE POLICY "Public can view scheduled/live webinars"
  ON webinars FOR SELECT
  USING (status IN ('scheduled', 'live', 'ended'));

CREATE POLICY "Hosts can manage their webinars"
  ON webinars FOR ALL
  TO authenticated
  USING (
    host_user_id = auth.uid() OR
    auth.uid() = ANY(co_host_user_ids)
  );

CREATE POLICY "Service role full access to webinars"
  ON webinars FOR ALL
  TO service_role
  USING (true);

-- Registrations: Public can insert, service role full access
CREATE POLICY "Public can insert registrations"
  ON webinar_registrations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role full access to registrations"
  ON webinar_registrations FOR ALL
  TO service_role
  USING (true);

-- Attendance: Users can see their own, service role full access
CREATE POLICY "Users can view their own attendance"
  ON webinar_attendance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access to attendance"
  ON webinar_attendance FOR ALL
  TO service_role
  USING (true);

-- Q&A: Users can submit questions, hosts can manage
CREATE POLICY "Anyone can submit questions"
  ON webinar_qa FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view approved questions"
  ON webinar_qa FOR SELECT
  USING (status IN ('approved', 'answered'));

CREATE POLICY "Service role full access to Q&A"
  ON webinar_qa FOR ALL
  TO service_role
  USING (true);

-- Chat: Users can send and view messages
CREATE POLICY "Anyone can send chat messages"
  ON webinar_chat FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages"
  ON webinar_chat FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Service role full access to chat"
  ON webinar_chat FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update webinar updated_at timestamp
CREATE OR REPLACE FUNCTION update_webinar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS webinar_updated_at ON webinars;
CREATE TRIGGER webinar_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW
  EXECUTE FUNCTION update_webinar_updated_at();

-- Function to update attendance watch duration
CREATE OR REPLACE FUNCTION update_watch_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
    NEW.watch_duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for watch duration
DROP TRIGGER IF EXISTS attendance_watch_duration ON webinar_attendance;
CREATE TRIGGER attendance_watch_duration
  BEFORE UPDATE ON webinar_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_watch_duration();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================
-- Required for Supabase Realtime postgres_changes subscriptions
-- Chat and Q&A tables stream live updates to the WebinarViewer client

ALTER PUBLICATION supabase_realtime ADD TABLE webinar_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE webinar_qa;

-- ============================================
-- SEED DATA (March 3rd Webinar)
-- ============================================

INSERT INTO webinars (
  title,
  description,
  slug,
  scheduled_start,
  scheduled_end,
  status,
  max_attendees,
  registration_required,
  chat_enabled,
  qa_enabled,
  recording_enabled
) VALUES (
  'The 5 Pillars of Integrated Power',
  'Free Live Training: Why successful men feel empty and the 10-minute practice that changes everything.',
  'five-pillars-march-2026',
  '2026-03-03 17:30:00-08',
  '2026-03-03 19:00:00-08',
  'scheduled',
  500,
  true,
  true,
  true,
  true
) ON CONFLICT (slug) DO NOTHING;
