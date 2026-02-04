/**
 * MSW Handlers - Enrollments API
 */
import { http, HttpResponse } from "msw";

import { mockEnrollment } from "../factories";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory store
let mockEnrollments: ReturnType<typeof mockEnrollment>[] = [];

export function resetEnrollmentsStore() {
  mockEnrollments = [];
}

export function setEnrollmentsStore(enrollments: ReturnType<typeof mockEnrollment>[]) {
  mockEnrollments = enrollments;
}

export const enrollmentHandlers = [
  // GET /api/enrollments/:requestType
  http.get(`${baseUrl}/api/enrollments/:requestType`, ({ params, request }) => {
    const { requestType } = params;
    const url = new URL(request.url);

    switch (requestType) {
      case "get-current": {
        const userId = url.searchParams.get("userId");
        const enrollment = mockEnrollments.find((e) => e.userId === userId);
        return HttpResponse.json({ data: enrollment || null });
      }

      case "get-all": {
        const userId = url.searchParams.get("userId");
        const enrollments = userId
          ? mockEnrollments.filter((e) => e.userId === userId)
          : mockEnrollments;
        return HttpResponse.json({ data: enrollments });
      }

      case "get-streak": {
        const userId = url.searchParams.get("userId");
        const enrollment = mockEnrollments.find((e) => e.userId === userId);
        return HttpResponse.json({
          data: {
            count: enrollment?.streakCount || 0,
            lastActivityDate: enrollment?.lastActivityDate || null,
          },
        });
      }

      case "get-progress": {
        const userId = url.searchParams.get("userId");
        const enrollment = mockEnrollments.find((e) => e.userId === userId);
        return HttpResponse.json({
          data: {
            totalPoints: enrollment?.totalPoints || 0,
            streakCount: enrollment?.streakCount || 0,
            daysCompleted: 0,
            totalDays: 45,
          },
        });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),

  // POST /api/enrollments/:requestType
  http.post(`${baseUrl}/api/enrollments/:requestType`, async ({ params, request }) => {
    const { requestType } = params;
    const body = (await request.json()) as Record<string, unknown>;

    switch (requestType) {
      case "create": {
        const newEnrollment = mockEnrollment({
          userId: body.userId as string,
          sessionId: body.sessionId as string,
        });
        mockEnrollments.push(newEnrollment);
        return HttpResponse.json({ data: newEnrollment }, { status: 201 });
      }

      case "update-streak": {
        const userId = body.userId as string;
        const index = mockEnrollments.findIndex((e) => e.userId === userId);
        if (index !== -1) {
          mockEnrollments[index].streakCount += 1;
          mockEnrollments[index].lastActivityDate = new Date().toISOString();
        }
        return HttpResponse.json({
          data: mockEnrollments[index] || null,
        });
      }

      case "add-points": {
        const userId = body.userId as string;
        const points = body.points as number;
        const index = mockEnrollments.findIndex((e) => e.userId === userId);
        if (index !== -1) {
          mockEnrollments[index].totalPoints += points;
        }
        return HttpResponse.json({
          data: mockEnrollments[index] || null,
        });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),
];

export default enrollmentHandlers;
