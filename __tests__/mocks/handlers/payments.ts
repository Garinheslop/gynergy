/**
 * MSW Handlers - Payments API (Stripe)
 */
import { http, HttpResponse } from "msw";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory store for entitlements
interface Entitlement {
  userId: string;
  type: "challenge" | "subscription";
  status: "active" | "cancelled" | "expired";
  expiresAt: string | null;
}

let mockEntitlements: Entitlement[] = [];
let mockFriendCodes: { code: string; usedBy: string | null; createdBy: string }[] = [];

export function resetPaymentsStore() {
  mockEntitlements = [];
  mockFriendCodes = [];
}

export function setEntitlementsStore(entitlements: Entitlement[]) {
  mockEntitlements = entitlements;
}

export function setFriendCodesStore(codes: typeof mockFriendCodes) {
  mockFriendCodes = codes;
}

export const paymentHandlers = [
  // POST /api/payments/create-checkout
  http.post(`${baseUrl}/api/payments/create-checkout`, async ({ request }) => {
    const body = (await request.json()) as { priceId?: string; productType?: string };

    if (!body.priceId) {
      return HttpResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    // Return a mock Stripe checkout session
    return HttpResponse.json({
      data: {
        sessionId: `cs_test_${Date.now()}`,
        url: `https://checkout.stripe.com/test/session_${Date.now()}`,
      },
    });
  }),

  // GET /api/payments/entitlements
  http.get(`${baseUrl}/api/payments/entitlements`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return HttpResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userEntitlements = mockEntitlements.filter((e) => e.userId === userId);

    return HttpResponse.json({
      data: {
        entitlements: userEntitlements,
        hasActiveAccess: userEntitlements.some((e) => e.status === "active"),
      },
    });
  }),

  // POST /api/payments/friend-code
  http.post(`${baseUrl}/api/payments/friend-code`, async ({ request }) => {
    const body = (await request.json()) as { code?: string; userId?: string; action?: string };

    if (body.action === "generate") {
      const newCode = {
        code: `FRIEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        usedBy: null,
        createdBy: body.userId || "unknown",
      };
      mockFriendCodes.push(newCode);
      return HttpResponse.json({ data: newCode });
    }

    if (body.action === "redeem") {
      const code = mockFriendCodes.find((c) => c.code === body.code);

      if (!code) {
        return HttpResponse.json({ error: "Invalid friend code" }, { status: 400 });
      }

      if (code.usedBy) {
        return HttpResponse.json({ error: "Code has already been used" }, { status: 400 });
      }

      code.usedBy = body.userId || "unknown";

      // Add entitlement for the user
      mockEntitlements.push({
        userId: body.userId || "unknown",
        type: "challenge",
        status: "active",
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return HttpResponse.json({
        data: {
          success: true,
          message: "Friend code redeemed successfully",
        },
      });
    }

    return HttpResponse.json({ error: "Invalid action" }, { status: 400 });
  }),

  // POST /api/payments/webhook (Stripe webhook)
  http.post(`${baseUrl}/api/payments/webhook`, async ({ request }) => {
    // Webhook handler - in tests, we typically bypass this
    // and directly manipulate the mock stores
    const _body = await request.text();

    // Just acknowledge the webhook
    return HttpResponse.json({ received: true });
  }),
];

export default paymentHandlers;
