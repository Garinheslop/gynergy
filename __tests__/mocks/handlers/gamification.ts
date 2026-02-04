/**
 * MSW Handlers - Gamification API (Badges, Points)
 */
import { http, HttpResponse } from "msw";

import { mockBadge, mockUserBadge } from "../factories";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory stores
let mockBadges: ReturnType<typeof mockBadge>[] = [];
let mockUserBadges: ReturnType<typeof mockUserBadge>[] = [];
let mockPoints = { total: 0, transactions: [] as unknown[] };

export function resetGamificationStore() {
  mockBadges = [];
  mockUserBadges = [];
  mockPoints = { total: 0, transactions: [] };
}

export function setBadgesStore(badges: ReturnType<typeof mockBadge>[]) {
  mockBadges = badges;
}

export function setUserBadgesStore(userBadges: ReturnType<typeof mockUserBadge>[]) {
  mockUserBadges = userBadges;
}

export function setPointsStore(points: typeof mockPoints) {
  mockPoints = points;
}

export const gamificationHandlers = [
  // GET /api/gamification/:requestType
  http.get(`${baseUrl}/api/gamification/:requestType`, ({ params }) => {
    const { requestType } = params;

    switch (requestType) {
      case "get-badges":
        return HttpResponse.json({
          data: mockBadges,
        });

      case "get-user-badges":
        return HttpResponse.json({
          data: mockUserBadges,
        });

      case "get-points":
        return HttpResponse.json({
          data: mockPoints,
        });

      case "get-multiplier":
        return HttpResponse.json({
          data: {
            current: { value: 1.0, name: "No multiplier" },
            streak: 3,
          },
        });

      case "get-leaderboard":
        return HttpResponse.json({
          data: [],
        });

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),

  // POST /api/gamification/:requestType
  http.post(`${baseUrl}/api/gamification/:requestType`, async ({ params, request }) => {
    const { requestType } = params;
    const body = (await request.json()) as Record<string, unknown>;

    switch (requestType) {
      case "check-badges": {
        // Simulate badge check - return any newly earned badges
        return HttpResponse.json({
          data: {
            earned: [],
            checked: true,
          },
        });
      }

      case "toggle-showcase": {
        const badgeId = body.badgeId as string;
        const index = mockUserBadges.findIndex((ub) => ub.badgeId === badgeId);
        if (index !== -1) {
          mockUserBadges[index].isShowcased = !mockUserBadges[index].isShowcased;
        }
        return HttpResponse.json({
          data: mockUserBadges[index] || null,
        });
      }

      case "award-points": {
        const points = body.points as number;
        mockPoints.total += points;
        mockPoints.transactions.push({
          id: `tx-${Date.now()}`,
          points,
          type: body.type,
          createdAt: new Date().toISOString(),
        });
        return HttpResponse.json({
          data: { total: mockPoints.total },
        });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),
];

export default gamificationHandlers;
