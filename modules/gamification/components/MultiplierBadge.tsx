"use client";
import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface MultiplierBadgeProps {
  multiplier: number;
  name?: string;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "compact" | "pill";
  sx?: string;
}

const MultiplierBadge: React.FC<MultiplierBadgeProps> = ({
  multiplier,
  name,
  showLabel = true,
  size = "medium",
  variant = "default",
  sx,
}) => {
  // No multiplier active
  if (multiplier <= 1) {
    return null;
  }

  const sizeClasses = {
    small: {
      container: "px-2 py-0.5 gap-1",
      text: "text-xs font-bold",
      label: paragraphVariants.meta,
      icon: "text-[12px]",
    },
    medium: {
      container: "px-3 py-1 gap-1.5",
      text: "text-sm font-bold",
      label: paragraphVariants.meta,
      icon: "text-[16px]",
    },
    large: {
      container: "px-4 py-2 gap-2",
      text: "text-lg font-bold",
      label: paragraphVariants.regular,
      icon: "text-[20px]",
    },
  };

  const config = sizeClasses[size];

  // Determine color based on multiplier level
  const getMultiplierColor = () => {
    if (multiplier >= 2.0) return "bg-amber-500/20 text-amber-400 border-amber-400/30";
    if (multiplier >= 1.5) return "bg-purple-500/20 text-purple-400 border-purple-400/30";
    return "bg-action/20 text-action border-action/30";
  };

  // Get glow effect for higher multipliers
  const getGlow = () => {
    if (multiplier >= 2.0) return "shadow-lg shadow-amber-500/20";
    if (multiplier >= 1.5) return "shadow-md shadow-purple-500/20";
    return "";
  };

  if (variant === "compact") {
    return <span className={cn(config.text, "text-action", sx)}>{multiplier}x</span>;
  }

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border",
          config.container,
          getMultiplierColor(),
          getGlow(),
          sx
        )}
      >
        <i className={cn("gng-lightning", config.icon)} />
        <span className={config.text}>{multiplier}x</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center rounded-lg border p-3",
        getMultiplierColor(),
        getGlow(),
        sx
      )}
    >
      <div className="flex items-center gap-1">
        <i className={cn("gng-lightning", config.icon)} />
        <span className={config.text}>{multiplier}x</span>
      </div>
      {showLabel && name && (
        <Paragraph content={name} variant={config.label} sx="text-center opacity-70" />
      )}
    </div>
  );
};

// Multiplier progress indicator showing how close to next tier
interface MultiplierProgressProps {
  currentStreak: number;
  currentMultiplier: number;
  sx?: string;
}

export const MultiplierProgress: React.FC<MultiplierProgressProps> = ({
  currentStreak,
  currentMultiplier,
  sx,
}) => {
  // Define multiplier thresholds
  const thresholds = [
    { streak: 7, multiplier: 1.2, name: "1.2x" },
    { streak: 14, multiplier: 1.5, name: "1.5x" },
    { streak: 30, multiplier: 2.0, name: "2.0x" },
  ];

  // Find next threshold
  const nextThreshold = thresholds.find((t) => currentStreak < t.streak);

  if (!nextThreshold) {
    // Already at max multiplier
    return (
      <div className={cn("flex flex-col items-center gap-2", sx)}>
        <div className="flex items-center gap-2">
          <i className="gng-crown text-[24px] text-amber-400" />
          <span className="font-bold text-amber-400">Max Multiplier!</span>
        </div>
        <Paragraph
          content="You've reached the maximum 2.0x multiplier"
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary text-center"
        />
      </div>
    );
  }

  // Calculate progress to next threshold
  const prevThresholdStreak =
    thresholds.findIndex((t) => t.streak === nextThreshold.streak) > 0
      ? thresholds[thresholds.findIndex((t) => t.streak === nextThreshold.streak) - 1].streak
      : 0;

  const progressStreak = currentStreak - prevThresholdStreak;
  const targetStreak = nextThreshold.streak - prevThresholdStreak;
  const progress = (progressStreak / targetStreak) * 100;

  return (
    <div className={cn("flex flex-col gap-2", sx)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-content-dark-secondary">
          {currentMultiplier > 1 ? `${currentMultiplier}x` : "No multiplier"}
        </span>
        <span className="text-action font-medium">
          {nextThreshold.name} at {nextThreshold.streak} days
        </span>
      </div>
      <div className="bg-bkg-dark/30 h-2 overflow-hidden rounded-full">
        <div
          className="from-action to-action-secondary h-full rounded-full bg-gradient-to-r transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <Paragraph
        content={`${nextThreshold.streak - currentStreak} more days to unlock ${nextThreshold.name}`}
        variant={paragraphVariants.meta}
        sx="text-content-dark-secondary text-center"
      />
    </div>
  );
};

export default MultiplierBadge;
