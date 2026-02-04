/**
 * Supabase Mock
 * Provides mock implementations of Supabase client methods for testing
 */
import { vi } from "vitest";

import { mockSession, mockSupabaseUser } from "./factories";

// Mock data store for tests to manipulate
export const mockDataStore: Record<string, unknown[]> = {};

/**
 * Reset the mock data store
 */
export function resetMockDataStore(): void {
  Object.keys(mockDataStore).forEach((key) => delete mockDataStore[key]);
}

/**
 * Set mock data for a table
 */
export function setMockData(table: string, data: unknown[]): void {
  mockDataStore[table] = data;
}

/**
 * Get mock data from a table
 */
export function getMockData(table: string): unknown[] {
  return mockDataStore[table] || [];
}

/**
 * Create a chainable query builder mock
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockQueryBuilder = Record<string, any>;

function createQueryBuilder(table: string): MockQueryBuilder {
  const filters: Record<string, unknown> = {};
  let _selectFields: string = "*";
  let orderConfig: { column: string; ascending: boolean } | null = null;
  let limitValue: number | null = null;
  let singleResult = false;

  const builder: MockQueryBuilder = {
    select: vi.fn((fields: string = "*") => {
      _selectFields = fields;
      return builder;
    }),
    insert: vi.fn((data: unknown | unknown[]) => {
      const items = Array.isArray(data) ? data : [data];
      const existingData = getMockData(table);
      const newItems = items.map((item, index) => ({
        id: `mock-id-${existingData.length + index + 1}`,
        created_at: new Date().toISOString(),
        ...(item as object),
      }));
      setMockData(table, [...existingData, ...newItems]);
      return builder;
    }),
    update: vi.fn((data: unknown) => {
      const existingData = getMockData(table);
      const updated = existingData.map((item) => {
        const shouldUpdate = Object.entries(filters).every(
          ([key, value]) => (item as Record<string, unknown>)[key] === value
        );
        return shouldUpdate
          ? { ...(item as object), ...(data as object), updated_at: new Date().toISOString() }
          : item;
      });
      setMockData(table, updated);
      return builder;
    }),
    delete: vi.fn(() => {
      const existingData = getMockData(table);
      const filtered = existingData.filter((item) => {
        return !Object.entries(filters).every(
          ([key, value]) => (item as Record<string, unknown>)[key] === value
        );
      });
      setMockData(table, filtered);
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      filters[column] = value;
      return builder;
    }),
    neq: vi.fn((column: string, value: unknown) => {
      filters[`${column}_neq`] = value;
      return builder;
    }),
    gt: vi.fn((column: string, value: unknown) => {
      filters[`${column}_gt`] = value;
      return builder;
    }),
    gte: vi.fn((column: string, value: unknown) => {
      filters[`${column}_gte`] = value;
      return builder;
    }),
    lt: vi.fn((column: string, value: unknown) => {
      filters[`${column}_lt`] = value;
      return builder;
    }),
    lte: vi.fn((column: string, value: unknown) => {
      filters[`${column}_lte`] = value;
      return builder;
    }),
    in: vi.fn((column: string, values: unknown[]) => {
      filters[`${column}_in`] = values;
      return builder;
    }),
    order: vi.fn((column: string, options?: { ascending?: boolean }) => {
      orderConfig = { column, ascending: options?.ascending ?? true };
      return builder;
    }),
    limit: vi.fn((count: number) => {
      limitValue = count;
      return builder;
    }),
    single: vi.fn(() => {
      singleResult = true;
      return builder;
    }),
    maybeSingle: vi.fn(() => {
      singleResult = true;
      return builder;
    }),
    then: vi.fn((resolve: (value: unknown) => void) => {
      let data = getMockData(table);

      // Apply simple eq filters
      Object.entries(filters).forEach(([key, value]) => {
        if (!key.includes("_")) {
          data = data.filter((item) => (item as Record<string, unknown>)[key] === value);
        }
      });

      // Apply ordering
      if (orderConfig) {
        data = [...data].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[orderConfig!.column] as string | number;
          const bVal = (b as Record<string, unknown>)[orderConfig!.column] as string | number;
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return orderConfig!.ascending ? comparison : -comparison;
        });
      }

      // Apply limit
      if (limitValue !== null) {
        data = data.slice(0, limitValue);
      }

      // Return single or array
      if (singleResult) {
        resolve({ data: data[0] || null, error: null });
      } else {
        resolve({ data, error: null });
      }
    }),
  };

  return builder;
}

/**
 * Create mock Supabase storage
 */
