"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

/**
 * URL State Management Hook
 *
 * Sync React state with URL query parameters for shareable, bookmarkable UI states.
 */

/**
 * Value serializer interface
 */
interface Serializer<T> {
  parse: (value: string) => T;
  stringify: (value: T) => string;
}

/**
 * Built-in serializers
 */
export const serializers = {
  string: {
    parse: (value: string) => value,
    stringify: (value: string) => value,
  } as Serializer<string>,

  number: {
    parse: (value: string) => Number(value),
    stringify: (value: number) => String(value),
  } as Serializer<number>,

  boolean: {
    parse: (value: string) => value === "true" || value === "1",
    stringify: (value: boolean) => (value ? "true" : "false"),
  } as Serializer<boolean>,

  date: {
    parse: (value: string) => new Date(value),
    stringify: (value: Date) => value.toISOString(),
  } as Serializer<Date>,

  json: <T>(): Serializer<T> => ({
    parse: (value: string) => JSON.parse(decodeURIComponent(value)),
    stringify: (value: T) => encodeURIComponent(JSON.stringify(value)),
  }),

  array: <T>(itemSerializer: Serializer<T>, separator = ","): Serializer<T[]> => ({
    parse: (value: string) =>
      value
        .split(separator)
        .filter(Boolean)
        .map((v) => itemSerializer.parse(v)),
    stringify: (value: T[]) => value.map((v) => itemSerializer.stringify(v)).join(separator),
  }),
};

/**
 * Options for useUrlState hook
 */
interface UseUrlStateOptions<T> {
  defaultValue: T;
  serializer?: Serializer<T>;
  replace?: boolean;
  shallow?: boolean;
}

/**
 * Single URL parameter state hook
 *
 * @example
 * ```tsx
 * const [page, setPage] = useUrlState('page', {
 *   defaultValue: 1,
 *   serializer: serializers.number
 * });
 * ```
 */
export function useUrlState<T>(
  key: string,
  options: UseUrlStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const { defaultValue, serializer, replace = true, shallow = true } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current value from URL
  const currentValue = useMemo(() => {
    const urlValue = searchParams.get(key);
    if (urlValue === null) return defaultValue;

    try {
      if (serializer) {
        return serializer.parse(urlValue);
      }
      return urlValue as unknown as T;
    } catch {
      return defaultValue;
    }
  }, [searchParams, key, defaultValue, serializer]);

  // Update URL with new value
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const newValue =
        typeof value === "function" ? (value as (prev: T) => T)(currentValue) : value;

      const params = new URLSearchParams(searchParams.toString());

      // Serialize value
      let stringValue: string;
      if (serializer) {
        stringValue = serializer.stringify(newValue);
      } else {
        stringValue = String(newValue);
      }

      // Remove param if it equals default value
      if (newValue === defaultValue || stringValue === "") {
        params.delete(key);
      } else {
        params.set(key, stringValue);
      }

      // Build new URL
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Navigate
      if (shallow) {
        window.history[replace ? "replaceState" : "pushState"](null, "", newUrl);
      } else {
        if (replace) {
          router.replace(newUrl);
        } else {
          router.push(newUrl);
        }
      }
    },
    [currentValue, searchParams, key, defaultValue, serializer, pathname, router, replace, shallow]
  );

  return [currentValue, setValue];
}

/**
 * Multiple URL parameters state hook
 *
 * @example
 * ```tsx
 * const [params, setParams] = useUrlParams({
 *   page: { defaultValue: 1, serializer: serializers.number },
 *   sort: { defaultValue: 'date' },
 *   filter: { defaultValue: '', serializer: serializers.string }
 * });
 * ```
 */
