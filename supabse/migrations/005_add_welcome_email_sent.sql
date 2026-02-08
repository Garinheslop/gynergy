-- Migration: Add welcome_email_sent column to users table
-- This column tracks whether a welcome email has been sent to the user

ALTER TABLE users
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Set existing users as already welcomed (to avoid spamming existing users)
UPDATE users SET welcome_email_sent = TRUE WHERE welcome_email_sent IS NULL;
