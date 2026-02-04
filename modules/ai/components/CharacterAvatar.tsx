"use client";
import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { CharacterKey } from "@resources/types/ai";
import { paragraphVariants } from "@resources/variants";

interface CharacterAvatarProps {
  characterKey: CharacterKey;
  name?: string;
  showName?: boolean;
  size?: "small" | "medium" | "large";
  isActive?: boolean;
  sx?: string;
}

// Character-specific styles
const characterStyles: Record<CharacterKey, { gradient: string; icon: string }> = {
  yesi: {
    gradient: "from-pink-400 to-rose-500",
    icon: "gng-heart",
  },
  garin: {
    gradient: "from-blue-400 to-indigo-500",
    icon: "gng-lightning",
  },
};

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterKey,
  name,
  showName = false,
  size = "medium",
  isActive = false,
  sx,
}) => {
  const styles = characterStyles[characterKey];
  const displayName = name || (characterKey === "yesi" ? "Yesi" : "Garin");

  const sizeClasses = {
    small: {
      container: "w-8 h-8",
      icon: "text-[14px]",
      ring: "ring-2",
    },
    medium: {
      container: "w-12 h-12",
      icon: "text-[20px]",
      ring: "ring-2",
    },
    large: {
      container: "w-16 h-16",
      icon: "text-[28px]",
      ring: "ring-3",
    },
  };

  const config = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", sx)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-gradient-to-br",
          styles.gradient,
          config.container,
          isActive && [config.ring, "ring-white/50"],
          "transition-all duration-200"
        )}
      >
        <i className={cn(styles.icon, config.icon, "text-white")} />
      </div>
      {showName && (
        <Paragraph
          content={displayName}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary"
        />
      )}
    </div>
  );
};

export default CharacterAvatar;
