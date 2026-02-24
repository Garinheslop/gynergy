/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at runtime using Zod.
 * Provides typed access and clear error messages when vars are missing.
 *
 * Usage:
 *   import { serverEnv, clientEnv } from "@lib/env";
 *   const key = serverEnv.STRIPE_SECRET_KEY;
 *
 * Skips validation during build (no server env vars available).
 */

import { z } from "zod";

// Helper: non-empty string (treats "" as missing)
const requiredStr = z.string().min(1);

// ---------------------------------------------------------------------------
// Server-side environment schema (never exposed to browser)
// ---------------------------------------------------------------------------
const serverSchema = z.object({
  // -- Supabase --
  SUPABASE_SERVICE_ROLE_KEY: requiredStr,

  // -- Stripe --
  STRIPE_SECRET_KEY: requiredStr,
  STRIPE_WEBHOOK_SECRET: requiredStr,

  // -- 100ms Video --
  HMS_ACCESS_KEY: requiredStr,
  HMS_SECRET: requiredStr,
  HMS_TEMPLATE_ID: requiredStr,
  HMS_WEBINAR_TEMPLATE_ID: z.string().optional(),
  HMS_WEBHOOK_SECRET: z.string().optional(),

  // -- Email (Resend) --
  RESEND_API_KEY: requiredStr,
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),

  // -- AI Providers (at least one should be set for AI features) --
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // -- Cron --
  CRON_SECRET: requiredStr,

  // -- CRM --
  GHL_API_KEY: z.string().optional(),
  GHL_WEBHOOK_SECRET: z.string().optional(),

  // -- Video Hosting --
  BUNNY_STREAM_API_KEY: z.string().optional(),
  BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
  BUNNY_STREAM_CDN_HOSTNAME: z.string().optional(),

  // -- Rate Limiting --
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // -- Internal --
  INTERNAL_API_SECRET: z.string().optional(),
  ADMIN_SETUP_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Client-side environment schema (NEXT_PUBLIC_* — safe for browser)
// ---------------------------------------------------------------------------
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredStr.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredStr,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: requiredStr,
  NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID: requiredStr,
  NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID: requiredStr,
  NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID: requiredStr,
  NEXT_PUBLIC_100MS_APP_ID: requiredStr,
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_BUCKET_NAME: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Validation (skipped during build / static generation)
// ---------------------------------------------------------------------------

function isBuildTime(): boolean {
  // Vercel sets this during builds; also skip if explicitly requested
  return (
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.NEXT_PHASE === "phase-production-build"
  );
}

function validateServer() {
  if (isBuildTime()) return {} as z.infer<typeof serverSchema>;

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    console.error(`\n❌ Missing or invalid server environment variables:\n${missing.join("\n")}\n`);
    throw new Error(
      `Missing server env vars: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`
    );
  }
  return result.data;
}

function validateClient() {
  if (isBuildTime()) return {} as z.infer<typeof clientSchema>;

  const result = clientSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    console.error(`\n❌ Missing or invalid client environment variables:\n${missing.join("\n")}\n`);
    throw new Error(
      `Missing client env vars: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`
    );
  }
  return result.data;
}

// Lazy singletons — validated once on first access
let _serverEnv: z.infer<typeof serverSchema> | null = null;
let _clientEnv: z.infer<typeof clientSchema> | null = null;

/**
 * Validated server environment variables.
 * Throws with a clear message listing ALL missing vars on first access.
 * Only use in server-side code (API routes, server components, middleware).
 */
export const serverEnv = new Proxy({} as z.infer<typeof serverSchema>, {
  get(_target, prop: string) {
    if (!_serverEnv) _serverEnv = validateServer();
    return _serverEnv[prop as keyof typeof _serverEnv];
  },
});

/**
 * Validated client environment variables (NEXT_PUBLIC_*).
 * Safe to use in both server and client code.
 */
export const clientEnv = new Proxy({} as z.infer<typeof clientSchema>, {
  get(_target, prop: string) {
    if (!_clientEnv) _clientEnv = validateClient();
    return _clientEnv[prop as keyof typeof _clientEnv];
  },
});

// Re-export schemas for testing
export { serverSchema, clientSchema };
