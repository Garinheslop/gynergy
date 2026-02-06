import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(_request: NextRequest) {
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
    // Fetch gamification data
    const [badgesResult, userBadgesResult, pointRulesResult, leaderboardResult, rewardsResult] =
      await Promise.all([
        // All badges
        serviceClient.from("badges").select("*").order("id", { ascending: true }),

        // Badge distribution
        serviceClient.from("user_badges").select("badge_id"),

        // Point rules/actions
        serviceClient.from("point_rules").select("*").order("id", { ascending: true }),

        // Top users for leaderboard preview
        serviceClient
          .from("user_stats")
          .select("user_id, total_points, current_streak, level")
          .order("total_points", { ascending: false })
          .limit(10),

        // Rewards/achievements
        serviceClient.from("rewards").select("*").order("points_required", { ascending: true }),
      ]);

    // Calculate badge distribution
    const badgeDistribution = new Map<string, number>();
    for (const ub of userBadgesResult.data || []) {
      const count = badgeDistribution.get(ub.badge_id) || 0;
      badgeDistribution.set(ub.badge_id, count + 1);
    }

    // Format badges with distribution
    const badges = (badgesResult.data || []).map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      requirement: badge.requirement,
      pointsAwarded: badge.points_awarded || 0,
      isActive: badge.is_active,
      earnedCount: badgeDistribution.get(badge.id) || 0,
      createdAt: badge.created_at,
    }));

    // Format point rules
    const pointRules = (pointRulesResult.data || []).map((rule) => ({
      id: rule.id,
      action: rule.action_type,
      name: rule.display_name || rule.action_type,
      description: rule.description,
      points: rule.points,
      maxPerDay: rule.max_per_day,
      isActive: rule.is_active,
    }));

    // Format rewards
    const rewards = (rewardsResult.data || []).map((reward) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type: reward.reward_type,
      pointsRequired: reward.points_required,
      isActive: reward.is_active,
      claimedCount: reward.claimed_count || 0,
    }));

    // Calculate stats
    const totalPoints = (leaderboardResult.data || []).reduce(
      (sum, u) => sum + (u.total_points || 0),
      0
    );
    const avgPoints = leaderboardResult.data?.length
      ? Math.round(totalPoints / leaderboardResult.data.length)
      : 0;

    const stats = {
      totalBadges: badges.length,
      activeBadges: badges.filter((b) => b.isActive).length,
      totalBadgesEarned: userBadgesResult.data?.length || 0,
      totalPointRules: pointRules.length,
      totalRewards: rewards.length,
      avgPointsTop10: avgPoints,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        badges,
        pointRules,
        rewards,
        leaderboardPreview: leaderboardResult.data || [],
      },
    });
  } catch (error) {
    console.error("Error fetching gamification data:", error);
    return NextResponse.json({ error: "Failed to fetch gamification data" }, { status: 500 });
  }
}

// Create or update gamification elements
export async function POST(request: NextRequest) {
  const supabase = createClient();

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
    const body = await request.json();
    const { action, entityType, data } = body;

    let result;

    switch (entityType) {
      case "badge":
        if (action === "create") {
          result = await serviceClient.from("badges").insert({
            name: data.name,
            description: data.description,
            icon: data.icon,
            category: data.category,
            requirement: data.requirement,
            points_awarded: data.pointsAwarded || 0,
            is_active: data.isActive ?? true,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("badges")
            .update({
              name: data.name,
              description: data.description,
              icon: data.icon,
              category: data.category,
              requirement: data.requirement,
              points_awarded: data.pointsAwarded,
              is_active: data.isActive,
            })
            .eq("id", data.id);
        } else if (action === "toggle") {
          result = await serviceClient
            .from("badges")
            .update({ is_active: data.isActive })
            .eq("id", data.id);
        }
        break;

      case "point_rule":
        if (action === "create") {
          result = await serviceClient.from("point_rules").insert({
            action_type: data.action,
            display_name: data.name,
            description: data.description,
            points: data.points,
            max_per_day: data.maxPerDay,
            is_active: data.isActive ?? true,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("point_rules")
            .update({
              display_name: data.name,
              description: data.description,
              points: data.points,
              max_per_day: data.maxPerDay,
              is_active: data.isActive,
            })
            .eq("id", data.id);
        }
        break;

      case "reward":
        if (action === "create") {
          result = await serviceClient.from("rewards").insert({
            name: data.name,
            description: data.description,
            reward_type: data.type,
            points_required: data.pointsRequired,
            is_active: data.isActive ?? true,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("rewards")
            .update({
              name: data.name,
              description: data.description,
              points_required: data.pointsRequired,
              is_active: data.isActive,
            })
            .eq("id", data.id);
        }
        break;

      case "grant_points": {
        // Manually grant points to a user
        const { data: currentStats } = await serviceClient
          .from("user_stats")
          .select("total_points")
          .eq("user_id", data.userId)
          .single();

        result = await serviceClient
          .from("user_stats")
          .update({
            total_points: (currentStats?.total_points || 0) + data.points,
          })
          .eq("user_id", data.userId);
        break;
      }

      case "grant_badge":
        // Manually grant a badge to a user
        result = await serviceClient.from("user_badges").insert({
          user_id: data.userId,
          badge_id: data.badgeId,
          earned_at: new Date().toISOString(),
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    if (result?.error) throw result.error;

    // Log the action
    await serviceClient.from("admin_audit_logs").insert({
      admin_id: user.id,
      action_type: action,
      action_category: "gamification",
      resource_type: entityType,
      resource_id: data.id,
      metadata: data,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error managing gamification:", error);
    return NextResponse.json({ error: "Failed to manage gamification" }, { status: 500 });
  }
}
