"use client";

import { useState, useEffect, useRef, type ReactNode, Suspense } from "react";

import { cn } from "@lib/utils/style";

interface LazyLoadProps {
  /** Content to lazy load */
  children: ReactNode;
  /** Placeholder while loading */
  placeholder?: ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Whether to unload when out of view (default false) */
  unloadOnHide?: boolean;
  /** Minimum height for placeholder */
  minHeight?: number | string;
  /** Class name */
  className?: string;
  /** Callback when content becomes visible */
  onVisible?: () => void;
}

/**
 * Lazy load content when it enters the viewport
 *
 * @example
 * ```tsx
 * <LazyLoad placeholder={<Skeleton />}>
 *   <HeavyComponent />
 * </LazyLoad>
 *
 * <LazyLoad rootMargin="100px" onVisible={() => trackImpression()}>
 *   <AdBanner />
 * </LazyLoad>
 * ```
 */
export function LazyLoad({
  children,
  placeholder,
  rootMargin = "100px",
  threshold = 0,
  unloadOnHide = false,
  minHeight,
  className,
  onVisible,
}: LazyLoadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is available
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
          onVisible?.();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, hasBeenVisible, onVisible]);

  // Determine what to render
  const shouldRender = unloadOnHide ? isVisible : hasBeenVisible;

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: !shouldRender ? minHeight : undefined }}
    >
      {shouldRender
        ? children
        : placeholder || (
            <div
              className="bg-grey-800 animate-pulse rounded"
              style={{ minHeight: minHeight || 100 }}
            />
          )}
    </div>
  );
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback({
  height,
  className,
}: {
  height?: number | string;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-grey-800/50 flex items-center justify-center rounded-lg", className)}
      style={{ minHeight: height || 100 }}
    >
      <div className="text-grey-400 flex items-center gap-2">
        <span className="border-grey-600 border-t-action-500 h-4 w-4 animate-spin rounded-full border-2" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Wrapper component for lazy loading with Suspense
 *
 * @example
 * ```tsx
 * const LazyChart = lazy(() => import('./HeavyChart'));
 *
 * // Usage
 * <LazyLoadWrapper height={300}>
 *   <LazyChart data={chartData} />
 * </LazyLoadWrapper>
 * ```
 */
interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  height?: number | string;
}

export function LazyLoadWrapper({ children, fallback, height }: LazyLoadWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback height={height} />}>
      {children}
    </Suspense>
  );
}

/**
 * Lazy image component with blur placeholder
 */
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholderColor?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholderColor = "#1f2937",
  objectFit = "cover",
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width,
        height,
        backgroundColor: placeholderColor,
      }}
    >
      {/* Placeholder/loading state */}
      {!isLoaded && !hasError && <div className="bg-grey-700 absolute inset-0 animate-pulse" />}

      {/* Error state */}
      {hasError && (
        <div className="bg-grey-800 absolute inset-0 flex items-center justify-center">
          <i className="gng-image-off text-grey-500 text-2xl" />
        </div>
      )}

      {/* Image - using native img for lazy loading control */}
      <LazyLoad rootMargin="200px">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ objectFit }}
        />
      </LazyLoad>
    </div>
  );
}

/**
 * Hook for lazy loading data
 */
interface UseLazyLoadOptions<T> {
  load: () => Promise<T>;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseLazyLoadResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  load: () => Promise<void>;
  reset: () => void;
}

export function useLazyLoad<T>({
  load,
  enabled = true,
  onSuccess,
  onError,
}: UseLazyLoadOptions<T>): UseLazyLoadResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoaded = useRef(false);

  const loadData = async () => {
    if (hasLoaded.current || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await load();
      setData(result);
      hasLoaded.current = true;
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load");
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
    hasLoaded.current = false;
  };

  useEffect(() => {
    if (enabled && !hasLoaded.current) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { data, isLoading, error, load: loadData, reset };
}

/**
 * Component that loads data when visible
 */
interface LazyDataProps<T> {
  load: () => Promise<T>;
  children: (data: T) => ReactNode;
  placeholder?: ReactNode;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
  rootMargin?: string;
  className?: string;
}

export function LazyData<T>({
  load,
  children,
  placeholder,
  errorFallback,
  rootMargin = "100px",
  className,
}: LazyDataProps<T>) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    load: reload,
  } = useLazyLoad<T>({
    load,
    enabled: isVisible,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {error && errorFallback
        ? errorFallback(error, reload)
        : isLoading || !data
          ? placeholder || <DefaultLoadingFallback />
          : children(data)}
    </div>
  );
}
