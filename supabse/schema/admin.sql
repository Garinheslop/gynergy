-- Admin Dashboard Schema
-- Provides audit logging, system metrics, admin preferences, and moderation queue

-- ============================================
-- Admin Audit Logs
-- Track all admin actions for compliance and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'view', 'create', 'update', 'delete', 'export',
    'suspend', 'unsuspend', 'approve', 'reject', 'escalate'
  )),
  action_category TEXT NOT NULL CHECK (action_category IN (
    'user_management', 'content_moderation', 'payment',
    'system', 'analytics', 'settings'
  )),

  -- Resource affected
  resource_type TEXT NOT NULL,
  resource_id UUID,

  -- State tracking
  previous_state JSONB,
  new_state JSONB,

  -- Context
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,

  -- Result
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- System Metrics
-- Store aggregated platform metrics for dashboards
-- ============================================
CREATE TABLE IF NOT EXISTS "system_metrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN (
    'users', 'revenue', 'engagement', 'content',
    'performance', 'errors', 'ai'
  )),

  -- Value
  value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'count',

  -- Dimensions for slicing
  dimensions JSONB DEFAULT '{}',

  -- Time tracking
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  aggregation_period TEXT DEFAULT 'hourly' CHECK (aggregation_period IN (
    'realtime', 'hourly', 'daily', 'weekly', 'monthly'
  ))
);

-- ============================================
-- Admin Preferences
-- Per-admin dashboard settings
-- ============================================
CREATE TABLE IF NOT EXISTS "admin_preferences" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Dashboard layout
  dashboard_layout JSONB DEFAULT '{"widgets": ["stats", "activity", "alerts"]}',
  default_date_range TEXT DEFAULT '7d' CHECK (default_date_range IN (
    '24h', '7d', '30d', '90d', '1y', 'all'
  )),

  -- UI preferences
  sidebar_collapsed BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),

  -- Aria AI settings
  aria_enabled BOOLEAN DEFAULT true,
  aria_auto_insights BOOLEAN DEFAULT true,
  aria_voice_enabled BOOLEAN DEFAULT false,

  -- Notification preferences
  email_daily_digest BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Moderation Queue
-- Content awaiting admin review
-- ============================================
CREATE TABLE IF NOT EXISTS "moderation_queue" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN (
    'post', 'comment', 'reflection', 'profile', 'message'
  )),
  content_id UUID NOT NULL,
  content_preview TEXT,

  -- Reporter info (null if auto-flagged)
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  report_reason TEXT,

  -- Priority and status
  priority TEXT DEFAULT 'normal' CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'approved', 'rejected', 'escalated'
  )),

  -- AI analysis
  ai_risk_score NUMERIC CHECK (ai_risk_score >= 0 AND ai_risk_score <= 1),
  ai_risk_factors JSONB DEFAULT '[]',
  ai_recommendation TEXT,

  -- Resolution
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Dashboard Metrics Cache
-- Pre-computed metrics for fast dashboard loading
-- ============================================
CREATE TABLE IF NOT EXISTS "dashboard_metrics_cache" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  metric_key TEXT NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,

  -- Cache management
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Metadata
  query_hash TEXT,
  computation_time_ms INTEGER
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- Admins only for all admin tables
-- ============================================

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logs: Admins can read all, write own actions
CREATE POLICY "Admins can read all audit logs" ON admin_audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert own audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (admin_id = auth.uid() AND is_admin(auth.uid()));

-- System metrics: Admins can read all, service role can write
CREATE POLICY "Admins can read system metrics" ON system_metrics
  FOR SELECT USING (is_admin(auth.uid()));

-- Admin preferences: Each admin manages their own
CREATE POLICY "Admins can manage own preferences" ON admin_preferences
  FOR ALL USING (user_id = auth.uid() AND is_admin(auth.uid()));

-- Moderation queue: Admins can read and update all
CREATE POLICY "Admins can read moderation queue" ON moderation_queue
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update moderation queue" ON moderation_queue
  FOR UPDATE USING (is_admin(auth.uid()));

-- Dashboard cache: Admins can read
CREATE POLICY "Admins can read dashboard cache" ON dashboard_metrics_cache
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_category ON admin_audit_logs(action_category);
CREATE INDEX idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_category ON system_metrics(metric_category);
CREATE INDEX idx_system_metrics_recorded ON system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_dimensions ON system_metrics USING GIN(dimensions);

CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX idx_moderation_queue_content ON moderation_queue(content_type, content_id);
CREATE INDEX idx_moderation_queue_created ON moderation_queue(created_at DESC);

CREATE INDEX idx_dashboard_cache_key ON dashboard_metrics_cache(metric_key);
CREATE INDEX idx_dashboard_cache_expires ON dashboard_metrics_cache(expires_at);

-- ============================================
-- Triggers for Updated At
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_preferences_updated_at
  BEFORE UPDATE ON admin_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_queue_updated_at
  BEFORE UPDATE ON moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
