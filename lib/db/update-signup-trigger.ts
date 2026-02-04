import postgres from "postgres";

async function updateSignupTrigger() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
  });

  console.log("Connected to database");

  try {
    console.log("Updating signup trigger to handle Google OAuth...");

    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (id, supabase_id, first_name, last_name, email, profile_image, is_anonymous)
        VALUES (
          NEW.id,
          NEW.id,
          COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
            NULLIF(NEW.raw_user_meta_data ->> 'given_name', ''),
            ''
          ),
          COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
            NULLIF(NEW.raw_user_meta_data ->> 'family_name', ''),
            ''
          ),
          NEW.email,
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
    `);

    console.log("Signup trigger updated successfully!");
  } catch (error) {
    console.error("Update failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

updateSignupTrigger();
