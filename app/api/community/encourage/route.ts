export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// POST: Send encouragement to a member
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
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Can't encourage yourself
    if (memberId === user.id) {
      return NextResponse.json({ error: "Cannot encourage yourself" }, { status: 400 });
    }

    // Check rate limit (3 encouragements per day to the same user)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: encouragementCount } = await supabase
      .from("encouragements")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("receiver_id", memberId)
      .gte("created_at", today.toISOString());

    if (encouragementCount && encouragementCount >= 3) {
      return NextResponse.json(
        { error: "You've already sent 3 encouragements to this person today" },
        { status: 429 }
      );
    }

    // Get sender's info
    const { data: sender } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    // Get receiver's info
    const { data: receiver } = await supabase
      .from("users")
      .select("id, first_name")
      .eq("id", memberId)
      .single();

    if (!receiver) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Create encouragement record
    const { error: encouragementError } = await supabase.from("encouragements").insert({
      sender_id: user.id,
      receiver_id: memberId,
    });

    if (encouragementError) {
      console.error("Error creating encouragement:", encouragementError);
      return NextResponse.json({ error: "Failed to send encouragement" }, { status: 500 });
    }

    // Award points to sender for being encouraging
    await supabase.from("points_transactions").insert({
      user_id: user.id,
      points: 5,
      action_type: "send_encouragement",
      description: `Sent encouragement to ${receiver.first_name}`,
    });

    // Create notification for receiver
    await supabase.from("notifications").insert({
      user_id: memberId,
      type: "encouragement",
      title: "You received encouragement!",
      message: `${sender?.first_name || "Someone"} sent you encouragement. Keep going!`,
      data: { senderId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: `Encouragement sent to ${receiver.first_name}!`,
    });
  } catch (error) {
    console.error("Encouragement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
