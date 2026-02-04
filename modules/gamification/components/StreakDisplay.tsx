"use client";
import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface StreakDisplayProps {
  streak: number;
  label?: string;
  showLabel?: boolean;
  showFlame?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "compact" | "detailed";
  streakTypes?: {
    morning: number;
    evening: number;
    gratitude: number;
  };
  sx?: string;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  label = "Day Streak",
  showLabel = true,
  showFlame = true,
  size = "medium",
  variant = "default",
  streakTypes,
  sx,
}) => {
  const sizeClasses = {
    small: {
      container: "gap-1",
      number: "text-lg font-bold",
      label: paragraphVariants.meta,
      icon: "text-[18px]",
    },
    medium: {
      container: "gap-2",
      number: "text-2xl font-bold",
      label: paragraphVariants.meta,
      icon: "text-[28px]",
    },
    large: {
      container: "gap-3",
      number: "text-4xl font-bold",
      label: paragraphVariants.regular,
      icon: "text-[40px]",
    },
  };

  const config = sizeClasses[size];

  // Determine flame color based on streak length
  const getFlameColor = (streakCount: number) => {
    if (streakCount >= 30) return "text-amber-400"; // Legendary
    if (streakCount >= 14) return "text-orange-400"; // Strong
    if (streakCount >= 7) return "text-orange-300"; // Good
    if (streakCount >= 3) return "text-yellow-400"; // Building
    return "text-gray-400"; // Starting
  };

  // Determine if flame should animate
  const shouldAnimate = streak >= 3;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", sx)}>
        {showFlame && (
          <i
            className={cn(
              "gng-fire",
              config.icon,
              getFlameColor(streak),
              shouldAnimate && "animate-pulse"
            )}
          />
        )}
        <span className={cn(config.number, "text-content-dark")}>{streak}</span>
      </div>
    );
  }

  if (variant === "detailed" && streakTypes) {
    return (
      <div className={cn("flex flex-col", config.container, sx)}>
        {/* Main streak */}
        <div className="flex items-center gap-2">
          {showFlame && (
            <i
              className={cn(
                "gng-fire",
                config.icon,
                getFlameColor(streak),
                shouldAnimate && "animate-pulse"
              )}
            />
          )}
          <span className={cn(config.number, "text-content-dark")}>{streak}</span>
          {showLabel && (
            <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
          )}
        </div>

        {/* Individual streaks */}
        <div className="mt-2 flex gap-4">
          <div className="flex items-center gap-1">
            <i className="gng-sun text-[16px] text-yellow-400" />
            <span className="text-content-dark-secondary text-sm">{streakTypes.morning}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="gng-moon text-[16px] text-blue-400" />
            <span className="text-content-dark-secondary text-sm">{streakTypes.evening}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="gng-heart text-[16px] text-pink-400" />
            <span className="text-content-dark-secondary text-sm">{streakTypes.gratitude}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", config.container, sx)}>
      <div className="flex items-center gap-2">
        {showFlame && (
          <i
            className={cn(
              "gng-fire",
              config.icon,
              getFlameColor(streak),
              shouldAnimate && "animate-pulse"
            )}
          />
        )}
        <span className={cn(config.number, "text-content-dark")}>{streak}</span>
      </div>
      {showLabel && (
        <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
      )}
    </div>
  );
};

// Streak milestone indicator
interface StreakMilestoneProps {
  current: number;
  next: number;
  label?: string;
  sx?: string;
}

export const StreakMilestone: React.FC<StreakMilestoneProps> = ({
  current,
  next,
  label = "Next milestone",
  sx,
}) => {
  const progress = (current / next) * 100;

  return (
    <div className={cn("flex flex-col gap-2", sx)}>
      <div className="flex justify-between text-sm">
        <span className="text-content-dark-secondary">{label}</span>
        <span className="text-content-dark">
          {current}/{next}
        </span>
      </div>
      <div className="bg-bkg-dark/30 h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default StreakDisplay;
