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
}));

vi.mock("@lib/supabase-server", () => ({
  createServiceClient: vi.fn(),
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

// Helper to create mock Supabase client
function createMockSupabase() {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data: null, error: null });

  return {
    from: mockFrom,
    _mocks: { mockFrom, mockSelect, mockInsert, mockUpdate, mockEq, mockSingle },
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
      const mockSupabase = createMockSupabase();
      mockSupabase._mocks.mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
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
      // Should not have made any database calls for unhandled events
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("returns 500 when handler throws error", async () => {
      // Mock supabase to throw during insert operation
      const mockSupabase = createMockSupabase();
      mockSupabase._mocks.mockInsert.mockRejectedValue(new Error("Database connection failed"));
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

      expect(response.status).toBe(500);
      expect(data.error).toBe("Webhook handler failed");
    });
  });
});
