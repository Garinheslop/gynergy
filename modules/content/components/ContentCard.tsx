"use client";

import React from "react";

import Image from "next/image";

import { cn } from "@lib/utils/style";
import { ContentItemWithProgress, ContentType } from "@resources/types/content";

// =============================================================================
// TYPES
// =============================================================================

interface ContentCardProps {
  content: ContentItemWithProgress;
  onClick?: () => void;
  onBookmark?: () => void;
  className?: string;
  variant?: "default" | "compact" | "horizontal";
}

// =============================================================================
// HELPERS
// =============================================================================

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getContentIcon = (type: ContentType): string => {
  switch (type) {
    case "video":
      return "gng-play-circle";
    case "document":
      return "gng-file-text";
    case "audio":
      return "gng-music";
    case "image":
      return "gng-image";
    default:
      return "gng-file";
  }
};

const getContentLabel = (type: ContentType): string => {
  switch (type) {
    case "video":
      return "Video";
    case "document":
      return "Document";
    case "audio":
      return "Audio";
    case "image":
      return "Image";
    default:
      return "Content";
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onClick,
  onBookmark,
  className,
  variant = "default",
}) => {
  const isCompleted = content.isCompleted;
  const hasProgress = content.progressPercent > 0 && content.progressPercent < 100;

  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg p-3",
          "bg-white transition-colors hover:bg-gray-50",
          "border-border border",
          className
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            content.contentType === "video" && "bg-red-100 text-red-600",
            content.contentType === "document" && "bg-blue-100 text-blue-600",
            content.contentType === "audio" && "bg-purple-100 text-purple-600",
            content.contentType === "image" && "bg-green-100 text-green-600"
          )}
        >
          <i className={getContentIcon(content.contentType)} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="text-content-dark truncate text-sm font-medium">{content.title}</h4>
          <p className="text-content-muted text-xs">
            {getContentLabel(content.contentType)}
            {content.durationSeconds && ` • ${formatDuration(content.durationSeconds)}`}
          </p>
        </div>

        {/* Status */}
        {isCompleted && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <i className="gng-check text-xs text-white" />
          </div>
        )}
        {hasProgress && (
          <div className="text-action w-8 text-xs font-medium">{content.progressPercent}%</div>
        )}
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex cursor-pointer gap-4 rounded-xl p-4",
          "bg-white transition-colors hover:bg-gray-50",
          "border-border border",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
          {content.thumbnailUrl ? (
            <Image src={content.thumbnailUrl} alt={content.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className={cn(getContentIcon(content.contentType), "text-3xl text-gray-400")} />
            </div>
          )}

          {/* Duration badge */}
          {content.durationSeconds && (
            <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
              {formatDuration(content.durationSeconds)}
            </div>
          )}

          {/* Progress overlay */}
          {hasProgress && (
            <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/30">
              <div className="bg-action h-full" style={{ width: `${content.progressPercent}%` }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-content-dark line-clamp-2 font-semibold">{content.title}</h3>
            {onBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark();
                }}
                className={cn(
                  "flex-shrink-0 rounded-full p-1.5 transition-colors",
                  content.isBookmarked
                    ? "text-action hover:text-action/80"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <i className={content.isBookmarked ? "gng-bookmark-fill" : "gng-bookmark"} />
              </button>
            )}
          </div>

          {content.description && (
            <p className="text-content-muted mt-1 line-clamp-2 text-sm">{content.description}</p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                content.contentType === "video" && "bg-red-100 text-red-700",
                content.contentType === "document" && "bg-blue-100 text-blue-700",
                content.contentType === "audio" && "bg-purple-100 text-purple-700",
                content.contentType === "image" && "bg-green-100 text-green-700"
              )}
            >
              {getContentLabel(content.contentType)}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <i className="gng-check-circle" />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer overflow-hidden rounded-xl",
        "bg-white transition-shadow hover:shadow-lg",
        "border-border border",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        {content.thumbnailUrl ? (
          <Image src={content.thumbnailUrl} alt={content.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <i className={cn(getContentIcon(content.contentType), "text-4xl text-gray-400")} />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              content.contentType === "video" && "bg-red-500 text-white",
              content.contentType === "document" && "bg-blue-500 text-white",
              content.contentType === "audio" && "bg-purple-500 text-white",
              content.contentType === "image" && "bg-green-500 text-white"
            )}
          >
            <i className={cn(getContentIcon(content.contentType), "mr-1")} />
            {getContentLabel(content.contentType)}
          </span>
        </div>

        {/* Bookmark button */}
        {onBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className={cn(
              "absolute top-2 right-2 rounded-full p-2 transition-colors",
              content.isBookmarked
                ? "bg-action text-white"
                : "bg-black/30 text-white hover:bg-black/50"
            )}
          >
            <i className={content.isBookmarked ? "gng-bookmark-fill" : "gng-bookmark"} />
          </button>
        )}

        {/* Duration badge */}
        {content.durationSeconds && (
          <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
            {formatDuration(content.durationSeconds)}
          </div>
        )}

        {/* Completed indicator */}
        {isCompleted && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs text-white">
            <i className="gng-check" />
            Completed
          </div>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/30">
            <div
              className="bg-action h-full transition-all"
              style={{ width: `${content.progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="text-content-dark line-clamp-2 min-h-[2.5rem] font-semibold">
          {content.title}
        </h3>

        {content.description && (
          <p className="text-content-muted mt-1 line-clamp-2 text-sm">{content.description}</p>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