export function useUrlParams<T extends Record<string, UseUrlStateOptions<unknown>>>(
  schema: T
): [
  { [K in keyof T]: T[K]["defaultValue"] },
  (
    updates:
      | Partial<{ [K in keyof T]: T[K]["defaultValue"] }>
      | ((prev: { [K in keyof T]: T[K]["defaultValue"] }) => Partial<{
          [K in keyof T]: T[K]["defaultValue"];
        }>)
  ) => void,
  { reset: () => void; remove: (keys: (keyof T)[]) => void },
] {
  type Values = { [K in keyof T]: T[K]["defaultValue"] };

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse all values from URL
  const values = useMemo(() => {
    const result = {} as Values;

    for (const [key, options] of Object.entries(schema)) {
      const urlValue = searchParams.get(key);

      if (urlValue === null) {
        result[key as keyof T] = options.defaultValue as Values[keyof T];
      } else {
        try {
          if (options.serializer) {
            result[key as keyof T] = options.serializer.parse(urlValue) as Values[keyof T];
          } else {
            result[key as keyof T] = urlValue as unknown as Values[keyof T];
          }
        } catch {
          result[key as keyof T] = options.defaultValue as Values[keyof T];
        }
      }
    }

    return result;
  }, [searchParams, schema]);

  // Update URL with new values
  const setValues = useCallback(
    (updates: Partial<Values> | ((prev: Values) => Partial<Values>)) => {
      const newValues = typeof updates === "function" ? updates(values) : updates;
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(newValues)) {
        const options = schema[key];
        if (!options) continue;

        let stringValue: string;
        if (options.serializer) {
          stringValue = options.serializer.stringify(value);
        } else {
          stringValue = String(value);
        }

        if (value === options.defaultValue || stringValue === "") {
          params.delete(key);
        } else {
          params.set(key, stringValue);
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState(null, "", newUrl);
    },
    [values, searchParams, schema, pathname]
  );

  // Reset all params to defaults
  const reset = useCallback(() => {
    window.history.replaceState(null, "", pathname);
  }, [pathname]);

  // Remove specific params
  const remove = useCallback(
    (keys: (keyof T)[]) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of keys) {
        params.delete(key as string);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState(null, "", newUrl);
    },
    [searchParams, pathname]
  );

  return [values, setValues, { reset, remove }];
}

/**
 * Pagination URL state hook
 *
 * @example
 * ```tsx
 * const pagination = useUrlPagination({ pageSize: 20 });
 * // pagination.page, pagination.setPage, pagination.nextPage, etc.
 * ```
 */
export function useUrlPagination(options: {
  pageSize?: number;
  pageKey?: string;
  pageSizeKey?: string;
}): {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
} {
  const { pageSize: defaultPageSize = 10, pageKey = "page", pageSizeKey = "pageSize" } = options;

  const [page, setPage] = useUrlState(pageKey, {
    defaultValue: 1,
    serializer: serializers.number,
  });

  const [pageSize, setPageSize] = useUrlState(pageSizeKey, {
    defaultValue: defaultPageSize,
    serializer: serializers.number,
  });

  const nextPage = useCallback(() => setPage((p) => p + 1), [setPage]);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [setPage]);
  const reset = useCallback(() => setPage(1), [setPage]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    reset,
  };
}

/**
 * Sorting URL state hook
 *
 * @example
 * ```tsx
 * const sorting = useUrlSorting<User>({
 *   defaultField: 'createdAt',
 *   defaultDirection: 'desc'
 * });
 * ```
 */
export function useUrlSorting<T>(options: {
  defaultField: keyof T;
  defaultDirection?: "asc" | "desc";
  fieldKey?: string;
  directionKey?: string;
}): {
  field: keyof T;
  direction: "asc" | "desc";
  setSort: (field: keyof T, direction?: "asc" | "desc") => void;
  toggleDirection: () => void;
  reset: () => void;
} {
  const {
    defaultField,
    defaultDirection = "asc",
    fieldKey = "sortBy",
    directionKey = "sortDir",
  } = options;

  const [field, setField] = useUrlState(fieldKey, {
    defaultValue: defaultField as string,
    serializer: serializers.string,
  });

  const [direction, setDirection] = useUrlState(directionKey, {
    defaultValue: defaultDirection,
    serializer: serializers.string,
  });

  const setSort = useCallback(
    (newField: keyof T, newDirection?: "asc" | "desc") => {
      setField(newField as string);
      if (newDirection) {
        setDirection(newDirection);
      }
    },
    [setField, setDirection]
  );

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "asc" ? "desc" : "asc"));
  }, [setDirection]);

  const reset = useCallback(() => {
    setField(defaultField as string);
    setDirection(defaultDirection);
  }, [setField, setDirection, defaultField, defaultDirection]);

  return {
    field: field as keyof T,
    direction: direction as "asc" | "desc",
    setSort,
    toggleDirection,
    reset,
  };
}

