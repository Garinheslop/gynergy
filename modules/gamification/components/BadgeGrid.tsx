"use client";
import React, { useState, useMemo } from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { Badge, UserBadge, BadgeCategory } from "@resources/types/gamification";
import { paragraphVariants } from "@resources/variants";

import BadgeCard, { BadgeCardDetailed } from "./BadgeCard";

interface BadgeGridProps {
  badges: Badge[];
  userBadges: UserBadge[];
  showFilters?: boolean;
  showLocked?: boolean;
  columns?: 3 | 4 | 5 | 6;
  size?: "small" | "medium" | "large";
  onBadgeClick?: (badge: Badge, userBadge?: UserBadge) => void;
  onToggleShowcase?: (badgeId: string) => void;
  sx?: string;
}

const categoryLabels: Record<BadgeCategory, string> = {
  consistency: "Consistency",
  completion: "Completion",
  speed: "Speed",
  social: "Social",
  milestone: "Milestone",
  special: "Special",
};

const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  userBadges,
  showFilters = true,
  showLocked = true,
  columns = 4,
  size = "medium",
  onBadgeClick,
  onToggleShowcase,
  sx,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");
  const [selectedBadge, setSelectedBadge] = useState<{
    badge: Badge;
    userBadge?: UserBadge;
  } | null>(null);

  // Create a map of earned badges for quick lookup
  const earnedBadgeMap = useMemo(() => {
    const map = new Map<string, UserBadge>();
    userBadges.forEach((ub) => {
      if (ub.badge) {
        map.set(ub.badge.id, ub);
      } else {
        map.set(ub.badgeId, ub);
      }
    });
    return map;
  }, [userBadges]);

  // Filter badges based on category and earned status
  const filteredBadges = useMemo(() => {
    let filtered = badges;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    // Filter out hidden badges that aren't earned
    filtered = filtered.filter((b) => {
      if (b.isHidden) {
        return earnedBadgeMap.has(b.id);
      }
      return true;
    });

    // Optionally filter out locked badges
    if (!showLocked) {
      filtered = filtered.filter((b) => earnedBadgeMap.has(b.id));
    }

    // Sort: earned first, then by sort order
    return filtered.sort((a, b) => {
      const aEarned = earnedBadgeMap.has(a.id);
      const bEarned = earnedBadgeMap.has(b.id);
      if (aEarned !== bEarned) {
        return aEarned ? -1 : 1;
      }
      return a.sortOrder - b.sortOrder;
    });
  }, [badges, selectedCategory, showLocked, earnedBadgeMap]);

  // Get unique categories from available badges
  const availableCategories = useMemo(() => {
    const categories = new Set(badges.map((b) => b.category));
    return Array.from(categories);
  }, [badges]);

  // Stats
  const stats = useMemo(() => {
    const total = badges.filter((b) => !b.isHidden || earnedBadgeMap.has(b.id)).length;
    const earned = userBadges.length;
    return { total, earned };
  }, [badges, userBadges, earnedBadgeMap]);

  const handleBadgeClick = (badge: Badge) => {
    const userBadge = earnedBadgeMap.get(badge.id);
    if (onBadgeClick) {
      onBadgeClick(badge, userBadge);
    } else {
      setSelectedBadge({ badge, userBadge });
    }
  };

  const handleToggleShowcase = (badgeId: string) => {
    if (onToggleShowcase) {
      onToggleShowcase(badgeId);
    }
  };

  const gridColsClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return (
    <div className={cn("flex flex-col gap-4", sx)}>
      {/* Stats */}
      <div className="flex items-center justify-between">
        <Paragraph
          content={`Badges: ${stats.earned}/${stats.total}`}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary"
        />
        {stats.earned > 0 && (
          <Paragraph
            content={`${Math.round((stats.earned / stats.total) * 100)}% Complete`}
            variant={paragraphVariants.meta}
            sx="text-action"
          />
        )}
      </div>

      {/* Category filters */}
      {showFilters && availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              selectedCategory === "all"
                ? "bg-action text-content-dark"
                : "bg-bkg-light text-content-dark-secondary hover:bg-bkg-light/80"
            )}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              className={cn(
                "rounded-full px-3 py-1 text-sm capitalize transition-colors",
                selectedCategory === category
                  ? "bg-action text-content-dark"
                  : "bg-bkg-light text-content-dark-secondary hover:bg-bkg-light/80"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      )}

      {/* Badge grid */}
      <div
        className={cn(
          "grid gap-3",
          gridColsClass[columns],
          // Responsive adjustments
          columns > 4 && "sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        )}
      >
        {filteredBadges.map((badge) => {
          const userBadge = earnedBadgeMap.get(badge.id);
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              userBadge={userBadge}
              isEarned={!!userBadge}
              size={size}
              onClick={() => handleBadgeClick(badge)}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {filteredBadges.length === 0 && (
        <div className="text-content-dark-secondary flex flex-col items-center justify-center py-8">
          <i className="gng-trophy mb-2 text-[48px] opacity-30" />
          <Paragraph content="No badges found" variant={paragraphVariants.regular} />
        </div>
      )}

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <BadgeCardDetailed
              badge={selectedBadge.badge}
              userBadge={selectedBadge.userBadge}
              onClose={() => setSelectedBadge(null)}
              onToggleShowcase={
                selectedBadge.userBadge
                  ? () => handleToggleShowcase(selectedBadge.badge.id)
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
