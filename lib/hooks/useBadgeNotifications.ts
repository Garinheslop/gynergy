"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UserBadge, CelebrationEvent } from "@resources/types/gamification";

interface BadgeNotificationState {
  newBadges: UserBadge[];
  pendingCelebrations: CelebrationEvent[];
  currentCelebration: CelebrationEvent | null;
  isPolling: boolean;
  lastChecked: Date | null;
}

interface UseBadgeNotificationsOptions {
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onNewBadge?: (badge: UserBadge) => void;
  onCelebration?: (event: CelebrationEvent) => void;
  persistKey?: string; // localStorage key for persisting state
}

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_PREFIX = "gynergy_badge_notifications_";

export function useBadgeNotifications(options: UseBadgeNotificationsOptions = {}) {
  const {
    enabled = true,
    pollInterval = DEFAULT_POLL_INTERVAL,
    onNewBadge,
    onCelebration,
    persistKey = "default",
  } = options;

  const [state, setState] = useState<BadgeNotificationState>(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${persistKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            lastChecked: parsed.lastChecked ? new Date(parsed.lastChecked) : null,
            currentCelebration: null,
            isPolling: false,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    return {
      newBadges: [],
      pendingCelebrations: [],
      currentCelebration: null,
      isPolling: false,
      lastChecked: null,
    };
  });

  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const onNewBadgeRef = useRef(onNewBadge);
  const onCelebrationRef = useRef(onCelebration);
  const persistKeyRef = useRef(persistKey);

  // Keep refs in sync with latest callback values
  useEffect(() => {
    onNewBadgeRef.current = onNewBadge;
    onCelebrationRef.current = onCelebration;
    persistKeyRef.current = persistKey;
  }, [onNewBadge, onCelebration, persistKey]);

  // Persist state to localStorage (stable — no state/callback dependencies)
  const persistState = useCallback((newState: Partial<BadgeNotificationState>) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${persistKeyRef.current}`,
          JSON.stringify({
            newBadges: newState.newBadges ?? [],
            pendingCelebrations: newState.pendingCelebrations ?? [],
            lastChecked: newState.lastChecked ?? null,
          })
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  // Check for new badges
  const checkForNewBadges = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState((prev) => ({ ...prev, isPolling: true }));

    try {
      const res = await fetch("/api/gamification/new-badges");
      if (!res.ok) throw new Error("Failed to fetch new badges");

      const data = await res.json();
      const newBadges: UserBadge[] = data.badges || [];

      if (newBadges.length > 0 && isMountedRef.current) {
        // Create celebration events for each new badge
        const celebrations: CelebrationEvent[] = newBadges.map((badge) => ({
          id: `badge-${badge.id}-${Date.now()}`,
          type: "badge" as const,
          priority: getBadgePriority(badge),
          data: {
            badge: badge.badge,
            userBadge: badge,
          },
          createdAt: new Date().toISOString(),
        }));

        setState((prev) => {
          const updatedState = {
            ...prev,
            newBadges: [...prev.newBadges, ...newBadges],
            pendingCelebrations: [...prev.pendingCelebrations, ...celebrations].sort(
              (a, b) => b.priority - a.priority
            ),
            lastChecked: new Date(),
            isPolling: false,
          };
          persistState(updatedState);
          return updatedState;
        });

        // Notify for each new badge via ref (avoids dependency instability)
        newBadges.forEach((badge) => {
          onNewBadgeRef.current?.(badge);
        });
      } else {
        setState((prev) => {
          const updatedState = {
            ...prev,
            lastChecked: new Date(),
            isPolling: false,
          };
          persistState(updatedState);
          return updatedState;
        });
      }
    } catch (error) {
      console.error("Error checking for new badges:", error);
      setState((prev) => ({ ...prev, isPolling: false }));
    }
  }, [persistState]);

  // Show next celebration
  const showNextCelebration = useCallback(() => {
    setState((prev) => {
      if (prev.pendingCelebrations.length === 0) {
        return { ...prev, currentCelebration: null };
      }

      const [next, ...remaining] = prev.pendingCelebrations;
      onCelebrationRef.current?.(next);

      return {
        ...prev,
        currentCelebration: next,
        pendingCelebrations: remaining,
      };
    });
  }, []);

  // Dismiss current celebration
  const dismissCelebration = useCallback(() => {
    setState((prev) => ({ ...prev, currentCelebration: null }));
  }, []);

  // Mark badges as seen
  const markBadgesAsSeen = useCallback(
    async (badgeIds: string[]) => {
      try {
        await fetch("/api/gamification/mark-seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeIds }),
        });

        setState((prev) => {
          const seenSet = new Set(badgeIds);
          const remaining = prev.newBadges.filter((b) => !seenSet.has(b.id));
          const updatedState = { ...prev, newBadges: remaining };
          persistState(updatedState);
          return updatedState;
        });
      } catch (error) {
        console.error("Error marking badges as seen:", error);
      }
    },
    [persistState]
  );

  // Clear all notifications
  const clearAll = useCallback(() => {
    setState((prev) => {
      const cleared = {
        ...prev,
        newBadges: [],
        pendingCelebrations: [],
        currentCelebration: null,
      };
      persistState(cleared);
      return cleared;
    });
  }, [persistState]);

  // Set up polling (single setInterval, no recursive chains)
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return () => {
        isMountedRef.current = false;
      };
    }

    // Initial check
    checkForNewBadges();

    // Single interval — checkForNewBadges is stable so this effect
    // only fires on mount/unmount, preventing parallel polling chains
    pollTimeoutRef.current = setInterval(() => {
      checkForNewBadges();
    }, pollInterval);

    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [enabled, pollInterval, checkForNewBadges]);

  // Auto-show celebrations
  useEffect(() => {
    if (!state.currentCelebration && state.pendingCelebrations.length > 0) {
      // Small delay to prevent rapid-fire popups
      const timeout = setTimeout(showNextCelebration, 500);
      return () => clearTimeout(timeout);
    }
  }, [state.currentCelebration, state.pendingCelebrations.length, showNextCelebration]);

  return {
    // State
    newBadges: state.newBadges,
    newBadgeCount: state.newBadges.length,
    pendingCelebrations: state.pendingCelebrations,
    currentCelebration: state.currentCelebration,
    isPolling: state.isPolling,
    lastChecked: state.lastChecked,
    hasPendingCelebrations: state.pendingCelebrations.length > 0,

    // Actions
    checkForNewBadges,
    showNextCelebration,
    dismissCelebration,
    markBadgesAsSeen,
    clearAll,
  };
}

// Helper to calculate badge priority (higher = more important)
function getBadgePriority(badge: UserBadge): number {
  const rarityPriority: Record<string, number> = {
    legendary: 100,
    epic: 80,
    rare: 60,
    uncommon: 40,
    common: 20,
  };

  return rarityPriority[badge.badge?.rarity || "common"] || 20;
}

export default useBadgeNotifications;
