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
  className?: string;
}

export function EmptyState({
  icon = "gng-inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-grey-700 bg-grey-900/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <div className="bg-grey-800 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <i className={cn(icon, "text-grey-500 text-3xl")} />
      </div>
      <h3 className="mb-1 text-lg font-medium text-white">{title}</h3>
      {description && <p className="text-grey-400 mb-4 max-w-sm text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-action-600 hover:bg-action-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Specific empty state variants
export function NoResultsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon="gng-search"
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
      icon="gng-plus-circle"
      title={`No ${resource} yet`}
      description={`Get started by adding your first ${resource.toLowerCase()}.`}
      action={onAdd ? { label: `Add ${resource}`, onClick: onAdd } : undefined}
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="gng-alert-circle"
      title="Something went wrong"
      description={message || "An error occurred while loading data."}
      action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
      className="border-danger/30 bg-danger/5"
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
