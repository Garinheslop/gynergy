-- Webinar Registrations Schema
-- Created for the "5 Pillars of Integrated Power" free live training

-- webinar_registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  webinar_date DATE NOT NULL,
  source TEXT DEFAULT 'landing_page',
  assessment_started BOOLEAN DEFAULT FALSE,
  assessment_completed BOOLEAN DEFAULT FALSE,
  assessment_score INTEGER,
  attended BOOLEAN DEFAULT FALSE,
  converted_to_challenge BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on email + webinar_date (one registration per webinar)
CREATE UNIQUE INDEX IF NOT EXISTS webinar_registrations_email_date
  ON webinar_registrations(email, webinar_date);

-- Index for querying by webinar date
CREATE INDEX IF NOT EXISTS webinar_registrations_webinar_date
  ON webinar_registrations(webinar_date);

-- Index for querying by registration date
CREATE INDEX IF NOT EXISTS webinar_registrations_registered_at
  ON webinar_registrations(registered_at);

-- RLS policies
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Service role can manage all registrations
CREATE POLICY "Service role can manage registrations"
  ON webinar_registrations
  FOR ALL
  TO service_role
  USING (true);

-- assessment_results table (for tracking individual assessment completions)
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  pillar_scores JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  interpretation TEXT NOT NULL CHECK (interpretation IN ('elite', 'gap', 'critical')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'webinar_flow',
  webinar_registration_id UUID REFERENCES webinar_registrations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by email
CREATE INDEX IF NOT EXISTS assessment_results_email
  ON assessment_results(email);

-- Index for linking to webinar registration
CREATE INDEX IF NOT EXISTS assessment_results_webinar_registration
  ON assessment_results(webinar_registration_id);

-- RLS for assessment_results
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage assessment results"
  ON assessment_results
  FOR ALL
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webinar_registration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS webinar_registrations_updated_at ON webinar_registrations;
CREATE TRIGGER webinar_registrations_updated_at
  BEFORE UPDATE ON webinar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_webinar_registration_updated_at();
