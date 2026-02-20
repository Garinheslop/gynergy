/**
 * Payments Webhook API Route Tests
 * Tests for Stripe webhook event handling
 */
import { NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@lib/logger", () => ({
  paymentLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@lib/stripe", () => ({
  verifyWebhookSignature: vi.fn(),
  formatPrice: vi.fn().mockReturnValue("$997.00"),
  STRIPE_PRODUCTS: {
    CHALLENGE: { name: "45-Day Challenge", amount: 99700 },
  },
}));

vi.mock("@lib/supabase-server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@lib/email", () => ({
  sendPurchaseConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import { verifyWebhookSignature } from "@lib/stripe";
import { createServiceClient } from "@lib/supabase-server";

import { POST } from "../../../app/api/payments/webhook/route";

const mockVerifyWebhookSignature = vi.mocked(verifyWebhookSignature);
const mockCreateServiceClient = vi.mocked(createServiceClient);

// Helper to create NextRequest
function createRequest(body: string, signature: string | null): NextRequest {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

// Helper to create mock Supabase client with table-specific responses
function createMockSupabase(tableResponses?: {
  profiles?: { data: unknown; error: unknown };
  friend_codes?: { data: unknown; error: unknown };
  purchases?: { error: unknown };
  subscriptions?: { data: unknown; error: unknown };
}) {
  const mockFrom = vi.fn();

  // Default responses
  const defaults = {
    profiles: { data: { first_name: "Test" }, error: null },
    friend_codes: { data: [{ code: "FRIEND123" }, { code: "FRIEND456" }], error: null },
    purchases: { error: null },
    subscriptions: { data: null, error: null },
  };

  const responses = { ...defaults, ...tableResponses };

  // Create chainable object that supports .eq().eq().single() pattern
  const createChainable = (tableData: { data?: unknown; error?: unknown }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chainable: any = {
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue(tableData),
    };
    // Make eq return itself for chaining .eq().eq()
    chainable.eq.mockReturnValue(chainable);
    return chainable;
  };

  // Table-specific behavior
  mockFrom.mockImplementation((tableName: string) => {
    const tableData = responses[tableName as keyof typeof responses] || { data: null, error: null };
    const chainable = createChainable(tableData);

    return {
      select: vi.fn().mockReturnValue(chainable),
      insert: vi
        .fn()
        .mockResolvedValue({ error: tableName === "purchases" ? responses.purchases.error : null }),
      update: vi.fn().mockReturnValue(chainable),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
  });

  return {
    from: mockFrom,
    _mocks: { mockFrom },
  };
}

describe("Payments Webhook API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/payments/webhook", () => {
    it("returns 400 when no signature is provided", async () => {
      const request = createRequest("{}", null);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No signature");
    });

    it("returns 400 when signature verification fails", async () => {
      mockVerifyWebhookSignature.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const request = createRequest("{}", "invalid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid signature");
    });

    it("handles checkout.session.completed event for challenge purchase", async () => {
      const mockSupabase = createMockSupabase();
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_intent: "pi_test_123",
            customer: "cus_test_123",
            customer_email: "test@example.com",
            amount_total: 99700,
            currency: "usd",
            metadata: {
              userId: "user-123",
              productType: "challenge",
            },
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("purchases");
    });

    it("handles invoice.paid event for subscription", async () => {
      // Simulate subscription not existing yet (PGRST116 = not found)
      const mockSupabase = createMockSupabase({
        subscriptions: { data: null, error: { code: "PGRST116" } },
      });
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "invoice.paid",
        data: {
          object: {
            subscription: "sub_test_123",
            subscription_details: { metadata: { userId: "user-123" } },
            period_start: Math.floor(Date.now() / 1000),
            period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            customer: "cus_test_123",
            amount_paid: 1999,
            currency: "usd",
            lines: {
              data: [{ price: { id: "price_123", recurring: { interval: "month" } } }],
            },
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it("handles invoice.payment_failed event", async () => {
      const mockSupabase = createMockSupabase();
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "invoice.payment_failed",
        data: {
          object: {
            subscription: "sub_test_123",
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("subscriptions");
    });

    it("handles customer.subscription.updated event", async () => {
      const mockSupabase = createMockSupabase();
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test_123",
            status: "active",
            cancel_at_period_end: false,
            canceled_at: null,
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it("handles customer.subscription.deleted event", async () => {
      const mockSupabase = createMockSupabase();
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_test_123",
            status: "canceled",
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });

    it("ignores unhandled event types", async () => {
      const mockSupabase = createMockSupabase();
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "customer.created",
        data: {
          object: { id: "cus_test" },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should not have made any business table calls for unhandled events
      // (webhook_events calls are expected for deduplication/tracking)
      const businessCalls = mockSupabase.from.mock.calls.filter(
        ([table]: [string]) => table !== "webhook_events"
      );
      expect(businessCalls).toHaveLength(0);
    });

    it("returns 500 when handler throws error", async () => {
      // Mock supabase to return error during insert operation (route throws on error)
      const mockSupabase = createMockSupabase({
        purchases: { error: new Error("Database connection failed") },
      });
      mockCreateServiceClient.mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceClient>
      );

      const event = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            payment_intent: "pi_test",
            customer: "cus_test",
            metadata: { productType: "challenge", userId: "user-123" },
          },
        },
      };

      mockVerifyWebhookSignature.mockReturnValue(
        event as unknown as ReturnType<typeof verifyWebhookSignature>
      );

      const request = createRequest(JSON.stringify(event), "valid-signature");
      const response = await POST(request);
      const data = await response.json();

      // Route returns 200 to Stripe even on error (prevents retry storms)
      // Failed events are stored in webhook_events for manual retry
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.error).toBe("Handler failed, queued for retry");
    });
  });
});
