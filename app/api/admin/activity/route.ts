import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

interface ActivityItem {
  id: string;
  type: "user_signup" | "purchase" | "completion" | "moderation" | "system";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export async function GET() {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  try {
    const activities: ActivityItem[] = [];

    // Fetch recent data from multiple sources in parallel
    const [recentUsers, recentPurchases, recentJournals, recentModeration] = await Promise.all([
      // Recent user signups (last 24 hours)
      serviceClient
        .from("users")
        .select("id, first_name, last_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent purchases
      serviceClient
        .from("purchases")
        .select("id, user_id, amount_cents, purchase_type, status, purchased_at, created_at")
        .eq("status", "completed")
        .order("purchased_at", { ascending: false })
        .limit(10),

      // Recent journal completions (proxy for challenge progress)
      serviceClient
        .from("journal_entries")
        .select("id, user_id, entry_type, day_number, created_at")
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent moderation items
      serviceClient
        .from("moderation_queue")
        .select("id, content_type, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Get user names for purchases and journals
    const userIds = new Set<string>();
    recentPurchases.data?.forEach((p) => p.user_id && userIds.add(p.user_id));
    recentJournals.data?.forEach((j) => j.user_id && userIds.add(j.user_id));

    const { data: userNames } = await serviceClient
      .from("users")
      .select("id, first_name, last_name")
      .in("id", Array.from(userIds));

    const userNameMap = new Map(
      userNames?.map((u) => [
        u.id,
        `${u.first_name || ""} ${u.last_name || ""}`.trim() || "User",
      ]) || []
    );

    // Convert to activities
    recentUsers.data?.forEach((user) => {
      activities.push({
        id: `signup-${user.id}`,
        type: "user_signup",
        title: "New User Signup",
        description: `${user.first_name || user.email?.split("@")[0] || "Someone"} joined the 45-day challenge`,
        timestamp: user.created_at,
      });
    });

    recentPurchases.data?.forEach((purchase) => {
      const userName = purchase.user_id ? userNameMap.get(purchase.user_id) : "Someone";
      const amount = (purchase.amount_cents || 0) / 100;
      activities.push({
        id: `purchase-${purchase.id}`,
        type: "purchase",
        title: "New Purchase",
        description: `$${amount.toLocaleString()} ${purchase.purchase_type} purchase by ${userName}`,
        timestamp: purchase.purchased_at || purchase.created_at,
      });
    });

    recentJournals.data?.forEach((journal) => {
      if (journal.day_number === 45) {
        const userName = journal.user_id ? userNameMap.get(journal.user_id) : "Someone";
        activities.push({
          id: `completion-${journal.id}`,
          type: "completion",
          title: "Challenge Completed",
          description: `${userName} completed Day 45!`,
          timestamp: journal.created_at,
        });
      }
    });

    recentModeration.data?.forEach((item) => {
      if (item.status === "pending") {
        activities.push({
          id: `mod-${item.id}`,
          type: "moderation",
          title: "Content Flagged",
          description: `${item.content_type} flagged for review (${item.priority} priority)`,
          timestamp: item.created_at,
        });
      }
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return top 10
    return NextResponse.json({
      success: true,
      data: activities.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
