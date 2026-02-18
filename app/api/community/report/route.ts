export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { checkStrictRateLimit, getRateLimitHeaders } from "@lib/rate-limit";
import { createClient, createServiceClient } from "@lib/supabase-server";

const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "inappropriate_content",
  "self_harm",
  "other",
] as const;

const CONTENT_TYPES = ["post", "comment"] as const;

// POST: Submit a content report
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP (prevent report flooding)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkStrictRateLimit(`report:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contentType, contentId, reason, details } = body;

    // Validate content type
    if (!contentType || !CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type. Must be 'post' or 'comment'" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    // Validate content ID
    if (!contentId) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
    }

    // Verify the content exists and get a preview
    let contentPreview = "";
    if (contentType === "post") {
      const { data: post, error: postError } = await supabase
        .from("community_posts")
        .select("content, user_id")
        .eq("id", contentId)
        .single();

      if (postError || !post) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      // Prevent self-reporting
      if (post.user_id === user.id) {
        return NextResponse.json({ error: "You cannot report your own content" }, { status: 400 });
      }

      contentPreview = post.content.substring(0, 200);
    } else {
      const { data: comment, error: commentError } = await supabase
        .from("post_comments")
        .select("content, user_id")
        .eq("id", contentId)
        .single();

      if (commentError || !comment) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }

      if (comment.user_id === user.id) {
        return NextResponse.json({ error: "You cannot report your own content" }, { status: 400 });
      }

      contentPreview = comment.content.substring(0, 200);
    }

    // Check for duplicate reports from same user
    const serviceClient = createServiceClient();
    const { data: existingReport } = await serviceClient
      .from("moderation_queue")
      .select("id")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("reported_by", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this content" },
        { status: 409 }
      );
    }

    // Determine priority based on reason
    let priority: "low" | "normal" | "high" | "urgent" = "normal";
    if (reason === "self_harm") {
      priority = "urgent";
    } else if (reason === "harassment" || reason === "hate_speech") {
      priority = "high";
    }

    // Build report reason text
    const reasonLabels: Record<string, string> = {
      spam: "Spam or misleading",
      harassment: "Harassment or bullying",
      hate_speech: "Hate speech",
      misinformation: "Misinformation",
      inappropriate_content: "Inappropriate content",
      self_harm: "Self-harm or dangerous behavior",
      other: "Other",
    };

    const reportReason = details
      ? `${reasonLabels[reason]}: ${details.trim().substring(0, 500)}`
      : reasonLabels[reason];

    // Insert into moderation queue using service client (bypasses admin-only RLS)
    const { error: insertError } = await serviceClient.from("moderation_queue").insert({
      content_type: contentType,
      content_id: contentId,
      content_preview: contentPreview,
      reported_by: user.id,
      report_reason: reportReason,
      priority,
      status: "pending",
    });

    if (insertError) {
      console.error("Failed to submit report:", insertError);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    // Increment reported_count on the content (best-effort, non-blocking)
    if (contentType === "post") {
      try {
        await supabase.rpc("increment_reported_count", { post_id: contentId });
      } catch {
        /* best-effort */
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
