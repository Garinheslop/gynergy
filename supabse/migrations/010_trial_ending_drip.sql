-- ============================================================================
-- Migration 010: Trial Ending Drip Campaign + Loyalty Rate
-- ============================================================================
-- Adds the trial_ending_soon drip campaign for Day 75/78/82 emails
-- that offer challenge graduates the $19.97/mo founding member rate.
-- Also updates the trigger_event CHECK constraint to support new triggers.

-- ============================================================================
-- 1. Update trigger_event CHECK constraint on drip_campaigns
-- ============================================================================
-- Add challenge_completed_purchaser, challenge_completed_friend_code,
-- and trial_ending_soon to the allowed trigger events.

ALTER TABLE drip_campaigns DROP CONSTRAINT IF EXISTS drip_campaigns_trigger_event_check;
ALTER TABLE drip_campaigns ADD CONSTRAINT drip_campaigns_trigger_event_check
  CHECK (trigger_event IN (
    'webinar_registered',
    'assessment_completed',
    'purchase_completed',
    'cart_abandoned',
    'user_inactive',
    'friend_codes_issued',
    'community_activated',
    'challenge_completed_purchaser',
    'challenge_completed_friend_code',
    'trial_ending_soon'
  ));

-- ============================================================================
-- 2. Challenge Completed campaigns (used by lifecycle cron)
-- ============================================================================

INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Challenge Completed (Purchaser)',
  'Post-challenge drip for users who purchased the $997 challenge. Celebration + journal continuation.',
  'challenge_completed_purchaser'
) ON CONFLICT DO NOTHING;

INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Challenge Completed (Friend Code)',
  'Post-challenge drip for users who joined via friend code. Celebration + subscribe CTA.',
  'challenge_completed_friend_code'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Trial Ending campaign — the loyalty rate drip
-- ============================================================================

INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Trial Ending — Founding Member Offer',
  '3-email sequence starting Day 75 of 90-day trial. Notice → loyalty offer ($19.97/mo) → final reminder.',
  'trial_ending_soon'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Seed drip emails for trial ending campaign
-- ============================================================================

DO $$
DECLARE
  v_trial_campaign_id UUID;
BEGIN
  SELECT id INTO v_trial_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'trial_ending_soon' LIMIT 1;

  IF v_trial_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      -- Email 1: Day 75 (enrolled at Day 75, so delay 0h = immediate)
      (v_trial_campaign_id, 1, 0,  'Your free trial ends in 15 days',                     'trial_ending_notice'),
      -- Email 2: Day 78 (72 hours after enrollment)
      (v_trial_campaign_id, 2, 72, 'You earned this: $19.97/mo (founding member rate)',    'trial_ending_loyalty_offer'),
      -- Email 3: Day 82 (168 hours = 7 days after enrollment)
      (v_trial_campaign_id, 3, 168, 'Last chance: $19.97/mo expires soon',                 'trial_ending_final_reminder')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;
