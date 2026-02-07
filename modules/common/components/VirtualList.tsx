"use client";

import { useRef, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";

import { cn } from "@lib/utils/style";

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container */
  containerHeight: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of items to render outside the visible area */
  overscan?: number;
  /** Key extractor function */
  getKey?: (item: T, index: number) => string | number;
  /** Class name for the container */
  className?: string;
  /** Class name for the scroll container */
  scrollClassName?: string;
  /** Callback when scrolling */
  onScroll?: (scrollTop: number) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Loading indicator */
  loadingIndicator?: ReactNode;
  /** Empty state */
  emptyState?: ReactNode;
}

/**
 * Virtualized list component for efficient rendering of large lists
 *
 * Only renders items that are visible in the viewport plus a configurable
 * overscan buffer, dramatically improving performance for large datasets.
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={users}
 *   itemHeight={64}
 *   containerHeight={400}
 *   renderItem={(user) => (
 *     <UserCard user={user} />
 *   )}
 *   getKey={(user) => user.id}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  getKey,
  className,
  scrollClassName,
  onScroll,
  isLoading,
  loadingIndicator,
  emptyState,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  // Visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Total height
  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Reset scroll on items change
  useEffect(() => {
    setScrollTop(0);
  }, [items]);

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {emptyState || <p className="text-grey-400 text-sm">No items to display</p>}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {loadingIndicator || (
          <div className="text-grey-400 flex items-center gap-2">
            <span className="border-grey-600 border-t-action-500 h-4 w-4 animate-spin rounded-full border-2" />
            <span className="text-sm">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", scrollClassName)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div className={className} style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getKey ? getKey(item, actualIndex) : actualIndex;

            return (
              <div key={key} style={{ height: itemHeight }} className="flex items-center">
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual list with variable item heights
 */
interface VariableVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, measureRef: (el: HTMLElement | null) => void) => ReactNode;
  overscan?: number;
  getKey?: (item: T, index: number) => string | number;
  className?: string;
}

export function VariableVirtualList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  getKey,
  className,
}: VariableVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());

  // Calculate item positions
  const { itemPositions, totalHeight } = useMemo(() => {
    const positions: number[] = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      positions.push(currentTop);
      currentTop += measuredHeights.get(i) || estimatedItemHeight;
    }

    return {
      itemPositions: positions,
      totalHeight: currentTop,
    };
  }, [items.length, measuredHeights, estimatedItemHeight]);

  // Find visible range using binary search
  const { startIndex, endIndex } = useMemo(() => {
    // Binary search to find start index
    let start = 0;
    let end = items.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (itemPositions[mid] < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIdx = Math.max(0, start - overscan);

    // Find end index
    const viewportBottom = scrollTop + containerHeight;
    let endIdx = start;
    while (endIdx < items.length && itemPositions[endIdx] < viewportBottom) {
      endIdx++;
    }
    endIdx = Math.min(items.length, endIdx + overscan);

    return { startIndex: startIdx, endIndex: endIdx };
  }, [scrollTop, containerHeight, itemPositions, items.length, overscan]);

  // Measure item height
  const createMeasureRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        const height = el.getBoundingClientRect().height;
        if (height !== measuredHeights.get(index)) {
          setMeasuredHeights((prev) => {
            const next = new Map(prev);
            next.set(index, height);
            return next;
          });
        }
      }
    },
    [measuredHeights]
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const key = getKey ? getKey(item, actualIndex) : actualIndex;
          const top = itemPositions[actualIndex];

          return (
            <div
              key={key}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, actualIndex, createMeasureRef(actualIndex))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple infinite scroll list
 */
interface InfiniteListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore?: boolean;
  threshold?: number;
  getKey?: (item: T, index: number) => string | number;
  className?: string;
}

export function InfiniteList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  hasMore,
  loadMore,
  isLoadingMore,
  threshold = 200,
  getKey,
  className,
}: InfiniteListProps<T>) {
  const handleScroll = useCallback(
    (scrollTop: number) => {
      const totalHeight = items.length * itemHeight;
      const scrollBottom = scrollTop + containerHeight;

      if (hasMore && !isLoadingMore && totalHeight - scrollBottom < threshold) {
        loadMore();
      }
    },
    [items.length, itemHeight, containerHeight, hasMore, isLoadingMore, threshold, loadMore]
  );

  return (
    <>
      <VirtualList
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        getKey={getKey}
        onScroll={handleScroll}
        className={className}
      />
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <span className="border-grey-600 border-t-action-500 h-5 w-5 animate-spin rounded-full border-2" />
        </div>
      )}
    </>
  );
}
