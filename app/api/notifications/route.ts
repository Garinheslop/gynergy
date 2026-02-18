export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: Fetch notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);
    const cursor = searchParams.get("cursor");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let query = supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    // Filter out expired notifications
    query = query.or("expires_at.is.null,expires_at.gt.now()");

    const { data: notifications, error } = await query;

    if (error) {
      // Table/schema may not exist yet — return empty instead of 500
      // 42P01 = undefined table, 42703 = undefined column, PGRST = PostgREST schema errors
      const isSchemaError =
        error.code === "42P01" ||
        error.code === "42703" ||
        (typeof error.code === "string" && error.code.startsWith("PGRST"));
      if (isSchemaError) {
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
          hasMore: false,
          nextCursor: null,
        });
      }
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("user_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .or("expires_at.is.null,expires_at.gt.now()");

    const formattedNotifications = (notifications || []).map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      icon: n.icon,
      actionType: n.action_type,
      actionData: n.action_data,
      isRead: n.is_read,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));

    const hasMore = notifications && notifications.length === limit;
    const nextCursor = hasMore ? notifications[notifications.length - 1]?.created_at : null;

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount: unreadCount || 0,
      hasMore,
      nextCursor,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Mark all as read
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications read:", error);
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "marked_all_read" });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID or markAll required" }, { status: 400 });
    }

    // Mark single notification as read
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking notification read:", error);
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "marked_read" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
