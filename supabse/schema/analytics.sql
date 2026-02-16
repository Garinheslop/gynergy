-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
-- Stores analytics events from beacon endpoint
-- Used for abandonment tracking, error reporting,
-- and critical conversion events

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Client info (anonymized)
  user_agent TEXT,
  ip_hash TEXT, -- Hashed IP for deduplication, not raw IP

  -- Optional user association
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- Source tracking
  page_url TEXT,
  referrer TEXT
);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_analytics_events_name
ON analytics_events(event_name);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
ON analytics_events(timestamp DESC);

-- Index for user-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user
ON analytics_events(user_id) WHERE user_id IS NOT NULL;

-- Composite index for funnel analysis
CREATE INDEX IF NOT EXISTS idx_analytics_events_funnel
ON analytics_events(event_name, timestamp DESC);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can insert (for client-side tracking)
CREATE POLICY "Authenticated users can insert" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anon users can insert (for pre-auth tracking like assessment)
CREATE POLICY "Anon users can insert" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- EMAIL TRACKING TABLE
-- ============================================
-- Tracks email opens and link clicks

CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email identification
  email_id TEXT NOT NULL, -- Unique ID for each sent email
  email_type TEXT NOT NULL, -- 'assessment_report', 'welcome', etc.
  recipient_email TEXT NOT NULL,

  -- Event type
  event_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked'

  -- Click tracking
  link_url TEXT, -- For click events
  link_name TEXT, -- 'webinar_cta', 'social_link', etc.

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Client info
  user_agent TEXT,
  ip_hash TEXT
);

-- Index for querying by email
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_id
ON email_tracking(email_id);

-- Index for querying by recipient
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient
ON email_tracking(recipient_email);

-- Index for funnel analysis
CREATE INDEX IF NOT EXISTS idx_email_tracking_type_event
ON email_tracking(email_type, event_type, timestamp DESC);

-- Enable RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON email_tracking
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Allow inserts from tracking endpoint
CREATE POLICY "Allow tracking inserts" ON email_tracking
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER VIEW: Assessment Funnel
-- ============================================
-- Aggregates assessment events for quick funnel analysis

CREATE OR REPLACE VIEW assessment_funnel_daily AS
SELECT
  DATE_TRUNC('day', timestamp) AS date,
  COUNT(*) FILTER (WHERE event_name = 'assessment_viewed') AS viewed,
  COUNT(*) FILTER (WHERE event_name = 'assessment_started') AS started,
  COUNT(*) FILTER (WHERE event_name = 'assessment_questions_completed') AS questions_completed,
  COUNT(*) FILTER (WHERE event_name = 'assessment_email_submitted') AS email_submitted,
  COUNT(*) FILTER (WHERE event_name = 'assessment_completed') AS completed,
  COUNT(*) FILTER (WHERE event_name = 'assessment_cta_clicked') AS cta_clicked,
  COUNT(*) FILTER (WHERE event_name = 'assessment_abandoned') AS abandoned,
  -- Conversion rates
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'assessment_started')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'assessment_viewed'), 0) * 100,
    1
  ) AS start_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'assessment_completed')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'assessment_started'), 0) * 100,
    1
  ) AS completion_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'assessment_cta_clicked')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_name = 'assessment_completed'), 0) * 100,
    1
  ) AS cta_rate
FROM analytics_events
WHERE event_name LIKE 'assessment_%'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- ============================================
-- HELPER VIEW: Email Performance
-- ============================================

CREATE OR REPLACE VIEW email_performance AS
SELECT
  email_type,
  DATE_TRUNC('day', timestamp) AS date,
  COUNT(*) FILTER (WHERE event_type = 'sent') AS sent,
  COUNT(*) FILTER (WHERE event_type = 'opened') AS opened,
  COUNT(*) FILTER (WHERE event_type = 'clicked') AS clicked,
  -- Rates
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'opened')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'sent'), 0) * 100,
    1
  ) AS open_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'clicked')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'opened'), 0) * 100,
    1
  ) AS click_rate
FROM email_tracking
GROUP BY email_type, DATE_TRUNC('day', timestamp)
ORDER BY date DESC, email_type;
