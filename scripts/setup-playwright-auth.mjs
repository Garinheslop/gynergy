import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjI3ODExMiwiZXhwIjoyMDU3ODU0MTEyfQ.Tf4Tq5c5Vr9TLvt-mumVKBgIVC5wpWOOPq1_0gOOlQI";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzgxMTIsImV4cCI6MjA1Nzg1NDExMn0.8qEL_XhWjYcLBjou_P0OjL2lpgMoSDCl2KnN04ogCsw";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setup() {
  const testEmail = "garin@gynergy.com";
  const testPassword = "PlaywrightTest123!";

  console.log("=== SETTING UP PLAYWRIGHT AUTH ===\n");

  // Step 1: Set a known password for garin via admin API
  console.log("Step 1: Setting test password for", testEmail);
  const {
    data: { users },
  } = await adminClient.auth.admin.listUsers({ perPage: 100 });
  const garin = users?.find((u) => u.email === testEmail);

  if (!garin) {
    console.log("ERROR: User not found");
    return;
  }

  console.log("  User ID:", garin.id);

  const { error: pwErr } = await adminClient.auth.admin.updateUserById(garin.id, {
    password: testPassword,
  });

  if (pwErr) {
    console.log("ERROR setting password:", pwErr.message);
    return;
  }
  console.log("  Password set successfully.");

  // Step 2: Verify we can sign in with these credentials
  console.log("\nStep 2: Verifying sign-in...");
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.log("ERROR signing in:", signInErr.message);
    return;
  }

  console.log("  Sign in successful!");
  console.log("  Access token (first 50 chars):", signInData.session.access_token.substring(0, 50) + "...");
  console.log("  Refresh token (first 30 chars):", signInData.session.refresh_token.substring(0, 30) + "...");
  console.log("  Expires at:", signInData.session.expires_at);

  // Output the credentials for Playwright
  console.log("\n=== PLAYWRIGHT AUTH READY ===");
  console.log("Email:", testEmail);
  console.log("Password:", testPassword);
  console.log("\nSet these env vars for Playwright:");
  console.log(`  TEST_USER_EMAIL=${testEmail}`);
  console.log(`  TEST_USER_PASSWORD=${testPassword}`);
}

setup().catch(console.error);
