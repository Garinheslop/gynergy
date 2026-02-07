import { NextRequest, NextResponse } from "next/server";

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

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50"), 100);
    const actionType = searchParams.get("actionType");
    const actionCategory = searchParams.get("actionCategory");
    const resourceType = searchParams.get("resourceType");
    const adminId = searchParams.get("adminId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build query
    let query = serviceClient
      .from("admin_audit_logs")
      .select(
        `
        id,
        admin_id,
        action_type,
        action_category,
        resource_type,
        resource_id,
        previous_state,
        new_state,
        metadata,
        ip_address,
        status,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters
    if (actionType) {
      query = query.eq("action_type", actionType);
    }

    if (actionCategory) {
      query = query.eq("action_category", actionCategory);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (search) {
      // Search across resource_type and metadata (as text)
      query = query.or(
        `resource_type.ilike.%${search}%,metadata->>'description'.ilike.%${search}%`
      );
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }

    // Get admin user emails for display
    const adminIdSet = new Set<string>();
    logs?.forEach((log) => {
      if (log.admin_id) adminIdSet.add(log.admin_id);
    });
    const adminIds = Array.from(adminIdSet);

    const { data: adminUsers } = await serviceClient
      .from("users")
      .select("id, email")
      .in("id", adminIds);

    const adminEmailMap = new Map(adminUsers?.map((u) => [u.id, u.email]) || []);

    // Transform logs with admin emails
    const transformedLogs = logs?.map((log) => ({
      id: log.id,
      adminId: log.admin_id,
      adminEmail: adminEmailMap.get(log.admin_id) || undefined,
      actionType: log.action_type,
      actionCategory: log.action_category,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      previousState: log.previous_state,
      newState: log.new_state,
      metadata: log.metadata,
      ipAddress: log.ip_address,
      status: log.status,
      createdAt: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedLogs || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

// POST: Create a new audit log entry
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

  try {
    const body = await request.json();

    const {
      actionType,
      actionCategory,
      resourceType,
      resourceId,
      previousState,
      newState,
      metadata,
      status = "success",
    } = body;

    // Validate required fields
    if (!actionType || !actionCategory || !resourceType) {
      return NextResponse.json(
        { error: "Missing required fields: actionType, actionCategory, resourceType" },
        { status: 400 }
      );
    }

    // Get client IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    // Get user agent
    const userAgent = request.headers.get("user-agent");

    const serviceClient = createServiceClient();

    const { data: log, error } = await serviceClient
      .from("admin_audit_logs")
      .insert({
        admin_id: user.id,
        action_type: actionType,
        action_category: actionCategory,
        resource_type: resourceType,
        resource_id: resourceId || null,
        previous_state: previousState || null,
        new_state: newState || null,
        metadata: metadata || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audit log:", error);
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: log.id,
        adminId: log.admin_id,
        actionType: log.action_type,
        actionCategory: log.action_category,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        status: log.status,
        createdAt: log.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 });
  }
}
