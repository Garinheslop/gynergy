-- Migration 006: Add RLS policies to user_roles table
--
-- Fixes P0 bug: user_roles has RLS enabled but no policies defined,
-- causing ALL admin role checks to fail silently.
--
-- Impact: middleware.ts admin check queries user_roles with anon key.
-- With RLS enabled and no policies, this always returns null,
-- so admin users are always redirected away from /admin.
--
-- This migration adds a SELECT policy so authenticated users can
-- read their own roles. Insert/update/delete remain denied for
-- non-service-role clients (correct behavior).

-- Allow authenticated users to read their own roles
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
