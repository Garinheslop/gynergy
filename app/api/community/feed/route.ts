export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// Type definitions for type safety
interface PostAuthor {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface UserReaction {
  reaction_type: string;
}

interface CommunityPost {
  id: string;
  user_id: string;
  cohort_id: string | null;
  post_type: string;
  title: string | null;
  content: string;
  media_urls: string[];
  reaction_count: number;
  comment_count: number;
  share_count: number;
  visibility: string;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: PostAuthor | null;
  user_reaction: UserReaction[] | null;
}

// GET: Fetch community feed
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const postType = searchParams.get("type");

    // Get user's active cohort
    const { data: membership } = await supabase
      .from("cohort_memberships")
      .select("cohort_id")
      .eq("user_id", user.id)
      .single();

    const cohortId = membership?.cohort_id;

    // Build query for posts
    let query = supabase
      .from("community_posts")
      .select(
        `
        *,
        author:users!community_posts_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        ),
        user_reaction:post_reactions!left(
          reaction_type
        )
      `
      )
      .eq("is_approved", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by visibility - user can see public, their own, and cohort posts if in cohort
    if (cohortId) {
      query = query.or(
        `visibility.eq.public,user_id.eq.${user.id},and(visibility.eq.cohort,cohort_id.eq.${cohortId})`
      );
    } else {
      query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
    }

    // Filter by post type if specified
    if (postType) {
      query = query.eq("post_type", postType);
    }

    // Pagination cursor
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }

    // Format response
    const typedPosts = posts as CommunityPost[] | null;
    const formattedPosts = (typedPosts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      cohortId: post.cohort_id,
      postType: post.post_type,
      title: post.title,
      content: post.content,
      mediaUrls: post.media_urls || [],
      reactionCount: post.reaction_count,
      commentCount: post.comment_count,
      shareCount: post.share_count,
      visibility: post.visibility,
      isFeatured: post.is_featured,
      isPinned: post.is_pinned,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.author
        ? {
            id: post.author.id,
            firstName: post.author.first_name,
            lastName: post.author.last_name,
            profileImage: post.author.profile_image,
          }
        : null,
      userReaction: post.user_reaction?.[0]?.reaction_type || null,
    }));

    const hasMore = typedPosts && typedPosts.length === limit;
    const nextCursor = hasMore ? typedPosts[typedPosts.length - 1]?.created_at : null;

    return NextResponse.json({
      posts: formattedPosts,
      hasMore,
      nextCursor,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Create a new post
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
    const { postType, title, content, mediaUrls, visibility, linkedJournalId, linkedBadgeId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get user's cohort
    const { data: membership } = await supabase
      .from("cohort_memberships")
      .select("cohort_id")
      .eq("user_id", user.id)
      .single();

    // Create post
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        cohort_id: membership?.cohort_id || null,
        post_type: postType || "win",
        title: title || null,
        content: content.trim(),
        media_urls: mediaUrls || [],
        visibility: visibility || "cohort",
        linked_journal_id: linkedJournalId || null,
        linked_badge_id: linkedBadgeId || null,
      })
      .select(
        `
        *,
        author:users!community_posts_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    // Award points for sharing a win
    if (postType === "win") {
      await supabase.from("points_transactions").insert({
        user_id: user.id,
        points: 10,
        action_type: "community_post",
        description: "Shared a win with the community",
      });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        userId: post.user_id,
        cohortId: post.cohort_id,
        postType: post.post_type,
        title: post.title,
        content: post.content,
        mediaUrls: post.media_urls || [],
        reactionCount: post.reaction_count,
        commentCount: post.comment_count,
        shareCount: post.share_count,
        visibility: post.visibility,
        isFeatured: post.is_featured,
        isPinned: post.is_pinned,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: post.author
          ? {
              id: post.author.id,
              firstName: post.author.first_name,
              lastName: post.author.last_name,
              profileImage: post.author.profile_image,
            }
          : null,
        userReaction: null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
