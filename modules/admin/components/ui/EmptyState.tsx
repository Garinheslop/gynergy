"use client";

import { cn } from "@lib/utils/style";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
  illustration?: "search" | "empty" | "error" | "success" | "chart" | "users";
}

// SVG Illustrations for empty states
const illustrations = {
  search: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <circle cx="52" cy="52" r="32" className="stroke-grey-700" strokeWidth="4" fill="none" />
      <line
        x1="76"
        y1="76"
        x2="100"
        y2="100"
        className="stroke-grey-700"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="52" cy="52" r="16" className="fill-grey-800" />
      <circle cx="46" cy="46" r="4" className="fill-grey-700" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <rect
        x="20"
        y="30"
        width="80"
        height="60"
        rx="8"
        className="fill-grey-800 stroke-grey-700"
        strokeWidth="2"
      />
      <rect x="30" y="45" width="60" height="6" rx="3" className="fill-grey-700" />
      <rect x="30" y="57" width="40" height="6" rx="3" className="fill-grey-700" />
      <rect x="30" y="69" width="50" height="6" rx="3" className="fill-grey-700" />
      <circle cx="90" cy="30" r="16" className="fill-action-900" />
      <path
        d="M84 30 L90 36 L96 24"
        className="stroke-action-400"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <circle cx="60" cy="60" r="40" className="fill-error/10 stroke-error/30" strokeWidth="2" />
      <circle cx="60" cy="60" r="28" className="fill-grey-900" />
      <path d="M60 45 L60 65" className="stroke-error" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="75" r="3" className="fill-error" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <circle
        cx="60"
        cy="60"
        r="40"
        className="fill-action-900/30 stroke-action-500/30"
        strokeWidth="2"
      />
      <circle cx="60" cy="60" r="28" className="fill-action-900" />
      <path
        d="M45 60 L55 70 L75 50"
        className="stroke-action-400"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <rect x="20" y="80" width="16" height="25" rx="4" className="fill-grey-700" />
      <rect x="42" y="60" width="16" height="45" rx="4" className="fill-grey-700" />
      <rect x="64" y="40" width="16" height="65" rx="4" className="fill-action-900" />
      <rect x="86" y="55" width="16" height="50" rx="4" className="fill-grey-700" />
      <path
        d="M20 35 Q50 20, 72 30 T100 25"
        className="stroke-action-400"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="72" cy="30" r="5" className="fill-action-400" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
      <circle cx="60" cy="40" r="20" className="fill-grey-800 stroke-grey-700" strokeWidth="2" />
      <circle cx="60" cy="35" r="8" className="fill-grey-700" />
      <path d="M48 50 Q60 60, 72 50" className="stroke-grey-700" strokeWidth="2" fill="none" />
      <ellipse
        cx="60"
        cy="90"
        rx="35"
        ry="18"
        className="fill-grey-800 stroke-grey-700"
        strokeWidth="2"
      />
      <circle cx="30" cy="50" r="12" className="fill-grey-900 stroke-grey-700" strokeWidth="1" />
      <circle cx="90" cy="50" r="12" className="fill-grey-900 stroke-grey-700" strokeWidth="1" />
    </svg>
  ),
};

export function EmptyState({
  icon = "gng-inbox",
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
  illustration,
}: EmptyStateProps) {
  const sizeStyles = {
    sm: "px-4 py-8",
    md: "px-6 py-12",
    lg: "px-8 py-16",
  };

  const illustrationSize = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  return (
    <div
      className={cn(
        "border-grey-700 bg-grey-900/50 flex flex-col items-center justify-center rounded-xl border border-dashed text-center",
        sizeStyles[size],
        className
      )}
    >
      {illustration ? (
        <div className={cn("mb-4", illustrationSize[size])}>{illustrations[illustration]}</div>
      ) : (
        <div className="bg-grey-800 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <i className={cn(icon, "text-grey-500 text-3xl")} />
        </div>
      )}
      <h3 className="mb-1 text-lg font-medium text-white">{title}</h3>
      {description && <p className="text-grey-400 mb-4 max-w-sm text-sm">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="bg-action-600 hover:bg-action-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-grey-400 hover:text-grey-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Specific empty state variants
export function NoResultsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={
        query
          ? `No items match "${query}". Try adjusting your search or filters.`
          : "Try adjusting your search or filters."
      }
      action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
    />
  );
}

export function NoDataState({ resource, onAdd }: { resource: string; onAdd?: () => void }) {
  return (
    <EmptyState
      illustration="empty"
      title={`No ${resource} yet`}
      description={`Get started by adding your first ${resource.toLowerCase()}.`}
      action={onAdd ? { label: `Add ${resource}`, onClick: onAdd } : undefined}
    />
  );
}

export function NoUsersState({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      illustration="users"
      title="No users found"
      description="Users who match your criteria will appear here."
      action={onInvite ? { label: "Invite users", onClick: onInvite } : undefined}
    />
  );
}

export function NoChartDataState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      illustration="chart"
      title="No data to display"
      description="Data will appear here once there's activity to track."
      action={onRefresh ? { label: "Refresh data", onClick: onRefresh } : undefined}
      size="sm"
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      illustration="error"
      title="Something went wrong"
      description={message || "An error occurred while loading data."}
      action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
      className="border-error/20 bg-error/5"
    />
  );
}

export function SuccessState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <EmptyState
      illustration="success"
      title={title}
      description={message}
      action={action}
      className="border-action-500/20 bg-action-900/10"
    />
  );
}

export function NoAccessState() {
  return (
    <EmptyState
      icon="gng-lock"
      title="Access denied"
      description="You don't have permission to view this content."
    />
  );
}

export function ComingSoonState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon="gng-clock"
      title="Coming soon"
      description={`${feature} is currently under development and will be available soon.`}
    />
  );
}

export function MaintenanceState() {
  return (
    <EmptyState
      icon="gng-tool"
      title="Under maintenance"
      description="This feature is temporarily unavailable while we make improvements."
    />
  );
}
