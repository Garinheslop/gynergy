-- ============================================
-- EMAIL DRIP CAMPAIGNS SCHEMA
-- ============================================
-- Supports automated email sequences triggered by user actions.
-- Campaigns define a sequence of timed emails; enrollments track
-- each user's progress through a campaign.

-- ============================================
-- DRIP CAMPAIGNS TABLE
-- ============================================
-- Defines a named sequence of emails triggered by an event

CREATE TABLE IF NOT EXISTS drip_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger: what event starts this campaign
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'webinar_registered',
    'assessment_completed',
    'purchase_completed',
    'cart_abandoned',
    'user_inactive',
    'friend_codes_issued',
    'community_activated'
  )),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',
    'paused',
    'archived'
  )),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DRIP EMAILS TABLE
-- ============================================
-- Individual emails within a campaign, ordered by sequence

CREATE TABLE IF NOT EXISTS drip_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Parent campaign
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,

  -- Ordering & timing
  sequence_order INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,

  -- Content
  subject TEXT NOT NULL,
  template_key TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Each campaign has unique sequence ordering
  UNIQUE(campaign_id, sequence_order)
);

-- ============================================
-- DRIP ENROLLMENTS TABLE
-- ============================================
-- Tracks a user's progress through a drip campaign

CREATE TABLE IF NOT EXISTS drip_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Links
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Progress
  current_step INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT now(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',
    'completed',
    'cancelled'
  )),

  -- Extra context (e.g., assessment score, webinar title)
  metadata JSONB DEFAULT '{}',

  -- Prevent duplicate enrollments per campaign
  UNIQUE(campaign_id, email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_drip_emails_campaign
  ON drip_emails(campaign_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_drip_enrollments_active
  ON drip_enrollments(status, last_sent_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_drip_enrollments_campaign_email
  ON drip_enrollments(campaign_id, email);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_drip_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_drip_campaigns_updated_at ON drip_campaigns;
CREATE TRIGGER trigger_drip_campaigns_updated_at
  BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_drip_campaigns_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;

-- Service role has full access (cron, API routes use service client)
CREATE POLICY "Service role full access on drip_campaigns"
  ON drip_campaigns FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on drip_emails"
  ON drip_emails FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on drip_enrollments"
  ON drip_enrollments FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON drip_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA: Campaign Definitions
-- ============================================

-- Campaign 1: Post-Webinar Registration
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Post-Webinar Registration',
  'Nurture sequence after webinar registration: reminder to complete assessment, objection handling',
  'webinar_registered'
) ON CONFLICT DO NOTHING;

-- Campaign 2: Post-Assessment
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Post-Assessment',
  'Follow-up after Five Pillar Assessment: personalized pain points, social proof',
  'assessment_completed'
) ON CONFLICT DO NOTHING;

-- Campaign 3: Post-Purchase
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Post-Purchase',
  'Onboarding after challenge purchase: Day 0 guide, first week engagement, weekly check-in',
  'purchase_completed'
) ON CONFLICT DO NOTHING;

-- Seed drip emails for each campaign
-- Note: We use a DO block so we can reference campaign IDs dynamically

DO $$
DECLARE
  v_webinar_campaign_id UUID;
  v_assessment_campaign_id UUID;
  v_purchase_campaign_id UUID;
BEGIN
  -- Get campaign IDs
  SELECT id INTO v_webinar_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'webinar_registered' LIMIT 1;
  SELECT id INTO v_assessment_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'assessment_completed' LIMIT 1;
  SELECT id INTO v_purchase_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'purchase_completed' LIMIT 1;

  -- Webinar Registration Drip (steps 1-3; step 0 = instant confirmation already sent)
  IF v_webinar_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_webinar_campaign_id, 1, 24,  'Your pre-webinar assignment',                     'webinar_pre_assignment'),
      (v_webinar_campaign_id, 2, 72,  'The #1 reason men don''t show up',                'webinar_objection_handling'),
      (v_webinar_campaign_id, 3, 120, 'Quick reminder: {{webinar_title}} is coming up',   'webinar_final_reminder')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;

  -- Assessment Drip (steps 1-2; step 0 = instant report already sent)
  IF v_assessment_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_assessment_campaign_id, 1, 48,  'Your {{lowest_pillar}} score is holding you back', 'assessment_pain_point'),
      (v_assessment_campaign_id, 2, 96,  'What men who scored {{score}} did next',           'assessment_social_proof')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;

  -- Purchase Drip (steps 1-7; step 0 = instant welcome already sent)
  -- Includes onboarding (steps 1-3) + milestone celebrations (steps 4-7)
  IF v_purchase_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_purchase_campaign_id, 1, 24,   'Day 0: How to get the most out of this',    'purchase_day_zero_guide'),
      (v_purchase_campaign_id, 2, 72,   'Your first 3 days matter most',             'purchase_first_three_days'),
      (v_purchase_campaign_id, 3, 168,  'Week 1 check-in: How are you feeling?',     'purchase_week_one_checkin'),
      (v_purchase_campaign_id, 4, 336,  'Day 14: The habit is locking in',           'milestone_day_14'),
      (v_purchase_campaign_id, 5, 504,  'Day 21: Other people are noticing',         'milestone_day_21'),
      (v_purchase_campaign_id, 6, 720,  'Day 30: You''ve done what 90% couldn''t',   'milestone_day_30'),
      (v_purchase_campaign_id, 7, 1080, 'Day 45: You did it. Every single one.',     'milestone_day_45')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- ADDITIONAL CAMPAIGNS (Added 2026-02-17)
