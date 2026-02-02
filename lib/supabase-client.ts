import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";

// For development only - remove in production
const _DEV_USER: User = {
  id: "a1b2c3d4-e5f6-4321-8901-abcdef123456", // Valid UUID format
  app_metadata: {},
  user_metadata: {
    name: "Test User",
    onboarded: false, // Add this to trigger the onboarding flow
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "test@example.com",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: undefined,
  factors: undefined,
  identities: [],
};

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // For development only - remove in production
  // if (process.env.NODE_ENV === 'development') {
  //   // Create a mock session
  //   const createMockSession = (user: User): Session => ({
  //     user,
  //     access_token: 'fake-token',
  //     refresh_token: 'fake-refresh-token',
  //     expires_at: new Date(Date.now() + 3600 * 1000).getTime(),
  //     expires_in: 3600,
  //     token_type: 'bearer'
  //   });

  //   // Store auth callbacks
  //   const authCallbacks: ((event: AuthChangeEvent, session: Session | null) => void)[] = [];

  //   const mockAuth = {
  //     getUser: async () => ({ data: { user: DEV_USER }, error: null }),
  //     getSession: async () => ({
  //       data: { session: createMockSession(DEV_USER) },
  //       error: null
  //     }),
  //     signInWithOtp: async ({ email }: { email: string }) => {
  //       // Create a user with the provided email
  //       const mockUser = { ...DEV_USER, email };
  //       const mockSession = createMockSession(mockUser);

  //       // Trigger auth state change immediately
  //       setTimeout(() => {
  //         authCallbacks.forEach(cb => cb('SIGNED_IN', mockSession));
  //       }, 100);

  //       return { data: { user: mockUser }, error: null };
  //     },
  //     signOut: async () => {
  //       // Trigger auth state change
  //       authCallbacks.forEach(cb => cb('SIGNED_OUT', null));
  //       return { error: null };
  //     },
  //     onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  //       // Store callback
  //       authCallbacks.push(callback);

  //       // Return mock subscription
  //       return {
  //         data: {
  //           subscription: {
  //             unsubscribe: () => {
  //               const index = authCallbacks.indexOf(callback);
  //               if (index > -1) {
  //                 authCallbacks.splice(index, 1);
  //               }
  //             }
  //           }
  //         },
  //         error: null
  //       };
  //     }
  //   };

  //   return {
  //     ...client,
  //     auth: mockAuth,
  //     // Preserve all other client methods
  //     from: client.from.bind(client),
  //     rpc: client.rpc.bind(client),
  //     channel: client.channel.bind(client),
  //     realtime: client.realtime
  //   };
  // }

  return client;
}
