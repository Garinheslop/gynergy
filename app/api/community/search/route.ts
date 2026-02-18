export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";
import { checkRateLimit, rateLimitHeaders, RateLimits } from "@lib/utils/rate-limit";

interface PostAuthor {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
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
}

interface CohortMembershipUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface CohortMembership {
  role: string;
  joined_at: string;
  user: CohortMembershipUser[] | CohortMembershipUser | null;
}

// GET: Search community posts and members
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { ...RateLimits.ai, prefix: "search" });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10) || 10, 30);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Get user's cohort for visibility filtering
    const { data: membership } = await supabase
      .from("cohort_memberships")
      .select("cohort_id")
      .eq("user_id", user.id)
      .single();

    const cohortId = membership?.cohort_id;

    // Search posts (title + content) with same visibility rules as feed
    // Escape SQL LIKE wildcards to prevent unintended pattern matching
    const escapedQuery = query.replaceAll("%", String.raw`\%`).replaceAll("_", String.raw`\_`);
    const searchPattern = `%${escapedQuery}%`;

    let postsQuery = supabase
      .from("community_posts")
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
      .eq("is_approved", true)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply visibility filter
    if (cohortId) {
      postsQuery = postsQuery.or(
        `visibility.eq.public,user_id.eq.${user.id},and(visibility.eq.cohort,cohort_id.eq.${cohortId})`
      );
    } else {
      postsQuery = postsQuery.or(`visibility.eq.public,user_id.eq.${user.id}`);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Search posts error:", postsError);
    }

    // Search members (first_name + last_name) within user's cohort
    let membersResults: {
      id: string;
      firstName: string;
      lastName: string;
      profileImage: string | null;
      role: string;
    }[] = [];

    if (cohortId) {
      const { data: members, error: membersError } = await supabase
        .from("cohort_memberships")
        .select(
          `
          role,
          joined_at,
          user:users!cohort_memberships_user_id_fkey(
            id,
            first_name,
            last_name,
            profile_image
          )
        `
        )
        .eq("cohort_id", cohortId)
        .limit(limit);

      if (membersError) {
        console.error("Search members error:", membersError);
      }

      // Filter members by name match (Supabase can't filter on joined table with ilike easily)
      const typedMembers = members as unknown as CohortMembership[] | null;
      const lowerQuery = query.toLowerCase();

      membersResults = (typedMembers || [])
        .filter((m) => {
          const u = Array.isArray(m.user) ? m.user[0] : m.user;
          if (!u) return false;
          const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
          return fullName.includes(lowerQuery);
        })
        .map((m) => {
          const u = Array.isArray(m.user) ? m.user[0] : m.user;
          return {
            id: u!.id,
            firstName: u!.first_name,
            lastName: u!.last_name,
            profileImage: u!.profile_image,
            role: m.role,
          };
        })
        .slice(0, limit);
    }

    // Format posts
    const typedPosts = posts as CommunityPost[] | null;
    const formattedPosts = (typedPosts || []).map((post) => ({
      id: post.id,
      userId: post.user_id,
      postType: post.post_type,
      title: post.title,
      content: post.content,
      reactionCount: post.reaction_count,
      commentCount: post.comment_count,
      createdAt: post.created_at,
      author: post.author
        ? {
            id: post.author.id,
            firstName: post.author.first_name,
            lastName: post.author.last_name,
            profileImage: post.author.profile_image,
          }
        : null,
    }));

    return NextResponse.json({
      query,
      posts: formattedPosts,
      members: membersResults,
      totalResults: formattedPosts.length + membersResults.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
