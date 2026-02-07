"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/**
 * State Persistence Hooks
 *
 * Persist React state to localStorage, sessionStorage, IndexedDB,
 * or custom storage backends with automatic sync.
 */

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  get: <T>(key: string) => Promise<T | null> | T | null;
  set: <T>(key: string, value: T) => Promise<void> | void;
  remove: (key: string) => Promise<void> | void;
  clear?: () => Promise<void> | void;
}

/**
 * Persistence options
 */
export interface PersistenceOptions<T> {
  storage?: StorageAdapter;
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  };
  debounceMs?: number;
  version?: number;
  migrate?: (oldValue: unknown, oldVersion: number) => T;
  onError?: (error: Error) => void;
  onHydrate?: (value: T) => void;
  syncTabs?: boolean;
}

/**
 * Persistence state
 */
export interface PersistenceState<T> {
  value: T;
  isHydrated: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Local storage adapter
 */
export const localStorageAdapter: StorageAdapter = {
  get: <T>(key: string): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.clear();
  },
};

/**
 * Session storage adapter
 */
export const sessionStorageAdapter: StorageAdapter = {
  get: <T>(key: string): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(key);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.clear();
  },
};

/**
 * IndexedDB adapter
 */
export function createIndexedDBAdapter(
  dbName: string,
  storeName: string = "keyval"
): StorageAdapter {
  let dbPromise: Promise<IDBDatabase> | null = null;

  const getDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName);
      };
    });

    return dbPromise;
  };

  return {
    get: async <T>(key: string): Promise<T | null> => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
      });
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    remove: async (key: string): Promise<void> => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    clear: async (): Promise<void> => {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
  };
}

/**
 * Main persistence hook
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: PersistenceOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, PersistenceState<T>] {
  const {
    storage = localStorageAdapter,
    serializer = {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
    debounceMs = 0,
    version = 1,
    migrate,
    onError,
    onHydrate,
    syncTabs = false,
  } = options;

  const [state, setState] = useState<PersistenceState<T>>({
    value: initialValue,
    isHydrated: false,
    isLoading: true,
    error: null,
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Versioned key for migrations
  const versionedKey = `${key}_v${version}`;

  // Hydrate from storage on mount
  useEffect(() => {
    isMountedRef.current = true;

    const hydrate = async () => {
      try {
        // Try current version first
        let stored = await storage.get<{ value: T; version: number }>(versionedKey);

        // If not found, check for older versions
        if (!stored && migrate) {
          for (let v = version - 1; v >= 1; v--) {
            const oldKey = `${key}_v${v}`;
            const oldStored = await storage.get<{ value: unknown; version: number }>(oldKey);
            if (oldStored) {
              const migrated = migrate(oldStored.value, v);
              stored = { value: migrated, version };
              // Save migrated data
              await storage.set(versionedKey, stored);
              // Remove old key
              await storage.remove(oldKey);
              break;
            }
          }
        }

        if (isMountedRef.current) {
          const hydratedValue = stored?.value ?? initialValue;
          setState({
            value: hydratedValue,
            isHydrated: true,
            isLoading: false,
            error: null,
          });
          onHydrate?.(hydratedValue);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isHydrated: true,
            isLoading: false,
            error,
          }));
          onError?.(error);
        }
      }
    };

    hydrate();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  // Cross-tab sync
  useEffect(() => {
    if (!syncTabs || typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === versionedKey && e.newValue) {
        try {
          const parsed = serializer.deserialize(e.newValue);
          if (parsed && typeof parsed === "object" && "value" in parsed) {
            setState((prev) => ({
              ...prev,
              value: (parsed as { value: T }).value,
            }));
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [versionedKey, serializer, syncTabs]);

  // Persist to storage
  const persistValue = useCallback(
    async (value: T) => {
      try {
        await storage.set(versionedKey, { value, version });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
      }
    },
    [storage, versionedKey, version, onError]
  );

  // Set value with optional debounce
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue =
          typeof value === "function" ? (value as (prev: T) => T)(prev.value) : value;

        // Cancel pending debounce
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Persist with debounce
        if (debounceMs > 0) {
          debounceTimeoutRef.current = setTimeout(() => {
            persistValue(newValue);
          }, debounceMs);
        } else {
          persistValue(newValue);
        }

        return {
          ...prev,
          value: newValue,
        };
      });
    },
    [persistValue, debounceMs]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return [state.value, setValue, state];
}

/**
 * Simple persisted state without extra state info
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: Omit<PersistenceOptions<T>, "onHydrate">
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = usePersistentState(key, initialValue, options);
  return [value, setValue];
}

/**
 * Persist state to session storage
 */
