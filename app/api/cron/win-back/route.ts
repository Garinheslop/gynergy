export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

import { enrollInDrip } from "@lib/services/dripService";
import { createServiceClient } from "@lib/supabase-server";

// Win-Back Cron Job
//
// Runs daily. Detects users who have stopped journaling (3+ days inactive)
// and enrolls them in the win-back drip campaign.
// Vercel Cron schedule: once per day at 10:00 AM UTC

const CRON_SECRET = process.env.CRON_SECRET;
const INACTIVITY_THRESHOLD_DAYS = 3;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    checked: 0,
    enrolled: 0,
    errors: [] as string[],
  };

  try {
    const supabase = createServiceClient();

    // Find users with challenge access who haven't journaled in 3+ days
    // and who are NOT already enrolled in the win-back drip
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

    // Get all users with challenge access (capped at 100 for timeout safety)
    const { data: activeUsers, error: usersError } = await supabase
      .from("user_entitlements")
      .select("user_id, users:user_id(email)")
      .eq("entitlement_type", "challenge_access")
      .eq("is_active", true)
      .limit(100);

    if (usersError || !activeUsers) {
      throw new Error(`Failed to fetch active users: ${usersError?.message}`);
    }

    results.checked = activeUsers.length;

    const userIds = activeUsers.map((e) => e.user_id).filter(Boolean);
    if (!userIds.length) {
      return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...results });
    }

    // Batch fetch latest journal entries for all users (avoids N+1)
    const { data: recentEntries } = await supabase
      .from("journal_entries")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    // Build map: userId → most recent entry date
    const lastEntryMap = new Map<string, Date>();
    for (const entry of recentEntries || []) {
      if (!lastEntryMap.has(entry.user_id)) {
        lastEntryMap.set(entry.user_id, new Date(entry.created_at));
      }
    }

    // Batch fetch profiles for personalization (avoids N+1)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; first_name: string }) => [p.id, p.first_name])
    );

    for (const entitlement of activeUsers) {
      try {
        const userId = entitlement.user_id;
        const userRecord = entitlement.users as { email?: string } | null;
        const email = userRecord?.email;

        if (!email) continue;

        const lastActive = lastEntryMap.get(userId) || null;

        // Skip users who are still active
        if (lastActive && lastActive > thresholdDate) continue;

        // Skip users who never started (no entries at all)
        if (!lastActive) continue;

        // Enroll in win-back drip (idempotent — won't duplicate)
        const result = await enrollInDrip(
          "user_inactive",
          email,
          {
            firstName: profileMap.get(userId) || undefined,
            lastActiveDate: lastActive.toISOString(),
          },
          userId
        );

        if (result.success) {
          results.enrolled++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`Error processing user ${entitlement.user_id}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/win-back] Fatal error:", message);
    return NextResponse.json({ success: false, error: message, ...results }, { status: 500 });
  }
}
