import { NextRequest, NextResponse } from "next/server";

import { createAuditLog, getCategoryFromAction, AuditAction } from "@lib/services/auditLog";
import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(request: NextRequest) {
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
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "pending";
  const contentType = searchParams.get("contentType") || "all";

  try {
    // Build the moderation queue query
    let query = serviceClient
      .from("moderation_queue")
      .select(
        `
        id,
        content_type,
        content_id,
        content_preview,
        reported_by,
        report_reason,
        priority,
        status,
        ai_risk_score,
        ai_risk_factors,
        ai_recommendation,
        created_at,
        resolved_by,
        resolved_at,
        resolution_note
      `
      )
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (contentType !== "all") {
      query = query.eq("content_type", contentType);
    }

    const { data: moderationQueue, error } = await query.limit(50);

    if (error) {
      // If moderation_queue table doesn't exist, return empty data
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          data: {
            queue: [],
            stats: {
              pending: 0,
              inReview: 0,
              approved: 0,
              rejected: 0,
              escalated: 0,
            },
          },
        });
      }
      throw error;
    }

    // Get stats
    const [pendingCount, inReviewCount, approvedCount, rejectedCount, escalatedCount] =
      await Promise.all([
        serviceClient
          .from("moderation_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        serviceClient
          .from("moderation_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "in_review"),
        serviceClient
          .from("moderation_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),
        serviceClient
          .from("moderation_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
        serviceClient
          .from("moderation_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "escalated"),
      ]);

    // Get recent community activity for context
    const [recentPosts, recentComments] = await Promise.all([
      serviceClient
        .from("posts")
        .select("id, content, created_at, user_id, is_flagged")
        .order("created_at", { ascending: false })
        .limit(10),
      serviceClient
        .from("comments")
        .select("id, content, created_at, user_id, is_flagged")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Count flagged content
    const flaggedPosts = recentPosts.data?.filter((p) => p.is_flagged).length || 0;
    const flaggedComments = recentComments.data?.filter((c) => c.is_flagged).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        queue: moderationQueue || [],
        stats: {
          pending: pendingCount.count || 0,
          inReview: inReviewCount.count || 0,
          approved: approvedCount.count || 0,
          rejected: rejectedCount.count || 0,
          escalated: escalatedCount.count || 0,
        },
        recentActivity: {
          posts: recentPosts.data || [],
          comments: recentComments.data || [],
          flaggedPosts,
          flaggedComments,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching moderation data:", error);
    return NextResponse.json({ error: "Failed to fetch moderation data" }, { status: 500 });
  }
}

// Handle moderation actions
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { itemId, action, note } = body;

    if (!itemId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validActions = ["approve", "reject", "escalate", "start_review"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      escalate: "escalated",
      start_review: "in_review",
    };

    const updateData: Record<string, unknown> = {
      status: statusMap[action],
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    };

    if (note) {
      updateData.resolution_note = note;
    }

    // If starting review, don't mark as resolved
    if (action === "start_review") {
      delete updateData.resolved_by;
      delete updateData.resolved_at;
    }

    // Get item details before update for audit
    const { data: itemBefore } = await serviceClient
      .from("moderation_queue")
      .select("*")
      .eq("id", itemId)
      .single();

    const { error } = await serviceClient
      .from("moderation_queue")
      .update(updateData)
      .eq("id", itemId);

    if (error) throw error;

    // If rejected, also handle the underlying content
    if (action === "reject") {
      const { data: item } = await serviceClient
        .from("moderation_queue")
        .select("content_type, content_id")
        .eq("id", itemId)
        .single();

      if (item) {
        // Flag or hide the content based on type
        if (item.content_type === "post") {
          await serviceClient.from("posts").update({ is_hidden: true }).eq("id", item.content_id);
        } else if (item.content_type === "comment") {
          await serviceClient
            .from("comments")
            .update({ is_hidden: true })
            .eq("id", item.content_id);
        }
      }
    }

    // Log audit entry
    const auditActionMap: Record<string, AuditAction> = {
      approve: "moderation.approve",
      reject: "moderation.reject",
      escalate: "moderation.escalate",
      start_review: "moderation.approve", // Using approve as closest match
    };
    const auditAction = auditActionMap[action] || "moderation.approve";

    await createAuditLog(supabase, {
      adminId: user.id,
      action: auditAction,
      category: getCategoryFromAction(auditAction),
      resourceType: itemBefore?.content_type || "moderation_item",
      resourceId: itemId,
      previousState: itemBefore || undefined,
      newState: updateData,
      metadata: { moderationAction: action, note },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Item ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error processing moderation action:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
