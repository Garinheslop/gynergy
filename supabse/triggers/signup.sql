

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
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''), 
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),  
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'profile_image', NULL),  
    COALESCE(NEW.is_anonymous, false) 
  )
  ON CONFLICT (id) DO UPDATE 
    SET first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        profile_image = COALESCE(EXCLUDED.profile_image, users.profile_image),
        email = COALESCE(EXCLUDED.email, users.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


