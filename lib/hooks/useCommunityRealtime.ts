"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import { createClient } from "@lib/supabase-client";
import { CommunityPost } from "@resources/types/community";
import { useDispatch } from "@store/hooks";
import { addPost, removePost } from "@store/modules/community";

interface CommunityRealtimeResult {
  /** Number of new posts buffered (not yet shown) */
  newPostCount: number;
  /** Flush buffered posts into the feed */
  showNewPosts: () => void;
}

/**
 * Subscribes to Supabase Realtime changes on the community_posts table.
 *
 * New posts from other users are buffered and exposed via `newPostCount`.
 * Call `showNewPosts()` to flush them into the Redux feed (user-initiated).
 *
 * Deletes are applied immediately (no buffering needed).
 */
export function useCommunityRealtime(userId: string | undefined): CommunityRealtimeResult {
  const dispatch = useDispatch();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const [bufferedPosts, setBufferedPosts] = useState<CommunityPost[]>([]);

  // Fetch a single post from the feed API (includes author join + visibility check)
  const fetchPost = useCallback(async (postId: string): Promise<CommunityPost | null> => {
    try {
      const res = await fetch(`/api/community/feed?postId=${encodeURIComponent(postId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.post ?? null;
    } catch {
      return null;
    }
  }, []);

  // Handle new post INSERT from Realtime — buffer instead of auto-inserting
  const handleInsert = useCallback(
    async (payload: { new: Record<string, unknown> }) => {
      const row = payload.new;
      const postUserId = row.user_id as string;

      // Skip own posts — already added optimistically via createPost thunk
      if (postUserId === userId) return;

      const postId = row.id as string;
      const post = await fetchPost(postId);

      if (!post) return; // Visibility-filtered out or fetch failed

      setBufferedPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) return prev;
        return [post, ...prev];
      });
    },
    [userId, fetchPost]
  );

  // Handle post DELETE from Realtime — apply immediately
  const handleDelete = useCallback(
    (payload: { old: Record<string, unknown> }) => {
      const postId = payload.old.id as string;
      if (postId) {
        dispatch(removePost(postId));
        // Also remove from buffer if present
        setBufferedPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    },
    [dispatch]
  );

  // Flush buffered posts into the Redux feed
  const showNewPosts = useCallback(() => {
    for (const post of bufferedPosts) {
      dispatch(addPost(post));
    }
    setBufferedPosts([]);
  }, [bufferedPosts, dispatch]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`community_feed:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
        },
        handleInsert
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_posts",
        },
        handleDelete
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, handleInsert, handleDelete]);

  return {
    newPostCount: bufferedPosts.length,
    showNewPosts,
  };
}
