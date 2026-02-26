-- Migration 009: Billing Hardening
-- Fixes schema documentation and adds column comments for trial dates

-- Fix table comment (was $19.97, actual price is $39.95)
COMMENT ON TABLE subscriptions IS 'Journal subscriptions at $39.95/month or $399/year';

-- Document trial columns (auto-populated from Stripe on subscription creation)
COMMENT ON COLUMN subscriptions.trial_start IS 'Start of trial period (auto-populated from Stripe on creation)';
COMMENT ON COLUMN subscriptions.trial_end IS 'End of trial period (auto-populated from Stripe on creation)';
