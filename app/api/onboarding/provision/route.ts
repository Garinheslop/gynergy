/**
 * POST /api/onboarding/provision
 *
 * Cross-site provisioning endpoint called by gynergy.com / lvl5life.com
 * after a purchase to create user accounts in the portal.
 *
 * Auth: x-api-key header (shared secret = INTERNAL_API_SECRET)
 *
 * Flow:
 *   1. Validate API key + request body
 *   2. Check idempotency (Stripe session ID)
 *   3. Create or find auth user → trigger auto-creates portal user
 *   4. Update user with gender + metadata
 *   5. Store external assessment data
 *   6. Create purchase record
 *   7. Grant entitlements
 *   8. Enroll in current cohort
 *   9. Generate magic link (Supabase admin)
 *  10. Enroll in drip campaigns
 *  11. Return { success, memberId, onboardingUrl, tokenExpiresAt }
 */

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { DEFAULT_BOOK_ID } from "@lib/constants";
import { enrollInDrip } from "@lib/services/dripService";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// Request Validation Schema
// ============================================================================

const provisionSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),

  assessment: z
    .object({
      pillarScores: z.object({
        health: z.number().min(0).max(100),
        relationships: z.number().min(0).max(100),
        wealth: z.number().min(0).max(100),
        mindset: z.number().min(0).max(100),
        legacy: z.number().min(0).max(100),
      }),
      ascensionLevel: z.number().min(1).max(5),
      qualificationTier: z.string(),
      leveragePoint: z
        .object({
          pillar: z.string(),
          description: z.string(),
        })
        .optional(),
      maslow: z
        .object({
          primaryLevel: z.string(),
          ceiling: z.string(),
          growthEdge: z.string(),
        })
        .optional(),
    })
    .optional(),

  purchase: z.object({
    product: z.string(),
    stripeSessionId: z.string(),
    stripeCustomerId: z.string(),
    amountCents: z.number().int().positive(),
    purchaseDate: z.string().optional(),
    includesRetreat: z.boolean().optional(),
  }),

  referralCredit: z
    .object({
      slug: z.string(),
      shareUrl: z.string(),
      options: z.array(
        z.object({
          creditType: z.string(),
          creditAmountCents: z.number(),
          friendPaysCents: z.number(),
        })
      ),
    })
    .optional()
    .nullable(),

  giftData: z.unknown().optional().nullable(),

  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    })
    .optional(),
});

