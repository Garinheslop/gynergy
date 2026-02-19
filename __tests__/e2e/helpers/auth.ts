import { BrowserContext, Page } from "@playwright/test";

const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzgxMTIsImV4cCI6MjA1Nzg1NDExMn0.8qEL_XhWjYcLBjou_P0OjL2lpgMoSDCl2KnN04ogCsw";
const PROJECT_REF = "lhpmebczgzizqlypzwcj";

// ─── Test Agent Credentials ───────────────────────────────────
// Created via: node scripts/setup-test-agents.mjs

export interface TestAgent {
  email: string;
  password: string;
  name: string;
}

/** Primary test user (Garin's account) */
export const AGENT_PRIMARY: TestAgent = {
  email: process.env.TEST_USER_EMAIL || "garin@gynergy.com",
  password: process.env.TEST_USER_PASSWORD || "PlaywrightTest123!",
  name: "Garin",
};

/** Test Agent A — for multi-user testing */
export const AGENT_A: TestAgent = {
  email: "test-agent-a@gynergy.com",
  password: "AgentTestA123!",
  name: "Agent Alpha",
};

/** Test Agent B — for multi-user testing (same cohort as A) */
export const AGENT_B: TestAgent = {
  email: "test-agent-b@gynergy.com",
  password: "AgentTestB123!",
  name: "Agent Beta",
};

/** Test Agent C — for rate limit / load testing */
export const AGENT_C: TestAgent = {
  email: "test-agent-c@gynergy.com",
  password: "AgentTestC123!",
  name: "Agent Charlie",
};

// ─── Auth Result ──────────────────────────────────────────────

export interface SignInResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  userId?: string;
  error?: string;
}

// ─── Core Auth Functions ──────────────────────────────────────

/**
 * Sign in via Supabase REST API (runs in the browser context).
 * Returns tokens without setting cookies — use `setCookies` separately.
 */
async function supabaseSignIn(page: Page, email: string, password: string): Promise<SignInResult> {
  return page.evaluate(
    async ({ url, key, email, password }) => {
      try {
        const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: data.error_description || data.msg || "Unknown error",
          };
        }
        return {
          success: true,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          userId: data.user?.id,
        };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
    { url: SUPABASE_URL, key: ANON_KEY, email, password }
  );
}

/**
 * Set Supabase session cookies on the browser context.
 * Handles chunking for large tokens (Supabase SSR splits at ~3180 bytes).
 */
async function setCookies(
  context: BrowserContext,
  signInResult: SignInResult,
  baseUrl: string
): Promise<void> {
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const sessionData = JSON.stringify({
    access_token: signInResult.access_token,
    refresh_token: signInResult.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: signInResult.expires_at,
  });

  const url = new URL(baseUrl);
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const cookieBase = {
    domain: isLocalhost ? "localhost" : ".gynergy.app",
    path: "/",
    httpOnly: false,
    secure: !isLocalhost,
    sameSite: "Lax" as const,
    expires: Math.floor(Date.now() / 1000) + 3600,
  };

  // Chunk cookie (Supabase SSR splits at ~3180 bytes)
  const chunkSize = 3180;
  const chunks: string[] = [];
  for (let i = 0; i < sessionData.length; i += chunkSize) {
    chunks.push(sessionData.substring(i, i + chunkSize));
  }

  const cookiesToSet =
    chunks.length === 1
      ? [{ ...cookieBase, name: cookieName, value: chunks[0] }]
      : chunks.map((chunk, i) => ({
          ...cookieBase,
          name: `${cookieName}.${i}`,
          value: chunk,
        }));

  await context.addCookies(cookiesToSet);
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Authenticate a Playwright page via Supabase REST API and set session cookies.
 * Works against both localhost and production (gynergy.app).
 *
 * @param page    - Playwright page (must have navigated to at least one page)
 * @param baseUrl - The base URL of the app (e.g., http://localhost:3000)
 * @param agent   - Test agent credentials (defaults to AGENT_PRIMARY)
 */
export async function authenticatePage(
  page: Page,
  baseUrl: string,
  agent: TestAgent = AGENT_PRIMARY
): Promise<SignInResult> {
  const result = await supabaseSignIn(page, agent.email, agent.password);
  if (!result.success) return result;
  await setCookies(page.context(), result, baseUrl);
  return result;
}

/**
 * Authenticate a standalone browser context (no page needed for cookie setting).
 * Useful when you need to set up auth on a context before creating pages.
 *
 * @param context - Playwright browser context
 * @param page    - Any page in the context (needed for fetch in browser)
 * @param baseUrl - The base URL of the app
 * @param agent   - Test agent credentials
 */
export async function authenticateContext(
  context: BrowserContext,
  page: Page,
  baseUrl: string,
  agent: TestAgent
): Promise<SignInResult> {
  const result = await supabaseSignIn(page, agent.email, agent.password);
  if (!result.success) return result;
  await setCookies(context, result, baseUrl);
  return result;
}

/**
 * Make an authenticated API call using Playwright's native request API.
 * Uses the page's context cookies (not page.evaluate), so it's safe during navigation.
 * Useful for setting up test data (e.g., sending a DM before testing the inbox).
 */
export async function apiCall(
  page: Page,
  baseUrl: string,
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<{ status: number; data: unknown }> {
  const response = await page.request.fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    data: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  return { status: response.status(), data };
}
