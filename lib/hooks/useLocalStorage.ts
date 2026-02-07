"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Serialize value to JSON string
 */
function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Deserialize JSON string to value
 */
function deserialize<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface UseLocalStorageOptions<T> {
  /** Serialize function (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Deserialize function (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Sync across tabs/windows */
  syncTabs?: boolean;
}

/**
 * Hook for storing state in localStorage with SSR safety
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 *
 *   return (
 *     <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *       <option value="dark">Dark</option>
 *       <option value="light">Light</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = serialize,
    deserializer = (v: string) => deserialize(v, initialValue),
    syncTabs = true,
  } = options;

  // Get initial value from localStorage or use initialValue
  const readValue = useCallback((): T => {
    if (!isBrowser()) return initialValue;

    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? deserializer(stored) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Sync with localStorage on mount
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (!isBrowser()) {
        console.warn("localStorage is not available");
        return;
      }

      try {
        // Handle function updates
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, serializer(newValue));

        // Update state
        setStoredValue(newValue);

        // Dispatch storage event for other tabs/hooks
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: serializer(newValue),
          })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    if (!isBrowser()) return;

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (!isBrowser() || !syncTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(deserializer(e.newValue));
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue, syncTabs, deserializer]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for sessionStorage (same API as useLocalStorage)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, "syncTabs"> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { serializer = serialize, deserializer = (v: string) => deserialize(v, initialValue) } =
    options;

  const readValue = useCallback((): T => {
    if (!isBrowser()) return initialValue;

    try {
      const stored = window.sessionStorage.getItem(key);
      return stored !== null ? deserializer(stored) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (!isBrowser()) return;

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.sessionStorage.setItem(key, serializer(newValue));
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  const removeValue = useCallback(() => {
    if (!isBrowser()) return;

    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Check available storage space
 */
export function useStorageQuota(): {
  usage: number | null;
  quota: number | null;
  percent: number | null;
  isAvailable: boolean;
} {
  const [usage, setUsage] = useState<number | null>(null);
  const [quota, setQuota] = useState<number | null>(null);

  useEffect(() => {
    if (!isBrowser() || !navigator.storage?.estimate) return;

    navigator.storage.estimate().then((estimate) => {
      setUsage(estimate.usage ?? null);
      setQuota(estimate.quota ?? null);
    });
  }, []);

  const percent = useMemo(() => {
    if (usage === null || quota === null || quota === 0) return null;
    return Math.round((usage / quota) * 100);
  }, [usage, quota]);

  return {
    usage,
    quota,
    percent,
    isAvailable: isBrowser() && !!navigator.storage?.estimate,
  };
}

/**
 * Clear all localStorage items with a prefix
 */
export function clearStorageByPrefix(prefix: string, storage: "local" | "session" = "local"): void {
  if (!isBrowser()) return;

  const storageObj = storage === "local" ? window.localStorage : window.sessionStorage;

  const keysToRemove: string[] = [];
  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storageObj.removeItem(key));
}

/**
 * Get all localStorage items with a prefix
 */
export function getStorageByPrefix<T = unknown>(
  prefix: string,
  storage: "local" | "session" = "local"
): Record<string, T> {
  if (!isBrowser()) return {};

  const storageObj = storage === "local" ? window.localStorage : window.sessionStorage;
  const items: Record<string, T> = {};

  for (let i = 0; i < storageObj.length; i++) {
    const key = storageObj.key(i);
    if (key?.startsWith(prefix)) {
      const value = storageObj.getItem(key);
      if (value !== null) {
        try {
          items[key] = JSON.parse(value);
        } catch {
          items[key] = value as T;
        }
      }
    }
  }

  return items;
}
