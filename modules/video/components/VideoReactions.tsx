"use client";

import React, { useState, useCallback } from "react";

import { useHMSActions } from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";

interface VideoReactionsProps {
  onReaction?: (emoji: string) => void;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

const REACTIONS = [
  { emoji: "👏", label: "Clap" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🙏", label: "Gratitude" },
  { emoji: "✨", label: "Sparkle" },
  { emoji: "💪", label: "Strong" },
  { emoji: "🔥", label: "Fire" },
];

const VideoReactions: React.FC<VideoReactionsProps> = ({ onReaction }) => {
  const hmsActions = useHMSActions();
  const [isOpen, setIsOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [nextId, setNextId] = useState(0);

  // Send reaction
  const sendReaction = useCallback(
    async (emoji: string) => {
      try {
        // Send via HMS broadcast (if supported)
        await hmsActions.sendBroadcastMessage(JSON.stringify({ type: "reaction", emoji }));

        // Show local animation
        const id = nextId;
        setNextId((prev) => prev + 1);
        setFloatingEmojis((prev) => [...prev, { id, emoji, x: 20 + Math.random() * 60 }]);

        // Remove after animation
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
        }, 2000);

        onReaction?.(emoji);
        setIsOpen(false);
      } catch (err) {
        console.error("Failed to send reaction:", err);
      }
    },
    [hmsActions, nextId, onReaction]
  );

  // Handle hand raise (special reaction)
  const raiseHand = useCallback(async () => {
    try {
      await hmsActions.sendBroadcastMessage(JSON.stringify({ type: "hand_raise" }));
      sendReaction("✋");
    } catch (err) {
      console.error("Failed to raise hand:", err);
    }
  }, [hmsActions, sendReaction]);

  return (
    <>
      {/* Floating emojis container */}
      <div className="pointer-events-none fixed right-0 bottom-32 left-0 z-50 h-64 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div key={item.id} className="animate-float-up absolute" style={{ left: `${item.x}%` }}>
            <span className="text-4xl">{item.emoji}</span>
          </div>
        ))}
      </div>

      {/* Reactions button and picker */}
      <div className="relative">
        {/* Reaction picker */}
        {isOpen && (
          <div className="bg-bkg-dark-secondary animate-scale-in absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-2xl border border-white/10 p-2 shadow-xl">
            <div className="flex items-center gap-1">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => sendReaction(reaction.emoji)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
                  title={reaction.label}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reactions toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-all",
            isOpen
              ? "bg-action text-white"
              : "bg-bkg-dark-secondary hover:bg-bkg-dark text-content-light"
          )}
        >
          <span className="text-xl">😊</span>
        </button>
      </div>

      {/* Hand raise button */}
      <button
        onClick={raiseHand}
        className="bg-bkg-dark-secondary hover:bg-bkg-dark flex h-12 w-12 items-center justify-center rounded-full transition-all"
        title="Raise hand"
      >
        <span className="text-xl">✋</span>
      </button>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
        @keyframes scale-in {
          0% {
            transform: translateX(-50%) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default VideoReactions;
