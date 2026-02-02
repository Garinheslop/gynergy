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
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
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
    <div
      className={cn(
        "flex items-end gap-2 p-3 bg-bkg-dark border-t border-border-light/20",
        sx
      )}
    >
      {/* Text input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "w-full px-4 py-3 rounded-2xl resize-none",
            "bg-bkg-light text-content-dark placeholder:text-content-dark-secondary/50",
            "border border-transparent focus:border-action/50 focus:outline-none",
            "transition-all duration-200",
            "text-sm leading-relaxed",
            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          "transition-all duration-200",
          canSend
            ? "bg-action text-white hover:bg-action/90"
            : "bg-bkg-light text-content-dark-secondary/30"
        )}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <i className="gng-send text-[18px]" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
