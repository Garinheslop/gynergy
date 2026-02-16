"use client";

import { cn } from "@lib/utils/style";

import ActionButton from "../ActionButton";

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
  variant?: "default" | "meditation" | "error" | "success";
}

const sizeStyles = {
  sm: "px-4 py-8",
  md: "px-6 py-12",
  lg: "px-8 py-16",
};

const iconSizeStyles = {
  sm: "h-12 w-12 text-xl",
  md: "h-16 w-16 text-2xl",
  lg: "h-20 w-20 text-3xl",
};

const variantStyles = {
  default: {
    container: "bg-bkg-light-secondary border-border-light",
    icon: "bg-grey-200 text-grey-500",
    title: "text-content-dark",
    description: "text-content-dark-secondary",
  },
  meditation: {
    container: "bg-meditation-bg border-meditation-border",
    icon: "bg-meditation-light text-meditation",
    title: "text-content-dark",
    description: "text-content-dark-secondary",
  },
  error: {
    container: "bg-danger/5 border-danger/20",
    icon: "bg-danger/20 text-danger",
    title: "text-content-dark",
    description: "text-content-dark-secondary",
  },
  success: {
    container: "bg-action-50 border-action-200",
    icon: "bg-action-100 text-action-600",
    title: "text-content-dark",
    description: "text-content-dark-secondary",
  },
};

export function EmptyState({
  icon = "gng-inbox",
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
  variant = "default",
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-large flex flex-col items-center justify-center border border-dashed text-center",
        sizeStyles[size],
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-full",
          iconSizeStyles[size],
          styles.icon
        )}
      >
        <i className={cn(icon)} />
      </div>
      <h3 className={cn("mb-1 text-lg font-semibold", styles.title)}>{title}</h3>
      {description && (
        <p className={cn("mb-4 max-w-sm text-sm", styles.description)}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <ActionButton
              label={action.label}
              onClick={action.onClick}
              sx="!min-h-10 !px-4 !py-2"
            />
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-content-dark-secondary hover:text-content-dark rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Specific empty state variants for common use cases
export function NoJournalEntriesState({ onStart }: { onStart?: () => void }) {
  return (
    <EmptyState
      icon="gng-edit"
      title="No journal entries yet"
      description="Start your journey by writing your first journal entry."
      action={onStart ? { label: "Write Entry", onClick: onStart } : undefined}
      variant="meditation"
    />
  );
}

export function NoHistoryState({ period }: { period?: string }) {
  return (
    <EmptyState
      icon="gng-clock"
      title="No history yet"
      description={
        period
          ? `You don't have any activity for ${period}. Keep going!`
          : "Your activity history will appear here as you progress."
      }
      variant="default"
    />
  );
}

export function NoCommunityPostsState({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      icon="gng-message-circle"
      title="No posts yet"
      description="Be the first to share something with the community!"
      action={onCreatePost ? { label: "Create Post", onClick: onCreatePost } : undefined}
      variant="default"
    />
  );
}

export function NoCommentsState() {
  return (
    <EmptyState
      icon="gng-message-square"
      title="No comments yet"
      description="Be the first to join the conversation."
      size="sm"
      variant="default"
    />
  );
}

export function NoLeaderboardDataState() {
  return (
    <EmptyState
      icon="gng-award"
      title="Leaderboard coming soon"
      description="Complete activities to earn points and climb the ranks!"
      variant="default"
    />
  );
}

export function NoBadgesState() {
  return (
    <EmptyState
      icon="gng-award"
      title="No badges yet"
      description="Complete challenges and activities to unlock badges."
      variant="default"
    />
  );
}

export function NoMeditationsState() {
  return (
    <EmptyState
      icon="gng-headphones"
      title="No meditations available"
      description="New meditations will appear here as they become available."
      variant="meditation"
    />
  );
}

export function NoCoursesState({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon="gng-book-open"
      title="No courses available"
      description="Check back soon for new learning content."
      action={onBrowse ? { label: "Browse Library", onClick: onBrowse } : undefined}
      variant="default"
    />
  );
}

export function ErrorLoadingState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="gng-alert-triangle"
      title="Something went wrong"
      description={message || "We couldn't load this content. Please try again."}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      variant="error"
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="gng-wifi-off"
      title="You're offline"
      description="Check your internet connection and try again."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      variant="error"
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
      icon="gng-check-circle"
      title={title}
      description={message}
      action={action}
      variant="success"
    />
  );
}

export function ComingSoonState({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon="gng-clock"
      title="Coming soon"
      description={`${feature} is currently under development and will be available soon.`}
      variant="default"
    />
  );
}

export default EmptyState;
