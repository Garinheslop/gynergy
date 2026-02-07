"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface NetworkStatus {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Whether connection is slow (based on effectiveType) */
  isSlowConnection: boolean;
  /** Connection type if available */
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | null;
  /** Downlink speed in Mbps if available */
  downlink: number | null;
  /** Round-trip time in ms if available */
  rtt: number | null;
  /** Whether data saver is enabled */
  saveData: boolean;
  /** Time since last online status change */
  lastChanged: Date | null;
}

interface NetworkConnection {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
}

/**
 * Get the Network Information API if available
 */
function getNetworkConnection(): NetworkConnection | null {
  if (typeof navigator === "undefined") return null;

  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };

  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

/**
 * Hook to track network status and connection quality
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isOnline, isSlowConnection } = useNetworkStatus();
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />;
 *   }
 *
 *   if (isSlowConnection) {
 *     return <LowBandwidthMode />;
 *   }
 *
 *   return <FullExperience />;
 * }
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSlowConnection: false,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
    lastChanged: null,
  }));

  const updateNetworkInfo = useCallback(() => {
    const connection = getNetworkConnection();

    setStatus((prev) => ({
      ...prev,
      effectiveType: connection?.effectiveType ?? null,
      downlink: connection?.downlink ?? null,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? false,
      isSlowConnection:
        connection?.effectiveType === "slow-2g" ||
        connection?.effectiveType === "2g" ||
        (connection?.downlink !== undefined && connection.downlink < 1),
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        lastChanged: new Date(),
      }));
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        lastChanged: new Date(),
      }));
    };

    // Initialize
    updateNetworkInfo();

    // Listen to online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen to connection changes if available
    const connection = getNetworkConnection();
    if (connection?.addEventListener) {
      connection.addEventListener("change", updateNetworkInfo);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection?.removeEventListener) {
        connection.removeEventListener("change", updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  return status;
}

/**
 * Hook that shows an offline indicator with auto-dismiss
 */
export function useOfflineIndicator(showDuration = 3000): {
  showOffline: boolean;
  showBackOnline: boolean;
} {
  const { isOnline } = useNetworkStatus();
  const [showOffline, setShowOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOfflineRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      wasOfflineRef.current = true;
    } else {
      setShowOffline(false);

      // Show "back online" message if we were offline
      if (wasOfflineRef.current) {
        setShowBackOnline(true);
        wasOfflineRef.current = false;

        // Auto-hide after duration
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setShowBackOnline(false);
        }, showDuration);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline, showDuration]);

  return { showOffline, showBackOnline };
}

/**
 * Hook to ping a URL to verify actual connectivity
 */
export function useOnlineCheck(
  pingUrl = "/api/health",
  interval = 30000
): {
  isReachable: boolean;
  lastChecked: Date | null;
  checkNow: () => Promise<boolean>;
} {
  const { isOnline } = useNetworkStatus();
  const [isReachable, setIsReachable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkNow = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      setIsReachable(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(pingUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const reachable = response.ok;
      setIsReachable(reachable);
      setLastChecked(new Date());
      return reachable;
    } catch {
      setIsReachable(false);
      setLastChecked(new Date());
      return false;
    }
  }, [isOnline, pingUrl]);

  useEffect(() => {
    // Initial check
    checkNow();

    // Set up interval
    const intervalId = setInterval(checkNow, interval);

    return () => clearInterval(intervalId);
  }, [checkNow, interval]);

  return { isReachable, lastChecked, checkNow };
}

/**
 * Hook to queue operations when offline
 */
interface QueuedOperation<T> {
  id: string;
  operation: () => Promise<T>;
  createdAt: Date;
}

export function useOfflineQueue<T>(): {
  queue: QueuedOperation<T>[];
  addToQueue: (operation: () => Promise<T>) => string;
  removeFromQueue: (id: string) => void;
  processQueue: () => Promise<{ id: string; success: boolean; result?: T; error?: Error }[]>;
  clearQueue: () => void;
} {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedOperation<T>[]>([]);

  const addToQueue = useCallback((operation: () => Promise<T>): string => {
    const id = `op-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQueue((prev) => [...prev, { id, operation, createdAt: new Date() }]);
    return id;
  }, []);

  const removeFromQueue = useCallback((id: string): void => {
    setQueue((prev) => prev.filter((op) => op.id !== id));
  }, []);

  const clearQueue = useCallback((): void => {
    setQueue([]);
  }, []);

  const processQueue = useCallback(async (): Promise<
    { id: string; success: boolean; result?: T; error?: Error }[]
  > => {
    const results: { id: string; success: boolean; result?: T; error?: Error }[] = [];

    for (const op of queue) {
      try {
        const result = await op.operation();
        results.push({ id: op.id, success: true, result });
        removeFromQueue(op.id);
      } catch (error) {
        results.push({
          id: op.id,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return results;
  }, [queue, removeFromQueue]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue.length, processQueue]);

  return { queue, addToQueue, removeFromQueue, processQueue, clearQueue };
}
