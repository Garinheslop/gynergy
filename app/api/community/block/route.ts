export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: List users blocked by the current user
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: blocks, error } = await supabase
    .from("user_blocks")
    .select(
      `
      id,
      blocked_id,
      created_at,
      blocked_user:users!user_blocks_blocked_id_fkey(
        id,
        first_name,
        last_name,
        profile_image
      )
    `
    )
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
  }

  const formattedBlocks = (blocks || []).map((block) => {
    const rawUser = block.blocked_user as unknown;
    const blockedUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    const user = blockedUser as
      | {
          id: string;
          first_name: string;
          last_name: string;
          profile_image: string | null;
        }
      | undefined;
    return {
      id: block.id,
      blockedUserId: block.blocked_id,
      createdAt: block.created_at,
      blockedUser: user
        ? {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            profileImage: user.profile_image,
          }
        : null,
    };
  });

  return NextResponse.json({ blocks: formattedBlocks });
}

// POST: Block a user
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId: blockedUserId } = body;

    if (!blockedUserId || typeof blockedUserId !== "string") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Validate UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(blockedUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (blockedUserId === user.id) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", blockedUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create block (upsert to handle race conditions)
    const { error: blockError } = await supabase.from("user_blocks").upsert(
      {
        blocker_id: user.id,
        blocked_id: blockedUserId,
      },
      { onConflict: "blocker_id,blocked_id" }
    );

    if (blockError) {
      console.error("Failed to block user:", blockError);
      return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Unblock a user
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get("userId");

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!blockedUserId || !UUID_RE.test(blockedUserId)) {
      return NextResponse.json({ error: "Valid user ID is required" }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedUserId);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
