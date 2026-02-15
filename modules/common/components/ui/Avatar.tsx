"use client";

import { useState, useMemo, ReactNode } from "react";

import Image from "next/image";

import { cn } from "@lib/utils/style";

// Types
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type AvatarStatus = "online" | "offline" | "busy" | "away";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
  fallbackClassName?: string;
}

// Size configurations
const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: {
    container: "h-6 w-6",
    text: "text-xs",
    status: "h-2 w-2 border",
  },
  sm: {
    container: "h-8 w-8",
    text: "text-xs",
    status: "h-2.5 w-2.5 border-2",
  },
  md: {
    container: "h-10 w-10",
    text: "text-sm",
    status: "h-3 w-3 border-2",
  },
  lg: {
    container: "h-12 w-12",
    text: "text-base",
    status: "h-3.5 w-3.5 border-2",
  },
  xl: {
    container: "h-16 w-16",
    text: "text-lg",
    status: "h-4 w-4 border-2",
  },
  "2xl": {
    container: "h-24 w-24",
    text: "text-2xl",
    status: "h-5 w-5 border-2",
  },
};

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-success",
  offline: "bg-grey-500",
  busy: "bg-danger",
  away: "bg-warning",
};

// Helper to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Helper to generate consistent background color from name
function getColorFromName(name: string): string {
  const colors = [
    "bg-action-600",
    "bg-purple",
    "bg-success",
    "bg-warning",
    "bg-danger",
    "bg-action-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  className,
  fallbackClassName,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  const initials = useMemo(() => (name ? getInitials(name) : "?"), [name]);
  const bgColor = useMemo(() => (name ? getColorFromName(name) : "bg-grey-600"), [name]);

  return (
    <div
      className={cn("relative inline-flex shrink-0", sizeStyles[size].container, className)}
      role="img"
      aria-label={alt || name || "User avatar"}
    >
      {showFallback ? (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full font-medium text-white",
            bgColor,
            sizeStyles[size].text,
            fallbackClassName
          )}
        >
          {initials}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt || name || "User avatar"}
          fill
          className="rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {status && (
        <span
          className={cn(
            "border-grey-900 absolute right-0 bottom-0 rounded-full",
            sizeStyles[size].status,
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

// Avatar group component for stacking avatars
interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ children, max, size = "md", className }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max ? Math.max(0, childArray.length - max) : 0;

  return (
    <div className={cn("flex -space-x-2", className)} role="group" aria-label="User avatars">
      {visibleAvatars.map((child, index) => (
        <div key={index} className="ring-grey-900 relative rounded-full ring-2">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "bg-grey-700 text-grey-300 ring-grey-900 relative flex items-center justify-center rounded-full font-medium ring-2",
            sizeStyles[size].container,
            sizeStyles[size].text
          )}
          aria-label={`${remainingCount} more users`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar skeleton for loading state
interface AvatarSkeletonProps {
  size?: AvatarSize;
  className?: string;
}

export function AvatarSkeleton({ size = "md", className }: AvatarSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-grey-700 animate-pulse rounded-full",
        sizeStyles[size].container,
        className
      )}
      aria-hidden="true"
    />
  );
}
