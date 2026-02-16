-- ============================================
-- FIVE PILLAR ASSESSMENT SCHEMA
-- ============================================
-- Comprehensive assessment results with prequalification data
-- Designed for personalized reporting and lead scoring

-- ============================================
-- ASSESSMENT RESULTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contact Info
  email TEXT NOT NULL,
  first_name TEXT,

  -- ============================================
  -- SECTION A: EXTERNAL SUCCESS (Prequalification)
  -- ============================================

  -- Q1: Revenue tier
  revenue_tier TEXT CHECK (revenue_tier IN (
    'under_250k',
    '250k_500k',
    '500k_1m',
    '1m_5m',
    '5m_10m',
    '10m_plus'
  )),

  -- Q2: Achievements (array of selected achievements)
  achievements TEXT[] DEFAULT '{}',

  -- Q3: Prior coaching investment
  prior_coaching TEXT CHECK (prior_coaching IN (
    'never',
    'free_content',
    'under_1k',
    '1k_5k',
    '5k_15k',
    '15k_plus'
  )),

  -- Q4: External life rating (1-10)
  external_rating INTEGER CHECK (external_rating >= 1 AND external_rating <= 10),

  -- ============================================
  -- SECTION B: HIDDEN REALITY
  -- ============================================

  -- Q4: The 2am thought
  two_am_thought TEXT CHECK (two_am_thought IN (
    'worth_it',
    'lost_identity',
    'family_better_off',
    'terrified_slow_down',
    'performing_success',
    'other'
  )),
  two_am_thought_other TEXT, -- Free text if 'other' selected

  -- Q5: Last time felt present
  last_present TEXT CHECK (last_present IN (
    'last_week',
    'last_month',
    'last_6_months',
    'last_year',
    'cant_remember'
  )),

  -- Q6: Sacrifices (array of selected items)
  sacrifices TEXT[] DEFAULT '{}',

  -- Q7: Mask frequency
  mask_frequency TEXT CHECK (mask_frequency IN (
    'rarely',
    'sometimes_professional',
    'often',
    'almost_always',
    'lost_self'
  )),

  -- Q8: Body tension location
  body_tension TEXT CHECK (body_tension IN (
    'jaw',
    'neck_shoulders',
    'chest',
    'stomach',
    'lower_back',
    'relaxed',
    'disconnected'
  )),

  -- ============================================
  -- SECTION C: FIVE PILLARS DEEP SCAN
  -- ============================================

  -- Q9-13: Pillar scores (1-10 each)
  wealth_score INTEGER CHECK (wealth_score >= 1 AND wealth_score <= 10),
  health_score INTEGER CHECK (health_score >= 1 AND health_score <= 10),
  relationships_score INTEGER CHECK (relationships_score >= 1 AND relationships_score <= 10),
  growth_score INTEGER CHECK (growth_score >= 1 AND growth_score <= 10),
  purpose_score INTEGER CHECK (purpose_score >= 1 AND purpose_score <= 10),

  -- Calculated total (5-50)
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(wealth_score, 0) +
    COALESCE(health_score, 0) +
    COALESCE(relationships_score, 0) +
    COALESCE(growth_score, 0) +
    COALESCE(purpose_score, 0)
  ) STORED,

  -- ============================================
  -- SECTION D: OPENING
  -- ============================================

  -- Q14: Readiness level
  readiness TEXT CHECK (readiness IN (
    'just_curious',
    'scared_but_know',
    'ready_to_explore',
    'ready_to_invest',
    'desperate'
  )),

  -- Q15: Priority pillar
  priority_pillar TEXT CHECK (priority_pillar IN (
    'wealth',
    'health',
    'relationships',
    'growth',
    'purpose'
  )),

  -- ============================================
  -- COMPUTED FIELDS
  -- ============================================

  -- Score interpretation
  interpretation TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
            COALESCE(relationships_score, 0) + COALESCE(growth_score, 0) +
            COALESCE(purpose_score, 0)) >= 40 THEN 'elite'
      WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
            COALESCE(relationships_score, 0) + COALESCE(growth_score, 0) +
            COALESCE(purpose_score, 0)) >= 25 THEN 'gap'
      ELSE 'critical'
    END
  ) STORED,

  -- Lead score for prioritization
  lead_score INTEGER GENERATED ALWAYS AS (
    -- Revenue tier score (1-6)
    (CASE revenue_tier
      WHEN 'under_250k' THEN 1
      WHEN '250k_500k' THEN 2
      WHEN '500k_1m' THEN 3
      WHEN '1m_5m' THEN 4
      WHEN '5m_10m' THEN 5
      WHEN '10m_plus' THEN 6
      ELSE 1
    END)
    *
    -- Readiness score (1-10)
    (CASE readiness
      WHEN 'just_curious' THEN 1
      WHEN 'scared_but_know' THEN 3
      WHEN 'ready_to_explore' THEN 5
      WHEN 'ready_to_invest' THEN 8
      WHEN 'desperate' THEN 10
      ELSE 1
    END)
    *
    -- Gap severity (1-3)
    (CASE
      WHEN LEAST(
        COALESCE(wealth_score, 10),
        COALESCE(health_score, 10),
        COALESCE(relationships_score, 10),
        COALESCE(growth_score, 10),
        COALESCE(purpose_score, 10)
      ) <= 3 THEN 3
      WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
            COALESCE(relationships_score, 0) + COALESCE(growth_score, 0) +
            COALESCE(purpose_score, 0)) <= 30 THEN 2
      ELSE 1
    END)
  ) STORED,

  -- Lowest pillar for quick reference
  lowest_pillar TEXT GENERATED ALWAYS AS (
    CASE LEAST(
      COALESCE(wealth_score, 10),
      COALESCE(health_score, 10),
      COALESCE(relationships_score, 10),
      COALESCE(growth_score, 10),
      COALESCE(purpose_score, 10)
    )
      WHEN COALESCE(wealth_score, 10) THEN 'wealth'
      WHEN COALESCE(health_score, 10) THEN 'health'
      WHEN COALESCE(relationships_score, 10) THEN 'relationships'
      WHEN COALESCE(growth_score, 10) THEN 'growth'
      ELSE 'purpose'
    END
  ) STORED,

  -- ============================================
  -- TRACKING & METADATA
  -- ============================================

  -- Source tracking
  source TEXT DEFAULT 'direct', -- webinar, direct, referral, etc.
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Related records
  webinar_registration_id UUID REFERENCES webinar_registrations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email delivery
  email_report_sent BOOLEAN DEFAULT false,
  email_report_sent_at TIMESTAMPTZ,
  email_report_opened BOOLEAN DEFAULT false,
  email_report_opened_at TIMESTAMPTZ,

  -- Conversion tracking
  converted_to_webinar BOOLEAN DEFAULT false,
  converted_to_challenge BOOLEAN DEFAULT false,
  converted_to_lvl5 BOOLEAN DEFAULT false,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_to_complete_seconds INTEGER,

  -- For retakes
  is_retake BOOLEAN DEFAULT false,
  previous_assessment_id UUID REFERENCES assessment_results(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Email lookups (for deduplication and report retrieval)
CREATE INDEX IF NOT EXISTS idx_assessment_email ON assessment_results(email);

-- Lead score for prioritization queries
CREATE INDEX IF NOT EXISTS idx_assessment_lead_score ON assessment_results(lead_score DESC);

-- Interpretation for segment queries
CREATE INDEX IF NOT EXISTS idx_assessment_interpretation ON assessment_results(interpretation);

-- Conversion funnel analysis
CREATE INDEX IF NOT EXISTS idx_assessment_conversions ON assessment_results(
  converted_to_webinar,
  converted_to_challenge,
  converted_to_lvl5
);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_assessment_created ON assessment_results(created_at DESC);

-- Source analysis
CREATE INDEX IF NOT EXISTS idx_assessment_source ON assessment_results(source);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public assessment)
CREATE POLICY "Anyone can submit assessment"
  ON assessment_results FOR INSERT
  TO anon
  WITH CHECK (true);

