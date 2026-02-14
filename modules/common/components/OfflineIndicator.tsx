"use client";

import { useEffect, useState } from "react";

import { useNetworkStatus, useOfflineIndicator } from "@lib/hooks/useNetworkStatus";
import { QueueStatus } from "@lib/hooks/useOfflineQueuePersisted";
import { cn } from "@lib/utils/style";

// =============================================================================
// OFFLINE BANNER
// =============================================================================

interface OfflineBannerProps {
  className?: string;
  /** Custom message when offline */
  offlineMessage?: string;
  /** Custom message when back online */
  onlineMessage?: string;
  /** Position of the banner */
  position?: "top" | "bottom";
}

export function OfflineBanner({
  className,
  offlineMessage = "You're offline. Changes will sync when you reconnect.",
  onlineMessage = "You're back online!",
  position = "bottom",
}: OfflineBannerProps) {
  const { showOffline, showBackOnline } = useOfflineIndicator();

  if (!showOffline && !showBackOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-0 left-0 z-50 flex items-center justify-center px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        position === "top" ? "top-0" : "bottom-0",
        showOffline && "bg-amber-500 text-white",
        showBackOnline && "bg-green-500 text-white",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showOffline && (
          <>
            <WifiOffIcon className="h-4 w-4" />
            <span>{offlineMessage}</span>
          </>
        )}
        {showBackOnline && (
          <>
            <WifiIcon className="h-4 w-4" />
            <span>{onlineMessage}</span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SYNC STATUS INDICATOR
// =============================================================================

interface SyncStatusIndicatorProps {
  queueStatus: QueueStatus;
  className?: string;
  /** Show when queue is empty */
  showWhenEmpty?: boolean;
}

export function SyncStatusIndicator({
  queueStatus,
  className,
  showWhenEmpty = false,
}: SyncStatusIndicatorProps) {
  const { isOnline } = useNetworkStatus();

  if (!showWhenEmpty && queueStatus.totalPending === 0 && !queueStatus.processing) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        queueStatus.processing && "bg-blue-100 text-blue-700",
        !queueStatus.processing &&
          queueStatus.totalPending > 0 &&
          isOnline &&
          "bg-amber-100 text-amber-700",
        !queueStatus.processing &&
          queueStatus.totalPending > 0 &&
          !isOnline &&
          "bg-gray-100 text-gray-600",
        queueStatus.totalPending === 0 && "bg-green-100 text-green-700",
        className
      )}
    >
      {queueStatus.processing ? (
        <>
          <SpinnerIcon className="h-3 w-3 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : queueStatus.totalPending > 0 ? (
        <>
          {isOnline ? <CloudQueueIcon className="h-3 w-3" /> : <WifiOffIcon className="h-3 w-3" />}
          <span>
            {queueStatus.totalPending} pending
            {queueStatus.failedCount > 0 && ` (${queueStatus.failedCount} failed)`}
          </span>
        </>
      ) : (
        <>
          <CheckIcon className="h-3 w-3" />
          <span>Synced</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// FLOATING SYNC BADGE
// =============================================================================

interface FloatingSyncBadgeProps {
  queueStatus: QueueStatus;
  className?: string;
  /** Position of the badge */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Click handler */
  onClick?: () => void;
}

export function FloatingSyncBadge({
  queueStatus,
  className,
  position = "bottom-right",
  onClick,
}: FloatingSyncBadgeProps) {
  const { isOnline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);

  // Show badge when there are pending items or processing
  useEffect(() => {
    if (queueStatus.totalPending > 0 || queueStatus.processing) {
      setVisible(true);
    } else {
      // Fade out after a delay when queue is empty
      const timeout = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [queueStatus.totalPending, queueStatus.processing]);

  if (!visible) {
    return null;
  }

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed z-40 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all duration-300",
        positionClasses[position],
        queueStatus.processing && "bg-blue-500 text-white",
        !queueStatus.processing &&
          queueStatus.totalPending > 0 &&
          !isOnline &&
          "bg-amber-500 text-white",
        !queueStatus.processing &&
          queueStatus.totalPending > 0 &&
          isOnline &&
          "bg-blue-500 text-white",
        queueStatus.totalPending === 0 && "bg-green-500 text-white",
        className
      )}
    >
      {queueStatus.processing ? (
        <>
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Syncing</span>
        </>
      ) : queueStatus.totalPending > 0 ? (
        <>
          {isOnline ? <CloudQueueIcon className="h-4 w-4" /> : <WifiOffIcon className="h-4 w-4" />}
          <span className="text-sm font-medium">{queueStatus.totalPending}</span>
        </>
      ) : (
        <>
          <CheckIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Synced</span>
        </>
      )}
    </button>
  );
}

// =============================================================================
// CONNECTION QUALITY INDICATOR
// =============================================================================

interface ConnectionQualityProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionQualityIndicator({
  className,
  showLabel = true,
}: ConnectionQualityProps) {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className={cn("flex items-center gap-1.5 text-red-500", className)}>
        <WifiOffIcon className="h-4 w-4" />
        {showLabel && <span className="text-xs">Offline</span>}
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className={cn("flex items-center gap-1.5 text-amber-500", className)}>
        <WifiLowIcon className="h-4 w-4" />
        {showLabel && <span className="text-xs">Slow ({effectiveType || "weak"})</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-green-500", className)}>
      <WifiIcon className="h-4 w-4" />
      {showLabel && <span className="text-xs">Online</span>}
    </div>
  );
}

// =============================================================================
// ICONS (Inline SVGs to avoid dependency)
// =============================================================================

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
      />
    </svg>
  );
}

function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  );
}

function WifiLowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CloudQueueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default OfflineBanner;
