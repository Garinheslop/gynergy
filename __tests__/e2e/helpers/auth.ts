import { Page } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "garin@gynergy.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "PlaywrightTest123!";
const SUPABASE_URL = "https://lhpmebczgzizqlypzwcj.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxocG1lYmN6Z3ppenFseXB6d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzgxMTIsImV4cCI6MjA1Nzg1NDExMn0.8qEL_XhWjYcLBjou_P0OjL2lpgMoSDCl2KnN04ogCsw";

interface SignInResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  userId?: string;
  error?: string;
}

/**
 * Authenticate a Playwright page via Supabase REST API and set session cookies.
 * Works against both localhost and production (gynergy.app).
 */
export async function authenticatePage(page: Page, baseUrl: string): Promise<SignInResult> {
  // Sign in via Supabase REST API in browser context
  const signInResult: SignInResult = await page.evaluate(
    async ({ url, key, email, password }) => {
      try {
        const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error_description || data.msg || "Unknown error" };
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
    { url: SUPABASE_URL, key: ANON_KEY, email: TEST_EMAIL, password: TEST_PASSWORD }
  );

  if (!signInResult.success) return signInResult;

  // Build session cookie
  const projectRef = "lhpmebczgzizqlypzwcj";
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionData = JSON.stringify({
    access_token: signInResult.access_token,
    refresh_token: signInResult.refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: signInResult.expires_at,
  });

  // Determine cookie domain from baseUrl
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
      : chunks.map((chunk, i) => ({ ...cookieBase, name: `${cookieName}.${i}`, value: chunk }));

  await page.context().addCookies(cookiesToSet);

  return signInResult;
}
