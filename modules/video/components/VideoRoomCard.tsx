"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { VideoRoomWithDetails, roomTypeLabels, VideoRoomStatus } from "@resources/types/video";
import { paragraphVariants } from "@resources/variants";

interface VideoRoomCardProps {
  room: VideoRoomWithDetails;
  onJoin?: () => void;
  onView?: () => void;
  onRSVP?: (status: "accepted" | "declined" | "maybe") => void;
  showActions?: boolean;
  compact?: boolean;
  sx?: string;
}

const statusColors: Record<VideoRoomStatus, string> = {
  scheduled: "bg-action/20 text-action",
  live: "bg-success/20 text-success",
  ended: "bg-content-dark-secondary/20 text-content-dark-secondary",
  cancelled: "bg-danger/20 text-danger",
};

const statusLabels: Record<VideoRoomStatus, string> = {
  scheduled: "Scheduled",
  live: "Live Now",
  ended: "Ended",
  cancelled: "Cancelled",
};

const VideoRoomCard: React.FC<VideoRoomCardProps> = ({
  room,
  onJoin,
  onView,
  onRSVP,
  showActions = true,
  compact = false,
  sx,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isJoinable = room.status === "scheduled" || room.status === "live";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg p-3",
          "bg-bkg-light hover:bg-bkg-light/80 transition-colors",
          "cursor-pointer",
          sx
        )}
        onClick={onView}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn("flex h-10 w-10 items-center justify-center rounded-lg", "bg-action/10")}
          >
            <i className="gng-video text-action text-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <Paragraph
              content={room.title}
              variant={paragraphVariants.meta}
              sx="font-semibold text-content-dark truncate"
            />
            <Paragraph
              content={`${formatDate(room.scheduledStart)} • ${formatTime(room.scheduledStart)}`}
              variant={paragraphVariants.meta}
              sx="text-content-dark-secondary"
            />
          </div>
        </div>
        <span
          className={cn("rounded-full px-2 py-1 text-xs font-medium", statusColors[room.status])}
        >
          {statusLabels[room.status]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-bkg-light border-border-light/20 rounded-xl border p-4",
        "hover:border-action/30 transition-all duration-200",
        sx
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn("flex h-12 w-12 items-center justify-center rounded-xl", "bg-action/10")}
          >
            <i className="gng-video text-action text-[24px]" />
          </div>
          <div>
            <Paragraph
              content={room.title}
              variant={paragraphVariants.regular}
              sx="font-bold text-content-dark"
            />
            <Paragraph
              content={roomTypeLabels[room.roomType]}
              variant={paragraphVariants.meta}
              sx="text-content-dark-secondary"
            />
          </div>
        </div>
        <span
          className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[room.status])}
        >
          {statusLabels[room.status]}
        </span>
      </div>

      {/* Description */}
      {room.description && (
        <Paragraph
          content={room.description}
          variant={paragraphVariants.meta}
          sx="text-content-dark-secondary mb-3 line-clamp-2"
        />
      )}

      {/* Details */}
      <div className="text-content-dark-secondary mb-4 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <i className="gng-calendar text-[14px]" />
          <span className="text-sm">{formatDate(room.scheduledStart)}</span>
        </div>
        <div className="flex items-center gap-1">
          <i className="gng-time text-[14px]" />
          <span className="text-sm">{formatTime(room.scheduledStart)}</span>
        </div>
        {room.participantCount !== undefined && (
          <div className="flex items-center gap-1">
            <i className="gng-users text-[14px]" />
            <span className="text-sm">{room.participantCount} joined</span>
          </div>
        )}
      </div>

      {/* Host info */}
      {room.hostName && (
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-action/20 flex h-6 w-6 items-center justify-center rounded-full">
            <span className="text-action text-xs font-medium">
              {room.hostName.charAt(0).toUpperCase()}
            </span>
          </div>
          <Paragraph
            content={`Hosted by ${room.hostName}`}
            variant={paragraphVariants.meta}
            sx="text-content-dark-secondary"
          />
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          {isJoinable && onJoin && (
            <button
              onClick={onJoin}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium",
                "bg-action hover:bg-action/90 text-white",
                "transition-colors duration-200"
              )}
            >
              {room.status === "live" ? "Join Now" : "Join"}
            </button>
          )}
          {onView && (
            <button
              onClick={onView}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "text-content-dark border-border-light border bg-transparent",
                "hover:bg-bkg-light transition-colors duration-200"
              )}
            >
              Details
            </button>
          )}
          {isJoinable && room.userRsvpStatus === "pending" && onRSVP && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRSVP("accepted")}
                className="hover:bg-success/10 text-success rounded-lg p-2"
                title="Accept"
              >
                <i className="gng-check text-[18px]" />
              </button>
              <button
                onClick={() => onRSVP("declined")}
                className="hover:bg-danger/10 text-danger rounded-lg p-2"
                title="Decline"
              >
                <i className="gng-close text-[18px]" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoRoomCard;
