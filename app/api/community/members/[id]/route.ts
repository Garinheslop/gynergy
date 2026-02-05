export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: Fetch a specific member's profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Fetch member profile
    const { data: memberData, error: memberError } = await supabase
      .from("users")
      .select(
        `
        id,
        first_name,
        last_name,
        profile_image,
        bio,
        location
      `
      )
      .eq("id", memberId)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get member's cohort
    const { data: membership } = await supabase
      .from("cohort_memberships")
      .select(
        `
        role,
        cohort:cohorts(
          id,
          name,
          slug
        )
      `
      )
      .eq("user_id", memberId)
      .single();

    // Get member's stats from session enrollments
    const { data: enrollment } = await supabase
      .from("session_enrollments")
      .select("total_points, morning_streak, evening_streak, gratitude_streak")
      .eq("user_id", memberId)
      .single();

    const maxStreak = Math.max(
      enrollment?.morning_streak || 0,
      enrollment?.evening_streak || 0,
      enrollment?.gratitude_streak || 0
    );

    // Get user's privacy settings
    const { data: privacySettings } = await supabase
      .from("user_privacy_settings")
      .select("show_streak, show_points, show_badges")
      .eq("user_id", memberId)
      .single();

    // Get badge count
    const { count: badgesCount } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId);

    // Get post count
    const { count: postsCount } = await supabase
      .from("community_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", memberId);

    // Fetch member's recent posts
    const { data: posts } = await supabase
      .from("community_posts")
      .select(
        `
        id,
        post_type,
        title,
        content,
        created_at,
        is_anonymous
      `
      )
      .eq("user_id", memberId)
      .eq("is_anonymous", false)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get reaction and comment counts for posts
    const postIds = posts?.map((p) => p.id) || [];

    const { data: reactionCounts } = await supabase
      .from("post_reactions")
      .select("post_id")
      .in("post_id", postIds);

    const { data: commentCounts } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);

    const reactionCountMap = new Map<string, number>();
    const commentCountMap = new Map<string, number>();

    reactionCounts?.forEach((r) => {
      reactionCountMap.set(r.post_id, (reactionCountMap.get(r.post_id) || 0) + 1);
    });

    commentCounts?.forEach((c) => {
      commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1);
    });

    // Format posts
    const formattedPosts = (posts || []).map((post) => ({
      id: post.id,
      postType: post.post_type,
      title: post.title,
      content: post.content,
      createdAt: post.created_at,
      reactionCount: reactionCountMap.get(post.id) || 0,
      commentCount: commentCountMap.get(post.id) || 0,
    }));

    // Format member profile
    const member = {
      id: memberData.id,
      firstName: memberData.first_name,
      lastName: memberData.last_name,
      profileImage: memberData.profile_image,
      bio: memberData.bio,
      location: memberData.location,
      cohort: membership?.cohort
        ? {
            id: (membership.cohort as any).id,
            name: (membership.cohort as any).name,
            slug: (membership.cohort as any).slug,
          }
        : null,
      role: membership?.role || "member",
      streak: maxStreak,
      points: enrollment?.total_points || 0,
      badgesCount: badgesCount || 0,
      postsCount: postsCount || 0,
      // Privacy settings
      showStreak: privacySettings?.show_streak ?? true,
      showPoints: privacySettings?.show_points ?? true,
      showBadges: privacySettings?.show_badges ?? true,
    };

    return NextResponse.json({
      member,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error("Member profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
