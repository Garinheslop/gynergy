-- ============================================
-- MIGRATION 011: PILLAR RENAME
-- ============================================
-- Canonical pillar names: Health, Relationships, Wealth, Mindset, Legacy
-- Rename: Growth → Mindset, Purpose → Legacy
-- Date: 2026-03-02
-- Context: gynergy.com integration spec alignment
-- ============================================

-- ============================================
-- STEP 1: DROP GENERATED (COMPUTED) COLUMNS
-- These reference growth_score and purpose_score,
-- so they must be dropped before column rename.
-- ============================================

ALTER TABLE assessment_results DROP COLUMN IF EXISTS total_score;
ALTER TABLE assessment_results DROP COLUMN IF EXISTS interpretation;
ALTER TABLE assessment_results DROP COLUMN IF EXISTS lead_score;
ALTER TABLE assessment_results DROP COLUMN IF EXISTS lowest_pillar;

-- ============================================
-- STEP 2: RENAME BASE COLUMNS
-- ============================================

ALTER TABLE assessment_results RENAME COLUMN growth_score TO mindset_score;
ALTER TABLE assessment_results RENAME COLUMN purpose_score TO legacy_score;

-- ============================================
-- STEP 3: UPDATE CHECK CONSTRAINT ON priority_pillar
-- ============================================

ALTER TABLE assessment_results DROP CONSTRAINT IF EXISTS assessment_results_priority_pillar_check;
ALTER TABLE assessment_results ADD CONSTRAINT assessment_results_priority_pillar_check
  CHECK (priority_pillar IN ('wealth', 'health', 'relationships', 'mindset', 'legacy'));

-- Migrate existing data values
UPDATE assessment_results SET priority_pillar = 'mindset' WHERE priority_pillar = 'growth';
UPDATE assessment_results SET priority_pillar = 'legacy' WHERE priority_pillar = 'purpose';

-- ============================================
-- STEP 4: RECREATE GENERATED COLUMNS WITH NEW NAMES
-- ============================================

-- Total score (5-50)
ALTER TABLE assessment_results ADD COLUMN total_score INTEGER GENERATED ALWAYS AS (
  COALESCE(wealth_score, 0) +
  COALESCE(health_score, 0) +
  COALESCE(relationships_score, 0) +
  COALESCE(mindset_score, 0) +
  COALESCE(legacy_score, 0)
) STORED;

-- Score interpretation
ALTER TABLE assessment_results ADD COLUMN interpretation TEXT GENERATED ALWAYS AS (
  CASE
    WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
          COALESCE(relationships_score, 0) + COALESCE(mindset_score, 0) +
          COALESCE(legacy_score, 0)) >= 40 THEN 'elite'
    WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
          COALESCE(relationships_score, 0) + COALESCE(mindset_score, 0) +
          COALESCE(legacy_score, 0)) >= 25 THEN 'gap'
    ELSE 'critical'
  END
) STORED;

-- Lead score for prioritization
ALTER TABLE assessment_results ADD COLUMN lead_score INTEGER GENERATED ALWAYS AS (
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
  (CASE readiness
    WHEN 'just_curious' THEN 1
    WHEN 'scared_but_know' THEN 3
    WHEN 'ready_to_explore' THEN 5
    WHEN 'ready_to_invest' THEN 8
    WHEN 'desperate' THEN 10
    ELSE 1
  END)
  *
  (CASE
    WHEN LEAST(
      COALESCE(wealth_score, 10),
      COALESCE(health_score, 10),
      COALESCE(relationships_score, 10),
      COALESCE(mindset_score, 10),
      COALESCE(legacy_score, 10)
    ) <= 3 THEN 3
    WHEN (COALESCE(wealth_score, 0) + COALESCE(health_score, 0) +
          COALESCE(relationships_score, 0) + COALESCE(mindset_score, 0) +
          COALESCE(legacy_score, 0)) <= 30 THEN 2
    ELSE 1
  END)
) STORED;

-- Lowest pillar for quick reference
ALTER TABLE assessment_results ADD COLUMN lowest_pillar TEXT GENERATED ALWAYS AS (
  CASE LEAST(
    COALESCE(wealth_score, 10),
    COALESCE(health_score, 10),
    COALESCE(relationships_score, 10),
    COALESCE(mindset_score, 10),
    COALESCE(legacy_score, 10)
  )
    WHEN COALESCE(wealth_score, 10) THEN 'wealth'
    WHEN COALESCE(health_score, 10) THEN 'health'
    WHEN COALESCE(relationships_score, 10) THEN 'relationships'
    WHEN COALESCE(mindset_score, 10) THEN 'mindset'
    ELSE 'legacy'
  END
) STORED;

-- ============================================
-- STEP 5: RECREATE INDEXES (some reference dropped columns)
-- ============================================

-- These indexes should still work since they reference the column by name
-- and the generated columns are recreated with same names.
-- But let's be safe and recreate:
DROP INDEX IF EXISTS idx_assessment_lead_score;
CREATE INDEX idx_assessment_lead_score ON assessment_results(lead_score DESC);

DROP INDEX IF EXISTS idx_assessment_interpretation;
CREATE INDEX idx_assessment_interpretation ON assessment_results(interpretation);

-- ============================================
-- STEP 6: RECREATE VIEWS (they reference old column names)
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
