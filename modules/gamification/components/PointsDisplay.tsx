"use client";
import React, { useEffect, useState, useRef } from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";

interface PointsDisplayProps {
  points: number;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "compact" | "detailed";
  breakdown?: {
    base: number;
    multiplier: number;
    bonus: number;
  };
  sx?: string;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  showLabel = true,
  label = "Total Points",
  animate = true,
  size = "medium",
  variant = "default",
  breakdown,
  sx,
}) => {
  const [displayedPoints, setDisplayedPoints] = useState(animate ? 0 : points);
  const prevPointsRef = useRef(points);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate point changes
  useEffect(() => {
    if (!animate) {
      setDisplayedPoints(points);
      return;
    }

    const prevPoints = prevPointsRef.current;
    const diff = points - prevPoints;

    if (diff === 0) {
      setDisplayedPoints(points);
      return;
    }

    setIsAnimating(true);
    const duration = Math.min(Math.abs(diff) * 20, 1000); // Max 1 second animation
    const startTime = Date.now();
    const startValue = prevPoints;

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + diff * easeOut);

      setDisplayedPoints(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setIsAnimating(false);
        prevPointsRef.current = points;
      }
    };

    requestAnimationFrame(animateValue);

    return () => {
      prevPointsRef.current = points;
    };
  }, [points, animate]);

  const sizeClasses = {
    small: {
      container: "gap-1",
      points: "text-xl font-bold",
      label: paragraphVariants.meta,
      icon: "text-[16px]",
    },
    medium: {
      container: "gap-2",
      points: "text-3xl font-bold",
      label: paragraphVariants.meta,
      icon: "text-[24px]",
    },
    large: {
      container: "gap-3",
      points: "text-5xl font-bold",
      label: paragraphVariants.regular,
      icon: "text-[32px]",
    },
  };

  const config = sizeClasses[size];

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", sx)}>
        <i className={cn("gng-star text-action", config.icon)} />
        <span className={cn(config.points, "text-content-dark", isAnimating && "text-action")}>
          {displayedPoints.toLocaleString()}
        </span>
      </div>
    );
  }

  if (variant === "detailed" && breakdown) {
    return (
      <div className={cn("flex flex-col", config.container, sx)}>
        {showLabel && (
          <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
        )}
        <div className="flex items-center gap-2">
          <i className={cn("gng-star text-action", config.icon)} />
          <span className={cn(config.points, "text-content-dark", isAnimating && "text-action")}>
            {displayedPoints.toLocaleString()}
          </span>
        </div>
        <div className="text-content-dark-secondary mt-2 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>Base</span>
            <span>+{breakdown.base}</span>
          </div>
          {breakdown.multiplier > 1 && (
            <div className="text-action flex justify-between">
              <span>{breakdown.multiplier}x Multiplier</span>
              <span>x{breakdown.multiplier}</span>
            </div>
          )}
          {breakdown.bonus > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Bonus</span>
              <span>+{breakdown.bonus}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", config.container, sx)}>
      {showLabel && (
        <Paragraph content={label} variant={config.label} sx="text-content-dark-secondary" />
      )}
      <div className="flex items-center gap-2">
        <i className={cn("gng-star text-action", config.icon)} />
        <span
          className={cn(
            config.points,
            "text-content-dark transition-colors duration-200",
            isAnimating && "text-action"
          )}
        >
          {displayedPoints.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// Points earned indicator (for showing +X points after actions)
interface PointsEarnedProps {
  points: number;
  multiplier?: number;
  showMultiplier?: boolean;
  onComplete?: () => void;
  sx?: string;
}

export const PointsEarned: React.FC<PointsEarnedProps> = ({
  points,
  multiplier = 1,
  showMultiplier = true,
  onComplete,
  sx,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={cn(
        "bg-action/20 flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        sx
      )}
    >
      <i className="gng-star text-action text-[20px]" />
      <span className="text-action font-bold">+{points}</span>
      {showMultiplier && multiplier > 1 && (
        <span className="text-action/70 text-sm">({multiplier}x)</span>
      )}
    </div>
  );
};

export default PointsDisplay;