// Products that trigger provisioning (challenge access)
const VALID_PRODUCTS = ["45-day-awakening", "awakening-retreat-bundle"];

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------
    // 1. Auth — verify API key
    // ------------------------------------------------------------------
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.INTERNAL_API_SECRET;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ------------------------------------------------------------------
    // 2. Parse + validate request body
    // ------------------------------------------------------------------
    const body = await request.json();
    const parsed = provisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // ------------------------------------------------------------------
    // 3. Validate product
    // ------------------------------------------------------------------
    if (!VALID_PRODUCTS.includes(data.purchase.product)) {
      return NextResponse.json({ error: "unknown_product" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ------------------------------------------------------------------
    // 4. Idempotency — check if this Stripe session was already processed
    // ------------------------------------------------------------------
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id, user_id")
      .eq("stripe_checkout_session_id", data.purchase.stripeSessionId)
      .single();

    if (existingPurchase) {
      // Already provisioned — return existing data with a fresh magic link
      const onboardingUrl = await generateOnboardingUrl(supabase, data.email);
      return NextResponse.json(
        {
          error: "already_provisioned",
          memberId: existingPurchase.user_id,
          onboardingUrl,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------------
    // 5. Find or create auth user
    // ------------------------------------------------------------------
    // The on_auth_user_created trigger automatically creates a portal
    // `users` record with the same ID when an auth user is created.
    let authUserId: string;
    let isReturningUser = false;

    // Check portal users table first (fastest, avoids admin API call)
    const { data: existingPortalUser } = await supabase
      .from("users")
      .select("id, supabase_id")
      .eq("email", data.email)
      .single();

    if (existingPortalUser) {
      authUserId = existingPortalUser.supabase_id || existingPortalUser.id;
      isReturningUser = true;
    } else {
      // Create new auth user — trigger creates portal user automatically
      const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      });

      if (authError) {
        console.error("[provision] Auth user creation error:", authError);
        return NextResponse.json(
          { error: "user_creation_failed", details: authError.message },
          { status: 500 }
        );
      }

      authUserId = authResult.user.id;
    }

    // The portal user ID = auth user ID (set by the trigger)
    const userId = existingPortalUser?.id || authUserId;

    // ------------------------------------------------------------------
    // 6. Update portal user with gender + name
    // ------------------------------------------------------------------
    const updateFields: Record<string, unknown> = {
      first_name: data.firstName,
      last_name: data.lastName,
      updated_at: new Date().toISOString(),
    };
    if (data.gender) {
      updateFields.gender = data.gender;
    }

    await supabase.from("users").update(updateFields).eq("id", userId);

    // ------------------------------------------------------------------
    // 7. Ensure user_roles record exists
    // ------------------------------------------------------------------
    if (!isReturningUser) {
      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "user" })
        .select("id")
        .single();
    }

    // ------------------------------------------------------------------
    // 8. Store external assessment
    // ------------------------------------------------------------------
    if (data.assessment) {
      await supabase.from("external_assessments").insert({
        user_id: userId,
        source: "gynergy.com",
        pillar_scores: data.assessment.pillarScores,
        ascension_level: data.assessment.ascensionLevel,
        qualification_tier: data.assessment.qualificationTier,
        leverage_point: data.assessment.leveragePoint || null,
        maslow: data.assessment.maslow || null,
        raw_data: data.assessment,
      });
    }

    // ------------------------------------------------------------------
    // 9. Create purchase record
    // ------------------------------------------------------------------
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userId,
      stripe_checkout_session_id: data.purchase.stripeSessionId,
      stripe_customer_id: data.purchase.stripeCustomerId,
      purchase_type: "challenge",
      amount_cents: data.purchase.amountCents,
      currency: "usd",
      status: "completed",
      email: data.email,
      purchased_at: data.purchase.purchaseDate || new Date().toISOString(),
      metadata: {
        source: "provision_api",
        product: data.purchase.product,
        includesRetreat: data.purchase.includesRetreat || false,
        referralCredit: data.referralCredit || null,
        utm: data.utm || null,
      },
    });

    if (purchaseError) {
      console.error("[provision] Purchase creation error:", purchaseError);
      return NextResponse.json(
        { error: "purchase_creation_failed", details: purchaseError.message },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // 10. Grant entitlements (belt-and-suspenders with DB trigger)
    // ------------------------------------------------------------------
    await supabase.from("user_entitlements").upsert(
      {
        user_id: userId,
        has_challenge_access: true,
        challenge_access_type: "purchased",
        challenge_access_granted_at: new Date().toISOString(),
        has_community_access: true,
        community_access_granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // ------------------------------------------------------------------
    // 11. Enroll in current or next cohort
    // ------------------------------------------------------------------
    await enrollInCohort(supabase, userId);

    // ------------------------------------------------------------------
    // 12. Generate onboarding URL (magic link)
    // ------------------------------------------------------------------
    const onboardingUrl = await generateOnboardingUrl(supabase, data.email);
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // ------------------------------------------------------------------
    // 13. Enroll in drip campaigns
    // ------------------------------------------------------------------
    const dripMeta = {
      firstName: data.firstName,
      product: data.purchase.product,
    };

    await enrollInDrip("purchase_completed", data.email, dripMeta, userId);

    if (data.referralCredit) {
      await enrollInDrip(
        "friend_codes_issued",
        data.email,
        {
          firstName: data.firstName,
          referralSlug: data.referralCredit.slug,
          shareUrl: data.referralCredit.shareUrl,
        },
        userId
      );
    }

    // ------------------------------------------------------------------
    // 14. Return success
    // ------------------------------------------------------------------
    console.log(`[provision] Successfully provisioned user ${userId} (${data.email})`);

    return NextResponse.json({
      success: true,
      memberId: userId,
      onboardingUrl,
      tokenExpiresAt,
    });
  } catch (error) {
    console.error("[provision] Unhandled error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// ============================================================================
// Helper: Generate onboarding URL via Supabase magic link
// ============================================================================

async function generateOnboardingUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string
): Promise<string> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://app.gynergy.com";

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error("[provision] Magic link generation failed:", error);
      // Fallback — user can log in manually via OTP
      return `${appUrl}/auth`;
    }

    return data.properties.action_link;
  } catch (err) {
    console.error("[provision] Magic link generation error:", err);
    return `${appUrl}/auth`;
  }
}

// ============================================================================
// Helper: Enroll user in current or next active cohort
// ============================================================================

async function enrollInCohort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<void> {
  try {
    // Check if user already has an active enrollment
    const { data: existingEnrollment } = await supabase
      .from("session_enrollments")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (existingEnrollment) {
      return; // Already enrolled
    }

    // Find the current active or next upcoming cohort session
    const { data: session } = await supabase
      .from("book_sessions")
      .select("id, book_id")
      .eq("is_personal", false)
      .in("status", ["active", "upcoming"])
      .order("start_date", { ascending: true })
      .limit(1)
      .single();

    if (!session) {
      // No active cohort — create a personal session (same as webhook fallback)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 45);

      const { data: personalSession } = await supabase
        .from("book_sessions")
        .insert({
          book_id: DEFAULT_BOOK_ID,
          duration_days: 45,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          is_personal: true,
          owner_user_id: userId,
          status: "active",
          cohort_label: "Personal Challenge",
          max_enrollments: 1,
          grace_period_end: new Date(endDate.getTime() + 37 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (personalSession) {
        await supabase.from("session_enrollments").insert({
          user_id: userId,
          book_id: DEFAULT_BOOK_ID,
          session_id: personalSession.id,
          enrollment_date: now.toISOString(),
        });
      }
      return;
    }

    // Enroll in the cohort session
    await supabase.from("session_enrollments").insert({
      user_id: userId,
      book_id: session.book_id,
      session_id: session.id,
      enrollment_date: new Date().toISOString(),
    });

    // Also add to cohort_memberships if table exists
    const { data: cohort } = await supabase
      .from("cohorts")
      .select("id")
      .eq("session_id", session.id)
      .single();

    if (cohort) {
      await supabase
        .from("cohort_memberships")
        .insert({
          cohort_id: cohort.id,
          user_id: userId,
        })
        .select("id")
        .single();
    }
  } catch (err) {
    // Non-fatal — user can be manually enrolled later
    console.error("[provision] Cohort enrollment error:", err);
  }
}
