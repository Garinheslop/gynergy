"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Debounce a value - only updates after delay with no changes
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 *
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   300
 * );
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Throttle a value - updates at most once per interval
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 * ```
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastExecuted.current;

    if (elapsed >= interval) {
      setThrottledValue(value);
      lastExecuted.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }, interval - elapsed);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Throttle a callback function
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottledCallback(
 *   () => updateScrollPosition(),
 *   100
 * );
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 * ```
 */
export function useThrottledCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  interval: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Args) => void {
  const { leading = true, trailing = true } = options;

  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Args | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      const elapsed = now - lastExecuted.current;

      lastArgsRef.current = args;

      if (elapsed >= interval) {
        if (leading) {
          callbackRef.current(...args);
          lastExecuted.current = now;
        }
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (lastArgsRef.current && Date.now() - lastExecuted.current >= interval) {
            callbackRef.current(...lastArgsRef.current);
            lastExecuted.current = Date.now();
          }
        }, interval - elapsed);
      }
    },
    [interval, leading, trailing]
  );
}

/**
 * Debounce with immediate option and cancel/flush methods
 */
interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

export function useAdvancedDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
  options: { immediate?: boolean } = {}
): DebouncedFunction<Args> {
  const { immediate = false } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Args | null>(null);
  const hasBeenCalledRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: Args) => {
      lastArgsRef.current = args;

      if (immediate && !hasBeenCalledRef.current) {
        callbackRef.current(...args);
        hasBeenCalledRef.current = true;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!immediate && lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current);
        }
        hasBeenCalledRef.current = false;
        timeoutRef.current = null;
      }, delay);
    },
    [delay, immediate]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hasBeenCalledRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      hasBeenCalledRef.current = false;
    }
  }, []);

  const pending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  return useMemo(
    () =>
      Object.assign(debouncedFn, {
        cancel,
        flush,
        pending,
      }),
    [debouncedFn, cancel, flush, pending]
  );
}
