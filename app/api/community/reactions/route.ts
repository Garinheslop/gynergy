export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// POST: Add reaction to a post
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
    const { postId, reactionType } = body;

    if (!postId || !reactionType) {
      return NextResponse.json({ error: "Post ID and reaction type required" }, { status: 400 });
    }

    const validReactions = ["cheer", "fire", "heart", "celebrate", "inspire", "support"];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if user already reacted (upsert)
    const { data: existing } = await supabase
      .from("post_reactions")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Update existing reaction if different
      if (existing.reaction_type === reactionType) {
        return NextResponse.json({ reaction: { type: reactionType, action: "unchanged" } });
      }

      const { error } = await supabase
        .from("post_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existing.id);

      if (error) {
        console.error("Error updating reaction:", error);
        return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
      }

      return NextResponse.json({ reaction: { type: reactionType, action: "updated" } });
    }

    // Create new reaction
    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    });

    if (error) {
      console.error("Error adding reaction:", error);
      return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
    }

    return NextResponse.json({ reaction: { type: reactionType, action: "added" } });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove reaction from a post
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing reaction:", error);
      return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
