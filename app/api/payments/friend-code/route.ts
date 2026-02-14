export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { sendFriendCodeRedeemedEmail } from "@lib/email";
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

    // Get friend codes created by this user with redeemer info
    const { data: friendCodes, error } = await supabase
      .from("friend_codes")
      .select(
        `
        *,
        used_by:users!friend_codes_used_by_id_fkey(id, first_name, last_name)
      `
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching friend codes:", error);
      return NextResponse.json({ error: "Failed to fetch friend codes" }, { status: 500 });
    }

    // Compute status for each code
    const codesWithStatus = (friendCodes || []).map((code) => {
      let status: "active" | "used" | "expired" | "revoked" = "active";
      if (!code.is_active) {
        status = "revoked";
      } else if (code.used_by_id) {
        status = "used";
      } else if (code.expires_at && new Date(code.expires_at) < new Date()) {
        status = "expired";
      }
      return { ...code, status };
    });

    return NextResponse.json({ friendCodes: codesWithStatus });
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

    const normalizedCode = code.toUpperCase().trim();

    // Get friend code details before redemption for notification
    const { data: friendCode } = await supabase
      .from("friend_codes")
      .select(
        `
        id,
        creator_id,
        creator:users!friend_codes_creator_id_fkey(id, email, first_name)
      `
      )
      .eq("code", normalizedCode)
      .single();

    // Use service client for RPC call (needs elevated permissions)
    const serviceSupabase = createServiceClient();

    // Call the redeem_friend_code function
    const { data, error } = await serviceSupabase.rpc("redeem_friend_code", {
      p_code: normalizedCode,
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

    // Send notification email to code creator
    if (friendCode?.creator) {
      // Cast through unknown since Supabase types the relation as array but it's actually a single object
      const creator = friendCode.creator as unknown as {
        id: string;
        email: string;
        first_name: string;
      };

      // Get redeemer's name
      const { data: redeemer } = await supabase
        .from("users")
        .select("first_name")
        .eq("id", user.id)
        .single();

      const redeemerFirstName = redeemer?.first_name || "Someone";

      // Send notification (fire and forget - don't block the response)
      sendFriendCodeRedeemedEmail({
        to: creator.email,
        creatorFirstName: creator.first_name || "Friend",
        redeemerFirstName,
        code: normalizedCode,
      }).catch((err: unknown) => {
        console.error("Failed to send friend code redeemed email:", err);
      });
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

// DELETE: Revoke a friend code (deactivate it)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const codeId = url.searchParams.get("codeId");
    const code = url.searchParams.get("code");

    if (!codeId && !code) {
      return NextResponse.json({ error: "Code ID or code is required" }, { status: 400 });
    }

    // Build query to find the code
    let query = supabase.from("friend_codes").select("id, code, creator_id, used_by_id, is_active");

    if (codeId) {
      query = query.eq("id", codeId);
    } else if (code) {
      query = query.eq("code", code.toUpperCase().trim());
    }

    const { data: friendCode, error: fetchError } = await query.single();

    if (fetchError || !friendCode) {
      return NextResponse.json({ error: "Friend code not found" }, { status: 404 });
    }

    // Verify ownership - only the creator can revoke
    if (friendCode.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only revoke your own friend codes" },
        { status: 403 }
      );
    }

    // Check if already used
    if (friendCode.used_by_id) {
      return NextResponse.json(
        { error: "Cannot revoke a code that has already been used" },
        { status: 400 }
      );
    }

    // Check if already revoked
    if (!friendCode.is_active) {
      return NextResponse.json({ error: "This code has already been revoked" }, { status: 400 });
    }

    // Revoke the code by setting is_active to false
    const { error: updateError } = await supabase
      .from("friend_codes")
      .update({ is_active: false })
      .eq("id", friendCode.id);

    if (updateError) {
      console.error("Error revoking friend code:", updateError);
      return NextResponse.json({ error: "Failed to revoke friend code" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Friend code ${friendCode.code} has been revoked`,
      code: friendCode.code,
    });
  } catch (error) {
    console.error("Revoke friend code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
