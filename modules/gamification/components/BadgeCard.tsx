"use client";
import React, { memo } from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { Badge, UserBadge, BadgeRarity } from "@resources/types/gamification";
import { paragraphVariants } from "@resources/variants";

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  isEarned?: boolean;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  showProgress?: boolean;
  progress?: number;
  onClick?: () => void;
  sx?: string;
}

const rarityColors: Record<BadgeRarity, string> = {
  common: "from-gray-400/20 to-gray-500/20 border-gray-400/30",
  uncommon: "from-green-400/20 to-green-500/20 border-green-400/30",
  rare: "from-blue-400/20 to-blue-500/20 border-blue-400/30",
  epic: "from-purple-400/20 to-purple-500/20 border-purple-400/30",
  legendary: "from-amber-400/20 to-amber-500/20 border-amber-400/30",
};

const rarityGlow: Record<BadgeRarity, string> = {
  common: "",
  uncommon: "shadow-green-500/20",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-amber-500/50",
};

const sizeClasses = {
  small: {
    container: "w-16 h-16 p-2",
    icon: "text-2xl",
    text: paragraphVariants.meta,
  },
  medium: {
    container: "w-24 h-24 p-3",
    icon: "text-[36px]",
    text: paragraphVariants.meta,
  },
  large: {
    container: "w-32 h-32 p-4",
    icon: "text-[48px]",
    text: paragraphVariants.regular,
  },
};

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  userBadge,
  isEarned = false,
  size = "medium",
  showDescription: _showDescription = false,
  showProgress = false,
  progress = 0,
  onClick,
  sx,
}) => {
  const earned = isEarned || !!userBadge;
  const sizeConfig = sizeClasses[size];
  const isNew = userBadge?.isNew;

  return (
    <button
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200",
        sizeConfig.container,
        // Background gradient based on rarity
        earned
          ? cn(
              "bg-gradient-to-br",
              rarityColors[badge.rarity],
              rarityGlow[badge.rarity],
              "shadow-lg"
            )
          : "bg-bkg-light/50 border-border-light/20 opacity-50 grayscale",
        // Hover effects only if earned and clickable
        earned && onClick && "cursor-pointer hover:scale-105",
        !earned && "cursor-default",
        sx
      )}
      onClick={earned && onClick ? onClick : undefined}
      disabled={!earned}
      aria-label={`${badge.name} badge${earned ? "" : " (locked)"}`}
    >
      {/* New badge indicator */}
      {isNew && (
        <span className="bg-action absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full" />
      )}

      {/* Showcased indicator */}
      {userBadge?.isShowcased && (
        <span className="absolute -top-1 -left-1 text-[10px] text-amber-400">
          <i className="gng-star" />
        </span>
      )}

      {/* Badge icon */}
      <i
        className={cn(
          `gng-${badge.icon}`,
          sizeConfig.icon,
          earned ? "text-content-dark" : "text-content-dark/30"
        )}
      />

      {/* Badge name (only shown on larger sizes) */}
      {size !== "small" && (
        <Paragraph
          content={badge.name}
          variant={sizeConfig.text}
          sx={cn(
            "mt-1 text-center line-clamp-2",
            earned ? "text-content-dark" : "text-content-dark/30"
          )}
        />
      )}

      {/* Progress bar (for locked badges) */}
      {showProgress && !earned && progress > 0 && (
        <div className="bg-bkg-dark/30 absolute right-2 bottom-1 left-2 h-1 overflow-hidden rounded-full">
          <div
            className="bg-action/50 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </button>
  );
};

// Detailed badge card for full info display
interface BadgeCardDetailedProps {
  badge: Badge;
  userBadge?: UserBadge;
  onClose?: () => void;
  onToggleShowcase?: () => void;
  sx?: string;
}

export const BadgeCardDetailed: React.FC<BadgeCardDetailedProps> = ({
  badge,
  userBadge,
  onClose,
  onToggleShowcase,
  sx,
}) => {
  const earned = !!userBadge;

  return (
    <div
      className={cn("bg-bkg-light flex w-full max-w-sm flex-col items-center rounded-2xl p-6", sx)}
    >
      {/* Close button */}
      {onClose && (
        <button
          className="text-content-dark/50 hover:text-content-dark absolute top-4 right-4"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="gng-close text-xl" />
        </button>
      )}

      {/* Badge display */}
      <div
        className={cn(
          "mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br",
          earned ? rarityColors[badge.rarity] : "bg-bkg-dark/20"
        )}
      >
        <i
          className={cn(
            `gng-${badge.icon} text-[48px]`,
            earned ? "text-content-dark" : "text-content-dark/30"
          )}
        />
      </div>

      {/* Badge info */}
      <Paragraph
        content={badge.name}
        variant={paragraphVariants.regular}
        sx="font-bold text-center mb-2"
      />
      <Paragraph
        content={badge.description}
        variant={paragraphVariants.meta}
        sx="text-center text-content-dark-secondary mb-4"
      />

      {/* Rarity and points */}
      <div className="mb-4 flex items-center gap-4">
        <span
          className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", {
            "bg-gray-500/20 text-gray-300": badge.rarity === "common",
            "bg-green-500/20 text-green-300": badge.rarity === "uncommon",
            "bg-blue-500/20 text-blue-300": badge.rarity === "rare",
            "bg-purple-500/20 text-purple-300": badge.rarity === "epic",
            "bg-amber-500/20 text-amber-300": badge.rarity === "legendary",
          })}
        >
          {badge.rarity}
        </span>
        {badge.pointsReward > 0 && (
          <span className="text-action text-sm font-medium">+{badge.pointsReward} pts</span>
        )}
      </div>

      {/* Earned date */}
      {userBadge && (
        <Paragraph
          content={`Earned ${new Date(userBadge.unlockedAt).toLocaleDateString()}`}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary mb-4"
        />
      )}

      {/* Showcase toggle */}
      {userBadge && onToggleShowcase && (
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
            userBadge.isShowcased
              ? "bg-amber-500/20 text-amber-300"
              : "bg-bkg-dark/20 text-content-dark-secondary hover:bg-bkg-dark/30"
          )}
          onClick={onToggleShowcase}
        >
          <i className="gng-star text-[16px]" />
          <span className="text-sm">{userBadge.isShowcased ? "Showcased" : "Add to Showcase"}</span>
        </button>
      )}
    </div>
  );
};

export default memo(BadgeCard);