/**
 * Tab URL state hook
 *
 * @example
 * ```tsx
 * const { activeTab, setTab, tabs } = useUrlTabs({
 *   tabs: ['overview', 'settings', 'billing'] as const,
 *   defaultTab: 'overview'
 * });
 * ```
 */
export function useUrlTabs<T extends readonly string[]>(options: {
  tabs: T;
  defaultTab: T[number];
  key?: string;
}): {
  activeTab: T[number];
  setTab: (tab: T[number]) => void;
  tabs: T;
  isActive: (tab: T[number]) => boolean;
} {
  const { tabs, defaultTab, key = "tab" } = options;

  const [activeTab, setActiveTab] = useUrlState(key, {
    defaultValue: defaultTab,
    serializer: serializers.string,
  });

  // Validate tab exists
  const validTab = tabs.includes(activeTab as T[number]) ? activeTab : defaultTab;

  const setTab = useCallback(
    (tab: T[number]) => {
      if (tabs.includes(tab)) {
        setActiveTab(tab);
      }
    },
    [tabs, setActiveTab]
  );

  const isActive = useCallback((tab: T[number]) => validTab === tab, [validTab]);

  return {
    activeTab: validTab as T[number],
    setTab,
    tabs,
    isActive,
  };
}

/**
 * Filter URL state hook
 *
 * @example
 * ```tsx
 * const { filters, setFilter, clearFilter, clearAll } = useUrlFilters({
 *   status: { defaultValue: 'all' },
 *   category: { defaultValue: [] as string[], serializer: serializers.array(serializers.string) }
 * });
 * ```
 */
export function useUrlFilters<T extends Record<string, UseUrlStateOptions<unknown>>>(
  schema: T
): {
  filters: { [K in keyof T]: T[K]["defaultValue"] };
  setFilter: <K extends keyof T>(key: K, value: T[K]["defaultValue"]) => void;
  clearFilter: (key: keyof T) => void;
  clearAll: () => void;
  hasFilters: boolean;
} {
  const [filters, setFilters, { reset }] = useUrlParams(schema);

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]["defaultValue"]) => {
      setFilters({ [key]: value } as Partial<{ [K2 in keyof T]: T[K2]["defaultValue"] }>);
    },
    [setFilters]
  );

  const clearFilter = useCallback(
    (key: keyof T) => {
      setFilters({ [key]: schema[key].defaultValue } as Partial<{
        [K in keyof T]: T[K]["defaultValue"];
      }>);
    },
    [setFilters, schema]
  );

  // Check if any filters differ from defaults
  const hasFilters = useMemo(() => {
    for (const [key, value] of Object.entries(filters)) {
      const defaultValue = schema[key]?.defaultValue;
      if (Array.isArray(value) && Array.isArray(defaultValue)) {
        if (value.length !== defaultValue.length || value.some((v, i) => v !== defaultValue[i])) {
          return true;
        }
      } else if (value !== defaultValue) {
        return true;
      }
    }
    return false;
  }, [filters, schema]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAll: reset,
    hasFilters,
  };
}

/**
 * History-aware navigation hook
 */
export function useUrlHistory(): {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  historyLength: number;
} {
  const [historyLength, setHistoryLength] = useState(0);
  const initialLength = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initialLength.current = window.history.length;
      setHistoryLength(window.history.length);

      const handlePopState = () => {
        setHistoryLength(window.history.length);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  const canGoBack = historyLength > 1;
  const canGoForward = false; // Can't reliably detect forward history

  const goBack = useCallback(() => {
    if (canGoBack && typeof window !== "undefined") {
      window.history.back();
    }
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  }, []);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    historyLength,
  };
}

/**
 * Debounced URL state for search inputs
 */
export function useDebouncedUrlState<T>(
  key: string,
  options: UseUrlStateOptions<T> & { debounceMs?: number }
): [T, (value: T) => void, { isPending: boolean }] {
  const { debounceMs = 300, ...urlOptions } = options;
  const [urlValue, setUrlValue] = useUrlState(key, urlOptions);
  const [localValue, setLocalValue] = useState(urlValue);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when URL changes externally
  useEffect(() => {
    setLocalValue(urlValue);
  }, [urlValue]);

  const setValue = useCallback(
    (value: T) => {
      setLocalValue(value);
      setIsPending(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setUrlValue(value);
        setIsPending(false);
      }, debounceMs);
    },
    [setUrlValue, debounceMs]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [localValue, setValue, { isPending }];
}