-- Users can view their own results
CREATE POLICY "Users can view own assessments"
  ON assessment_results FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Service role has full access
CREATE POLICY "Service role full access to assessments"
  ON assessment_results FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_updated_at ON assessment_results;
CREATE TRIGGER assessment_updated_at
  BEFORE UPDATE ON assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_updated_at();

-- Calculate time to complete
CREATE OR REPLACE FUNCTION calculate_assessment_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.time_to_complete_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_duration ON assessment_results;
CREATE TRIGGER assessment_duration
  BEFORE UPDATE ON assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_assessment_duration();

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Assessment funnel metrics
CREATE OR REPLACE VIEW assessment_funnel_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_started,
  COUNT(completed_at) as total_completed,
  ROUND(COUNT(completed_at)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) as completion_rate,
  COUNT(CASE WHEN converted_to_webinar THEN 1 END) as webinar_conversions,
  COUNT(CASE WHEN converted_to_challenge THEN 1 END) as challenge_conversions,
  AVG(total_score) as avg_score,
  AVG(lead_score) as avg_lead_score
FROM assessment_results
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Lead prioritization view
CREATE OR REPLACE VIEW high_priority_leads AS
SELECT
  id,
  email,
  first_name,
  revenue_tier,
  readiness,
  total_score,
  lead_score,
  lowest_pillar,
  priority_pillar,
  two_am_thought,
  created_at
FROM assessment_results
WHERE
  completed_at IS NOT NULL
  AND lead_score >= 25
  AND NOT converted_to_challenge
ORDER BY lead_score DESC, created_at DESC;

-- Score distribution
CREATE OR REPLACE VIEW assessment_score_distribution AS
SELECT
  interpretation,
  COUNT(*) as count,
  ROUND(AVG(total_score), 1) as avg_score,
  ROUND(AVG(lead_score), 1) as avg_lead_score,
  MODE() WITHIN GROUP (ORDER BY lowest_pillar) as most_common_weakness,
  MODE() WITHIN GROUP (ORDER BY priority_pillar) as most_common_priority
FROM assessment_results
WHERE completed_at IS NOT NULL
GROUP BY interpretation;
