-- ============================================
-- GHL INTEGRATION SCHEMA
-- ============================================
-- Tracks bidirectional sync state between Supabase and GoHighLevel

-- ============================================
-- GHL CONTACT SYNC TABLE
-- ============================================
-- Maps GHL contact IDs to Gynergy emails for bidirectional sync

CREATE TABLE IF NOT EXISTS ghl_contact_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- GHL identity
  ghl_contact_id TEXT UNIQUE NOT NULL,

  -- Gynergy identity (email is the shared key)
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Contact data from GHL
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  -- Sync state
  last_synced_to_ghl TIMESTAMPTZ,
  last_synced_from_ghl TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN (
    'synced', 'pending_to_ghl', 'pending_from_ghl', 'error'
  )),
  sync_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups (primary join key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ghl_sync_email
  ON ghl_contact_sync(email);

-- Index for sync status (cron queries)
CREATE INDEX IF NOT EXISTS idx_ghl_sync_status
  ON ghl_contact_sync(sync_status)
  WHERE sync_status != 'synced';

-- Index for GHL contact ID lookups
CREATE INDEX IF NOT EXISTS idx_ghl_sync_ghl_id
  ON ghl_contact_sync(ghl_contact_id);


-- ============================================
-- GHL WEBHOOK LOG TABLE
-- ============================================
-- Logs all inbound GHL webhook events for audit + replay

CREATE TABLE IF NOT EXISTS ghl_webhook_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  email TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_log_type
  ON ghl_webhook_log(event_type, created_at DESC);

-- Index for unprocessed events
CREATE INDEX IF NOT EXISTS idx_ghl_webhook_log_unprocessed
  ON ghl_webhook_log(processed, created_at)
  WHERE processed = false;


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ghl_contact_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_webhook_log ENABLE ROW LEVEL SECURITY;

-- Service role only (these are automation tables)
CREATE POLICY "Service role full access on ghl_contact_sync"
  ON ghl_contact_sync FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on ghl_webhook_log"
  ON ghl_webhook_log FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_ghl_contact_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ghl_sync_updated_at ON ghl_contact_sync;
CREATE TRIGGER trigger_ghl_sync_updated_at
  BEFORE UPDATE ON ghl_contact_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_ghl_contact_sync_updated_at();
