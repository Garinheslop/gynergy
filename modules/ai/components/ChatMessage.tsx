"use client";
import React from "react";

import { cn } from "@lib/utils/style";
import { CharacterKey, ConversationRole } from "@resources/types/ai";

import CharacterAvatar from "./CharacterAvatar";

interface ChatMessageProps {
  role: ConversationRole;
  content: string;
  characterKey?: CharacterKey;
  characterName?: string;
  timestamp?: string;
  isStreaming?: boolean;
  sx?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  characterKey,
  characterName,
  timestamp,
  isStreaming = false,
  sx,
}) => {
  const isUser = role === "user";
  const isSystem = role === "system";

  // Don't render system messages in the UI
  if (isSystem) return null;

  // Format timestamp
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row", sx)}>
      {/* Avatar */}
      {!isUser && characterKey && (
        <div className="flex-shrink-0">
          <CharacterAvatar characterKey={characterKey} size="small" />
        </div>
      )}

      {/* Message bubble */}
      <div className={cn("flex max-w-[80%] flex-col", isUser ? "items-end" : "items-start")}>
        {/* Character name */}
        {!isUser && characterName && (
          <span className="text-content-dark-secondary mb-1 ml-1 text-xs">{characterName}</span>
        )}

        {/* Content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-action rounded-br-md text-white"
              : "bg-bkg-light text-content-dark rounded-bl-md",
            isStreaming && "animate-pulse"
          )}
        >
          {/* Render content with simple markdown support */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-current" />}
          </div>
        </div>

        {/* Timestamp */}
        {formattedTime && !isStreaming && (
          <span className="text-content-dark-secondary/50 mx-1 mt-1 text-xs">{formattedTime}</span>
        )}
      </div>

      {/* User avatar placeholder for alignment */}
      {isUser && <div className="w-8 flex-shrink-0" />}
    </div>
  );
};

export default ChatMessage;
