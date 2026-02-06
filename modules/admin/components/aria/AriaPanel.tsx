"use client";

import { useState, useRef, useEffect } from "react";

import { cn } from "@lib/utils/style";

import type { AriaMessage, AriaInsight } from "../../types/admin";

interface AriaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  insights?: AriaInsight[];
}

export default function AriaPanel({ isOpen, onClose, insights = [] }: AriaPanelProps) {
  const [messages, setMessages] = useState<AriaMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm Aria, your admin intelligence assistant. I can help you understand your platform data, identify trends, and take action. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AriaMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/aria/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          context: {
            currentPage: window.location.pathname,
            recentMessages: messages.slice(-5),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: AriaMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || "I apologize, I couldn't process that request. Please try again.",
        timestamp: new Date().toISOString(),
        actionItems: data.actionItems,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: AriaMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "How many users signed up this week?",
    "What's our current MRR?",
    "Show me engagement trends",
    "Any users at risk of churning?",
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={cn(
          "border-grey-800 bg-bkg-dark fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="border-grey-800 flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="from-purple to-purple-light flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br">
              <i className="gng-sparkle text-lg text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Aria</h2>
              <p className="text-grey-500 text-xs">Admin Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-grey-400 hover:bg-grey-800 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-white"
          >
            <i className="gng-close text-lg" />
          </button>
        </div>

        {/* Insights (if any) */}
        {insights.length > 0 && (
          <div className="border-grey-800 border-b p-4">
            <p className="text-grey-500 mb-2 text-xs font-medium tracking-wider uppercase">
              Insights
            </p>
            <div className="flex flex-col gap-2">
              {insights.slice(0, 2).map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    insight.priority === "high"
                      ? "bg-danger/10 text-danger"
                      : insight.type === "opportunity"
                        ? "bg-action-900 text-action-300"
                        : "bg-grey-800 text-grey-300"
                  )}
                >
                  <p className="font-medium">{insight.title}</p>
                  <p className="mt-1 text-xs opacity-80">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-action-600 text-white"
                      : "bg-grey-800 text-grey-200"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.actionItems && message.actionItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actionItems.map((action) => (
                        <button
                          key={action.id}
                          className="bg-action-700 hover:bg-action-600 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-grey-800 flex items-center gap-2 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="bg-grey-500 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="bg-grey-500 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="bg-grey-500 h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="border-grey-800 border-t p-4">
            <p className="text-grey-500 mb-2 text-xs font-medium tracking-wider uppercase">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setInput(question)}
                  className="bg-grey-800 text-grey-300 hover:bg-grey-700 rounded-lg px-3 py-1.5 text-xs transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-grey-800 flex items-center gap-3 border-t p-4"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Aria anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="border-grey-700 bg-grey-800 placeholder-grey-500 focus:border-action-500 focus:ring-action-500 flex-1 rounded-lg border px-4 py-2.5 text-sm text-white outline-none focus:ring-1 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-action-600 hover:bg-action-500 flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="gng-send text-lg" />
          </button>
        </form>
      </div>
    </>
  );
}
