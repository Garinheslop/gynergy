-- ============================================
-- Migration 018: Rename Pillars
-- growth → mindset, purpose → legacy
-- ============================================
-- This migration renames pillar values in assessment_results.
-- Column names (growth_score, purpose_score) are NOT renamed
-- as they are physical column identifiers, not display names.
-- ============================================

BEGIN;

-- 1. Update existing priority_pillar values
UPDATE assessment_results
SET priority_pillar = 'mindset'
WHERE priority_pillar = 'growth';

UPDATE assessment_results
SET priority_pillar = 'legacy'
WHERE priority_pillar = 'purpose';

-- 2. Update the CHECK constraint on priority_pillar
ALTER TABLE assessment_results
  DROP CONSTRAINT IF EXISTS assessment_results_priority_pillar_check;

ALTER TABLE assessment_results
  ADD CONSTRAINT assessment_results_priority_pillar_check
  CHECK (priority_pillar IN ('wealth', 'health', 'relationships', 'mindset', 'legacy'));

-- 3. Drop and recreate the lowest_pillar generated column
-- (Generated columns cannot be updated directly — must drop and recreate)
ALTER TABLE assessment_results DROP COLUMN IF EXISTS lowest_pillar;

ALTER TABLE assessment_results
  ADD COLUMN lowest_pillar TEXT GENERATED ALWAYS AS (
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
      WHEN COALESCE(growth_score, 10) THEN 'mindset'
      ELSE 'legacy'
    END
  ) STORED;

COMMIT;
