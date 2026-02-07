"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Performance metrics from the browser
 */
interface PerformanceMetrics {
  /** Time to First Byte */
  ttfb: number | null;
  /** First Contentful Paint */
  fcp: number | null;
  /** Largest Contentful Paint */
  lcp: number | null;
  /** First Input Delay */
  fid: number | null;
  /** Cumulative Layout Shift */
  cls: number | null;
  /** Time to Interactive (approximate) */
  tti: number | null;
  /** DOM Content Loaded */
  domContentLoaded: number | null;
  /** Window Load */
  windowLoad: number | null;
}

/**
 * Hook to track Core Web Vitals and other performance metrics
 *
 * @example
 * ```tsx
 * function PerformanceMonitor() {
 *   const { metrics, isLoading } = usePerformanceMetrics();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <p>LCP: {metrics.lcp}ms</p>
 *       <p>FID: {metrics.fid}ms</p>
 *       <p>CLS: {metrics.cls}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMetrics(): {
  metrics: PerformanceMetrics;
  isLoading: boolean;
} {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ttfb: null,
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    tti: null,
    domContentLoaded: null,
    windowLoad: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) {
      setIsLoading(false);
      return;
    }

    // Get navigation timing
    const getNavigationMetrics = () => {
      const entries = performance.getEntriesByType("navigation");
      if (entries.length > 0) {
        const navEntry = entries[0] as PerformanceNavigationTiming;
        setMetrics((prev) => ({
          ...prev,
          ttfb: navEntry.responseStart - navEntry.requestStart,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
          windowLoad: navEntry.loadEventEnd - navEntry.startTime,
        }));
      }
    };

    // Get paint timing
    const getPaintMetrics = () => {
      const entries = performance.getEntriesByType("paint");
      for (const entry of entries) {
        if (entry.name === "first-contentful-paint") {
          setMetrics((prev) => ({
            ...prev,
            fcp: entry.startTime,
          }));
        }
      }
    };

    // Observe LCP
    let lcpObserver: PerformanceObserver | null = null;
    if ("PerformanceObserver" in window) {
      try {
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics((prev) => ({
            ...prev,
            lcp: lastEntry.startTime,
          }));
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // LCP not supported
      }
    }

    // Observe FID
    let fidObserver: PerformanceObserver | null = null;
    if ("PerformanceObserver" in window) {
      try {
        fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const fidEntry = entries[0] as PerformanceEventTiming;
            setMetrics((prev) => ({
              ...prev,
              fid: fidEntry.processingStart - fidEntry.startTime,
            }));
          }
        });
        fidObserver.observe({ type: "first-input", buffered: true });
      } catch {
        // FID not supported
      }
    }

    // Observe CLS
    let clsObserver: PerformanceObserver | null = null;
    let clsValue = 0;
    if ("PerformanceObserver" in window) {
      try {
        clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const layoutShift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!layoutShift.hadRecentInput && layoutShift.value) {
              clsValue += layoutShift.value;
              setMetrics((prev) => ({
                ...prev,
                cls: clsValue,
              }));
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch {
        // CLS not supported
      }
    }

    // Get initial metrics
    getNavigationMetrics();
    getPaintMetrics();

    // Mark loading complete
    setTimeout(() => setIsLoading(false), 100);

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);

  return { metrics, isLoading };
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string): {
  renderTime: number | null;
  markRenderStart: () => void;
  markRenderEnd: () => void;
} {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const markRenderStart = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const markRenderEnd = useCallback(() => {
    if (startTimeRef.current !== null) {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      setRenderTime(duration);

      // Log to performance marks
      if (typeof performance !== "undefined" && performance.mark) {
        performance.mark(`${componentName}-render-end`);
        try {
          performance.measure(
            `${componentName}-render`,
            `${componentName}-render-start`,
            `${componentName}-render-end`
          );
        } catch {
          // Marks might not exist
        }
      }
    }
  }, [componentName]);

  // Mark start on mount
  useEffect(() => {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`${componentName}-render-start`);
    }
    markRenderStart();
  }, [componentName, markRenderStart]);

  return { renderTime, markRenderStart, markRenderEnd };
}

/**
 * Hook to track long tasks (tasks > 50ms)
 */
export function useLongTasks(options: { threshold?: number } = {}): {
  longTasks: Array<{ startTime: number; duration: number }>;
  clearTasks: () => void;
} {
  const { threshold = 50 } = options;
  const [longTasks, setLongTasks] = useState<Array<{ startTime: number; duration: number }>>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    let observer: PerformanceObserver | null = null;

    try {
      observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.duration > threshold) {
            setLongTasks((prev) => [
              ...prev.slice(-99), // Keep last 100
              { startTime: entry.startTime, duration: entry.duration },
            ]);
          }
        }
      });

      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Long tasks not supported
    }

    return () => {
      observer?.disconnect();
    };
  }, [threshold]);

  const clearTasks = useCallback(() => {
    setLongTasks([]);
  }, []);

  return { longTasks, clearTasks };
}

/**
 * Hook to measure async operation duration
 */
export function useAsyncTiming(): {
  start: () => void;
  end: () => number;
  duration: number | null;
  reset: () => void;
} {
  const [duration, setDuration] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    setDuration(null);
  }, []);

  const end = useCallback((): number => {
    if (startTimeRef.current === null) {
      return 0;
    }
    const endTime = performance.now();
    const dur = endTime - startTimeRef.current;
    setDuration(dur);
    return dur;
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    setDuration(null);
  }, []);

  return { start, end, duration, reset };
}

/**
 * Hook to detect if device is low-end
 */
export function useIsLowEndDevice(): boolean {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4;

    // Check device memory (in GB)
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

    // Check connection type
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } })
      .connection;
    const connectionType = connection?.effectiveType;

    // Determine if low-end
    const isLowEndDevice =
      cores <= 2 ||
      (memory !== undefined && memory <= 2) ||
      connectionType === "slow-2g" ||
      connectionType === "2g";

    setIsLowEnd(isLowEndDevice);
  }, []);

  return isLowEnd;
}

/**
 * Hook to track memory usage
 */
export function useMemoryUsage(): {
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
  usagePercent: number | null;
} {
  const [memory, setMemory] = useState<{
    usedJSHeapSize: number | null;
    totalJSHeapSize: number | null;
    jsHeapSizeLimit: number | null;
    usagePercent: number | null;
  }>({
    usedJSHeapSize: null,
    totalJSHeapSize: null,
    jsHeapSizeLimit: null,
    usagePercent: null,
  });

  useEffect(() => {
    if (typeof performance === "undefined") return;

    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (!perf.memory) return;

    const updateMemory = () => {
      if (perf.memory) {
        const used = perf.memory.usedJSHeapSize;
        const limit = perf.memory.jsHeapSizeLimit;
        setMemory({
          usedJSHeapSize: used,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: limit,
          usagePercent: limit > 0 ? (used / limit) * 100 : null,
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);

    return () => clearInterval(interval);
  }, []);

  return memory;
}
