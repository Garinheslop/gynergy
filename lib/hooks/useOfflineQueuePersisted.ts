"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useNetworkStatus } from "./useNetworkStatus";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Serializable representation of an API operation
 * This can be stored in localStorage
 */
export interface SerializedOperation {
  id: string;
  type: "api";
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

export interface OperationResult {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export interface QueueStatus {
  totalPending: number;
  processing: boolean;
  lastProcessedAt: string | null;
  failedCount: number;
}

const STORAGE_KEY = "gynergy_offline_queue";
const MAX_RETRIES_DEFAULT = 3;

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

function getStoredQueue(): SerializedOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SerializedOperation[];
  } catch {
    return [];
  }
}

function saveQueue(queue: SerializedOperation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save offline queue:", error);
  }
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseOfflineQueuePersistedOptions {
  /** Auto-process queue when coming back online */
  autoProcess?: boolean;
  /** Interval to check and process queue (ms) */
  processInterval?: number;
  /** Maximum retries per operation */
  maxRetries?: number;
  /** Callback when operation succeeds */
  onSuccess?: (result: OperationResult) => void;
  /** Callback when operation fails */
  onError?: (result: OperationResult) => void;
  /** Callback when queue processing starts */
  onProcessStart?: () => void;
  /** Callback when queue processing ends */
  onProcessEnd?: (results: OperationResult[]) => void;
}

export function useOfflineQueuePersisted(options: UseOfflineQueuePersistedOptions = {}) {
  const {
    autoProcess = true,
    processInterval = 30000,
    maxRetries = MAX_RETRIES_DEFAULT,
    onSuccess,
    onError,
    onProcessStart,
    onProcessEnd,
  } = options;

  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<SerializedOperation[]>([]);
  const [status, setStatus] = useState<QueueStatus>({
    totalPending: 0,
    processing: false,
    lastProcessedAt: null,
    failedCount: 0,
  });
  const processingRef = useRef(false);
  const initializedRef = useRef(false);

  // Load queue from storage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const stored = getStoredQueue();
    if (stored.length > 0) {
      setQueue(stored);
      setStatus((prev) => ({
        ...prev,
        totalPending: stored.length,
        failedCount: stored.filter((op) => op.retryCount > 0).length,
      }));
    }
  }, []);

  // Save queue to storage whenever it changes
  useEffect(() => {
    if (!initializedRef.current) return;
    saveQueue(queue);
    setStatus((prev) => ({
      ...prev,
      totalPending: queue.length,
      failedCount: queue.filter((op) => op.retryCount > 0).length,
    }));
  }, [queue]);

  /**
   * Add an API operation to the queue
   */
  const enqueue = useCallback(
    (
      method: SerializedOperation["method"],
      endpoint: string,
      body?: Record<string, unknown>,
      metadata?: Record<string, unknown>
    ): string => {
      const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const operation: SerializedOperation = {
        id,
        type: "api",
        method,
        endpoint,
        body,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries,
        metadata,
      };

      setQueue((prev) => [...prev, operation]);
      return id;
    },
    [maxRetries]
  );

  /**
   * Remove an operation from the queue
   */
  const remove = useCallback((id: string): void => {
    setQueue((prev) => prev.filter((op) => op.id !== id));
  }, []);

  /**
   * Clear all operations from the queue
   */
  const clear = useCallback((): void => {
    setQueue([]);
    saveQueue([]);
  }, []);

  /**
   * Execute a single operation
   */
  const executeOperation = useCallback(
    async (operation: SerializedOperation): Promise<OperationResult> => {
      try {
        const response = await fetch(operation.endpoint, {
          method: operation.method,
          headers: {
            "Content-Type": "application/json",
            ...operation.headers,
          },
          body: operation.body ? JSON.stringify(operation.body) : undefined,
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
          return {
            id: operation.id,
            success: true,
            data,
            statusCode: response.status,
          };
        }

        return {
          id: operation.id,
          success: false,
          error: data?.error || `HTTP ${response.status}`,
          statusCode: response.status,
        };
      } catch (error) {
        return {
          id: operation.id,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    },
    []
  );

  /**
   * Process all pending operations in the queue
   */
  const processQueue = useCallback(async (): Promise<OperationResult[]> => {
    if (processingRef.current || queue.length === 0 || !isOnline) {
      return [];
    }

    processingRef.current = true;
    setStatus((prev) => ({ ...prev, processing: true }));
    onProcessStart?.();

    const results: OperationResult[] = [];
    const remainingOps: SerializedOperation[] = [];

    for (const op of queue) {
      const result = await executeOperation(op);
      results.push(result);

      if (result.success) {
        onSuccess?.(result);
      } else {
        // Check if we should retry
        if (op.retryCount < op.maxRetries) {
          remainingOps.push({
            ...op,
            retryCount: op.retryCount + 1,
          });
        } else {
          onError?.(result);
        }
      }
    }

    setQueue(remainingOps);
    setStatus((prev) => ({
      ...prev,
      processing: false,
      lastProcessedAt: new Date().toISOString(),
    }));

    processingRef.current = false;
    onProcessEnd?.(results);

    return results;
  }, [queue, isOnline, executeOperation, onSuccess, onError, onProcessStart, onProcessEnd]);

  // Auto-process when coming back online
  useEffect(() => {
    if (autoProcess && isOnline && queue.length > 0 && !processingRef.current) {
      // Small delay to ensure connection is stable
      const timeoutId = setTimeout(() => {
        processQueue();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [autoProcess, isOnline, queue.length, processQueue]);

  // Periodic processing interval
  useEffect(() => {
    if (!autoProcess || processInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (isOnline && queue.length > 0 && !processingRef.current) {
        processQueue();
      }
    }, processInterval);

    return () => clearInterval(intervalId);
  }, [autoProcess, processInterval, isOnline, queue.length, processQueue]);

  return {
    /** Current queue of pending operations */
    queue,
    /** Queue status info */
    status,
    /** Add operation to queue */
    enqueue,
    /** Remove operation from queue */
    remove,
    /** Clear entire queue */
    clear,
    /** Manually process queue */
    processQueue,
    /** Whether currently online */
    isOnline,
  };
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for queuing journal saves when offline
 */
export function useOfflineJournalQueue() {
  return useOfflineQueuePersisted({
    onSuccess: (result) => {
      console.log("Journal synced:", result.id);
    },
    onError: (result) => {
      console.error("Journal sync failed:", result.id, result.error);
    },
  });
}

/**
 * Hook for queuing community actions when offline
 */
export function useOfflineCommunityQueue() {
  return useOfflineQueuePersisted({
    maxRetries: 2, // Fewer retries for community actions
    onSuccess: (result) => {
      console.log("Community action synced:", result.id);
    },
    onError: (result) => {
      console.error("Community action sync failed:", result.id, result.error);
    },
  });
}
