"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { createClient } from "@lib/supabase-client";

/**
 * Lightweight hook that tracks unread DM count for the Navbar badge.
 * Uses Supabase Realtime to stay in sync without polling.
 */
export function useUnreadMessageCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/community/messages");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.totalUnread ?? 0);
    } catch {
      // Silent — badge stays as-is
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) fetchCount();
  }, [userId, fetchCount]);

  // Realtime: increment on incoming messages, decrement handled by refetch
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dm_badge:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Increment optimistically for instant badge update
          setCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // When messages are marked as read, refetch for accurate count
          const row = payload.new as Record<string, unknown>;
          if (row.is_read === true) {
            fetchCount();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchCount]);

  return count;
}
