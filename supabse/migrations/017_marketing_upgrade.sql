-- ============================================
-- MIGRATION 017: Marketing Ecosystem Upgrade
-- ============================================
-- Adds new drip campaigns, NPS responses table, and waitlist table.
-- Covers PRs 2, 3, 6, and 7 of the marketing upgrade plan.

-- ============================================
-- 1. UPDATE CHECK CONSTRAINT for new trigger events
-- ============================================
-- Add webinar_attended, webinar_missed to the trigger_event constraint

ALTER TABLE drip_campaigns
  DROP CONSTRAINT IF EXISTS drip_campaigns_trigger_event_check;

ALTER TABLE drip_campaigns
  ADD CONSTRAINT drip_campaigns_trigger_event_check
  CHECK (trigger_event IN (
    'webinar_registered',
    'webinar_attended',
    'webinar_missed',
    'assessment_completed',
    'purchase_completed',
    'cart_abandoned',
    'user_inactive',
    'friend_codes_issued',
    'community_activated',
    'challenge_completed_purchaser',
    'challenge_completed_friend_code',
    'bridge_month_started',
    'trial_ending_soon'
  ));

-- ============================================
-- 2. POST-WEBINAR ATTENDED CAMPAIGN
-- ============================================

INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Post-Webinar Pitch',
  '3-email conversion sequence after attending a live webinar. Recap, objection handling, then final scarcity CTA.',
  'webinar_attended'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'webinar_attended' LIMIT 1;

  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_campaign_id, 1, 24, 'The template is in your hands. Now what?',           'webinar_post_recap'),
      (v_campaign_id, 2, 48, '"I can do this on my own"',                           'webinar_post_objection'),
      (v_campaign_id, 3, 72, 'Last call: your Five Pillar score is still the same', 'webinar_post_final')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 3. POST-WEBINAR MISSED / NO-SHOW CAMPAIGN (PR 3)
-- ============================================

INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Webinar No-Show Recovery',
  '3-email recovery sequence for webinar registrants who did not attend. Replay, key takeaway, next training.',
  'webinar_missed'
) ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'webinar_missed' LIMIT 1;

  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_campaign_id, 1, 2,  'Watch the replay before it expires',         'webinar_missed_replay'),
      (v_campaign_id, 2, 24, 'The one thing every man in the room realized', 'webinar_missed_key_takeaway'),
      (v_campaign_id, 3, 72, 'Next live training — don''t miss this one',  'webinar_missed_next_training')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 4. EXTENDED ASSESSMENT NURTURE (PR 2)
-- ============================================
-- Add 5 more emails to the existing assessment_completed campaign (sequence 3-7)

DO $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'assessment_completed' LIMIT 1;

  IF v_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_campaign_id, 3, 168, 'He scored a 3.2 on his weakest pillar. Here''s what happened.', 'assessment_case_study'),
      (v_campaign_id, 4, 240, 'Why your lowest score matters more than you think',             'assessment_pillar_deep_dive'),
      (v_campaign_id, 5, 336, 'I''m hosting a live training this month',                       'assessment_webinar_invite'),
      (v_campaign_id, 6, 432, 'Has your score changed?',                                       'assessment_retake_cta'),
      (v_campaign_id, 7, 504, 'The next cohort starts soon. 3 spots left.',                    'assessment_final_offer')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 5. NPS RESPONSES TABLE (PR 6)
-- ============================================

CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  feedback TEXT,
  context TEXT NOT NULL CHECK (context IN ('day_45', 'day_75', 'general')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nps_responses_user
  ON nps_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_nps_responses_context
  ON nps_responses(context, created_at);

ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on nps_responses"
  ON nps_responses FOR ALL
  USING (auth.role() = 'service_role');

-- Users can insert their own responses
CREATE POLICY "Users can insert own NPS responses"
  ON nps_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses
CREATE POLICY "Users can view own NPS responses"
  ON nps_responses FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 6. WAITLIST TABLE (PR 7)
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  cohort_month TEXT,
  source TEXT NOT NULL DEFAULT 'landing' CHECK (source IN (
    'landing', 'pricing', 'full_cohort'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,

  -- Prevent duplicate entries per email + cohort
  UNIQUE(email, cohort_month)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_cohort
  ON waitlist(cohort_month, created_at);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on waitlist"
  ON waitlist FOR ALL
  USING (auth.role() = 'service_role');
