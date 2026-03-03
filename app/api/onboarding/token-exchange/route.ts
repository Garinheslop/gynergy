export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { checkStrictRateLimit, getRateLimitHeaders } from "@lib/rate-limit";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// POST /api/onboarding/token-exchange
// Validates an onboarding token and creates a Supabase session.
// Called by the /welcome page to auto-authenticate provisioned users.
// ============================================================================

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkStrictRateLimit(`token-exchange:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  let body: { token: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find valid, unexpired, unused token
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token", body.token)
    .single();

  if (tokenError || !tokenRecord) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  if (tokenRecord.used_at) {
    return NextResponse.json({ error: "token_already_used" }, { status: 410 });
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: "token_expired" }, { status: 410 });
  }

  // Mark token as used (single-use)
  await supabase
    .from("onboarding_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRecord.id);

  // Generate a magic link for this user so the browser can authenticate
  const { data: magicLink, error: magicError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: tokenRecord.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://app.gynergy.com"}/auth/callback?next=/date-zero-gratitude`,
    },
  });

  if (magicError || !magicLink) {
    console.error("[token-exchange] Magic link generation failed:", magicError);
    return NextResponse.json({ error: "auth_failed" }, { status: 500 });
  }

  // Extract the token hash from the magic link properties
  const actionLink = magicLink.properties?.action_link;

  return NextResponse.json({
    success: true,
    email: tokenRecord.email,
    actionLink,
  });
}
