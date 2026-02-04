/**
 * MSW Server Setup
 * Configures the mock service worker for Node.js testing environment
 */
import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";

import { handlers, stores } from "./handlers";

// Create the MSW server with all handlers
export const server = setupServer(...handlers);

// Export stores for test manipulation
export { stores };

// Re-export handler types for extending in tests
export { handlers };

/**
 * Setup function to be called in test setup
 * Configures MSW server with proper lifecycle hooks
 */
export function setupMSW() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: "warn",
    });
  });

  // Reset handlers and stores after each test
  afterEach(() => {
    server.resetHandlers();
    stores.resetAll();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });

  return server;
}

/**
 * Helper to add custom handlers for specific tests
 *
 * @example
 * ```ts
 * import { server, addTestHandlers } from "@tests/mocks/server";
 * import { http, HttpResponse } from "msw";
 *
 * test("custom handler", () => {
 *   addTestHandlers(
 *     http.get("/api/custom", () => HttpResponse.json({ custom: true }))
 *   );
 *   // ... test code
 * });
 * ```
 */
export function addTestHandlers(...customHandlers: Parameters<typeof server.use>) {
  server.use(...customHandlers);
}

/**
 * Helper to simulate API errors
 *
 * @example
 * ```ts
 * import { simulateApiError } from "@tests/mocks/server";
 *
 * test("handles API error", () => {
 *   simulateApiError("/api/journals/get-all", 500, "Internal Server Error");
 *   // ... test error handling
 * });
 * ```
 */
export function simulateApiError(
  path: string,
  status: number = 500,
  message: string = "Internal Server Error"
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  server.use(
    http.get(`${baseUrl}${path}`, () => {
      return HttpResponse.json({ error: message }, { status });
    }),
    http.post(`${baseUrl}${path}`, () => {
      return HttpResponse.json({ error: message }, { status });
    })
  );
}

/**
 * Helper to simulate network failure
 */
export function simulateNetworkError(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  server.use(
    http.get(`${baseUrl}${path}`, () => {
      return Response.error();
    }),
    http.post(`${baseUrl}${path}`, () => {
      return Response.error();
    })
  );
}

/**
 * Helper to simulate slow API response
 */
export function simulateSlowResponse(path: string, delayMs: number = 2000) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  server.use(
    http.get(`${baseUrl}${path}`, async () => {
      await delay(delayMs);
      return HttpResponse.json({ data: null });
    }),
    http.post(`${baseUrl}${path}`, async () => {
      await delay(delayMs);
      return HttpResponse.json({ data: null });
    })
  );
}

export default server;