function createStorageMock() {
  const uploadedFiles: Record<string, { path: string; data: unknown }> = {};

  return {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(async (path: string, file: unknown) => {
        uploadedFiles[`${bucket}/${path}`] = { path, data: file };
        return { data: { path: `${bucket}/${path}` }, error: null };
      }),
      download: vi.fn(async (path: string) => {
        const file = uploadedFiles[`${bucket}/${path}`];
        if (file) {
          return { data: new Blob(), error: null };
        }
        return { data: null, error: { message: "File not found" } };
      }),
      remove: vi.fn(async (paths: string[]) => {
        paths.forEach((path) => delete uploadedFiles[`${bucket}/${path}`]);
        return { data: paths.map((path) => ({ name: path })), error: null };
      }),
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://mock-storage.supabase.co/${bucket}/${path}` },
      })),
      list: vi.fn(async () => ({
        data: Object.entries(uploadedFiles)
          .filter(([key]) => key.startsWith(bucket))
          .map(([key]) => ({ name: key.replace(`${bucket}/`, "") })),
        error: null,
      })),
    })),
  };
}

/**
 * Create mock Supabase auth
 */
function createAuthMock(initialSession = mockSession()) {
  let currentSession: ReturnType<typeof mockSession> | null = initialSession;
  let currentUser: ReturnType<typeof mockSupabaseUser> | null = initialSession?.user || null;

  return {
    getUser: vi.fn(async () => ({
      data: { user: currentUser },
      error: null,
    })),
    getSession: vi.fn(async () => ({
      data: { session: currentSession },
      error: null,
    })),
    signInWithOtp: vi.fn(async ({ email: _email }: { email: string }) => {
      return { data: { user: null, session: null }, error: null };
    }),
    signInWithPassword: vi.fn(
      async ({ email, password: _password }: { email: string; password: string }) => {
        const user = mockSupabaseUser({ email });
        const session = mockSession({ user });
        currentUser = user;
        currentSession = session;
        return { data: { user, session }, error: null };
      }
    ),
    signUp: vi.fn(async ({ email, password: _password }: { email: string; password: string }) => {
      const user = mockSupabaseUser({ email });
      currentUser = user;
      return { data: { user, session: null }, error: null };
    }),
    signOut: vi.fn(async () => {
      currentUser = null;
      currentSession = null;
      return { error: null };
    }),
    onAuthStateChange: vi.fn((_callback: (event: string, session: unknown) => void) => {
      // Return subscription object
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
    resetPasswordForEmail: vi.fn(async () => ({
      data: {},
      error: null,
    })),
    updateUser: vi.fn(async (updates: Partial<unknown>) => {
      if (currentUser) {
        currentUser = { ...currentUser, ...updates } as typeof currentUser;
      }
      return { data: { user: currentUser }, error: null };
    }),
    // Test helpers
    __setUser: (user: typeof currentUser) => {
      currentUser = user;
    },
    __setSession: (session: typeof currentSession) => {
      currentSession = session;
    },
  };
}

/**
 * Create a complete mock Supabase client
 */
export function createMockSupabaseClient(initialSession = mockSession()) {
  return {
    from: vi.fn((table: string) => createQueryBuilder(table)),
    auth: createAuthMock(initialSession),
    storage: createStorageMock(),
    rpc: vi.fn(async (_functionName: string, _params?: Record<string, unknown>) => {
      return { data: null, error: null };
    }),
    channel: vi.fn((_name: string) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
}

/**
 * Create mock for @lib/supabase-client createClient
 */
export function setupSupabaseMock(initialSession = mockSession()) {
  const mockClient = createMockSupabaseClient(initialSession);

  vi.mock("@lib/supabase-client", () => ({
    createClient: vi.fn(() => mockClient),
  }));

  vi.mock("@lib/supabase-server", () => ({
    createClient: vi.fn(() => mockClient),
    createServiceClient: vi.fn(() => mockClient),
  }));

  return mockClient;
}

/**
 * Create mock for server-side Supabase (cookies handling)
 */
export function createMockServerSupabaseClient(initialSession = mockSession()) {
  const client = createMockSupabaseClient(initialSession);
  return {
    ...client,
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  };
}

export default createMockSupabaseClient;
