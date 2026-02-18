/**
 * Community Stats API
 *
 * GET - Returns aggregate community stats for the hero section.
 * Uses head-only count queries for minimal data transfer.
 */

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run all count queries in parallel
    const [postsResult, membersResult, referralsResult] = await Promise.all([
      // Total approved posts
      supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", true),

      // Total community members (all cohort memberships)
      supabase.from("cohort_memberships").select("id", { count: "exact", head: true }),

      // Total referrals
      supabase.from("referrals").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      totalPosts: postsResult.count ?? 0,
      totalMembers: membersResult.count ?? 0,
      totalReferrals: referralsResult.count ?? 0,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