-- ============================================

-- Campaign 4: Cart Abandonment
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Cart Abandonment Recovery',
  'Re-engage users who started checkout but did not complete. 3-email sequence with downsell option.',
  'cart_abandoned'
) ON CONFLICT DO NOTHING;

-- Campaign 5: User Inactive / Win-back
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Win-Back / Re-engagement',
  'Re-engage users who stopped journaling. Triggered by cron detecting inactivity.',
  'user_inactive'
) ON CONFLICT DO NOTHING;

-- Campaign 6: Friend Code Referral Reminders
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Referral Reminders',
  'Remind users to share their unused friend codes. Enrolled after purchase when codes are generated.',
  'friend_codes_issued'
) ON CONFLICT DO NOTHING;

-- Campaign 7: Community Activation
INSERT INTO drip_campaigns (name, description, trigger_event)
VALUES (
  'Community Activation',
  'Welcome and onboard users when they get community access. Tour, introduce yourself prompt, first call.',
  'community_activated'
) ON CONFLICT DO NOTHING;

-- Seed emails for new campaigns
DO $$
DECLARE
  v_cart_campaign_id UUID;
  v_winback_campaign_id UUID;
  v_referral_campaign_id UUID;
  v_community_campaign_id UUID;
BEGIN
  SELECT id INTO v_cart_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'cart_abandoned' LIMIT 1;
  SELECT id INTO v_winback_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'user_inactive' LIMIT 1;
  SELECT id INTO v_referral_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'friend_codes_issued' LIMIT 1;
  SELECT id INTO v_community_campaign_id
    FROM drip_campaigns WHERE trigger_event = 'community_activated' LIMIT 1;

  -- Cart Abandonment Drip (3 emails: 1h, 24h, 72h after checkout expiry)
  IF v_cart_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_cart_campaign_id, 1, 1,  'You left something behind',                    'cart_abandoned_reminder'),
      (v_cart_campaign_id, 2, 24, 'What {{firstName}} would have missed',         'cart_abandoned_proof'),
      (v_cart_campaign_id, 3, 72, 'Last call: Your assessment score hasn''t changed', 'cart_abandoned_final')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;

  -- Win-Back Drip (3 emails: 3d, 7d, 14d of inactivity)
  IF v_winback_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_winback_campaign_id, 1, 72,  'Your journal is waiting',            'winback_gentle'),
      (v_winback_campaign_id, 2, 168, 'The gap gets harder to close',       'winback_pattern'),
      (v_winback_campaign_id, 3, 336, 'One entry. That''s all.',            'winback_final')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;

  -- Referral Reminders Drip (3 emails: 3d, 14d, 30d after codes issued)
  IF v_referral_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_referral_campaign_id, 1, 72,  'Your friend codes are worth $1,994',              'referral_day3'),
      (v_referral_campaign_id, 2, 336, 'The men who share finish stronger',                'referral_day14'),
      (v_referral_campaign_id, 3, 720, 'Last reminder: 2 spots reserved for your people',  'referral_day30')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;

  -- Community Activation Drip (2 emails: 1h, 48h after activation)
  IF v_community_campaign_id IS NOT NULL THEN
    INSERT INTO drip_emails (campaign_id, sequence_order, delay_hours, subject, template_key)
    VALUES
      (v_community_campaign_id, 1, 1,  'Welcome to the room',               'community_welcome'),
      (v_community_campaign_id, 2, 48, 'Your first call is this week',      'community_first_call')
    ON CONFLICT (campaign_id, sequence_order) DO NOTHING;
  END IF;
END $$;