export function useSessionPersistedState<T>(
  key: string,
  initialValue: T,
  options?: Omit<PersistenceOptions<T>, "storage" | "syncTabs">
): [T, (value: T | ((prev: T) => T)) => void] {
  return usePersistedState(key, initialValue, {
    ...options,
    storage: sessionStorageAdapter,
    syncTabs: false,
  });
}

/**
 * Persist state to IndexedDB (for larger data)
 */
export function useIndexedDBState<T>(
  key: string,
  initialValue: T,
  options?: Omit<PersistenceOptions<T>, "storage" | "syncTabs"> & {
    dbName?: string;
    storeName?: string;
  }
): [T, (value: T | ((prev: T) => T)) => void, PersistenceState<T>] {
  const { dbName = "app_storage", storeName = "state", ...restOptions } = options || {};

  const adapter = useMemo(() => createIndexedDBAdapter(dbName, storeName), [dbName, storeName]);

  return usePersistentState(key, initialValue, {
    ...restOptions,
    storage: adapter,
    syncTabs: false,
  });
}

/**
 * Persist a map/record with individual key persistence
 */
export function usePersistedMap<K extends string, V>(
  namespace: string,
  options?: PersistenceOptions<Record<K, V>>
): {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  remove: (key: K) => void;
  has: (key: K) => boolean;
  entries: () => Array<[K, V]>;
  clear: () => void;
} {
  const [map, setMap] = usePersistentState<Record<K, V>>(namespace, {} as Record<K, V>, options);

  const get = useCallback((key: K): V | undefined => map[key], [map]);

  const set = useCallback(
    (key: K, value: V) => {
      setMap((prev) => ({ ...prev, [key]: value }));
    },
    [setMap]
  );

  const remove = useCallback(
    (key: K) => {
      setMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [setMap]
  );

  const has = useCallback((key: K): boolean => key in map, [map]);

  const entries = useCallback((): Array<[K, V]> => {
    return Object.entries(map) as Array<[K, V]>;
  }, [map]);

  const clear = useCallback(() => {
    setMap({} as Record<K, V>);
  }, [setMap]);

  return { get, set, remove, has, entries, clear };
}

/**
 * Persist a list with array operations
 */
export function usePersistedList<T>(
  key: string,
  options?: PersistenceOptions<T[]>
): {
  items: T[];
  add: (item: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  clear: () => void;
  setItems: (items: T[]) => void;
} {
  const [items, setItems] = usePersistentState<T[]>(key, [], options);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
    },
    [setItems]
  );

  const remove = useCallback(
    (index: number) => {
      setItems((prev) => prev.filter((_, i) => i !== index));
    },
    [setItems]
  );

  const update = useCallback(
    (index: number, item: T) => {
      setItems((prev) => {
        const next = [...prev];
        next[index] = item;
        return next;
      });
    },
    [setItems]
  );

  const clear = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return { items, add, remove, update, clear, setItems };
}

/**
 * History with undo/redo persisted to storage
 */
export function usePersistedHistory<T>(
  key: string,
  initialValue: T,
  options?: PersistenceOptions<{ past: T[]; present: T; future: T[] }> & {
    maxHistory?: number;
  }
): {
  value: T;
  set: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
} {
  const { maxHistory = 50, ...persistOptions } = options || {};

  const [state, setState] = usePersistentState(
    key,
    { past: [] as T[], present: initialValue, future: [] as T[] },
    persistOptions
  );

  const set = useCallback(
    (value: T) => {
      setState((prev) => ({
        past: [...prev.past, prev.present].slice(-maxHistory),
        present: value,
        future: [],
      }));
    },
    [setState, maxHistory]
  );

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, [setState]);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, [setState]);

  const clear = useCallback(() => {
    setState({ past: [], present: initialValue, future: [] });
  }, [setState, initialValue]);

  return {
    value: state.present,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clear,
  };
}
