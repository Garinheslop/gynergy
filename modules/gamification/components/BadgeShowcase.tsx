"use client";

import { useEffect, useState } from "react";

import { cn } from "@lib/utils/style";
import { UserBadge, BadgeRarity } from "@resources/types/gamification";

import BadgeCard from "./BadgeCard";

interface BadgeShowcaseProps {
  userId?: string;
  badges?: UserBadge[];
  maxBadges?: number;
  size?: "small" | "medium" | "large";
  showEmptySlots?: boolean;
  emptyMessage?: string;
  onBadgeClick?: (badge: UserBadge) => void;
  className?: string;
}

const rarityGradients: Record<BadgeRarity, string> = {
  common: "from-gray-500/10 to-gray-600/10",
  uncommon: "from-green-500/10 to-green-600/10",
  rare: "from-blue-500/10 to-blue-600/10",
  epic: "from-purple-500/10 to-purple-600/10",
  legendary: "from-amber-500/10 to-amber-600/10",
};

export default function BadgeShowcase({
  userId,
  badges: propBadges,
  maxBadges = 3,
  size = "medium",
  showEmptySlots = true,
  emptyMessage = "No badges showcased yet",
  onBadgeClick,
  className,
}: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(!propBadges);
  const [animatingBadgeId, setAnimatingBadgeId] = useState<string | null>(null);

  // Fetch showcased badges if not provided via props
  useEffect(() => {
    if (propBadges) {
      setBadges(propBadges.filter((b) => b.isShowcased).slice(0, maxBadges));
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchShowcasedBadges = async () => {
      try {
        const res = await fetch(`/api/gamification/user-badges?showcased=true`);
        if (res.ok) {
          const data = await res.json();
          setBadges((data.badges || []).slice(0, maxBadges));
        }
      } catch (error) {
        console.error("Error fetching showcased badges:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowcasedBadges();
  }, [userId, propBadges, maxBadges]);

  const handleBadgeClick = (badge: UserBadge) => {
    // Trigger animation
    setAnimatingBadgeId(badge.id);
    setTimeout(() => setAnimatingBadgeId(null), 300);

    onBadgeClick?.(badge);
  };

  // Calculate empty slots to show
  const emptySlots = showEmptySlots ? Math.max(0, maxBadges - badges.length) : 0;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {Array.from({ length: maxBadges }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-grey-800/50 animate-pulse rounded-xl",
              size === "small" && "h-16 w-16",
              size === "medium" && "h-24 w-24",
              size === "large" && "h-32 w-32"
            )}
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0 && !showEmptySlots) {
    return (
      <div className={cn("text-grey-500 py-4 text-center text-sm", className)}>{emptyMessage}</div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        {badges.map((userBadge) => {
          if (!userBadge.badge) return null;

          const isAnimating = animatingBadgeId === userBadge.id;

          return (
            <div
              key={userBadge.id}
              className={cn(
                "relative transition-transform duration-200",
                isAnimating && "scale-110"
              )}
            >
              {/* Glow effect for rare+ badges */}
              {userBadge.badge.rarity !== "common" && userBadge.badge.rarity !== "uncommon" && (
                <div
                  className={cn(
                    "absolute inset-0 -z-10 rounded-xl bg-gradient-to-br opacity-50 blur-md",
                    rarityGradients[userBadge.badge.rarity]
                  )}
                />
              )}

              <BadgeCard
                badge={userBadge.badge}
                userBadge={userBadge}
                isEarned
                size={size}
                onClick={() => handleBadgeClick(userBadge)}
              />
            </div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={cn(
              "border-grey-700/50 bg-grey-900/30 flex items-center justify-center rounded-xl border-2 border-dashed",
              size === "small" && "h-16 w-16",
              size === "medium" && "h-24 w-24",
              size === "large" && "h-32 w-32"
            )}
          >
            <i className="gng-plus text-grey-600 text-xl" />
          </div>
        ))}
      </div>

      {/* Badge count summary */}
      {badges.length > 0 && (
        <div className="text-grey-500 flex items-center gap-2 text-xs">
          <i className="gng-badge" />
          <span>
            {badges.length} of {maxBadges} showcase slots used
          </span>
        </div>
      )}
    </div>
  );
}

// Compact inline version for profile headers
interface BadgeShowcaseInlineProps {
  badges: UserBadge[];
  maxVisible?: number;
  onViewAll?: () => void;
}

export function BadgeShowcaseInline({
  badges,
  maxVisible = 3,
  onViewAll,
}: BadgeShowcaseInlineProps) {
  const showcased = badges.filter((b) => b.isShowcased).slice(0, maxVisible);
  const totalBadges = badges.length;
  const hiddenCount = totalBadges - maxVisible;

  if (showcased.length === 0 && totalBadges === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Showcased badges */}
      <div className="flex -space-x-2">
        {showcased.map((userBadge) => {
          if (!userBadge.badge) return null;
          return (
            <div
              key={userBadge.id}
              className={cn(
                "border-grey-900 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-gradient-to-br",
                rarityGradients[userBadge.badge.rarity]
              )}
              title={userBadge.badge.name}
            >
              <i className={cn(`gng-${userBadge.badge.icon}`, "text-xs text-white")} />
            </div>
          );
        })}

        {/* Overflow indicator */}
        {hiddenCount > 0 && (
          <button
            onClick={onViewAll}
            className="bg-grey-800 text-grey-400 hover:bg-grey-700 border-grey-900 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors"
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {/* Total badge count */}
      <span className="text-grey-500 text-xs">{totalBadges} badges</span>
    </div>
  );
}
