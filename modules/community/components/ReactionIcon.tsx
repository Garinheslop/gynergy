"use client";

import { FC } from "react";

import { cn } from "@lib/utils/style";
import { ReactionType, REACTION_ICONS } from "@resources/types/community";

interface ReactionIconProps {
  type: ReactionType;
  size?: "sm" | "md" | "lg";
  className?: string;
  colored?: boolean;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const ReactionIcon: FC<ReactionIconProps> = ({ type, size = "md", className, colored = true }) => {
  const config = REACTION_ICONS[type];
  if (!config) return null;

  return (
    <svg
      className={cn(SIZES[size], className)}
      fill="none"
      viewBox={config.viewBox || "0 0 24 24"}
      stroke={colored ? config.color : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={config.svgPath} />
    </svg>
  );
};

export default ReactionIcon;
