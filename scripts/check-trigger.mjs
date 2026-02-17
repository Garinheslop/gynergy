import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjI3ODExMiwiZXhwIjoyMDU3ODU0MTEyfQ.Tf4Tq5c5Vr9TLvt-mumVKBgIVC5wpWOOPq1_0gOOlQI";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTrigger() {
  console.log("=== CHECKING DATABASE TRIGGER STATUS ===\n");

  // Check if the trigger exists
  console.log("--- 1. Check trigger status ---");
  const { data: triggers, error: trigErr } = await supabase.rpc("exec_sql", {
    sql: `
      SELECT trigger_name, event_manipulation, action_statement, action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'auth'
      AND event_object_table = 'users';
    `,
  });

  if (trigErr) {
    console.log("Cannot use RPC exec_sql:", trigErr.message);
    console.log("Trying alternative approach...");

    // Try querying pg_trigger directly
    const { data: pgTriggers, error: pgErr } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT t.tgname, t.tgenabled, p.proname
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'auth.users'::regclass;
      `,
    });

    if (pgErr) {
      console.log("RPC not available:", pgErr.message);
    } else {
      console.log("Triggers:", JSON.stringify(pgTriggers, null, 2));
    }
  } else {
    console.log("Triggers:", JSON.stringify(triggers, null, 2));
  }

  // Check the function exists
  console.log("\n--- 2. Check if handle_new_user function exists ---");
  const { data: funcs, error: funcErr } = await supabase.rpc("exec_sql", {
    sql: `
      SELECT routine_name, routine_schema, routine_definition
      FROM information_schema.routines
      WHERE routine_name = 'handle_new_user';
    `,
  });

  if (funcErr) {
    console.log("Cannot query functions:", funcErr.message);
  } else {
    console.log("Function:", JSON.stringify(funcs, null, 2));
  }

  // Check the actual columns of the users table
  console.log("\n--- 3. Check users table columns ---");
  const { data: cols, error: colErr } = await supabase.rpc("exec_sql", {
    sql: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `,
  });

  if (colErr) {
    console.log("Cannot query columns:", colErr.message);
  } else {
    console.log("Columns:", JSON.stringify(cols, null, 2));
  }

  // Alternative: Try to check table structure via a select
  console.log("\n--- 4. Check users table structure via query ---");
  const { data: sampleUser, error: sampleErr } = await supabase
    .from("users")
    .select("*")
    .limit(1)
    .single();

  if (sampleErr) {
    console.log("Error:", sampleErr.message);
  } else if (sampleUser) {
    console.log("Users table columns:", Object.keys(sampleUser));
  }

  // Step 5: Try creating a user WITHOUT the trigger firing
  // The admin API creates in auth.users which fires the trigger.
  // Let's try to create directly in public.users first, then auth.users
  console.log("\n--- 5. Try creating test user step by step ---");

  const testEmail = "test-playwright@gynergy.com";
  const testId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  // First check if we already have a leftover auth user
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const existing = users?.find((u) => u.email === testEmail);

  if (existing) {
    console.log("  Found existing auth user:", existing.id);
    console.log("  Deleting it first...");
    const { error: delErr } = await supabase.auth.admin.deleteUser(existing.id);
    if (delErr) {
      console.log("  ERROR deleting:", delErr.message);
    } else {
      console.log("  Deleted.");

      // Also clean up public.users
      await supabase.from("users").delete().eq("id", existing.id);
      await supabase.from("user_entitlements").delete().eq("user_id", existing.id);
      await supabase.from("user_roles").delete().eq("user_id", existing.id);
    }
  }

  // Now try creating - first insert into public.users
  console.log("\n  Inserting into public.users first...");
  const { error: insertErr } = await supabase.from("users").insert({
    id: testId,
    supabase_id: testId,
    first_name: "Test",
    last_name: "User",
    email: testEmail,
    is_anonymous: false,
  });

  if (insertErr) {
    console.log("  ERROR inserting into public.users:", insertErr.message);
    console.log("  (This is expected if there's a FK constraint to auth.users)");
  } else {
    console.log("  Inserted into public.users successfully.");
  }

  // Now try creating the auth user with the admin API
  console.log("\n  Creating auth user...");
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: "TestPassword123!",
    email_confirm: true,
    user_metadata: {
      first_name: "Test",
      last_name: "User",
    },
  });

  if (createErr) {
    console.log("  ERROR creating auth user:", createErr.message);
    console.log("  Status:", createErr.status);

    // Check the database logs
    console.log("\n  Checking if user partially created in auth...");
    const {
      data: { users: usersAfter },
    } = await supabase.auth.admin.listUsers({ perPage: 500 });
    const partialUser = usersAfter?.find((u) => u.email === testEmail);
    if (partialUser) {
      console.log("  User WAS created in auth.users (ID:", partialUser.id, ")");
      console.log("  The trigger is likely causing the error but the user was created.");

      // Manually create in public.users
      console.log("  Manually inserting into public.users...");
      const { error: manualErr } = await supabase.from("users").upsert({
        id: partialUser.id,
        supabase_id: partialUser.id,
        first_name: "Test",
        last_name: "User",
        email: testEmail,
        is_anonymous: false,
      });
      if (manualErr) {
        console.log("  ERROR:", manualErr.message);
      } else {
        console.log("  Success! User manually inserted into public.users.");
      }

      // Grant entitlements
      console.log("  Granting entitlements...");
      const { error: entErr } = await supabase.from("user_entitlements").upsert({
        user_id: partialUser.id,
        has_challenge_access: true,
        challenge_access_type: "admin_granted",
        challenge_access_granted_at: new Date().toISOString(),
        has_community_access: true,
        community_access_granted_at: new Date().toISOString(),
      });
      if (entErr) {
        console.log("  ERROR:", entErr.message);
      } else {
        console.log("  Entitlements granted!");
      }

      // Grant admin role
      console.log("  Granting admin role...");
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: partialUser.id,
        role: "admin",
      });
      if (roleErr) {
        console.log("  ERROR:", roleErr.message);
      } else {
        console.log("  Admin role granted!");
      }

      // Update password
      console.log("  Setting password...");
      const { error: pwErr } = await supabase.auth.admin.updateUser(partialUser.id, {
        password: "TestPassword123!",
      });
      if (pwErr) {
        console.log("  ERROR:", pwErr.message);
      } else {
        console.log("  Password set!");
      }

      console.log("\n  >>> TEST USER READY <<<");
      console.log("  Email:", testEmail);
      console.log("  Password: TestPassword123!");
      console.log("  User ID:", partialUser.id);
    } else {
      console.log("  User was NOT created in auth.users either.");
      console.log("  The error is happening before the INSERT completes.");
    }
  } else {
    console.log("  Auth user created:", newUser.user.id);

    // The trigger should have handled public.users insertion
    const { data: checkUser } = await supabase.from("users").select("id").eq("id", newUser.user.id).single();
    if (checkUser) {
      console.log("  Trigger worked - user exists in public.users!");
    } else {
      console.log("  Trigger FAILED - user NOT in public.users. Inserting manually...");
      await supabase.from("users").upsert({
        id: newUser.user.id,
        supabase_id: newUser.user.id,
        first_name: "Test",
        last_name: "User",
        email: testEmail,
        is_anonymous: false,
      });
    }

    // Grant entitlements
    await supabase.from("user_entitlements").upsert({
      user_id: newUser.user.id,
      has_challenge_access: true,
      challenge_access_type: "admin_granted",
      challenge_access_granted_at: new Date().toISOString(),
    });

    // Grant admin role
    await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
    });

    console.log("\n  >>> TEST USER READY <<<");
    console.log("  Email:", testEmail);
    console.log("  Password: TestPassword123!");
    console.log("  User ID:", newUser.user.id);
  }

  console.log("\n=== DONE ===");
}

checkTrigger().catch(console.error);
