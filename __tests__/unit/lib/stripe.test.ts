/**
 * Stripe Library Tests
 * Tests for lib/stripe.ts
 *
 * Focus on pure functions and configuration.
 * API-dependent functions are better tested in integration tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Stripe module to prevent actual API calls
vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: vi
          .fn()
          .mockResolvedValue({ id: "cs_test_123", url: "https://checkout.stripe.com" }),
      },
    },
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
      update: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
    },
    subscriptions: {
      update: vi.fn().mockResolvedValue({ id: "sub_test_123" }),
      cancel: vi.fn().mockResolvedValue({ id: "sub_test_123" }),
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({ type: "test.event", data: {} }),
    },
  }));
  return { default: MockStripe };
});

describe("Stripe Library", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
    process.env.NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID = "price_challenge_123";
    process.env.NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID = "price_journal_123";
    process.env.NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID = "price_annual_123";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("formatPrice", () => {
    it("formats cents to USD currency string", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(99700)).toBe("$997.00");
      expect(formatPrice(3995)).toBe("$39.95");
      expect(formatPrice(100)).toBe("$1.00");
      expect(formatPrice(0)).toBe("$0.00");
    });

    it("formats with default USD currency", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(1000)).toBe("$10.00");
    });

    it("formats with specified currency", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(1000, "eur")).toBe("€10.00");
      expect(formatPrice(1000, "gbp")).toBe("£10.00");
    });

    it("handles lowercase currency codes", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(1000, "usd")).toBe("$10.00");
    });

    it("handles uppercase currency codes", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(1000, "USD")).toBe("$10.00");
    });

    it("formats large amounts correctly", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(99999900)).toBe("$999,999.00");
    });

    it("formats amounts with cents correctly", async () => {
      const { formatPrice } = await import("@lib/stripe");

      expect(formatPrice(99)).toBe("$0.99");
      expect(formatPrice(1)).toBe("$0.01");
    });
  });

  describe("STRIPE_PRODUCTS", () => {
    it("has correct challenge product configuration", async () => {
      const { STRIPE_PRODUCTS } = await import("@lib/stripe");

      expect(STRIPE_PRODUCTS.CHALLENGE.amount).toBe(99700);
      expect(STRIPE_PRODUCTS.CHALLENGE.name).toBe("45-Day Awakening Challenge");
      expect(STRIPE_PRODUCTS.CHALLENGE.priceId).toBe("price_challenge_123");
    });

    it("has correct monthly journal product configuration", async () => {
      const { STRIPE_PRODUCTS } = await import("@lib/stripe");

      expect(STRIPE_PRODUCTS.JOURNAL_MONTHLY.amount).toBe(3995);
      expect(STRIPE_PRODUCTS.JOURNAL_MONTHLY.name).toBe("Digital Journal (Monthly)");
      expect(STRIPE_PRODUCTS.JOURNAL_MONTHLY.priceId).toBe("price_journal_123");
    });

    it("has correct annual journal product configuration", async () => {
      const { STRIPE_PRODUCTS } = await import("@lib/stripe");

      expect(STRIPE_PRODUCTS.JOURNAL_ANNUAL.amount).toBe(39900);
      expect(STRIPE_PRODUCTS.JOURNAL_ANNUAL.name).toBe("Digital Journal (Annual)");
      expect(STRIPE_PRODUCTS.JOURNAL_ANNUAL.priceId).toBe("price_annual_123");
    });

    it("returns empty string when price ID env var not set", async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID;
      vi.resetModules();

      const { STRIPE_PRODUCTS } = await import("@lib/stripe");

      expect(STRIPE_PRODUCTS.CHALLENGE.priceId).toBe("");
    });
  });

  describe("getStripe (internal)", () => {
    it("throws error when STRIPE_SECRET_KEY not configured", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();

      const { createChallengeCheckoutSession } = await import("@lib/stripe");

      await expect(
        createChallengeCheckoutSession({
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("STRIPE_SECRET_KEY is not configured");
    });
  });

  describe("createChallengeCheckoutSession", () => {
    it("creates session with required parameters", async () => {
      const { createChallengeCheckoutSession } = await import("@lib/stripe");

      const result = await createChallengeCheckoutSession({
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result).toHaveProperty("id");
      expect(result.id).toBe("cs_test_123");
    });

    it("creates session with optional parameters", async () => {
      const { createChallengeCheckoutSession } = await import("@lib/stripe");

      const result = await createChallengeCheckoutSession({
        userId: "user-123",
        email: "test@example.com",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.id).toBe("cs_test_123");
    });
  });

  describe("createSubscriptionCheckoutSession", () => {
    it("creates subscription session with required parameters", async () => {
      const { createSubscriptionCheckoutSession, STRIPE_PRODUCTS } = await import("@lib/stripe");

      const result = await createSubscriptionCheckoutSession({
        userId: "user-123",
        priceId: STRIPE_PRODUCTS.JOURNAL_MONTHLY.priceId,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.id).toBe("cs_test_123");
    });

    it("creates subscription session with trial days", async () => {
      const { createSubscriptionCheckoutSession, STRIPE_PRODUCTS } = await import("@lib/stripe");

      const result = await createSubscriptionCheckoutSession({
        userId: "user-123",
        priceId: STRIPE_PRODUCTS.JOURNAL_MONTHLY.priceId,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        trialDays: 14,
      });

      expect(result.id).toBe("cs_test_123");
    });
  });

  describe("verifyWebhookSignature", () => {
    it("throws error when webhook secret not configured", async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      vi.resetModules();

      const { verifyWebhookSignature } = await import("@lib/stripe");

      expect(() => verifyWebhookSignature("payload", "sig_test")).toThrow(
        "STRIPE_WEBHOOK_SECRET is not configured"
      );
    });

    it("verifies webhook signature with valid inputs", async () => {
      const { verifyWebhookSignature } = await import("@lib/stripe");

      const result = verifyWebhookSignature("payload", "sig_test");

      expect(result).toHaveProperty("type");
      expect(result.type).toBe("test.event");
    });
  });

  describe("getOrCreateCustomer", () => {
    it("creates customer when none exists", async () => {
      const { getOrCreateCustomer } = await import("@lib/stripe");

      const result = await getOrCreateCustomer({
        email: "test@example.com",
        userId: "user-123",
        name: "Test User",
      });

      expect(result.id).toBe("cus_test_123");
    });
  });

  describe("cancelSubscription", () => {
    it("cancels subscription at period end by default", async () => {
      const { cancelSubscription } = await import("@lib/stripe");

      const result = await cancelSubscription("sub_test_123");

      expect(result.id).toBe("sub_test_123");
    });

    it("cancels subscription immediately when specified", async () => {
      const { cancelSubscription } = await import("@lib/stripe");

      const result = await cancelSubscription("sub_test_123", false);

      expect(result.id).toBe("sub_test_123");
    });
  });
});
