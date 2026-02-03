"use client";

import React from "react";

import { useHMSStore, selectConnectionQualityByPeerID } from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";

interface ConnectionQualityProps {
  peerId: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const ConnectionQuality: React.FC<ConnectionQualityProps> = ({
  peerId,
  showLabel = false,
  size = "md",
}) => {
  const connectionQuality = useHMSStore(selectConnectionQualityByPeerID(peerId));
  const score = connectionQuality?.downlinkQuality ?? 5;

  // Map score (0-5) to quality level
  const getQualityInfo = (score: number) => {
    if (score >= 4) {
      return {
        label: "Excellent",
        color: "text-success",
        bgColor: "bg-success",
        bars: 4,
      };
    }
    if (score >= 3) {
      return {
        label: "Good",
        color: "text-action",
        bgColor: "bg-action",
        bars: 3,
      };
    }
    if (score >= 2) {
      return {
        label: "Fair",
        color: "text-warning",
        bgColor: "bg-warning",
        bars: 2,
      };
    }
    return {
      label: "Poor",
      color: "text-danger",
      bgColor: "bg-danger",
      bars: 1,
    };
  };

  const quality = getQualityInfo(score);

  const sizeClasses = {
    sm: { container: "gap-0.5", bar: "w-0.5", heights: [6, 8, 10, 12] },
    md: { container: "gap-1", bar: "w-1", heights: [8, 12, 16, 20] },
    lg: { container: "gap-1.5", bar: "w-1.5", heights: [10, 14, 18, 22] },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {/* Signal bars */}
      <div className={cn("flex items-end", sizeConfig.container)}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "rounded-sm transition-all duration-300",
              sizeConfig.bar,
              index < quality.bars ? quality.bgColor : "bg-white/20"
            )}
            style={{ height: sizeConfig.heights[index] }}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={cn("text-xs font-medium", quality.color)}>{quality.label}</span>
      )}
    </div>
  );
};

// Standalone connection quality indicator for current user
export const LocalConnectionQuality: React.FC<{
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}> = ({ showLabel = true, size: _size = "md" }) => {
  // Note: For local peer, we use a different selector
  // This is a simplified version - in production you'd use selectLocalPeer
  return (
    <div className="bg-bkg-dark/80 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
      <div className="flex items-end gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "bg-success w-1 rounded-sm",
              index === 0 && "h-2",
              index === 1 && "h-3",
              index === 2 && "h-4",
              index === 3 && "h-5"
            )}
          />
        ))}
      </div>
      {showLabel && <span className="text-success text-xs font-medium">Connected</span>}
    </div>
  );
};

export default ConnectionQuality;
