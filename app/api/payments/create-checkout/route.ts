export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import {
  createChallengeCheckoutSession,
  createSubscriptionCheckoutSession,
  STRIPE_PRODUCTS,
} from "@lib/stripe";
import { createClient } from "@lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { productType } = body;

    // Get origin for redirect URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?canceled=true`;

    let session;

    if (productType === "challenge") {
      // Create checkout for $997 challenge
      session = await createChallengeCheckoutSession({
        userId: user?.id,
        email: user?.email,
        successUrl,
        cancelUrl,
      });
    } else if (productType === "journal_monthly") {
      // Require authentication for subscription
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      session = await createSubscriptionCheckoutSession({
        userId: user.id,
        email: user.email,
        priceId: STRIPE_PRODUCTS.JOURNAL_MONTHLY.priceId,
        successUrl,
        cancelUrl,
      });
    } else if (productType === "journal_annual") {
      // Require authentication for subscription
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      session = await createSubscriptionCheckoutSession({
        userId: user.id,
        email: user.email,
        priceId: STRIPE_PRODUCTS.JOURNAL_ANNUAL.priceId,
        successUrl,
        cancelUrl,
      });
    } else {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
