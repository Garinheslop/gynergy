/**
 * Setup Test Agent Users for E2E Testing
 *
 * Creates 3 test agent users in Supabase with proper entitlements and cohort membership.
 * These users enable multi-user testing: DM send/receive, realtime updates, rate limiting.
 *
 * Usage: node scripts/setup-test-agents.mjs
 *
 * Agent A (primary):   test-agent-a@gynergy.com / AgentTestA123!
 * Agent B (secondary): test-agent-b@gynergy.com / AgentTestB123!
 * Agent C (load test): test-agent-c@gynergy.com / AgentTestC123!
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjI3ODExMiwiZXhwIjoyMDU3ODU0MTEyfQ.Tf4Tq5c5Vr9TLvt-mumVKBgIVC5wpWOOPq1_0gOOlQI";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Separate anon client for sign-in verification (doesn't pollute the admin session)
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzgxMTIsImV4cCI6MjA1Nzg1NDExMn0.8qEL_XhWjYcLBjou_P0OjL2lpgMoSDCl2KnN04ogCsw";
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

const TEST_AGENTS = [
  {
    email: "test-agent-a@gynergy.com",
    password: "AgentTestA123!",
    firstName: "Agent",
    lastName: "Alpha",
    role: "user",
  },
  {
    email: "test-agent-b@gynergy.com",
    password: "AgentTestB123!",
    firstName: "Agent",
    lastName: "Beta",
    role: "user",
  },
  {
    email: "test-agent-c@gynergy.com",
    password: "AgentTestC123!",
    firstName: "Agent",
    lastName: "Charlie",
    role: "user",
  },
];

async function ensureUser(agent) {
  const { email, password, firstName, lastName } = agent;
  console.log(`\n--- Setting up ${email} ---`);

  // Check if user exists in auth.users
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = users?.find((u) => u.email === email);

  let userId;

  if (existing) {
    console.log(`  Auth user exists: ${existing.id}`);
    userId = existing.id;

    // Update password to ensure it's correct
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateErr) {
      console.log(`  ERROR updating password: ${updateErr.message}`);
      return null;
    }
    console.log(`  Password updated.`);
  } else {
    // Create user
    console.log(`  Creating auth user...`);
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (createErr) {
      console.log(`  ERROR creating user: ${createErr.message}`);

      // Check if partially created
      const {
        data: { users: usersAfter },
      } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const partial = usersAfter?.find((u) => u.email === email);
      if (partial) {
        console.log(`  Partially created: ${partial.id}`);
        userId = partial.id;
      } else {
        return null;
      }
    } else {
      console.log(`  Created: ${newUser.user.id}`);
      userId = newUser.user.id;
    }
  }

  // Ensure public.users record exists
  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!publicUser) {
    console.log(`  Creating public.users record...`);
    const { error: insertErr } = await supabase.from("users").upsert({
      id: userId,
      supabase_id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      is_anonymous: false,
    });
    if (insertErr) {
      console.log(`  ERROR inserting public.users: ${insertErr.message}`);
    } else {
      console.log(`  Public user record created.`);
    }
  } else {
    console.log(`  Public user record exists.`);
  }

  // Grant entitlements (challenge + community access)
  const { error: entErr } = await supabase.from("user_entitlements").upsert({
    user_id: userId,
    has_challenge_access: true,
    challenge_access_type: "admin_granted",
    challenge_access_granted_at: new Date().toISOString(),
    has_community_access: true,
    community_access_granted_at: new Date().toISOString(),
  });

  if (entErr) {
    console.log(`  ERROR granting entitlements: ${entErr.message}`);
  } else {
    console.log(`  Entitlements granted.`);
  }

  // Verify sign-in works (use anon client to avoid polluting admin session)
  const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.log(`  ERROR verifying sign-in: ${signInErr.message}`);
  } else {
    console.log(`  Sign-in verified. User ID: ${signIn.user.id}`);
  }

  return userId;
}

async function ensureSameCohort(userIds) {
  console.log("\n--- Ensuring all agents are in the same cohort ---");

  // Find an existing cohort, or create one for testing
  const { data: existingCohort } = await supabase
    .from("cohorts")
    .select("id, name")
    .limit(1)
    .single();

  let cohortId;

  if (existingCohort) {
    cohortId = existingCohort.id;
    console.log(`  Using existing cohort: ${existingCohort.name} (${cohortId})`);
  } else {
    console.log(`  No cohorts found. Creating test cohort...`);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 3);
    const { data: newCohort, error: cohortErr } = await supabase
      .from("cohorts")
      .insert({
        name: "Test Cohort",
        slug: "test-cohort-e2e",
        description: "Cohort for E2E testing",
        start_date: now.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        max_members: 50,
        is_active: true,
      })
      .select("id")
      .single();

    if (cohortErr) {
      console.log(`  ERROR creating cohort: ${cohortErr.message}`);
      return;
    }
    cohortId = newCohort.id;
    console.log(`  Created cohort: ${cohortId}`);
  }

  // Add each user to the cohort
  for (const userId of userIds) {
    if (!userId) continue;

    const { data: existing } = await supabase
      .from("cohort_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("cohort_id", cohortId)
      .single();

    if (existing) {
      console.log(`  User ${userId} already in cohort.`);
    } else {
      const { error: memberErr } = await supabase.from("cohort_memberships").insert({
        user_id: userId,
        cohort_id: cohortId,
        role: "member",
        joined_at: new Date().toISOString(),
      });

      if (memberErr) {
        console.log(`  ERROR adding user to cohort: ${memberErr.message}`);
      } else {
        console.log(`  Added user ${userId} to cohort.`);
      }
    }
  }
}

async function main() {
  console.log("=== SETTING UP TEST AGENT USERS ===");
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Agents: ${TEST_AGENTS.length}`);

  const userIds = [];

  for (const agent of TEST_AGENTS) {
    const userId = await ensureUser(agent);
    userIds.push(userId);
  }

  // Ensure all agents are in the same cohort for DM testing
  await ensureSameCohort(userIds.filter(Boolean));

  console.log("\n=== SETUP COMPLETE ===\n");
  console.log("Test Agent Credentials:");
  for (let i = 0; i < TEST_AGENTS.length; i++) {
    const agent = TEST_AGENTS[i];
    const uid = userIds[i];
    console.log(`  ${agent.firstName} ${agent.lastName}: ${agent.email} / ${agent.password} (${uid || "FAILED"})`);
  }

  console.log("\nUse these in Playwright E2E tests with the multi-user auth helper.");
}

main().catch(console.error);
