export const dynamic = "force-dynamic";

import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { checkStrictRateLimit, getRateLimitHeaders } from "@lib/rate-limit";
import { enrollInDrip } from "@lib/services/dripService";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// POST /api/onboarding/provision
// Called by gynergy.com after Stripe checkout to provision a new member.
// Creates auth user, records purchase, grants access, returns onboarding URL.
// ============================================================================

const VALID_PRODUCTS = ["45-day-awakening"] as const;
const TOKEN_EXPIRY_HOURS = 1;

function getProvisionApiKey(): string {
  const key = process.env.PROVISION_API_KEY;
  if (!key) throw new Error("PROVISION_API_KEY is not configured");
  return key;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function buildOnboardingUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.gynergy.com";
  return `${baseUrl}/welcome?token=${token}`;
}

// ============================================================================
// Payload validation
// ============================================================================

interface ProvisionPayload {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  assessment?: {
    pillarScores?: Record<string, number>;
    ascensionLevel?: number;
    qualificationTier?: string;
    leveragePoint?: { pillar: string; description: string };
    maslow?: { primaryLevel: string; ceiling: string; growthEdge: string };
  };
  purchase: {
    product: string;
    stripeSessionId: string;
    stripeCustomerId: string;
    amountCents: number;
    purchaseDate: string;
    includesRetreat?: boolean;
  };
  referralCredit?: {
    slug: string;
    shareUrl: string;
    options: Array<{
      creditType: string;
      creditAmountCents: number;
      friendPaysCents: number;
    }>;
  };
  giftData?: unknown;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

function validatePayload(
  body: unknown
): { valid: true; data: ProvisionPayload } | { valid: false; error: string } {
  const b = body as Record<string, unknown>;

  if (!b.email || typeof b.email !== "string" || !b.email.includes("@")) {
    return { valid: false, error: "invalid_email" };
  }

  if (!b.firstName || typeof b.firstName !== "string") {
    return { valid: false, error: "missing_first_name" };
  }

  const purchase = b.purchase as Record<string, unknown> | undefined;
  if (!purchase || typeof purchase !== "object") {
    return { valid: false, error: "missing_purchase" };
  }

  if (
    !purchase.product ||
    !VALID_PRODUCTS.includes(purchase.product as (typeof VALID_PRODUCTS)[number])
  ) {
    return { valid: false, error: "unknown_product" };
  }

  if (!purchase.stripeSessionId || typeof purchase.stripeSessionId !== "string") {
    return { valid: false, error: "missing_stripe_session_id" };
  }

  if (!purchase.stripeCustomerId || typeof purchase.stripeCustomerId !== "string") {
    return { valid: false, error: "missing_stripe_customer_id" };
  }

  if (typeof purchase.amountCents !== "number" || purchase.amountCents <= 0) {
    return { valid: false, error: "invalid_amount" };
  }

  return { valid: true, data: body as ProvisionPayload };
}

// ============================================================================
// Main handler
// ============================================================================

export async function POST(request: NextRequest) {
  // --- Rate limit ---
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkStrictRateLimit(`provision:${ip}`);
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
  const normalizedEmail = payload.email.toLowerCase().trim();

  const supabase = createServiceClient();

  // --- Deduplication: check if this Stripe session was already provisioned ---
  const { data: existingProvision } = await supabase
    .from("provision_events")
    .select("id, status, onboarding_url, user_id")
    .eq("stripe_session_id", payload.purchase.stripeSessionId)
    .single();

  if (existingProvision?.status === "completed" && existingProvision.onboarding_url) {
    return NextResponse.json({
      success: true,
      memberId: existingProvision.user_id,
      onboardingUrl: existingProvision.onboarding_url,
      tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      deduplicated: true,
    });
  }

  // Record provision attempt
  const { error: provisionInsertError } = await supabase.from("provision_events").upsert(
    {
      stripe_session_id: payload.purchase.stripeSessionId,
      email: normalizedEmail,
      status: "processing",
      payload: body as Record<string, unknown>,
      created_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" }
  );

  if (provisionInsertError) {
    console.error("[provision] Failed to record event:", provisionInsertError);
  }

  try {
    // ================================================================
    // STEP 1: Create or find Supabase Auth user
    // ================================================================

    let userId: string;
    let isNewUser = false;

    // Check if user already exists by email in our users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, supabase_id")
      .eq("email", normalizedEmail)
      .limit(1)
      .single();

    if (existingUser?.supabase_id) {
      userId = existingUser.supabase_id;
    } else {
      // Create new auth user with a random password (they'll use magic link)
      const tempPassword = crypto.randomBytes(32).toString("base64url");
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true, // Pre-verify email (they already verified via gynergy.com checkout)
        user_metadata: {
          first_name: payload.firstName,
          last_name: payload.lastName || "",
          source: "gynergy_com_provision",
        },
      });

      if (authError) {
        // User might exist in auth but not in users table
        if (authError.message?.includes("already been registered")) {
          const { data: authList } = await supabase.auth.admin.listUsers();
          const found = authList?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
          if (found) {
            userId = found.id;
          } else {
            throw new Error(`Auth user exists but not found: ${authError.message}`);
          }
        } else {
          throw new Error(`Auth creation failed: ${authError.message}`);
        }
      } else {
        userId = authUser.user.id;
        isNewUser = true;
      }
    }

    // ================================================================
    // STEP 2: Ensure users table record exists
    // ================================================================

    await supabase.from("users").upsert(
      {
        supabase_id: userId,
        email: normalizedEmail,
        first_name: payload.firstName,
        last_name: payload.lastName || null,
        gender: payload.gender || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "supabase_id" }
    );

    // Get the internal user ID (may differ from supabase_id if table uses its own UUID)
    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", userId)
      .single();

    const internalUserId = userRecord?.id || userId;

    // ================================================================
    // STEP 3: Record purchase
    // ================================================================

    const { error: purchaseError } = await supabase.from("purchases").upsert(
      {
        user_id: internalUserId,
        stripe_checkout_session_id: payload.purchase.stripeSessionId,
        stripe_customer_id: payload.purchase.stripeCustomerId,
        purchase_type: "challenge",
        amount_cents: payload.purchase.amountCents,
        currency: "usd",
        status: "completed",
        email: normalizedEmail,
        metadata: {
          source: "marketing",
          provisioned_by: "gynergy_com",
          includes_retreat: payload.purchase.includesRetreat || false,
          utm: payload.utm || null,
        },
        purchased_at: payload.purchase.purchaseDate || new Date().toISOString(),
      },
      { onConflict: "stripe_checkout_session_id" }
    );

    if (purchaseError) {
      console.error("[provision] Purchase insert error:", purchaseError);
      // Don't fail the whole provision — the DB trigger may have already fired
    }

    // ================================================================
    // STEP 4: Grant challenge access
    // Find current/next cohort session and enroll user
    // ================================================================

    const { data: activeSession } = await supabase
      .from("book_sessions")
      .select("id")
      .eq("is_personal", false)
      .in("status", ["active", "upcoming"])
      .order("start_date", { ascending: true })
      .limit(1)
      .single();

    if (activeSession) {
      // grant_challenge_access handles upsert internally
      await supabase.rpc("grant_challenge_access", {
        p_user_id: internalUserId,
        p_access_type: "purchased",
        p_session_id: activeSession.id,
      });

      // Enroll in cohort
      const { data: cohort } = await supabase
        .from("cohorts")
        .select("id")
        .eq("session_id", activeSession.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (cohort) {
        await supabase.from("cohort_memberships").upsert(
          {
            cohort_id: cohort.id,
            user_id: internalUserId,
            role: "member",
            joined_at: new Date().toISOString(),
          },
          { onConflict: "cohort_id,user_id" }
        );
      }
    } else {
      // No active session — still grant access, will be assigned later
      await supabase.from("user_entitlements").upsert(
        {
          user_id: internalUserId,
          has_challenge_access: true,
          challenge_access_type: "purchased",
          challenge_access_granted_at: new Date().toISOString(),
          has_community_access: true,
          community_access_granted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // ================================================================
    // STEP 5: Store referral credit (if provided)
    // ================================================================

    if (payload.referralCredit?.slug) {
      await supabase.from("referral_credits").upsert(
        {
          user_id: internalUserId,
          slug: payload.referralCredit.slug,
          share_url: payload.referralCredit.shareUrl,
          options: payload.referralCredit.options,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
    }

    // ================================================================
    // STEP 6: Generate one-time onboarding token
    // ================================================================

    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await supabase.from("onboarding_tokens").insert({
      token,
      user_id: internalUserId,
      email: normalizedEmail,
      expires_at: expiresAt.toISOString(),
    });

    const onboardingUrl = buildOnboardingUrl(token);

    // ================================================================
    // STEP 7: Mark provision as completed
    // ================================================================

    await supabase
      .from("provision_events")
      .update({
        user_id: internalUserId,
        status: "completed",
        onboarding_url: onboardingUrl,
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", payload.purchase.stripeSessionId);

    // ================================================================
    // STEP 8: Non-blocking side effects
    // ================================================================

    // Enroll in post-purchase drip
    enrollInDrip("purchase_completed", normalizedEmail, {
      firstName: payload.firstName,
      productName: "45-Day Awakening Challenge",
      source: "gynergy_com",
    }).catch((err) => console.error("[provision] Drip enrollment error:", err));

    // Enroll in referral credit sharing drip (if credit was issued)
    if (payload.referralCredit?.slug) {
      enrollInDrip("friend_codes_issued", normalizedEmail, {
        firstName: payload.firstName,
        shareUrl: payload.referralCredit.shareUrl,
      }).catch((err) => console.error("[provision] Credit drip enrollment error:", err));
    }

    // ================================================================
    // RESPONSE
    // ================================================================

    console.log(
      `[provision] ${isNewUser ? "New" : "Existing"} user provisioned: ${normalizedEmail} → ${internalUserId}`
    );

    return NextResponse.json({
      success: true,
      memberId: internalUserId,
      onboardingUrl,
      tokenExpiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[provision] Fatal error:", error);

    // Mark provision as failed
    await supabase
      .from("provision_events")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("stripe_session_id", payload.purchase.stripeSessionId);

    return NextResponse.json(
      {
        error: "provision_failed",
        message: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
