export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

// Type definitions for type safety
interface CommentAuthor {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface CommentReply {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author: CommentAuthor | null;
  replies: CommentReply[];
}

// GET: Fetch comments for a post
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
    const postId = searchParams.get("postId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Fetch blocked user IDs (bidirectional) for filtering
    const serviceClient = createServiceClient();
    const { data: blockedRows } = await serviceClient.rpc("get_blocked_user_ids", {
      uid: user.id,
    });
    const blockedUserIds: string[] = blockedRows || [];

    // Build query for comments (top-level only, replies are nested)
    let query = supabase
      .from("post_comments")
      .select(
        `
        *,
        author:users!post_comments_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        ),
        replies:post_comments!parent_id(
          *,
          author:users!post_comments_user_id_fkey(
            id,
            first_name,
            last_name,
            profile_image
          )
        )
      `
      )
      .eq("post_id", postId)
      .is("parent_id", null) // Only top-level comments
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter out blocked users (bidirectional)
    if (blockedUserIds.length > 0) {
      query = query.not("user_id", "in", `(${blockedUserIds.join(",")})`);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: comments, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    // Format response
    const typedComments = comments as PostComment[] | null;
    const formattedComments = (typedComments || []).map((comment) => ({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      parentId: comment.parent_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.author
        ? {
            id: comment.author.id,
            firstName: comment.author.first_name,
            lastName: comment.author.last_name,
            profileImage: comment.author.profile_image,
          }
        : null,
      replies: (comment.replies || [])
        .filter((reply) => !blockedUserIds.includes(reply.user_id))
        .map((reply) => ({
          id: reply.id,
          postId: reply.post_id,
          userId: reply.user_id,
          parentId: reply.parent_id,
          content: reply.content,
          createdAt: reply.created_at,
          updatedAt: reply.updated_at,
          author: reply.author
            ? {
                id: reply.author.id,
                firstName: reply.author.first_name,
                lastName: reply.author.last_name,
                profileImage: reply.author.profile_image,
              }
            : null,
        })),
    }));

    const hasMore = typedComments && typedComments.length === limit;
    const nextCursor = hasMore ? typedComments[typedComments.length - 1]?.created_at : null;

    return NextResponse.json({
      comments: formattedComments,
      hasMore,
      nextCursor,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Create a new comment or reply
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
    const { postId, content, parentId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify post exists
    const { data: post } = await supabase
      .from("community_posts")
      .select("id, user_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const { data: parentComment } = await supabase
        .from("post_comments")
        .select("id")
        .eq("id", parentId)
        .eq("post_id", postId)
        .single();

      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim(),
      })
      .select(
        `
        *,
        author:users!post_comments_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    // Increment comment count on the post
    await supabase.rpc("increment_comment_count", { p_post_id: postId });

    // Award points for engagement (if not commenting on own post)
    if (post.user_id !== user.id) {
      await supabase.from("points_transactions").insert({
        user_id: user.id,
        points: 5,
        action_type: "community_comment",
        description: "Commented on a community post",
      });

      // Notify post author
      await supabase.from("user_notifications").insert({
        user_id: post.user_id,
        category: "social",
        title: "New comment on your post",
        body: `Someone commented on your post`,
        action_type: "navigate",
        action_data: { route: `/community/post/${postId}`, postId, commentId: comment.id },
      });
    }

    return NextResponse.json({
      comment: {
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: comment.author
          ? {
              id: comment.author.id,
              firstName: comment.author.first_name,
              lastName: comment.author.last_name,
              profileImage: comment.author.profile_image,
            }
          : null,
        replies: [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    // Verify comment exists and belongs to user
    const { data: comment } = await supabase
      .from("post_comments")
      .select("id, user_id, post_id")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    // Delete comment (and cascading replies)
    const { error } = await supabase.from("post_comments").delete().eq("id", commentId);

    if (error) {
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    // Decrement comment count on the post
    await supabase.rpc("decrement_comment_count", { p_post_id: comment.post_id });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
