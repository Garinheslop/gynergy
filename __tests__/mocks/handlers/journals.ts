/**
 * MSW Handlers - Journals API
 */
import { http, HttpResponse } from "msw";

import { mockJournalEntry } from "../factories";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory store for journals during tests
let mockJournals: ReturnType<typeof mockJournalEntry>[] = [];

export function resetJournalsStore() {
  mockJournals = [];
}

export function setJournalsStore(journals: ReturnType<typeof mockJournalEntry>[]) {
  mockJournals = journals;
}

export const journalHandlers = [
  // GET /api/journals/:requestType
  http.get(`${baseUrl}/api/journals/:requestType`, ({ params }) => {
    const { requestType } = params;

    switch (requestType) {
      case "get-morning":
        return HttpResponse.json({
          data: mockJournals.filter((j) => j.entryType === "morning"),
        });

      case "get-evening":
        return HttpResponse.json({
          data: mockJournals.filter((j) => j.entryType === "evening"),
        });

      case "get-weekly":
        return HttpResponse.json({
          data: mockJournals.filter((j) => j.entryType === "weekly"),
        });

      case "get-all":
        return HttpResponse.json({
          data: mockJournals,
        });

      case "get-today": {
        const today = new Date().toISOString().split("T")[0];
        return HttpResponse.json({
          data: mockJournals.filter((j) => j.entryDate === today),
        });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),

  // POST /api/journals/:requestType
  http.post(`${baseUrl}/api/journals/:requestType`, async ({ params, request }) => {
    const { requestType } = params;
    const body = (await request.json()) as Record<string, unknown>;

    switch (requestType) {
      case "create-morning": {
        const newEntry = mockJournalEntry({
          entryType: "morning",
          content: body.content as Record<string, unknown>,
          entryDate: body.entryDate as string,
        });
        mockJournals.push(newEntry);
        return HttpResponse.json({ data: newEntry }, { status: 201 });
      }

      case "create-evening": {
        const newEntry = mockJournalEntry({
          entryType: "evening",
          content: body.content as Record<string, unknown>,
          entryDate: body.entryDate as string,
        });
        mockJournals.push(newEntry);
        return HttpResponse.json({ data: newEntry }, { status: 201 });
      }

      case "create-weekly": {
        const newEntry = mockJournalEntry({
          entryType: "weekly",
          content: body.content as Record<string, unknown>,
          entryDate: body.entryDate as string,
        });
        mockJournals.push(newEntry);
        return HttpResponse.json({ data: newEntry }, { status: 201 });
      }

      case "update": {
        const index = mockJournals.findIndex((j) => j.id === body.id);
        if (index === -1) {
          return HttpResponse.json({ error: "Journal not found" }, { status: 404 });
        }
        mockJournals[index] = {
          ...mockJournals[index],
          content: body.content as Record<string, unknown>,
          updatedAt: new Date().toISOString(),
        };
        return HttpResponse.json({ data: mockJournals[index] });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),
];

export default journalHandlers;
