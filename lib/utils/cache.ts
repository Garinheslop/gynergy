/**
 * In-Memory Request Cache
 *
 * Provides caching for API responses with TTL, stale-while-revalidate,
 * and automatic cleanup.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Time before data is considered stale (default: ttl / 2) */
  staleTime?: number;
  /** Maximum number of entries (default: 100) */
  maxEntries?: number;
}

/**
 * Simple in-memory cache with TTL and LRU eviction
 */
export class RequestCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes
      staleTime: options.staleTime ?? (options.ttl ?? 5 * 60 * 1000) / 2,
      maxEntries: options.maxEntries ?? 100,
    };

    // Set up periodic cleanup
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Get a value from cache
   */
  get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now >= entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);

    return {
      data: entry.data,
      isStale: now >= entry.staleAt,
    };
  }

  /**
   * Set a value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const effectiveTtl = ttl ?? this.options.ttl;

    // Evict if at capacity
    if (this.cache.size >= this.options.maxEntries && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + effectiveTtl,
      staleAt: now + (ttl ? ttl / 2 : this.options.staleTime),
    });

    this.updateAccessOrder(key);
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() >= entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
    };
  }

  /**
   * Get or set with async fetch
   */
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl, forceRefresh = false } = options;

    // Check cache first
    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached && !cached.isStale) {
        return cached.data;
      }
    }

    // Fetch fresh data
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async swr(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; onRevalidate?: (data: T) => void } = {}
  ): Promise<T> {
    const { ttl, onRevalidate } = options;
    const cached = this.get(key);

    // Return cached data immediately if available
    if (cached) {
      // If stale, revalidate in background
      if (cached.isStale) {
        fetcher()
          .then((data) => {
            this.set(key, data, ttl);
            onRevalidate?.(data);
          })
          .catch(() => {
            // Ignore revalidation errors, stale data is still valid
          });
      }
      return cached.data;
    }

    // No cache, fetch synchronously
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (pattern.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate entries with a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now >= entry.expiresAt) {
        this.delete(key);
      }
    }
  }
}

// Global cache instance
const globalCache = new RequestCache();

/**
 * Global cache helpers
 */
export const cache = {
  get: <T>(key: string) => globalCache.get(key) as { data: T; isStale: boolean } | null,
  set: <T>(key: string, data: T, ttl?: number) => globalCache.set(key, data, ttl),
  delete: (key: string) => globalCache.delete(key),
  has: (key: string) => globalCache.has(key),
  clear: () => globalCache.clear(),
  stats: () => globalCache.stats(),
  getOrFetch: <T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }) =>
    globalCache.getOrFetch(key, fetcher, options) as Promise<T>,
  swr: <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; onRevalidate?: (data: T) => void }
  ) =>
    globalCache.swr(
      key,
      fetcher,
      options as { ttl?: number; onRevalidate?: (data: unknown) => void }
    ) as Promise<T>,
  invalidatePattern: (pattern: RegExp) => globalCache.invalidatePattern(pattern),
  invalidatePrefix: (prefix: string) => globalCache.invalidatePrefix(prefix),
};

/**
 * Create a cache key from an object
 */
export function createCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");
  return `${prefix}:${sortedParams}`;
}

/**
 * Decorator to cache method results
 */
export function cached(options: CacheOptions & { keyPrefix?: string } = {}) {
  const methodCache = new RequestCache(options);

  return function <T>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ): TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>> {
    const originalMethod = descriptor.value;
    const prefix = options.keyPrefix ?? propertyKey;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const key = `${prefix}:${JSON.stringify(args)}`;
      const cached = methodCache.get(key);

      if (cached && !cached.isStale) {
        return cached.data as T;
      }

      const result = await originalMethod?.apply(this, args);
      if (result !== undefined) {
        methodCache.set(key, result);
      }

      return result as T;
    };

    return descriptor;
  };
}

/**
 * Memoize a function with cache
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: CacheOptions & { keyFn?: (...args: Args) => string } = {}
): (...args: Args) => Promise<Result> {
  const fnCache = new RequestCache<Result>(options);
  const keyFn = options.keyFn ?? ((...args: Args) => JSON.stringify(args));

  return async (...args: Args): Promise<Result> => {
    const key = keyFn(...args);
    return fnCache.getOrFetch(key, () => fn(...args));
  };
}
