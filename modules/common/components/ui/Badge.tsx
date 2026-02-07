"use client";

import { cn } from "@lib/utils/style";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-grey-700 text-grey-200",
  success: "bg-success/20 text-success border border-success/30",
  warning: "bg-warning/20 text-warning border border-warning/30",
  danger: "bg-danger/20 text-danger border border-danger/30",
  info: "bg-action-500/20 text-action-300 border border-action-500/30",
  purple: "bg-purple/20 text-purple border border-purple/30",
  outline: "bg-transparent text-grey-300 border border-grey-600",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs gap-1",
  md: "px-2 py-1 text-xs gap-1.5",
  lg: "px-3 py-1.5 text-sm gap-2",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  dot,
  removable,
  onRemove,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "danger" && "bg-danger",
            variant === "info" && "bg-action-400",
            variant === "purple" && "bg-purple",
            (variant === "default" || variant === "outline") && "bg-grey-400"
          )}
        />
      )}
      {icon && <i className={cn(icon, size === "sm" ? "text-xs" : "text-sm")} />}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
          aria-label="Remove"
        >
          <i className="gng-close text-xs" />
        </button>
      )}
    </span>
  );
}

// Status badge with predefined styles
interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "completed" | "failed" | "cancelled";
  size?: BadgeSize;
  className?: string;
}

const statusConfig: Record<StatusBadgeProps["status"], { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "default" },
};

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  );
}

// Count badge (for notifications, etc.)
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: "danger" | "info" | "default";
  className?: string;
}

export function CountBadge({ count, max = 99, variant = "danger", className }: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
        variant === "danger" && "bg-danger text-white",
        variant === "info" && "bg-action-500 text-white",
        variant === "default" && "bg-grey-600 text-white",
        className
      )}
    >
      {displayCount}
    </span>
  );
}
