"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { createClient } from "@lib/supabase-client";

export interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: MessageUser | null;
  recipient: MessageUser | null;
}

export interface Conversation {
  partnerId: string;
  partner: MessageUser | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface UseDirectMessagesReturn {
  // Conversation list
  conversations: Conversation[];
  totalUnread: number;
  conversationsLoading: boolean;
  refreshConversations: () => Promise<void>;

  // Active thread
  messages: DirectMessage[];
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;

  // Actions
  sendMessage: (
    recipientId: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
  openThread: (partnerId: string) => Promise<void>;
  markAsRead: (partnerId: string) => Promise<void>;

  // Active conversation
  activePartnerId: string | null;
}

export function useDirectMessages(userId: string | undefined): UseDirectMessagesReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  // Keep ref in sync for stable Realtime callback
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Fetch conversation list
  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    setConversationsLoading(true);
    try {
      const res = await fetch("/api/community/messages");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations);
      setTotalUnread(data.totalUnread);
    } catch {
      // Silent — conversations stay as-is
    } finally {
      setConversationsLoading(false);
    }
  }, [userId]);

  // Fetch thread messages for a specific partner
  const fetchThread = useCallback(
    async (partnerId: string, cursor?: string | null) => {
      if (!userId) return;
      setMessagesLoading(true);
      try {
        const params = new URLSearchParams({ userId: partnerId });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/community/messages?${params}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();

        if (cursor) {
          // Prepend older messages (API returns oldest-first)
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }

        setHasMoreMessages(data.hasMore);
        cursorRef.current = data.nextCursor;
      } catch {
        // Silent
      } finally {
        setMessagesLoading(false);
      }
    },
    [userId]
  );

  // Open a thread with a specific partner
  const openThread = useCallback(
    async (partnerId: string) => {
      setActivePartnerId(partnerId);
      cursorRef.current = null;
      setMessages([]);
      await fetchThread(partnerId);

      // Clear unread count for this conversation locally
      // Use ref to avoid stale closure — capture unread before clearing
      let unreadToClear = 0;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.partnerId === partnerId) {
            unreadToClear = c.unreadCount;
            return { ...c, unreadCount: 0 };
          }
          return c;
        })
      );
      if (unreadToClear > 0) {
        setTotalUnread((prev) => Math.max(0, prev - unreadToClear));
      }
    },
    [fetchThread]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activePartnerId || !hasMoreMessages || !cursorRef.current) return;
    await fetchThread(activePartnerId, cursorRef.current);
  }, [activePartnerId, hasMoreMessages, fetchThread]);

  // Send a message
  const sendMessage = useCallback(
    async (recipientId: string, content: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: "Not authenticated" };

      try {
        const res = await fetch("/api/community/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId, content }),
        });

        const data = await res.json();

        if (!res.ok) {
          return { success: false, error: data.error || "Failed to send message" };
        }

        // Add message to thread if we're viewing this conversation
        if (activePartnerId === recipientId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }

        // Update conversation list with new last message
        setConversations((prev) => {
          const existing = prev.find((c) => c.partnerId === recipientId);
          const updated: Conversation = {
            partnerId: recipientId,
            partner: existing?.partner ?? data.message.recipient,
            lastMessage: {
              content: data.message.content,
              createdAt: data.message.createdAt,
              senderId: userId,
            },
            unreadCount: existing?.unreadCount ?? 0,
          };

          const filtered = prev.filter((c) => c.partnerId !== recipientId);
          return [updated, ...filtered]; // Move to top
        });

        return { success: true };
      } catch {
        return { success: false, error: "Failed to send message" };
      }
    },
    [userId, activePartnerId]
  );

  // Mark conversation as read
  const markAsRead = useCallback(
    async (partnerId: string) => {
      if (!userId) return;
      try {
        await fetch("/api/community/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId }),
        });
      } catch {
        // Silent
      }
    },
    [userId]
  );

  // Fetch user profile for Realtime messages (payload lacks join data)
  const fetchUserProfile = useCallback(
    async (profileUserId: string): Promise<MessageUser | null> => {
      try {
        const res = await fetch(`/api/community/members/${profileUserId}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.member) return null;
        return {
          id: data.member.id,
          firstName: data.member.firstName,
          lastName: data.member.lastName,
          profileImage: data.member.profileImage,
        };
      } catch {
        return null;
      }
    },
    []
  );

  // Resolve partner info for new Realtime conversations (payload lacks join data)
  const resolveNewConversationPartner = useCallback(
    async (senderId: string) => {
      const partner = await fetchUserProfile(senderId);
      if (!partner) return;
      setConversations((curr) =>
        curr.map((c) => (c.partnerId === senderId && !c.partner ? { ...c, partner } : c))
      );
    },
    [fetchUserProfile]
  );

  // Update an existing conversation's last message and unread count
  const updateExistingConversation = useCallback(
    (senderId: string, content: string, createdAt: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === senderId
            ? {
                ...c,
                lastMessage: { content, createdAt, senderId },
                unreadCount: c.unreadCount + 1,
              }
            : c
        )
      );
    },
    []
  );

  // Add a brand-new conversation from a first-time sender
  const addNewConversation = useCallback(
    (senderId: string, content: string, createdAt: string) => {
      setConversations((prev) => [
        {
          partnerId: senderId,
          partner: null, // Populated asynchronously
          lastMessage: { content, createdAt, senderId },
          unreadCount: 1,
        },
        ...prev,
      ]);
      resolveNewConversationPartner(senderId);
    },
    [resolveNewConversationPartner]
  );

  // Handle incoming Realtime message
  const handleRealtimeInsert = useCallback(
    (payload: { new: Record<string, unknown> }) => {
      const row = payload.new;
      const senderId = row.sender_id as string;
      const recipientId = row.recipient_id as string;

      // Only handle messages sent TO us (our own sends are handled optimistically)
      if (recipientId !== userId) return;

      const newMessage: DirectMessage = {
        id: row.id as string,
        senderId,
        recipientId,
        content: row.content as string,
        isRead: row.is_read as boolean,
        readAt: (row.read_at as string) ?? null,
        createdAt: row.created_at as string,
        sender: null,
        recipient: null,
      };

      // If viewing this conversation, append message and auto-mark read
      if (activePartnerId === senderId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        markAsRead(senderId);
        return;
      }

      // Not viewing — update conversation list (use ref to avoid stale closure)
      const existing = conversationsRef.current.find((c) => c.partnerId === senderId);
      if (existing) {
        updateExistingConversation(senderId, newMessage.content, newMessage.createdAt);
      } else {
        addNewConversation(senderId, newMessage.content, newMessage.createdAt);
      }
      setTotalUnread((prev) => prev + 1);
    },
    [userId, activePartnerId, markAsRead, updateExistingConversation, addNewConversation]
  );

  // Initial load
  useEffect(() => {
    if (userId) {
      refreshConversations();
    }
  }, [userId, refreshConversations]);

  // Supabase Realtime subscription for instant message delivery
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        handleRealtimeInsert
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, handleRealtimeInsert]);

  return {
    conversations,
    totalUnread,
    conversationsLoading,
    refreshConversations,
    messages,
    messagesLoading,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    openThread,
    markAsRead,
    activePartnerId,
  };
}
