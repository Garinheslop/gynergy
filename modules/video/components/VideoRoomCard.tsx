"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";
import {
  VideoRoomWithDetails,
  roomTypeLabels,
  VideoRoomStatus,
} from "@resources/types/video";

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
          "flex items-center justify-between p-3 rounded-lg",
          "bg-bkg-light hover:bg-bkg-light/80 transition-colors",
          "cursor-pointer",
          sx
        )}
        onClick={onView}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-action/10"
            )}
          >
            <i className="gng-video text-[18px] text-action" />
          </div>
          <div className="flex-1 min-w-0">
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
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            statusColors[room.status]
          )}
        >
          {statusLabels[room.status]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-bkg-light border border-border-light/20",
        "hover:border-action/30 transition-all duration-200",
        sx
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-action/10"
            )}
          >
            <i className="gng-video text-[24px] text-action" />
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
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            statusColors[room.status]
          )}
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
      <div className="flex items-center gap-4 text-content-dark-secondary mb-4">
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
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-action/20 flex items-center justify-center">
            <span className="text-xs font-medium text-action">
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
                "flex-1 px-4 py-2 rounded-lg font-medium text-sm",
                "bg-action text-white hover:bg-action/90",
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
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-transparent text-content-dark border border-border-light",
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
                className="p-2 rounded-lg hover:bg-success/10 text-success"
                title="Accept"
              >
                <i className="gng-check text-[18px]" />
              </button>
              <button
                onClick={() => onRSVP("declined")}
                className="p-2 rounded-lg hover:bg-danger/10 text-danger"
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
