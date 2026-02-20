"use client";

import { useCallback, useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { createClient } from "@lib/supabase-client";
import type { SessionChatMessage, SessionChatRow } from "@resources/types/session";
import { chatRowToMessage } from "@resources/types/session";
import type { RootState, AppDispatch } from "@store/configureStore";
import { sessionActions } from "@store/modules/session/reducers";

export function useSessionChat(sessionId: string | null, breakoutRoomId?: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const chat = useSelector((state: RootState) => state.session.chat);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      let url = `/api/session/chat?sessionId=${sessionId}&limit=100`;
      if (breakoutRoomId) {
        url += `&breakoutRoomId=${breakoutRoomId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      dispatch(sessionActions.chatMessagesFetched(data.messages || []));
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  }, [sessionId, breakoutRoomId, dispatch]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    // Clear messages when switching rooms
    dispatch(sessionActions.chatMessagesCleared());
    fetchMessages();

    const supabase = createClient();
    const channelName = breakoutRoomId
      ? `session-chat-breakout-${breakoutRoomId}`
      : `session-chat-${sessionId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_chat",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const msg = chatRowToMessage(payload.new as SessionChatRow);
          // Only show messages for our current context (main or breakout)
          if (breakoutRoomId) {
            if (msg.breakoutRoomId === breakoutRoomId) {
              dispatch(sessionActions.chatMessageAdded(msg));
            }
          } else {
            if (!msg.breakoutRoomId) {
              dispatch(sessionActions.chatMessageAdded(msg));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_chat",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const msg = chatRowToMessage(payload.new as SessionChatRow);
          dispatch(sessionActions.chatMessageUpdated(msg));
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Polling fallback
    const fallback = setInterval(fetchMessages, 30000);

    return () => {
      clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [sessionId, breakoutRoomId, fetchMessages, dispatch]);

  // Send message
  const sendMessage = useCallback(
    async (message: string, userName?: string) => {
      if (!sessionId || !message.trim()) return;
      const res = await fetch("/api/session/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sessionId,
          message: message.trim(),
          userName,
          breakoutRoomId: breakoutRoomId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send message");
      return data.message as SessionChatMessage;
    },
    [sessionId, breakoutRoomId]
  );

  const pinMessage = useCallback(
    async (messageId: string, isPinned: boolean) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", sessionId, messageId, isPinned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to pin message");
    },
    [sessionId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", sessionId, messageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete message");
    },
    [sessionId]
  );

  // Filter out deleted messages
  const messages = chat.messages.filter((m) => !m.isDeleted);

  return {
    messages,
    loading: chat.loading,
    sendMessage,
    pinMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
