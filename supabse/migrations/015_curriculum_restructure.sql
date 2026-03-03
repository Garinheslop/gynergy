-- ============================================================================
-- MIGRATION 015: CURRICULUM RESTRUCTURE — BRIDGE MONTH + JOURNEY PHASES
-- ============================================================================
-- Extends the 45-day challenge to a 75-day journey:
--   Days 1-45:  Core Challenge (full requirements)
--   Days 46-66: Bridge Phase 1 — Integration (morning-only, free)
--   Days 67-75: Bridge Phase 2 — Choose Your Path (CTA visible)
-- Date: 2026-03-02
-- Context: Sprint 3 — curriculum restructure
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Bridge Month columns to books
-- ============================================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS bridge_duration_days INTEGER DEFAULT 30;
ALTER TABLE books ADD COLUMN IF NOT EXISTS journey_phases JSONB DEFAULT '[]';

-- Seed journey phases for the Date Zero Gratitude book
UPDATE books
SET bridge_duration_days = 30,
    journey_phases = '[
      {"order": 1, "name": "Shadow Work", "subtitle": "Foundation", "start_day": 1, "end_day": 9, "description": "Confronting what lies beneath the surface"},
      {"order": 2, "name": "Self-Forgiveness", "subtitle": "Emotional Processing", "start_day": 10, "end_day": 18, "description": "Releasing the weight you have been carrying"},
      {"order": 3, "name": "Awakening", "subtitle": "Clarity", "start_day": 19, "end_day": 27, "description": "Seeing yourself and your life clearly"},
      {"order": 4, "name": "Vision & Goals", "subtitle": "Direction", "start_day": 28, "end_day": 36, "description": "Mapping your next chapter with intention"},
      {"order": 5, "name": "Action Through Gratitude", "subtitle": "Integration", "start_day": 37, "end_day": 45, "description": "Turning insight into daily practice"}
    ]'::jsonb
WHERE id = '7215727d-cefa-460e-a5a0-478ec1002d08';

-- ============================================================================
-- STEP 2: Seed Day 66 "Habit Master" badge
-- ============================================================================

INSERT INTO badges (key, name, description, icon, category, rarity, unlock_condition, animation_type, points_reward, is_hidden, sort_order)
VALUES (
  'habit-milestone-66',
  'Habit Master',
  'Reach Day 66 — the science says the habit is now automatic. You are transformed.',
  'flame',
  'milestone',
  'legendary',
  '{"type": "streak", "activity": "all", "count": 66}',
  'legendary-burst',
  500,
  false,
  36
) ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 3: Extend cohort_transitions for Bridge Month events
-- ============================================================================

ALTER TABLE cohort_transitions DROP CONSTRAINT IF EXISTS cohort_transitions_transition_type_check;
ALTER TABLE cohort_transitions ADD CONSTRAINT cohort_transitions_transition_type_check
  CHECK (transition_type IN (
    'challenge_started',
    'challenge_completed',
    'bridge_month_started',
    'bridge_phase2_started',
    'bridge_month_completed',
    'grace_period_started',
    'grace_period_ended',
    'converted_to_subscription',
    'churned',
    'alumni_granted'
  ));

-- ============================================================================
-- STEP 4: Add bridge_month_started drip trigger event
-- ============================================================================

ALTER TABLE drip_campaigns DROP CONSTRAINT IF EXISTS drip_campaigns_trigger_event_check;
ALTER TABLE drip_campaigns ADD CONSTRAINT drip_campaigns_trigger_event_check
  CHECK (trigger_event IN (
    'webinar_registered',
    'assessment_completed',
    'purchase_completed',
    'cart_abandoned',
    'user_inactive',
    'referral_credit_issued',
    'community_activated',
    'challenge_completed_purchaser',
    'challenge_completed_referral',
    'trial_ending_soon',
    'bridge_month_started'
  ));

-- Seed the Bridge Month drip campaign
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Bridge Month Integration',
  'Light-touch emails during the 30-day Bridge Month (Days 46-75). Encouragement, Day 66 celebration, Choose Your Path introduction.',
  'bridge_month_started'
) ON CONFLICT DO NOTHING;

-- Seed Bridge Month drip emails
DO $$
DECLARE
  v_bridge_campaign_id UUID;
BEGIN
  SELECT id INTO v_bridge_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'bridge_month_started' LIMIT 1;

  IF v_bridge_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_bridge_campaign_id, 1, 0,   'Your Bridge Month begins',                     'bridge_month_welcome'),
      (v_bridge_campaign_id, 2, 216, 'Halfway there — the habit is forming',          'bridge_day_55_midpoint'),
      (v_bridge_campaign_id, 3, 480, 'Day 66: The science says you are transformed',  'bridge_day_66_habit'),
      (v_bridge_campaign_id, 4, 504, 'Choose your next chapter',                      'bridge_choose_path')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Backfill grace_period_end for existing sessions
-- Bridge Month (30 days) + 7-day buffer = 37 days after end_date
-- ============================================================================

UPDATE book_sessions
SET grace_period_end = end_date + INTERVAL '37 days'
WHERE grace_period_end IS NOT NULL
  AND grace_period_end = end_date + INTERVAL '30 days';
