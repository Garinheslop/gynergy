export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Use service client to bypass RLS for the increment
    const supabaseAdmin = createServiceClient();

    const { data: post } = await supabaseAdmin
      .from("community_posts")
      .select("share_count")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await supabaseAdmin
      .from("community_posts")
      .update({ share_count: (post.share_count || 0) + 1 })
      .eq("id", postId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to track share" }, { status: 500 });
  }
}
