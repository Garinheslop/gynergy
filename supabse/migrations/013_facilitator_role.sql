-- ============================================
-- MIGRATION 013: FACILITATOR ROLE
-- ============================================
-- Adds 'facilitator' role for lead facilitators (e.g., Matthew Zuraw)
-- who need admin dashboard access + cohort facilitation permissions.
-- Date: 2026-03-02
-- Context: Sprint 1 — gynergy.com integration (co-ed platform)
-- ============================================

-- STEP 1: Add 'facilitator' to global user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'facilitator', 'user'));

-- STEP 2: Add 'facilitator' to cohort_memberships
ALTER TABLE cohort_memberships DROP CONSTRAINT IF EXISTS cohort_memberships_role_check;
ALTER TABLE cohort_memberships ADD CONSTRAINT cohort_memberships_role_check
  CHECK (role IN ('admin', 'facilitator', 'moderator', 'member'));
