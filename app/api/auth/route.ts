export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { checkStrictRateLimit, getRateLimitHeaders } from "@lib/rate-limit";
import { createClient } from "@lib/supabase-server";

export async function POST(request: Request) {
  try {
    // Rate limit: 10 requests per minute per IP (brute-force protection)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitResult = await checkStrictRateLimit(`auth:${ip}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { email } = await request.json();
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.headers.get("origin")}/auth/callback`,
      },
    });

    if (error) throw error;

    return NextResponse.json({
      message: "Check your email to continue your journey.",
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Error processing authentication request" }, { status: 500 });
  }
}
