/**
 * MSW Handlers - User/Profile API
 */
import { http, HttpResponse } from "msw";

import { mockUser } from "../factories";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory store
let mockProfile: ReturnType<typeof mockUser> | null = null;

export function resetUserStore() {
  mockProfile = null;
}

export function setUserStore(user: ReturnType<typeof mockUser> | null) {
  mockProfile = user;
}

export const userHandlers = [
  // GET /api/user/profile
  http.get(`${baseUrl}/api/user/profile`, () => {
    if (!mockProfile) {
      return HttpResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return HttpResponse.json({ data: mockProfile });
  }),

  // POST /api/user/profile
  http.post(`${baseUrl}/api/user/profile`, async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof mockUser>>;

    if (mockProfile) {
      mockProfile = { ...mockProfile, ...body };
    } else {
      mockProfile = mockUser(body);
    }

    return HttpResponse.json({ data: mockProfile });
  }),

  // PUT /api/user/profile
  http.put(`${baseUrl}/api/user/profile`, async ({ request }) => {
    const body = (await request.json()) as Partial<ReturnType<typeof mockUser>>;

    if (!mockProfile) {
      return HttpResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    mockProfile = { ...mockProfile, ...body };
    return HttpResponse.json({ data: mockProfile });
  }),

  // GET /api/users/:requestType
  http.get(`${baseUrl}/api/users/:requestType`, ({ params }) => {
    const { requestType } = params;

    switch (requestType) {
      case "get-profile":
        return HttpResponse.json({ data: mockProfile });

      case "get-settings":
        return HttpResponse.json({
          data: {
            notifications: true,
            theme: "dark",
            timezone: "America/New_York",
          },
        });

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),

  // POST /api/users/:requestType
  http.post(`${baseUrl}/api/users/:requestType`, async ({ params, request }) => {
    const { requestType } = params;
    const body = (await request.json()) as Record<string, unknown>;

    switch (requestType) {
      case "update-profile":
        if (mockProfile) {
          mockProfile = { ...mockProfile, ...(body as Partial<ReturnType<typeof mockUser>>) };
        }
        return HttpResponse.json({ data: mockProfile });

      case "update-settings":
        return HttpResponse.json({
          data: {
            ...body,
            updated: true,
          },
        });

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),
];

export default userHandlers;
