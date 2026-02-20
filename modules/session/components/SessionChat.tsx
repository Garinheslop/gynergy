"use client";

import React, { useState, useRef, useEffect } from "react";

import { cn } from "@lib/utils/style";
import type { SessionChatMessage } from "@resources/types/session";

interface SessionChatProps {
  messages: SessionChatMessage[];
  onSend: (message: string) => Promise<unknown>;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onDelete?: (messageId: string) => void;
  isHost: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SessionChat: React.FC<SessionChatProps> = ({
  messages,
  onSend,
  onPin,
  onDelete,
  isHost,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smart auto-scroll (only if near bottom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || disabled) return;

    const message = input.trim();
    setInput("");
    setSending(true);
    try {
      await onSend(message);
    } catch {
      setInput(message); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  // Pinned messages at top
  const pinned = messages.filter((m) => m.isPinned);

  return (
    <div className="flex h-full flex-col">
      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="border-b border-gray-700 bg-teal-900/10 px-3 py-2">
          {pinned.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <span className="text-teal-400">📌</span>
              <div>
                <span className="font-medium text-teal-300">{msg.sentByName || "User"}: </span>
                <span className="text-gray-300">{msg.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message list */}
      <div ref={containerRef} className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-500">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "group flex items-start gap-2 rounded px-2 py-1 hover:bg-gray-800/50",
              msg.isHostMessage && "bg-teal-900/10"
            )}
          >
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  msg.isHostMessage ? "text-teal-400" : "text-gray-400"
                )}
              >
                {msg.sentByName || "User"}
                {msg.isHostMessage && " (Host)"}
              </span>
              <span className="ml-2 text-xs text-gray-600">{formatTime(msg.sentAt)}</span>
              <p className="text-sm text-gray-200">{msg.message}</p>
            </div>

            {/* Host moderation */}
            {isHost && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => onPin?.(msg.id, !msg.isPinned)}
                  className="text-xs text-gray-500 hover:text-teal-400"
                  title={msg.isPinned ? "Unpin" : "Pin"}
                >
                  📌
                </button>
                <button
                  onClick={() => onDelete?.(msg.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 px-3 py-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Chat disabled" : placeholder}
            disabled={disabled || sending}
            maxLength={500}
            className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || disabled}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionChat;
