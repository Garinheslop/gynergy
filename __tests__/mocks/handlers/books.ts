/**
 * MSW Handlers - Books API
 */
import { http, HttpResponse } from "msw";

import { mockBookSession } from "../factories";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// In-memory store
interface MockBook {
  id: string;
  title: string;
  slug: string;
  description: string;
  sessions: ReturnType<typeof mockBookSession>[];
}

let mockBooks: MockBook[] = [];

export function resetBooksStore() {
  mockBooks = [];
}

export function setBooksStore(books: MockBook[]) {
  mockBooks = books;
}

export const bookHandlers = [
  // GET /api/books/:requestType
  http.get(`${baseUrl}/api/books/:requestType`, ({ params, request }) => {
    const { requestType } = params;
    const url = new URL(request.url);

    switch (requestType) {
      case "get-all":
        return HttpResponse.json({ data: mockBooks });

      case "get-by-slug": {
        const slug = url.searchParams.get("slug");
        const book = mockBooks.find((b) => b.slug === slug);
        if (!book) {
          return HttpResponse.json({ error: "Book not found" }, { status: 404 });
        }
        return HttpResponse.json({ data: book });
      }

      case "get-by-id": {
        const id = url.searchParams.get("id");
        const book = mockBooks.find((b) => b.id === id);
        if (!book) {
          return HttpResponse.json({ error: "Book not found" }, { status: 404 });
        }
        return HttpResponse.json({ data: book });
      }

      case "get-sessions": {
        const bookId = url.searchParams.get("bookId");
        const book = mockBooks.find((b) => b.id === bookId);
        return HttpResponse.json({
          data: book?.sessions || [],
        });
      }

      case "get-active-session": {
        const bookId = url.searchParams.get("bookId");
        const book = mockBooks.find((b) => b.id === bookId);
        const activeSession = book?.sessions.find((s) => s.isActive);
        return HttpResponse.json({
          data: activeSession || null,
        });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),

  // POST /api/books/:requestType
  http.post(`${baseUrl}/api/books/:requestType`, async ({ params, request }) => {
    const { requestType } = params;
    const body = (await request.json()) as Record<string, unknown>;

    switch (requestType) {
      case "create": {
        const newBook: MockBook = {
          id: `book-${Date.now()}`,
          title: body.title as string,
          slug: body.slug as string,
          description: body.description as string,
          sessions: [],
        };
        mockBooks.push(newBook);
        return HttpResponse.json({ data: newBook }, { status: 201 });
      }

      default:
        return HttpResponse.json({ error: "Invalid request type" }, { status: 400 });
    }
  }),
];

export default bookHandlers;
