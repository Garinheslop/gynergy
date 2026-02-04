export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: Get user's current entitlements
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (entitlementsError && entitlementsError.code !== "PGRST116") {
      // PGRST116 = no rows found (which is fine, means no entitlements yet)
      console.error("Error fetching entitlements:", entitlementsError);
      return NextResponse.json({ error: "Failed to fetch entitlements" }, { status: 500 });
    }

    // Get user's friend codes
    const { data: friendCodes, error: friendCodesError } = await supabase
      .from("friend_codes")
      .select("code, used_by_id, used_at, created_at")
      .eq("creator_id", user.id);

    if (friendCodesError) {
      console.error("Error fetching friend codes:", friendCodesError);
    }

    // Get active subscription if any
    let subscription = null;
    if (entitlements?.journal_subscription_id) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", entitlements.journal_subscription_id)
        .single();
      subscription = sub;
    }

    // Format response with camelCase keys
    const formattedEntitlements = entitlements
      ? {
          id: entitlements.id,
          userId: entitlements.user_id,
          hasChallengeAccess: entitlements.has_challenge_access,
          challengeAccessType: entitlements.challenge_access_type,
          challengeAccessGrantedAt: entitlements.challenge_access_granted_at,
          challengeExpiresAt: entitlements.challenge_expires_at,
          hasJournalAccess: entitlements.has_journal_access,
          journalSubscriptionId: entitlements.journal_subscription_id,
          hasCommunityAccess: entitlements.has_community_access,
          communityAccessGrantedAt: entitlements.community_access_granted_at,
          updatedAt: entitlements.updated_at,
        }
      : null;

    const formattedFriendCodes = (friendCodes || []).map((fc) => ({
      code: fc.code,
      isUsed: !!fc.used_by_id,
      usedAt: fc.used_at,
      createdAt: fc.created_at,
    }));

    return NextResponse.json({
      entitlements: formattedEntitlements,
      friendCodes: formattedFriendCodes,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error("Get entitlements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
