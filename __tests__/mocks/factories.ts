/**
 * Mock Data Factories
 * Creates mock objects for testing with sensible defaults
 */
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Types matching the app's user/session types
export interface MockUser {
  id: string;
  supabaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
}

export interface MockBookSession {
  id: string;
  bookId: string;
  sessionNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface MockEnrollment {
  id: string;
  userId: string;
  sessionId: string;
  enrolledAt: string;
  streakCount: number;
  totalPoints: number;
  lastActivityDate: string;
}

export interface MockJournalEntry {
  id: string;
  userId: string;
  sessionId: string;
  entryType: "morning" | "evening" | "weekly";
  entryDate: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MockBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: Record<string, unknown>;
  pointsReward: number;
  isActive: boolean;
}

export interface MockUserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  isShowcased: boolean;
  badge?: MockBadge;
}

// Counter for generating unique IDs
let idCounter = 0;
function generateId(): string {
  return `test-id-${++idCounter}`;
}

/**
 * Reset the ID counter (call in beforeEach for consistent IDs)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Create a mock user profile
 */
export function mockUser(overrides: Partial<MockUser> = {}): MockUser {
  const id = generateId();
  return {
    id,
    supabaseId: `supabase-${id}`,
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    profileImage: "",
    ...overrides,
  };
}

/**
 * Create a mock Supabase user (used for auth)
 */
export function mockSupabaseUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  const id = generateId();
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides,
  };
}

/**
 * Create a mock Supabase session
 */
export function mockSession(overrides: Partial<Session> = {}): Session {
  const user = mockSupabaseUser();
  return {
    access_token: "mock-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-token",
    user,
    ...overrides,
  };
}

/**
 * Create a mock book session
 */
export function mockBookSession(overrides: Partial<MockBookSession> = {}): MockBookSession {
  const id = generateId();
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days later

  return {
    id,
    bookId: `book-${id}`,
    sessionNumber: 1,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    ...overrides,
  };
}

/**
 * Create a mock enrollment
 */
export function mockEnrollment(overrides: Partial<MockEnrollment> = {}): MockEnrollment {
  const id = generateId();
  return {
    id,
    userId: `user-${id}`,
    sessionId: `session-${id}`,
    enrolledAt: new Date().toISOString(),
    streakCount: 0,
    totalPoints: 0,
    lastActivityDate: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock journal entry
 */
export function mockJournalEntry(overrides: Partial<MockJournalEntry> = {}): MockJournalEntry {
  const id = generateId();
  return {
    id,
    userId: `user-${id}`,
    sessionId: `session-${id}`,
    entryType: "morning",
    entryDate: new Date().toISOString().split("T")[0],
    content: {
      gratitude: ["Test gratitude 1", "Test gratitude 2", "Test gratitude 3"],
      affirmation: "Test affirmation",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock badge
 */
export function mockBadge(overrides: Partial<MockBadge> = {}): MockBadge {
  const id = generateId();
  return {
    id,
    name: "Test Badge",
    description: "A badge for testing",
    icon: "badge-icon",
    category: "achievement",
    condition: { type: "streak", value: 7 },
    pointsReward: 50,
    isActive: true,
    ...overrides,
  };
}

/**
 * Create a mock user badge (earned badge)
 */
export function mockUserBadge(overrides: Partial<MockUserBadge> = {}): MockUserBadge {
  const id = generateId();
  return {
    id,
    userId: `user-${id}`,
    badgeId: `badge-${id}`,
    earnedAt: new Date().toISOString(),
    isShowcased: false,
    ...overrides,
  };
}

/**
 * Create a mock Redux state with sensible defaults
 */
export function mockReduxState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    profile: {
      current: null,
      loading: false,
      error: "",
    },
    books: {
      current: null,
      list: [],
      loading: false,
      error: "",
    },
    enrollments: {
      current: null,
      loading: false,
      lastFetched: null,
      streak: {
        count: 0,
        lastFetched: null,
        loading: false,
      },
    },
    journals: {
      morning: null,
      evening: null,
      weekly: null,
      loading: false,
      error: "",
    },
    gamification: {
      badges: {
        all: [],
        unlocked: [],
        loading: false,
        error: "",
      },
      multipliers: {
        current: null,
        loading: false,
      },
      points: {
        transactions: [],
        loading: false,
      },
      pendingCelebrations: [],
    },
    global: {
      theme: "dark",
      sidebarOpen: false,
    },
    ...overrides,
  };
}

/**
 * Create an array of mock items
 */
export function mockArray<T>(factory: (index: number) => T, count: number = 3): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

/**
 * Create mock API response
 */
export function mockApiResponse<T>(data: T, success: boolean = true) {
  if (success) {
    return { data, error: null };
  }
  return { data: null, error: { message: "Mock API error" } };
}
