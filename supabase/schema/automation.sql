-- ============================================
-- AUTOMATION ENGINE SCHEMA
-- ============================================
-- Event-driven automation: "when X happens, do Y"
-- Immutable event log + configurable rules

-- ============================================
-- AUTOMATION EVENTS TABLE
-- ============================================
-- Immutable log of every meaningful event in the system

CREATE TABLE IF NOT EXISTS automation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- What happened
  event_type TEXT NOT NULL,

  -- Who it happened to
  user_id UUID REFERENCES auth.users(id),
  email TEXT,

  -- Event data
  payload JSONB DEFAULT '{}',

  -- Processing state
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUTOMATION RULES TABLE
-- ============================================
-- Configurable rules: trigger → conditions → actions

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger: which event type activates this rule
  trigger_event TEXT NOT NULL,

  -- Conditions: JSONB conditions that must be met (evaluated at runtime)
  -- Example: {"streak_type": "morning", "count": {"$gte": 7}}
  conditions JSONB DEFAULT '{}',

  -- Actions: array of actions to execute
  -- Example: [{"type": "send_email", "template": "streak_7_congrats"}, {"type": "award_badge", "badge": "early_riser"}]
  actions JSONB DEFAULT '[]',

  -- Control
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_automation_events_type
  ON automation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_events_unprocessed
  ON automation_events(processed, created_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_automation_events_user
  ON automation_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger
  ON automation_rules(trigger_event)
  WHERE is_active = true;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER trigger_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rules_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on automation_events"
  ON automation_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on automation_rules"
  ON automation_rules FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own events
CREATE POLICY "Users can view own events"
  ON automation_events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA: Initial Automation Rules
-- ============================================

INSERT INTO automation_rules (name, description, trigger_event, conditions, actions, priority)
VALUES
  (
    '7-Day Streak Celebration',
    'Send congratulations email when user hits a 7-day streak',
    'streak_reached',
    '{"count": 7}',
    '[{"type": "send_email", "template": "streak_7_congrats"}]',
    10
  ),
  (
    '30-Day Streak Celebration',
    'Send congratulations email when user hits a 30-day streak',
    'streak_reached',
    '{"count": 30}',
    '[{"type": "send_email", "template": "streak_30_congrats"}]',
    20
  ),
  (
    'First Journal Badge',
    'Award first journal badge when user completes their first morning journal',
    'journal_completed',
    '{"journal_type": "morning", "is_first": true}',
    '[{"type": "send_email", "template": "first_journal_congrats"}]',
    5
  )
ON CONFLICT DO NOTHING;
