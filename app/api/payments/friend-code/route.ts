import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

// GET: Get user's friend codes
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get friend codes created by this user
    const { data: friendCodes, error } = await supabase
      .from("friend_codes")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching friend codes:", error);
      return NextResponse.json({ error: "Failed to fetch friend codes" }, { status: 500 });
    }

    return NextResponse.json({ friendCodes });
  } catch (error) {
    console.error("Get friend codes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Redeem a friend code
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Friend code is required" }, { status: 400 });
    }

    // Use service client for RPC call (needs elevated permissions)
    const serviceSupabase = createServiceClient();

    // Call the redeem_friend_code function
    const { data, error } = await serviceSupabase.rpc("redeem_friend_code", {
      p_code: code.toUpperCase().trim(),
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error redeeming friend code:", error);
      return NextResponse.json({ error: "Failed to redeem friend code" }, { status: 500 });
    }

    // The function returns JSONB with success, message/error
    const result = data as { success: boolean; message?: string; error?: string };

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid friend code" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Redeem friend code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Validate friend code without redeeming (for UI feedback)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Friend code is required" }, { status: 400 });
    }

    const supabase = createClient();

    // Check if code exists and is valid
    const { data: friendCode, error } = await supabase
      .from("friend_codes")
      .select("id, is_active, used_by_id, expires_at, creator_id")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !friendCode) {
      return NextResponse.json({
        valid: false,
        reason: "Code not found",
      });
    }

    if (!friendCode.is_active) {
      return NextResponse.json({
        valid: false,
        reason: "Code is no longer active",
      });
    }

    if (friendCode.used_by_id) {
      return NextResponse.json({
        valid: false,
        reason: "Code has already been used",
      });
    }

    if (friendCode.expires_at && new Date(friendCode.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: "Code has expired",
      });
    }

    return NextResponse.json({
      valid: true,
      message: "Valid friend code! Sign up to redeem.",
    });
  } catch (error) {
    console.error("Validate friend code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
