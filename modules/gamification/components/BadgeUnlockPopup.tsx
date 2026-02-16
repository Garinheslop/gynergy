"use client";
import React, { useEffect, useState, useCallback } from "react";

import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { buttonActionTypes } from "@resources/types/button";
import { Badge, UserBadge, BadgeRarity } from "@resources/types/gamification";
import { paragraphVariants } from "@resources/variants";

interface BadgeUnlockPopupProps {
  badge: Badge;
  userBadge?: UserBadge;
  points?: number;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
  sx?: string;
}

const rarityColors: Record<BadgeRarity, string> = {
  common: "from-gray-400 to-gray-500",
  uncommon: "from-green-400 to-green-500",
  rare: "from-blue-400 to-blue-500",
  epic: "from-purple-400 to-purple-500",
  legendary: "from-amber-400 to-amber-500",
};

const rarityBg: Record<BadgeRarity, string> = {
  common: "bg-gray-500/10",
  uncommon: "bg-green-500/10",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-amber-500/10",
};

// Simple confetti particle component
const ConfettiParticle: React.FC<{
  color: string;
  delay: number;
  duration: number;
  left: number;
}> = ({ color, delay, duration, left }) => (
  <div
    className="absolute h-2 w-2 rounded-sm opacity-0"
    style={{
      backgroundColor: color,
      left: `${left}%`,
      top: "-10px",
      animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
    }}
  />
);

// Confetti colors based on rarity
const confettiColors: Record<BadgeRarity, string[]> = {
  common: ["#9ca3af", "#6b7280", "#d1d5db"],
  uncommon: ["#4ade80", "#22c55e", "#86efac"],
  rare: ["#60a5fa", "#3b82f6", "#93c5fd"],
  epic: ["#c084fc", "#a855f7", "#d8b4fe"],
  legendary: ["#fbbf24", "#f59e0b", "#fcd34d"],
};

const BadgeUnlockPopup: React.FC<BadgeUnlockPopupProps> = ({
  badge,
  userBadge: _userBadge,
  points,
  isOpen,
  onClose,
  onShare,
  sx,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; color: string; delay: number; duration: number; left: number }>
  >([]);

  // Generate confetti particles
  const generateConfetti = useCallback(() => {
    const colors = confettiColors[badge.rarity];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 2,
      left: Math.random() * 100,
    }));
    setParticles(newParticles);
    setShowConfetti(true);
  }, [badge.rarity]);

  // Trigger confetti on open
  useEffect(() => {
    if (isOpen) {
      generateConfetti();
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, generateConfetti]);

  if (!isOpen) return null;

  return (
    <>
      {/* Confetti animation styles */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes badge-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          "bg-black/70 backdrop-blur-sm",
          sx
        )}
        onClick={onClose}
      >
        {/* Confetti container */}
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            {particles.map((particle) => (
              <ConfettiParticle
                key={particle.id}
                color={particle.color}
                delay={particle.delay}
                duration={particle.duration}
                left={particle.left}
              />
            ))}
          </div>
        )}

        {/* Popup content */}
        <div
          className={cn(
            "relative flex w-full max-w-sm flex-col items-center rounded-2xl p-8",
            "bg-bkg-dark border-border-light/20 border",
            rarityBg[badge.rarity]
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "badge-scale 0.5s ease-out forwards" }}
        >
          {/* Close button */}
          <button
            className="text-content-dark/50 hover:text-content-dark absolute top-4 right-4"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="gng-close text-xl" />
          </button>

          {/* Badge unlocked text */}
          <Paragraph
            content="Badge Unlocked!"
            variant={paragraphVariants.meta}
            sx="text-content-dark-secondary uppercase tracking-wider mb-4"
          />

          {/* Badge icon with glow */}
          <div
            className={cn(
              "mb-6 flex h-32 w-32 items-center justify-center rounded-full",
              "bg-gradient-to-br",
              rarityColors[badge.rarity]
            )}
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            <i className={cn(`gng-${badge.icon}`, "text-[64px] text-white")} />
          </div>

          {/* Badge name */}
          <Paragraph
            content={badge.name}
            variant={paragraphVariants.regular}
            sx="font-bold text-center text-2xl mb-2"
          />

          {/* Badge description */}
          <Paragraph
            content={badge.description}
            variant={paragraphVariants.meta}
            sx="text-center text-content-dark-secondary mb-4"
          />

          {/* Rarity and points */}
          <div className="mb-6 flex items-center gap-4">
            <span
              className={cn("rounded-full px-3 py-1 text-sm font-medium capitalize", {
                "bg-gray-500/20 text-gray-300": badge.rarity === "common",
                "bg-green-500/20 text-green-300": badge.rarity === "uncommon",
                "bg-blue-500/20 text-blue-300": badge.rarity === "rare",
                "bg-purple-500/20 text-purple-300": badge.rarity === "epic",
                "bg-amber-500/20 text-amber-300": badge.rarity === "legendary",
              })}
            >
              {badge.rarity}
            </span>
            {(points || badge.pointsReward > 0) && (
              <span className="text-action flex items-center gap-1 font-bold">
                <i className="gng-star text-[16px]" />+{points || badge.pointsReward} pts
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex w-full gap-3">
            {onShare && (
              <ActionButton
                label="Share"
                icon="share"
                buttonActionType={buttonActionTypes.outlined}
                onClick={onShare}
                sx="flex-1"
              />
            )}
            <ActionButton label="Continue" onClick={onClose} sx="flex-1" />
          </div>
        </div>
      </div>
    </>
  );
};

export default BadgeUnlockPopup;
