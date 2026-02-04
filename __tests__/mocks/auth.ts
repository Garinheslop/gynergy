/**
 * Auth Mock Utilities
 * Provides helpers for mocking authentication states in tests
 */
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { vi } from "vitest";

import { mockSession, mockSupabaseUser, mockUser } from "./factories";

export interface AuthState {
  isAuthenticated: boolean;
  session: Session | null;
  user: SupabaseUser | null;
  profile: ReturnType<typeof mockUser> | null;
}

/**
 * Create an authenticated auth state
 */
export function createAuthenticatedState(
  overrides: Partial<{
    session: Partial<Session>;
    user: Partial<SupabaseUser>;
    profile: Partial<ReturnType<typeof mockUser>>;
  }> = {}
): AuthState {
  const user = mockSupabaseUser(overrides.user);
  const session = mockSession({ user, ...overrides.session });
  const profile = mockUser({
    supabaseId: user.id,
    email: user.email || "test@example.com",
    ...overrides.profile,
  });

  return {
    isAuthenticated: true,
    session,
    user,
    profile,
  };
}

/**
 * Create an unauthenticated auth state
 */
export function createUnauthenticatedState(): AuthState {
  return {
    isAuthenticated: false,
    session: null,
    user: null,
    profile: null,
  };
}

/**
 * Create an expired session state
 */
export function createExpiredSessionState(): AuthState {
  const user = mockSupabaseUser();
  const session = mockSession({
    user,
    expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  });

  return {
    isAuthenticated: false,
    session,
    user,
    profile: null,
  };
}

/**
 * Mock the useSession hook
 */
export function mockUseSession(authState: AuthState) {
  return {
    session: authState.session
      ? {
          access_token: authState.session.access_token,
          token_type: authState.session.token_type,
          expires_in: authState.session.expires_in,
          expires_at: authState.session.expires_at,
          refresh_token: authState.session.refresh_token,
          user: authState.profile
            ? {
                id: authState.profile.id,
                supabaseId: authState.profile.supabaseId,
                firstName: authState.profile.firstName,
                lastName: authState.profile.lastName,
                email: authState.profile.email,
                profileImage: authState.profile.profileImage,
              }
            : null,
        }
      : null,
    bookSession: {
      isCompleted: false,
      latest: null,
    },
    authenticating: false,
    logout: vi.fn(),
  };
}

/**
 * Setup auth context mock for testing
 * Use this in beforeEach to mock the UseSession context
 */
export function setupAuthMock(authState: AuthState) {
  const mockSessionValue = mockUseSession(authState);

  vi.mock("@contexts/UseSession", () => ({
    useSession: vi.fn(() => mockSessionValue),
    default: ({ children }: { children: React.ReactNode }) => children,
  }));

  return mockSessionValue;
}

/**
 * Create Redux preloaded state for authenticated user
 */
export function createAuthenticatedReduxState(authState: AuthState = createAuthenticatedState()) {
  return {
    profile: {
      current: authState.profile,
      loading: false,
      error: "",
    },
    global: {
      isAuthenticated: authState.isAuthenticated,
    },
  };
}

/**
 * Create Redux preloaded state for unauthenticated user
 */
export function createUnauthenticatedReduxState() {
  return {
    profile: {
      current: null,
      loading: false,
      error: "",
    },
    global: {
      isAuthenticated: false,
    },
  };
}

/**
 * Mock auth middleware for API route testing
 */
export function mockAuthMiddleware(authState: AuthState) {
  return vi.fn(async () => {
    if (!authState.isAuthenticated) {
      return {
        authorized: false,
        error: "Not authenticated",
        user: null,
      };
    }

    return {
      authorized: true,
      error: null,
      user: authState.user,
    };
  });
}

/**
 * Helper to simulate login in tests
 */
export function simulateLogin(
  setAuthState: (state: AuthState) => void,
  overrides?: Parameters<typeof createAuthenticatedState>[0]
) {
  const authState = createAuthenticatedState(overrides);
  setAuthState(authState);
  return authState;
}

/**
 * Helper to simulate logout in tests
 */
export function simulateLogout(setAuthState: (state: AuthState) => void) {
  const authState = createUnauthenticatedState();
  setAuthState(authState);
  return authState;
}

/**
 * Helper to simulate session expiry in tests
 */
export function simulateSessionExpiry(setAuthState: (state: AuthState) => void) {
  const authState = createExpiredSessionState();
  setAuthState(authState);
  return authState;
}
