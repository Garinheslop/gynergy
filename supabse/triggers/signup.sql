

-- For creating new users while signup --
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION handle_new_user();
-- ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, supabase_id, first_name, last_name, email, profile_image, is_anonymous)
  VALUES (
    NEW.id,
    NEW.id,
    -- Check for Google OAuth (given_name) or regular signup (first_name)
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'given_name', ''),
      ''
    ),
    -- Check for Google OAuth (family_name) or regular signup (last_name)
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'family_name', ''),
      ''
    ),
    NEW.email,
    -- Check for Google OAuth (picture/avatar_url) or regular signup (profile_image)
    COALESCE(
      NEW.raw_user_meta_data ->> 'profile_image',
      NEW.raw_user_meta_data ->> 'picture',
      NEW.raw_user_meta_data ->> 'avatar_url',
      NULL
    ),
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (id) DO UPDATE
    SET first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), users.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), users.last_name),
        profile_image = COALESCE(EXCLUDED.profile_image, users.profile_image),
        email = COALESCE(EXCLUDED.email, users.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


