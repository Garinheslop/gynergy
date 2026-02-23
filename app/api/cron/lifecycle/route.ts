export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { enrollInDrip } from "@lib/services/dripService";
import { createServiceClient } from "@lib/supabase-server";

// Cohort Lifecycle Cron Job
//
// Runs daily at 6 AM UTC. Handles:
// 1. Sessions past end_date → set status='grace_period'
// 2. Sessions past grace_period_end → set status='completed', expire non-subscriber access
// 3. Upcoming sessions past start_date → set status='active'
//
// Vercel Cron schedule: daily at 6 AM UTC
//
// Performance: All DB operations use batch queries via .in() to avoid N+1.
// Only drip API calls remain sequential (external API, cannot batch).

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const results = {
    sessionsToGrace: 0,
    sessionsCompleted: 0,
    communityAccessGranted: 0,
    accessExpired: 0,
    dripEnrollments: 0,
    transitionsLogged: 0,
    errors: [] as string[],
  };

  try {
    // Pre-fetch alumni cohort once (used in Section 1)
    const { data: alumniCohort } = await supabase
      .from("cohorts")
      .select("id")
      .eq("slug", "alumni")
      .single();

    // ================================================================
    // 1. Active sessions past end_date → grace_period
    // ================================================================
    await handleActiveToGrace(supabase, now, results, alumniCohort?.id);

    // ================================================================
    // 2. Grace period sessions past grace_period_end → completed
    // ================================================================
    await handleGraceToCompleted(supabase, now, results);

    // ================================================================
    // 3. Upcoming sessions that should now be active
    // ================================================================
    await handleUpcomingToActive(supabase, now);

    return NextResponse.json({
      success: true,
      timestamp: now,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/lifecycle] Fatal error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ============================================================================
// Section 1: active → grace_period
// ============================================================================
async function handleActiveToGrace(
  supabase: ReturnType<typeof createServiceClient>,
  now: string,
  results: {
    sessionsToGrace: number;
    communityAccessGranted: number;
    dripEnrollments: number;
    transitionsLogged: number;
    errors: string[];
  },
  alumniCohortId: string | undefined
) {
  const { data: expiredActiveSessions } = await supabase
    .from("book_sessions")
    .select("id")
    .eq("status", "active")
    .eq("is_personal", false)
    .lt("end_date", now);

  if (!expiredActiveSessions?.length) return;

  const sessionIds = expiredActiveSessions.map((s) => s.id);

  // Batch update session statuses
  const { error: updateError } = await supabase
    .from("book_sessions")
    .update({ status: "grace_period", updated_at: now })
    .in("id", sessionIds);

  if (updateError) {
    results.errors.push(`Grace period transition error: ${updateError.message}`);
    return;
  }

  results.sessionsToGrace = sessionIds.length;

  // Batch fetch ALL enrollments for transitioning sessions
  const { data: allEnrollments } = await supabase
    .from("session_enrollments")
    .select("user_id, session_id")
    .in("session_id", sessionIds);

  if (!allEnrollments?.length) return;

  const userIds = Array.from(new Set(allEnrollments.map((e) => e.user_id)));

  // Batch grant community access to ALL users at once
  const { data: communityUpdated } = await supabase
    .from("user_entitlements")
    .update({
      has_community_access: true,
      community_access_granted_at: now,
      updated_at: now,
    })
    .in("user_id", userIds)
    .select("user_id");

  results.communityAccessGranted = communityUpdated?.length || 0;

  // Drip enrollments — sequential (external API, lookup maps for O(1) access)
  await enrollDripCampaigns(supabase, allEnrollments, userIds, results);

  // Batch upsert alumni cohort memberships
  if (alumniCohortId) {
    const alumniRows = userIds.map((userId) => ({
      cohort_id: alumniCohortId,
      user_id: userId,
      role: "member" as const,
    }));

    await supabase
      .from("cohort_memberships")
      .upsert(alumniRows, { onConflict: "cohort_id,user_id" });
  }

  // Batch insert transition records
  const transitionRows = allEnrollments.map((enrollment) => ({
    user_id: enrollment.user_id,
    from_session_id: enrollment.session_id,
    transition_type: "challenge_completed",
    metadata: { triggered_by: "lifecycle_cron" },
  }));

  const { error: transitionError } = await supabase
    .from("cohort_transitions")
    .insert(transitionRows);

  if (transitionError) {
    results.errors.push(`Transition insert error: ${transitionError.message}`);
  } else {
    results.transitionsLogged += transitionRows.length;
  }
}

// ============================================================================
// Drip campaign enrollment (sequential — external API)
// ============================================================================
async function enrollDripCampaigns(
  supabase: ReturnType<typeof createServiceClient>,
  allEnrollments: { user_id: string; session_id: string }[],
  userIds: string[],
  results: { dripEnrollments: number }
) {
  const { data: entitlements } = await supabase
    .from("user_entitlements")
    .select("user_id, challenge_access_type")
    .in("user_id", userIds);

  const { data: userProfiles } = await supabase.from("users").select("id, email").in("id", userIds);

  const entitlementMap = new Map(entitlements?.map((e) => [e.user_id, e]) || []);
  const emailMap = new Map(userProfiles?.map((u) => [u.id, u.email]) || []);

  for (const enrollment of allEnrollments) {
    const email = emailMap.get(enrollment.user_id);
    const entitlement = entitlementMap.get(enrollment.user_id);

    if (email && entitlement) {
      const dripTrigger =
        entitlement.challenge_access_type === "purchased"
          ? ("challenge_completed_purchaser" as const)
          : ("challenge_completed_friend_code" as const);

      const dripResult = await enrollInDrip(
        dripTrigger,
        email,
        { sessionId: enrollment.session_id, accessType: entitlement.challenge_access_type },
        enrollment.user_id
      );
      if (dripResult.success) results.dripEnrollments++;
    }
  }
}

// ============================================================================
// Section 2: grace_period → completed
// ============================================================================
async function handleGraceToCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  now: string,
  results: {
    sessionsCompleted: number;
    accessExpired: number;
    transitionsLogged: number;
    errors: string[];
  }
) {
  const { data: expiredGraceSessions } = await supabase
    .from("book_sessions")
    .select("id")
    .eq("status", "grace_period")
    .eq("is_personal", false)
    .lt("grace_period_end", now);

  if (!expiredGraceSessions?.length) return;

  const sessionIds = expiredGraceSessions.map((s) => s.id);

  // Batch update session statuses
  const { error: updateError } = await supabase
    .from("book_sessions")
    .update({ status: "completed", updated_at: now })
    .in("id", sessionIds);

  if (updateError) {
    results.errors.push(`Completion transition error: ${updateError.message}`);
    return;
  }

  results.sessionsCompleted = sessionIds.length;

  // Batch fetch ALL entitlements for completing sessions
  const { data: allEntitlements } = await supabase
    .from("user_entitlements")
    .select("user_id, has_journal_access, challenge_session_id")
    .in("challenge_session_id", sessionIds)
    .eq("has_challenge_access", true);

  if (!allEntitlements?.length) return;

  // Split into non-subscribers (revoke) and subscribers (convert)
  const toRevoke = allEntitlements.filter((e) => !e.has_journal_access);
  const toConvert = allEntitlements.filter((e) => e.has_journal_access);

  // Batch revoke challenge access for non-subscribers
  // Note: revokeUserIds is pre-filtered from allEntitlements (which used .in("challenge_session_id", sessionIds))
  // and user_entitlements has a unique user_id constraint — so each user has exactly one row.
  if (toRevoke.length > 0) {
    const revokeUserIds = toRevoke.map((e) => e.user_id);

    const { error: revokeError } = await supabase
      .from("user_entitlements")
      .update({ has_challenge_access: false, updated_at: now })
      .in("user_id", revokeUserIds);

    if (revokeError) {
      results.errors.push(`Access revocation error: ${revokeError.message}`);
    } else {
      results.accessExpired = toRevoke.length;
    }
  }

  // Batch insert transition records for ALL users
  const transitionRows = [
    ...toRevoke.map((e) => ({
      user_id: e.user_id,
      from_session_id: e.challenge_session_id,
      transition_type: "grace_period_ended",
      metadata: { had_subscription: false, triggered_by: "lifecycle_cron" },
    })),
    ...toConvert.map((e) => ({
      user_id: e.user_id,
      from_session_id: e.challenge_session_id,
      transition_type: "converted_to_subscription",
      metadata: { triggered_by: "lifecycle_cron" },
    })),
  ];

  if (transitionRows.length > 0) {
    const { error: transitionError } = await supabase
      .from("cohort_transitions")
      .insert(transitionRows);

    if (transitionError) {
      results.errors.push(`Transition insert error: ${transitionError.message}`);
    } else {
      results.transitionsLogged += transitionRows.length;
    }
  }
}

// ============================================================================
// Section 3: upcoming → active
// ============================================================================
async function handleUpcomingToActive(
  supabase: ReturnType<typeof createServiceClient>,
  now: string
) {
  const { data: readySessions } = await supabase
    .from("book_sessions")
    .select("id")
    .eq("status", "upcoming")
    .eq("is_personal", false)
    .lte("start_date", now);

  if (readySessions?.length) {
    const sessionIds = readySessions.map((s) => s.id);
    await supabase
      .from("book_sessions")
      .update({ status: "active", updated_at: now })
      .in("id", sessionIds);
  }
}
