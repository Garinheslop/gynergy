import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Save original env
const originalEnv = { ...process.env };

// Minimal valid env for all required fields
function validEnv() {
  return {
    // Server required
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_123",
    HMS_ACCESS_KEY: "test-hms-key",
    HMS_SECRET: "test-hms-secret",
    HMS_TEMPLATE_ID: "test-hms-template",
    RESEND_API_KEY: "re_test_123",
    CRON_SECRET: "test-cron-secret",
    // Client required
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID: "price_challenge",
    NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID: "price_journal",
    NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID: "price_annual",
    NEXT_PUBLIC_100MS_APP_ID: "test-100ms-app",
  };
}

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
    // Remove build-time skip flags
    delete process.env.SKIP_ENV_VALIDATION;
    delete process.env.NEXT_PHASE;
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  describe("serverSchema", () => {
    it("accepts valid required server vars", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = validEnv();
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("rejects empty STRIPE_SECRET_KEY", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = { ...validEnv(), STRIPE_SECRET_KEY: "" };
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("rejects missing CRON_SECRET", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = { ...validEnv() };
      delete (env as Record<string, unknown>).CRON_SECRET;
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("allows optional vars to be missing", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = validEnv();
      // No optional vars set — should still pass
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("accepts optional vars when provided", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = {
        ...validEnv(),
        ANTHROPIC_API_KEY: "sk-ant-test",
        GHL_API_KEY: "pit-test",
        UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
      };
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UPSTASH_REDIS_REST_URL (not a URL)", async () => {
      const { serverSchema } = await import("@lib/env");
      const env = { ...validEnv(), UPSTASH_REDIS_REST_URL: "not-a-url" };
      const result = serverSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("clientSchema", () => {
    it("accepts valid required client vars", async () => {
      const { clientSchema } = await import("@lib/env");
      const env = validEnv();
      const result = clientSchema.safeParse(env);
      expect(result.success).toBe(true);
    });

    it("rejects non-URL NEXT_PUBLIC_SUPABASE_URL", async () => {
      const { clientSchema } = await import("@lib/env");
      const env = { ...validEnv(), NEXT_PUBLIC_SUPABASE_URL: "not-a-url" };
      const result = clientSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("rejects missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", async () => {
      const { clientSchema } = await import("@lib/env");
      const env = { ...validEnv() };
      delete (env as Record<string, unknown>).NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const result = clientSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("serverEnv proxy", () => {
    it("returns validated value on access", async () => {
      Object.assign(process.env, validEnv());
      const { serverEnv } = await import("@lib/env");
      expect(serverEnv.STRIPE_SECRET_KEY).toBe("sk_test_123");
    });

    it("throws with descriptive error when required var missing", async () => {
      // Set all EXCEPT CRON_SECRET
      const env = validEnv();
      delete (env as Record<string, unknown>).CRON_SECRET;
      Object.assign(process.env, env);
      // Remove CRON_SECRET from process.env too
      delete process.env.CRON_SECRET;

      const { serverEnv } = await import("@lib/env");
      expect(() => serverEnv.STRIPE_SECRET_KEY).toThrow("Missing server env vars");
    });
  });

  describe("clientEnv proxy", () => {
    it("returns validated value on access", async () => {
      Object.assign(process.env, validEnv());
      const { clientEnv } = await import("@lib/env");
      expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    });
  });

  describe("build-time skip", () => {
    it("skips validation when SKIP_ENV_VALIDATION=true", async () => {
      process.env.SKIP_ENV_VALIDATION = "true";
      // No env vars set at all — should NOT throw
      const { serverEnv } = await import("@lib/env");
      expect(() => serverEnv.STRIPE_SECRET_KEY).not.toThrow();
    });

    it("skips validation during Next.js build phase", async () => {
      process.env.NEXT_PHASE = "phase-production-build";
      const { serverEnv } = await import("@lib/env");
      expect(() => serverEnv.STRIPE_SECRET_KEY).not.toThrow();
    });
  });
});
