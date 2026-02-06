import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
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
  const userId = params.id;

  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch additional data in parallel
    const [
      statsResult,
      progressResult,
      purchasesResult,
      badgesResult,
      activityResult,
      accessResult,
    ] = await Promise.all([
      // User stats
      serviceClient.from("user_stats").select("*").eq("user_id", userId).single(),

      // Challenge progress
      serviceClient
        .from("challenge_progress")
        .select("day_number, completed_at")
        .eq("user_id", userId)
        .order("day_number", { ascending: true }),

      // Purchase history
      serviceClient
        .from("purchases")
        .select("id, purchase_type, amount_cents, status, purchased_at")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false })
        .limit(10),

      // Badges earned
      serviceClient
        .from("user_badges")
        .select("id, badge_id, earned_at, badges(name, icon)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),

      // Recent activity (from multiple tables)
      Promise.all([
        serviceClient
          .from("journal_entries")
          .select("id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        serviceClient
          .from("reflections")
          .select("id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        serviceClient
          .from("posts")
          .select("id, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]),

      // Challenge access
      serviceClient
        .from("challenge_access")
        .select("access_type, granted_at")
        .eq("user_id", userId)
        .single(),
    ]);

    // Process challenge progress
    const completedDays = progressResult.data?.filter((p) => p.completed_at).length || 0;
    const currentDay = progressResult.data?.length || 0;
    const totalDays = 45; // 45-day challenge
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    // Combine and sort activities
    const [journals, reflections, posts] = activityResult;
    const activities = [
      ...(journals.data || []).map((j) => ({
        id: j.id,
        type: "journal" as const,
        title: "Wrote journal entry",
        timestamp: j.created_at,
      })),
      ...(reflections.data || []).map((r) => ({
        id: r.id,
        type: "reflection" as const,
        title: "Completed reflection",
        timestamp: r.created_at,
      })),
      ...(posts.data || []).map((p) => ({
        id: p.id,
        type: "post" as const,
        title: "Posted in community",
        description: p.content?.slice(0, 50) + (p.content?.length > 50 ? "..." : ""),
        timestamp: p.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Format badges
    const badges = (badgesResult.data || []).map((b) => {
      const badgeData = b.badges as { name?: string; icon?: string } | null;
      return {
        id: b.id,
        name: badgeData?.name || "Badge",
        icon: badgeData?.icon || "gng-award",
        earnedAt: b.earned_at,
      };
    });

    // Format purchases
    const purchases = (purchasesResult.data || []).map((p) => ({
      id: p.id,
      type: p.purchase_type,
      amount: p.amount_cents || 0,
      status: p.status,
      date: p.purchased_at,
    }));

    const userDetail = {
      id: profile.id,
      email: profile.email || "",
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      fullName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
      profileImage: profile.profile_image_path,
      isAnonymous: profile.is_anonymous || false,
      hasChallengeAccess: !!accessResult.data,
      accessType: accessResult.data?.access_type,
      hasCommunityAccess: true, // Default for now
      totalPoints: statsResult.data?.total_points || 0,
      currentStreak: statsResult.data?.current_streak || 0,
      longestStreak: statsResult.data?.longest_streak || 0,
      level: statsResult.data?.level || 1,
      createdAt: profile.created_at,
      lastActiveAt: statsResult.data?.last_active_at,
      challengeProgress: {
        currentDay,
        completedDays,
        totalDays,
        completionRate,
      },
      recentActivity: activities.slice(0, 10),
      purchases,
      badges,
    };

    return NextResponse.json({
      success: true,
      data: userDetail,
    });
  } catch (error) {
    console.error("Error fetching user detail:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// Handle user actions
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
  const userId = params.id;

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "grant_access":
        await serviceClient.from("challenge_access").upsert({
          user_id: userId,
          access_type: data?.accessType || "admin_granted",
          granted_at: new Date().toISOString(),
          granted_by: user.id,
        });
        break;

      case "revoke_access":
        await serviceClient.from("challenge_access").delete().eq("user_id", userId);
        break;

      case "reset_streak":
        await serviceClient.from("user_stats").update({ current_streak: 0 }).eq("user_id", userId);
        break;

      case "add_points": {
        const points = data?.points || 100;
        const { data: currentStats } = await serviceClient
          .from("user_stats")
          .select("total_points")
          .eq("user_id", userId)
          .single();

        await serviceClient
          .from("user_stats")
          .update({ total_points: (currentStats?.total_points || 0) + points })
          .eq("user_id", userId);
        break;
      }

      case "suspend":
        await serviceClient
          .from("profiles")
          .update({ is_suspended: true, suspended_at: new Date().toISOString() })
          .eq("id", userId);
        break;

      case "unsuspend":
        await serviceClient
          .from("profiles")
          .update({ is_suspended: false, suspended_at: null })
          .eq("id", userId);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log the admin action
    await serviceClient.from("admin_audit_logs").insert({
      admin_id: user.id,
      action_type: action,
      action_category: "user_management",
      resource_type: "user",
      resource_id: userId,
      metadata: data,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
    });
  } catch (error) {
    console.error("Error performing user action:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
