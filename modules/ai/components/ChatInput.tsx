"use client";
import React, { useState, useRef, useEffect, KeyboardEvent } from "react";

import { cn } from "@lib/utils/style";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  sx?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = "Type a message...",
  disabled = false,
  sx,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSend(trimmedMessage);
      setMessage("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn("bg-bkg-dark border-border-light/20 flex items-end gap-2 border-t p-3", sx)}>
      {/* Text input */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl px-4 py-3",
            "bg-bkg-light text-content-dark placeholder:text-content-dark-secondary/50",
            "focus:border-action/50 border border-transparent focus:outline-none",
            "transition-all duration-200",
            "text-sm leading-relaxed",
            (disabled || isLoading) && "cursor-not-allowed opacity-50"
          )}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
          "transition-all duration-200",
          canSend
            ? "bg-action hover:bg-action/90 text-white"
            : "bg-bkg-light text-content-dark-secondary/30"
        )}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <i className="gng-send text-[18px]" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
