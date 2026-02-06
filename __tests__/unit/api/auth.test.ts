/**
 * Auth API Route Tests
 * Tests for email OTP authentication
 */
import { NextRequest } from "next/server";

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@lib/supabase-server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@lib/supabase-server";

import { POST } from "../../../app/api/auth/route";

const mockCreateClient = vi.mocked(createClient);

// Helper to create NextRequest
function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/auth", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
    },
  });
}

describe("Auth API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth", () => {
    it("sends OTP email successfully", async () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOtp: mockSignInWithOtp,
        },
      } as unknown as ReturnType<typeof createClient>);

      const request = createRequest({ email: "test@example.com" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Check your email to continue your journey.");
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });
    });

    it("returns 500 when OTP fails to send", async () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue({
        error: { message: "Rate limit exceeded" },
      });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOtp: mockSignInWithOtp,
        },
      } as unknown as ReturnType<typeof createClient>);

      const request = createRequest({ email: "test@example.com" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Error processing authentication request");
    });

    it("returns 500 when supabase client throws", async () => {
      mockCreateClient.mockImplementation(() => {
        throw new Error("Connection failed");
      });

      const request = createRequest({ email: "test@example.com" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Error processing authentication request");
    });

    it("uses correct redirect URL from origin header", async () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });
      mockCreateClient.mockReturnValue({
        auth: {
          signInWithOtp: mockSignInWithOtp,
        },
      } as unknown as ReturnType<typeof createClient>);

      const request = new NextRequest("http://localhost/api/auth", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
        headers: {
          "Content-Type": "application/json",
          origin: "https://app.gynergy.com",
        },
      });

      await POST(request);

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: "https://app.gynergy.com/auth/callback",
        },
      });
    });
  });
});
