import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(request: NextRequest) {
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
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  try {
    let query = serviceClient.from("users").select(
      `
        id,
        supabase_id,
        first_name,
        last_name,
        email,
        profile_image,
        is_anonymous,
        created_at,
        updated_at,
        user_entitlements (
          has_challenge_access,
          challenge_access_type,
          has_community_access
        ),
        user_gamification (
          total_points,
          current_streak,
          level
        )
      `,
      { count: "exact" }
    );

    // Apply search filter
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Apply status filter
    if (status === "active") {
      query = query.eq("is_anonymous", false);
    } else if (status === "anonymous") {
      query = query.eq("is_anonymous", true);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: users,
      count,
      error,
    } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) throw error;

    // Transform data
    const transformedUsers = users?.map((u) => ({
      id: u.id,
      email: u.email || "No email",
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      fullName: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Anonymous",
      profileImage: u.profile_image,
      isAnonymous: u.is_anonymous,
      hasChallengeAccess: u.user_entitlements?.[0]?.has_challenge_access || false,
      accessType: u.user_entitlements?.[0]?.challenge_access_type || null,
      hasCommunityAccess: u.user_entitlements?.[0]?.has_community_access || false,
      totalPoints: u.user_gamification?.[0]?.total_points || 0,
      currentStreak: u.user_gamification?.[0]?.current_streak || 0,
      level: u.user_gamification?.[0]?.level || 1,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Get single user details
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

  const body = await request.json();
  const { action, userId, data } = body;

  const serviceClient = createServiceClient();

  try {
    switch (action) {
      case "getDetails": {
        const { data: userDetails, error } = await serviceClient
          .from("users")
          .select(
            `
            *,
            user_entitlements (*),
            user_gamification (*),
            purchases (id, amount_cents, status, purchase_type, purchased_at),
            journal_entries (id, entry_type, day_number, created_at)
          `
          )
          .eq("id", userId)
          .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data: userDetails });
      }

      case "updateUser": {
        const { error } = await serviceClient.from("users").update(data).eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "User updated" });
      }

      case "grantAccess": {
        const { error } = await serviceClient.from("user_entitlements").upsert({
          user_id: userId,
          has_challenge_access: true,
          challenge_access_type: "admin_granted",
          challenge_access_granted_at: new Date().toISOString(),
        });

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Access granted" });
      }

      case "revokeAccess": {
        const { error } = await serviceClient
          .from("user_entitlements")
          .update({
            has_challenge_access: false,
            challenge_access_type: null,
          })
          .eq("user_id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Access revoked" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("User action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
