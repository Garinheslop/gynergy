export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { checkStrictRateLimit, getRateLimitHeaders } from "@lib/rate-limit";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// POST /api/referral-credit/redeemed
// Called by gynergy.com when a friend redeems a referral credit.
// Updates the credit record and notifies the creator.
// ============================================================================

interface RedeemedPayload {
  creatorEmail: string;
  redeemerEmail: string;
  creditSlug: string;
  creditType: string;
  redeemedAt: string;
}

function getProvisionApiKey(): string {
  const key = process.env.PROVISION_API_KEY;
  if (!key) throw new Error("PROVISION_API_KEY is not configured");
  return key;
}

function validatePayload(
  body: unknown
): { valid: true; data: RedeemedPayload } | { valid: false; error: string } {
  const b = body as Record<string, unknown>;

  if (!b.creatorEmail || typeof b.creatorEmail !== "string") {
    return { valid: false, error: "missing_creator_email" };
  }

  if (!b.redeemerEmail || typeof b.redeemerEmail !== "string") {
    return { valid: false, error: "missing_redeemer_email" };
  }

  if (!b.creditSlug || typeof b.creditSlug !== "string") {
    return { valid: false, error: "missing_credit_slug" };
  }

  if (!b.creditType || typeof b.creditType !== "string") {
    return { valid: false, error: "missing_credit_type" };
  }

  return { valid: true, data: body as RedeemedPayload };
}

export async function POST(request: NextRequest) {
  // --- Rate limit ---
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkStrictRateLimit(`redeemed:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // --- API key auth ---
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== getProvisionApiKey()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // --- Parse and validate ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validatePayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = validation.data;
  const supabase = createServiceClient();

  // --- Find the credit by slug ---
  const { data: credit, error: creditError } = await supabase
    .from("referral_credits")
    .select("id, user_id, redeemed_at")
    .eq("slug", payload.creditSlug)
    .single();

  if (creditError || !credit) {
    return NextResponse.json({ error: "credit_not_found" }, { status: 404 });
  }

  // Already redeemed — idempotent response
  if (credit.redeemed_at) {
    return NextResponse.json({
      success: true,
      message: "Credit already redeemed",
      deduplicated: true,
    });
  }

  // --- Mark credit as redeemed ---
  const { error: updateError } = await supabase
    .from("referral_credits")
    .update({
      redeemed_at: payload.redeemedAt || new Date().toISOString(),
      redeemer_email: payload.redeemerEmail.toLowerCase().trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", credit.id);

  if (updateError) {
    console.error("[redeemed] Update error:", updateError);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  console.log(
    `[redeemed] Credit ${payload.creditSlug} redeemed by ${payload.redeemerEmail} (creator user: ${credit.user_id})`
  );

  return NextResponse.json({
    success: true,
    message: "Credit redemption recorded",
  });
}
