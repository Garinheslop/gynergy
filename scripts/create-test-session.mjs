import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjI3ODExMiwiZXhwIjoyMDU3ODU0MTEyfQ.Tf4Tq5c5Vr9TLvt-mumVKBgIVC5wpWOOPq1_0gOOlQI";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createTestSession() {
  const testEmail = "test-playwright@gynergy.com";
  const testPassword = "TestPassword123!";

  console.log("=== CREATING TEST SESSION ===\n");

  // Step 1: Check if test user already exists
  console.log("Step 1: Checking for existing test user...");
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existingUser = users?.find((u) => u.email === testEmail);

  let userId;

  if (existingUser) {
    console.log("  Test user already exists:", existingUser.id);
    userId = existingUser.id;

    // Update the password
    console.log("  Updating password...");
    const { error: updateErr } = await supabase.auth.admin.updateUser(existingUser.id, {
      password: testPassword,
      email_confirm: true,
    });
    if (updateErr) {
      console.log("  ERROR updating user:", updateErr.message);
      return;
    }
    console.log("  Password updated.");
  } else {
    // Step 2: Create test user via admin API (bypasses triggers)
    console.log("Step 2: Creating test user...");
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: "Test",
        last_name: "User",
      },
    });

    if (createErr) {
      console.log("  ERROR creating user:", createErr.message);
      console.log("  Full error:", JSON.stringify(createErr, null, 2));

      // If the trigger fails, try to check what happened
      console.log("\n  Checking if user was partially created...");
      const {
        data: { users: usersAfter },
      } = await supabase.auth.admin.listUsers({ perPage: 100 });
      const partialUser = usersAfter?.find((u) => u.email === testEmail);
      if (partialUser) {
        console.log("  User was partially created:", partialUser.id);
        console.log("  The auth.users INSERT worked but the trigger (handle_new_user) may have failed.");
        userId = partialUser.id;

        // Manually insert into users table
        console.log("  Manually inserting into users table...");
        const { error: manualErr } = await supabase.from("users").upsert({
          id: partialUser.id,
          supabase_id: partialUser.id,
          first_name: "Test",
          last_name: "User",
          email: testEmail,
          is_anonymous: false,
        });
        if (manualErr) {
          console.log("  ERROR inserting into users:", manualErr.message);
        } else {
          console.log("  Manually inserted into users table.");
        }
      }
    } else {
      console.log("  User created:", newUser.user.id);
      userId = newUser.user.id;
    }
  }

  if (!userId) {
    console.log("\nCannot proceed without user ID");
    return;
  }

  // Step 3: Ensure user exists in public.users table
  console.log("\nStep 3: Checking public.users table...");
  const { data: publicUser, error: pubErr } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (pubErr || !publicUser) {
    console.log("  User NOT in public.users table. Inserting...");
    const { error: insertErr } = await supabase.from("users").upsert({
      id: userId,
      supabase_id: userId,
      first_name: "Test",
      last_name: "User",
      email: testEmail,
      is_anonymous: false,
    });
    if (insertErr) {
      console.log("  ERROR inserting:", insertErr.message);
    } else {
      console.log("  Inserted into public.users table.");
    }
  } else {
    console.log("  User exists in public.users:", publicUser.first_name, publicUser.last_name);
  }

  // Step 4: Grant challenge access
  console.log("\nStep 4: Granting challenge access...");
  const { error: entErr } = await supabase.from("user_entitlements").upsert({
    user_id: userId,
    has_challenge_access: true,
    challenge_access_type: "admin_granted",
    challenge_access_granted_at: new Date().toISOString(),
    has_community_access: true,
    community_access_granted_at: new Date().toISOString(),
  });

  if (entErr) {
    console.log("  ERROR granting entitlements:", entErr.message);
  } else {
    console.log("  Challenge access granted!");
  }

  // Step 5: Grant admin role
  console.log("\nStep 5: Granting admin role...");
  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();

  if (existingRole) {
    console.log("  Admin role already exists.");
  } else {
    const { error: roleErr } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });
    if (roleErr) {
      console.log("  ERROR granting admin role:", roleErr.message);
    } else {
      console.log("  Admin role granted!");
    }
  }

  // Step 6: Generate a session token
  console.log("\nStep 6: Generating session...");
  const { data: signInData, error: signInErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: testEmail,
  });

  if (signInErr) {
    console.log("  ERROR generating magic link:", signInErr.message);
  } else {
    console.log("  Magic link generated!");
    console.log("  Action link:", signInData.properties?.action_link);
    console.log("  Hashed token:", signInData.properties?.hashed_token);
  }

  console.log("\n=== TEST SESSION SETUP COMPLETE ===");
  console.log("\nTest credentials:");
  console.log("  Email:", testEmail);
  console.log("  Password:", testPassword);
  console.log("  User ID:", userId);
  console.log("\nYou can now use these credentials in Playwright to log in via the login form.");
}

createTestSession().catch(console.error);
