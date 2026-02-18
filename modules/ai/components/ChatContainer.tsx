"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { CharacterKey } from "@resources/types/ai";
import { paragraphVariants } from "@resources/variants";

import AIConsentModal from "./AIConsentModal";
import CharacterAvatar from "./CharacterAvatar";
import CharacterSelector from "./CharacterSelector";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { useAIChat } from "../hooks/useAIChat";

interface ChatContainerProps {
  onClose?: () => void;
  showHeader?: boolean;
  sx?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ onClose, showHeader = true, sx }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [consentStatus, setConsentStatus] = useState<"loading" | "needed" | "granted">("loading");

  // Use the AI chat hook
  const {
    characters,
    activeCharacter,
    suggestedCharacter,
    messages,
    isStreaming,
    streamingContent,
    loading,
    error,
    fetchCharacters,
    fetchSuggestedCharacter,
    setActiveCharacter,
    sendMessageStream,
    clearChat,
  } = useAIChat();

  // Check AI consent on mount
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const res = await fetch("/api/user/consent");
        const data = await res.json();
        setConsentStatus(data.hasConsent ? "granted" : "needed");
      } catch {
        setConsentStatus("needed");
      }
    };
    checkConsent();
  }, []);

  const handleConsentAccepted = useCallback(() => {
    setConsentStatus("granted");
  }, []);

  const handleConsentDeclined = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Fetch characters on mount (only after consent granted)
  useEffect(() => {
    if (consentStatus !== "granted") return;
    if (!characters.fetched && !characters.loading) {
      fetchCharacters();
      fetchSuggestedCharacter();
    }
  }, [
    consentStatus,
    characters.fetched,
    characters.loading,
    fetchCharacters,
    fetchSuggestedCharacter,
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Handle character selection
  const handleSelectCharacter = (characterKey: CharacterKey) => {
    setActiveCharacter(characterKey);
  };

  // Handle sending a message
  const handleSendMessage = (message: string) => {
    if (!activeCharacter) return;
    sendMessageStream(message);
  };

  // Handle clearing chat
  const handleClearChat = () => {
    clearChat();
  };

  // Handle exporting conversation
  const handleExportChat = () => {
    if (messages.length === 0) return;

    const charName = currentCharacter?.name || activeCharacter;
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let content = `# Gynergy Coaching Session\n`;
    content += `**Coach:** ${charName}\n`;
    content += `**Date:** ${date}\n`;
    content += `**Messages:** ${messages.length}\n\n---\n\n`;

    messages.forEach((msg) => {
      const sender = msg.role === "user" ? "You" : charName;
      const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      content += `**${sender}**${time ? ` (${time})` : ""}\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (charName || "coach").toLowerCase();
    a.download = `gynergy-chat-${safeName}-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get current character info
  const currentCharacter = characters.data.find((c) => c.key === activeCharacter);

  // Show consent modal if consent not yet granted
  if (consentStatus === "loading") {
    return (
      <div className={cn("bg-bkg-dark flex h-full items-center justify-center", sx)}>
        <div className="flex gap-1">
          <span
            className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  }

  if (consentStatus === "needed") {
    return (
      <AIConsentModal
        isOpen={true}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    );
  }

  // Show character selector if no character selected
  if (!activeCharacter) {
    return (
      <div className={cn("bg-bkg-dark flex h-full flex-col", sx)}>
        {/* Header */}
        {showHeader && (
          <div className="border-border-light/20 flex items-center justify-between border-b p-4">
            <Paragraph
              content="Choose Your Coach"
              variant={paragraphVariants.regular}
              sx="font-bold text-content-dark"
            />
            {onClose && (
              <button
                onClick={onClose}
                className="text-content-dark-secondary hover:text-content-dark"
              >
                <i className="gng-close text-xl" />
              </button>
            )}
          </div>
        )}

        {/* Character selection */}
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Paragraph
            content="Who would you like to chat with today?"
            variant={paragraphVariants.meta}
            sx="text-content-dark-secondary mb-6 text-center"
          />
          <CharacterSelector
            selectedCharacter={activeCharacter}
            suggestedCharacter={suggestedCharacter}
            onSelect={handleSelectCharacter}
            variant="cards"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-bkg-dark flex h-full flex-col", sx)}>
      {/* Header */}
      {showHeader && (
        <div className="border-border-light/20 flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <CharacterAvatar characterKey={activeCharacter} size="medium" />
            <div>
              <Paragraph
                content={currentCharacter?.name || activeCharacter}
                variant={paragraphVariants.regular}
                sx="font-bold text-content-dark"
              />
              <Paragraph
                content={currentCharacter?.role || "AI Coach"}
                variant={paragraphVariants.meta}
                sx="text-content-dark-secondary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Switch character button */}
            <button
              onClick={() => setActiveCharacter(activeCharacter === "yesi" ? "garin" : "yesi")}
              className="text-content-dark-secondary hover:text-content-dark hover:bg-bkg-light rounded-full p-2"
              title="Switch character"
            >
              <i className="gng-refresh text-[18px]" />
            </button>
            {/* Export chat button */}
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="text-content-dark-secondary hover:text-content-dark hover:bg-bkg-light rounded-full p-2"
                title="Export conversation"
              >
                <i className="gng-download text-[18px]" />
              </button>
            )}
            {/* Clear chat button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-content-dark-secondary hover:text-content-dark hover:bg-bkg-light rounded-full p-2"
                title="Clear chat"
              >
                <i className="gng-trash text-[18px]" />
              </button>
            )}
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="text-content-dark-secondary hover:text-content-dark hover:bg-bkg-light rounded-full p-2"
              >
                <i className="gng-close text-xl" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <CharacterAvatar characterKey={activeCharacter} size="large" />
            <Paragraph
              content={`Hi! I'm ${currentCharacter?.name || activeCharacter}.`}
              variant={paragraphVariants.regular}
              sx="font-bold text-content-dark mt-4"
            />
            <Paragraph
              content="How can I support you on your gratitude journey today?"
              variant={paragraphVariants.meta}
              sx="text-content-dark-secondary mt-2 max-w-xs"
            />

            {/* Suggested prompts */}
            <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
              {[
                "How am I doing on my journey?",
                "I need some motivation today",
                "Help me reflect on my gratitude",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    "bg-bkg-light text-content-dark-secondary",
                    "hover:bg-action/10 hover:text-action",
                    "text-left transition-all duration-200"
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, index) => (
          <ChatMessage
            key={`${msg.timestamp || index}-${msg.role}`}
            role={msg.role}
            content={msg.content}
            characterKey={msg.role === "assistant" ? activeCharacter : undefined}
            characterName={msg.role === "assistant" ? currentCharacter?.name : undefined}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <ChatMessage
            role="assistant"
            content={streamingContent}
            characterKey={activeCharacter}
            characterName={currentCharacter?.name}
            isStreaming={true}
          />
        )}

        {/* Loading indicator */}
        {loading && !isStreaming && (
          <div className="text-content-dark-secondary flex items-center gap-2">
            <CharacterAvatar characterKey={activeCharacter} size="small" />
            <div className="flex gap-1">
              <span
                className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="bg-content-dark-secondary/50 h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-danger/10 text-danger flex items-center gap-2 rounded-lg p-3">
            <i className="gng-warning text-[18px]" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={loading || isStreaming}
        placeholder={`Message ${currentCharacter?.name || "coach"}...`}
      />
    </div>
  );
};

export default ChatContainer;
