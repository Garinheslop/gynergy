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
  /** Show warning indicator when streak is at risk */
  isAtRisk?: boolean;
  /** Optional message to show when at risk */
  riskMessage?: string;
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
  isAtRisk = false,
  riskMessage,
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
              isAtRisk && streak > 0 ? "animate-pulse text-red-400" : getFlameColor(streak),
              shouldAnimate && !isAtRisk && "animate-pulse"
            )}
          />
        )}
        <span className={cn(config.number, "text-content-dark")}>{streak}</span>
        {isAtRisk && streak > 0 && (
          <i
            className="gng-alert animate-pulse text-[14px] text-red-400"
            title={riskMessage || "Streak at risk!"}
          />
        )}
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
                isAtRisk && streak > 0 ? "animate-pulse text-red-400" : getFlameColor(streak),
                shouldAnimate && !isAtRisk && "animate-pulse"
              )}
            />
          )}
          <span className={cn(config.number, "text-content-dark")}>{streak}</span>
          {showLabel && (
            <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
          )}
          {isAtRisk && streak > 0 && (
            <i
              className="gng-alert animate-pulse text-[14px] text-red-400"
              title={riskMessage || "Streak at risk!"}
            />
          )}
        </div>

        {/* Warning message */}
        {isAtRisk && streak > 0 && riskMessage && (
          <Paragraph
            content={riskMessage}
            variant={paragraphVariants.meta}
            sx="text-red-400 mt-1"
          />
        )}

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
              isAtRisk && streak > 0 ? "animate-pulse text-red-400" : getFlameColor(streak),
              shouldAnimate && !isAtRisk && "animate-pulse"
            )}
          />
        )}
        <span className={cn(config.number, "text-content-dark")}>{streak}</span>
        {isAtRisk && streak > 0 && (
          <i
            className="gng-alert animate-pulse text-[14px] text-red-400"
            title={riskMessage || "Streak at risk!"}
          />
        )}
      </div>
      {showLabel && (
        <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
      )}
      {isAtRisk && streak > 0 && riskMessage && (
        <Paragraph
          content={riskMessage}
          variant={paragraphVariants.meta}
          sx="text-red-400 mt-1 text-center"
        />
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

// Streak warning badge for inline use
interface StreakWarningBadgeProps {
  streak: number;
  message?: string;
  sx?: string;
}

export const StreakWarningBadge: React.FC<StreakWarningBadgeProps> = ({
  streak,
  message = "Complete now to keep your streak!",
  sx,
}) => {
  if (streak === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2",
        sx
      )}
    >
      <div className="flex items-center gap-1.5">
        <i className="gng-fire animate-pulse text-[18px] text-red-400" />
        <span className="text-sm font-bold text-red-400">{streak}</span>
      </div>
      <div className="h-4 w-px bg-red-400/30" />
      <div className="flex items-center gap-1.5">
        <i className="gng-alert text-[14px] text-red-400" />
        <span className="text-sm text-red-300">{message}</span>
      </div>
    </div>
  );
};

export default StreakDisplay;
