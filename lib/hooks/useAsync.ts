"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type AsyncStatus = "idle" | "pending" | "success" | "error";

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  status: AsyncStatus;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseAsyncOptions<T> {
  /** Run immediately on mount */
  immediate?: boolean;
  /** Initial data */
  initialData?: T | null;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback on settle (success or error) */
  onSettled?: (data: T | null, error: Error | null) => void;
  /** Keep previous data while loading */
  keepPreviousData?: boolean;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  /** Execute the async function */
  execute: (...args: Args) => Promise<T | null>;
  /** Reset to initial state */
  reset: () => void;
  /** Set data manually */
  setData: (data: T | null) => void;
  /** Set error manually */
  setError: (error: Error | null) => void;
}

/**
 * Hook for managing async operations with loading, error, and success states
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { data: user, isPending, isError, execute } = useAsync(
 *     (id: string) => fetchUser(id),
 *     { immediate: false }
 *   );
 *
 *   useEffect(() => {
 *     execute(userId);
 *   }, [userId, execute]);
 *
 *   if (isPending) return <Spinner />;
 *   if (isError) return <Error />;
 *   return <User data={user} />;
 * }
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
    onSettled,
    keepPreviousData = false,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    status: "idle",
    isIdle: true,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);

  // Update ref when asyncFn changes
  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState((prev) => ({
        data: keepPreviousData ? prev.data : null,
        error: null,
        status: "pending",
        isIdle: false,
        isPending: true,
        isSuccess: false,
        isError: false,
      }));

      try {
        const data = await asyncFnRef.current(...args);

        if (mountedRef.current) {
          setState({
            data,
            error: null,
            status: "success",
            isIdle: false,
            isPending: false,
            isSuccess: true,
            isError: false,
          });

          onSuccess?.(data);
          onSettled?.(data, null);
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setState((prev) => ({
            data: keepPreviousData ? prev.data : null,
            error,
            status: "error",
            isIdle: false,
            isPending: false,
            isSuccess: false,
            isError: true,
          }));

          onError?.(error);
          onSettled?.(null, error);
        }

        return null;
      }
    },
    [keepPreviousData, onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      status: "idle",
      isIdle: true,
      isPending: false,
      isSuccess: false,
      isError: false,
    });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({
      ...prev,
      data,
      status: data !== null ? "success" : prev.status,
      isSuccess: data !== null,
    }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({
      ...prev,
      error,
      status: error !== null ? "error" : prev.status,
      isError: error !== null,
    }));
  }, []);

  // Run immediately if specified
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

/**
 * Hook for fetching data with automatic refetching
 */
interface UseFetchOptions<T> extends UseAsyncOptions<T> {
  /** Refetch interval in ms */
  refetchInterval?: number;
  /** Refetch on window focus */
  refetchOnFocus?: boolean;
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Enable/disable the query */
  enabled?: boolean;
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions<T> & RequestInit = {}
): UseAsyncReturn<T, []> & { refetch: () => Promise<T | null> } {
  const {
    refetchInterval,
    refetchOnFocus = false,
    refetchOnReconnect = false,
    enabled = true,
    onSuccess,
    onError,
    onSettled,
    initialData,
    keepPreviousData,
    ...fetchOptions
  } = options;

  const fetchFn = useCallback(async (): Promise<T> => {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [url, fetchOptions]);

  const asyncResult = useAsync(fetchFn, {
    immediate: enabled,
    onSuccess,
    onError,
    onSettled,
    initialData,
    keepPreviousData,
  });

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const intervalId = setInterval(() => {
      asyncResult.execute();
    }, refetchInterval);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchInterval, enabled, asyncResult.execute]);

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      asyncResult.execute();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchOnFocus, enabled, asyncResult.execute]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;

    const handleOnline = () => {
      asyncResult.execute();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchOnReconnect, enabled, asyncResult.execute]);

  return {
    ...asyncResult,
    refetch: asyncResult.execute,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
interface MutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | null, error: Error | null, variables: V) => void;
  onMutate?: (variables: V) => void;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> = {}
): {
  mutate: (variables: V) => void;
  mutateAsync: (variables: V) => Promise<T>;
  data: T | null;
  error: Error | null;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
} {
  const { onSuccess, onError, onSettled, onMutate } = options;

  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    status: AsyncStatus;
  }>({
    data: null,
    error: null,
    status: "idle",
  });

  const mutateAsync = useCallback(
    async (variables: V): Promise<T> => {
      setState({ data: null, error: null, status: "pending" });
      onMutate?.(variables);

      try {
        const data = await mutationFn(variables);
        setState({ data, error: null, status: "success" });
        onSuccess?.(data, variables);
        onSettled?.(data, null, variables);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, error, status: "error" });
        onError?.(error, variables);
        onSettled?.(null, error, variables);
        throw error;
      }
    },
    [mutationFn, onSuccess, onError, onSettled, onMutate]
  );

  const mutate = useCallback(
    (variables: V) => {
      mutateAsync(variables).catch(() => {
        // Error is handled via state
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, status: "idle" });
  }, []);

  return {
    mutate,
    mutateAsync,
    data: state.data,
    error: state.error,
    isIdle: state.status === "idle",
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    reset,
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimistic<T, V>(
  data: T,
  updateFn: (current: T, optimisticValue: V) => T
): [T, (value: V) => void] {
  const [optimisticData, setOptimisticData] = useState(data);
  const pendingRef = useRef(false);

  // Sync with actual data when not pending
  useEffect(() => {
    if (!pendingRef.current) {
      setOptimisticData(data);
    }
  }, [data]);

  const addOptimistic = useCallback(
    (value: V) => {
      pendingRef.current = true;
      setOptimisticData((current) => updateFn(current, value));

      // Reset pending after a short delay (for animation purposes)
      setTimeout(() => {
        pendingRef.current = false;
      }, 100);
    },
    [updateFn]
  );

  return [optimisticData, addOptimistic];
}
