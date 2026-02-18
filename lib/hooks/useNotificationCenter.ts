"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { createClient } from "@lib/supabase-client";

export type NotificationCategory =
  | "reminder"
  | "achievement"
  | "social"
  | "system"
  | "encouragement";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon: string | null;
  actionType: string | null;
  actionData: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface UseNotificationCenterReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotificationCenter(userId: string | undefined): UseNotificationCenterReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchNotifications = useCallback(
    async (cursor?: string | null) => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: "20" });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/notifications?${params}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();

        if (cursor) {
          // Append for pagination
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          // Replace for initial/refresh
          setNotifications(data.notifications);
        }

        setUnreadCount(data.unreadCount);
        setHasMore(data.hasMore);
        cursorRef.current = data.nextCursor;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Handle incoming Realtime notification
  const handleRealtimeInsert = useCallback((payload: { new: Record<string, unknown> }) => {
    const n = payload.new as {
      id: string;
      category: NotificationCategory;
      title: string;
      body: string;
      icon: string | null;
      action_type: string | null;
      action_data: Record<string, unknown> | null;
      is_read: boolean;
      read_at: string | null;
      created_at: string;
    };

    const newNotification: NotificationItem = {
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      icon: n.icon,
      actionType: n.action_type,
      actionData: n.action_data,
      isRead: n.is_read,
      readAt: n.read_at,
      createdAt: n.created_at,
    };

    // Deduplicate: Realtime event may arrive after a fetch that already includes it
    setNotifications((prev) =>
      prev.some((existing) => existing.id === newNotification.id)
        ? prev
        : [newNotification, ...prev]
    );
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Supabase Realtime subscription for instant notification delivery
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        handleRealtimeInsert
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      // Guard: check if already read to prevent unreadCount desync
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.isRead) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId }),
        });

        if (!res.ok) {
          // Rollback on failure
          setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, isRead: false, readAt: null } : n))
          );
          setUnreadCount((prev) => prev + 1);
        }
      } catch {
        // Rollback on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: false, readAt: null } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    [userId, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const previousNotifications = notifications;
    const previousCount = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (!res.ok) {
        // Rollback
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
      }
    } catch {
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }
  }, [userId, notifications, unreadCount]);

  const loadMore = useCallback(async () => {
    if (hasMore && cursorRef.current) {
      await fetchNotifications(cursorRef.current);
    }
  }, [hasMore, fetchNotifications]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
  };
}
