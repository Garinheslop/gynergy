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

    // Get all users with challenge access
    const { data: activeUsers, error: usersError } = await supabase
      .from("user_entitlements")
      .select("user_id, users:user_id(email)")
      .eq("entitlement_type", "challenge_access")
      .eq("is_active", true);

    if (usersError || !activeUsers) {
      throw new Error(`Failed to fetch active users: ${usersError?.message}`);
    }

    results.checked = activeUsers.length;

    for (const entitlement of activeUsers) {
      try {
        const userId = entitlement.user_id;
        const userRecord = entitlement.users as { email?: string } | null;
        const email = userRecord?.email;

        if (!email) continue;

        // Check their most recent journal entry
        const { data: lastEntry } = await supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // If no entries at all, or last entry is older than threshold
        const lastActive = lastEntry?.created_at ? new Date(lastEntry.created_at) : null;

        if (lastActive && lastActive > thresholdDate) {
          // User is still active, skip
          continue;
        }

        // User is inactive — check if they have any entries at all
        // (don't send win-back to users who never started)
        if (!lastEntry) continue;

        // Get first name for personalization
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", userId)
          .single();

        // Enroll in win-back drip (idempotent — won't duplicate)
        const result = await enrollInDrip(
          "user_inactive",
          email,
          {
            firstName: profile?.first_name || undefined,
            lastActiveDate: lastActive?.toISOString(),
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
