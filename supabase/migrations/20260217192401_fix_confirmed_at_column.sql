-- Fix: Convert confirmed_at from GENERATED ALWAYS STORED to regular column
-- Root cause: GoTrue v2.186.0 ORM includes confirmed_at in INSERT statements,
-- but PostgreSQL rejects writes to GENERATED columns, breaking all signups.

-- Step 1: Drop the GENERATED column
ALTER TABLE auth.users DROP COLUMN confirmed_at;

-- Step 2: Recreate as regular column
ALTER TABLE auth.users ADD COLUMN confirmed_at timestamptz;

-- Step 3: Backfill existing data
UPDATE auth.users
SET confirmed_at = LEAST(email_confirmed_at, phone_confirmed_at)
WHERE email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL;

-- Step 4: Create trigger function to keep confirmed_at in sync
CREATE OR REPLACE FUNCTION auth.sync_confirmed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  NEW.confirmed_at := LEAST(NEW.email_confirmed_at, NEW.phone_confirmed_at);
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger
CREATE TRIGGER sync_confirmed_at_trigger
BEFORE INSERT OR UPDATE OF email_confirmed_at, phone_confirmed_at
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.sync_confirmed_at();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION auth.sync_confirmed_at() TO supabase_auth_admin;
