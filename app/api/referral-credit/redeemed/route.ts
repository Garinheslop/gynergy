/**
 * POST /api/referral-credit/redeemed
 *
 * Called by gynergy.com when someone redeems a referral credit (gift code).
 * Updates the creator's purchase metadata to track the redemption and
 * sends a notification email to the credit creator.
 *
 * Auth: x-api-key header (shared secret = INTERNAL_API_SECRET)
 */

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { sendFriendCodeRedeemedEmail } from "@lib/email";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// Request Validation
// ============================================================================

const redeemSchema = z.object({
  creatorMemberId: z.string().uuid(),
  redeemerEmail: z.string().email(),
  redeemerFirstName: z.string().min(1),
  creditType: z.enum(["awakening", "journal"]),
  redeemedAt: z.string().datetime(),
});

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
    const parsed = redeemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createServiceClient();

    // ------------------------------------------------------------------
    // 3. Find the creator user
    // ------------------------------------------------------------------
    const { data: creator } = await supabase
      .from("users")
      .select("id, email, first_name")
      .eq("id", data.creatorMemberId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: "creator_not_found" }, { status: 404 });
    }

    // ------------------------------------------------------------------
    // 4. Find the creator's purchase with referral credit data
    // ------------------------------------------------------------------
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id, metadata")
      .eq("user_id", data.creatorMemberId)
      .eq("status", "completed")
      .not("metadata->referralCredit", "is", null)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .single();

    // ------------------------------------------------------------------
    // 5. Update purchase metadata with redemption event
    // ------------------------------------------------------------------
    if (purchase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = (purchase.metadata as Record<string, any>) || {};
      const existingEvents = Array.isArray(metadata.redeemed_events)
        ? metadata.redeemed_events
        : [];

      // Idempotency — check if this exact redemption was already recorded
      const isDuplicate = existingEvents.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => e.redeemerEmail === data.redeemerEmail && e.creditType === data.creditType
      );

      if (!isDuplicate) {
        existingEvents.push({
          redeemerEmail: data.redeemerEmail,
          redeemerFirstName: data.redeemerFirstName,
          creditType: data.creditType,
          redeemedAt: data.redeemedAt,
        });

        await supabase
          .from("purchases")
          .update({
            metadata: { ...metadata, redeemed_events: existingEvents },
          })
          .eq("id", purchase.id);
      }
    }

    // ------------------------------------------------------------------
    // 6. Record in referral_events for analytics (if table exists)
    // ------------------------------------------------------------------
    const referralSlug =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (purchase?.metadata as Record<string, any>)?.referralCredit?.slug || "";

    // Find referral link for this user
    const { data: referralLink } = await supabase
      .from("referral_links")
      .select("id")
      .eq("user_id", data.creatorMemberId)
      .limit(1)
      .single();

    if (referralLink) {
      await supabase.from("referral_events").insert({
        referrer_id: data.creatorMemberId,
        referred_email: data.redeemerEmail,
        referral_link_id: referralLink.id,
        event_type: "challenge_purchased",
        credit_cents: data.creditType === "awakening" ? 50000 : 10000,
      });
    }

    // ------------------------------------------------------------------
    // 7. Send notification email to creator (fire-and-forget)
    // ------------------------------------------------------------------
    if (creator.email) {
      try {
        await sendFriendCodeRedeemedEmail({
          to: creator.email,
          creatorFirstName: creator.first_name || "Friend",
          redeemerFirstName: data.redeemerFirstName,
          code: referralSlug,
        });
      } catch (emailErr) {
        // Non-fatal — log but don't fail the request
        console.error("[referral-credit/redeemed] Email send error:", emailErr);
      }
    }

    // ------------------------------------------------------------------
    // 8. Return success
    // ------------------------------------------------------------------
    console.log(
      `[referral-credit/redeemed] Credit redeemed: creator=${data.creatorMemberId}, redeemer=${data.redeemerEmail}, type=${data.creditType}`
    );

    return NextResponse.json({
      success: true,
      message: "Credit redemption recorded successfully",
    });
  } catch (error) {
    console.error("[referral-credit/redeemed] Unhandled error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
