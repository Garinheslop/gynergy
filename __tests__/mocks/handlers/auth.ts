/**
 * MSW Handlers - Auth API
 */
import { http, HttpResponse } from "msw";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authHandlers = [
  // POST /api/auth - Request OTP
  http.post(`${baseUrl}/api/auth`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; requestType?: string };

    if (body.requestType === "request-otp") {
      if (!body.email) {
        return HttpResponse.json({ error: "Email is required" }, { status: 400 });
      }

      return HttpResponse.json({
        success: true,
        message: "OTP sent to email",
      });
    }

    if (body.requestType === "verify-otp") {
      return HttpResponse.json({
        success: true,
        user: {
          id: "test-user-id",
          email: body.email,
        },
      });
    }

    return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
  }),

  // GET /api/auth - Get session
  http.get(`${baseUrl}/api/auth`, () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
      },
      session: {
        access_token: "mock-token",
        expires_at: Date.now() + 3600000,
      },
    });
  }),
];

export default authHandlers;
