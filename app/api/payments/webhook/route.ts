export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

import { sendPurchaseConfirmationEmail } from "@lib/email";
import { enrollInDrip, cancelDrip } from "@lib/services/dripService";
import { verifyWebhookSignature, formatPrice, STRIPE_PRODUCTS } from "@lib/stripe";
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// Type Definitions for Webhook Event Data
// ============================================================================

// Webhook invoice data (differs from strict Stripe.Invoice type)
interface WebhookInvoice {
  subscription?: string | { id?: string } | null;
  subscription_details?: { metadata?: { userId?: string } };
  period_start?: number;
  period_end?: number;
  customer?: string | { id?: string };
  lines?: { data?: Array<{ price?: { id?: string; recurring?: { interval?: string } } }> };
  amount_paid?: number;
  currency?: string;
}

// Webhook subscription data
interface WebhookSubscription {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
  current_period_start?: number;
  current_period_end?: number;
  metadata?: { userId?: string };
}

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // --- Event deduplication ---
  // Check if we've already processed this event
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id, status, attempts")
    .eq("stripe_event_id", event.id)
    .single();

  if (existingEvent?.status === "processed") {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  const previousAttempts = existingEvent?.attempts ?? 0;

  // Record event (upsert to handle race conditions)
  await supabase.from("webhook_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      status: "processing",
      payload: JSON.parse(body),
      attempts: previousAttempts + 1,
      created_at: new Date().toISOString(),
    },
    { onConflict: "stripe_event_id" }
  );

  // --- Process event (always return 200 to Stripe) ---
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as WebhookInvoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as WebhookInvoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as WebhookSubscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as WebhookSubscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "checkout.session.expired": {
        await handleCheckoutExpired(event.data.object);
        break;
      }

      default:
      // Unhandled event type - no action needed
    }

    // Mark as processed
    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Store in dead letter queue (mark as failed, keep payload for retry)
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        last_failed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);

    // Always return 200 to prevent Stripe from retrying endlessly
    // Failed events are stored for manual/automated retry via admin
    return NextResponse.json({ received: true, error: "Handler failed, queued for retry" });
  }
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const productType = session.metadata?.productType;

  if (productType === "challenge") {
    // Create purchase record
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userId || null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : session.customer?.id,
      purchase_type: "challenge",
      amount_cents: session.amount_total || 99700,
      currency: session.currency || "usd",
      status: "completed",
      email: session.customer_email,
      purchased_at: new Date().toISOString(),
    });

    if (purchaseError) {
      throw purchaseError;
    }

    // If user exists, the database trigger will automatically:
    // 1. Create 1 friend code
    // 2. Grant challenge access via user_entitlements

    // Send purchase confirmation email
    if (session.customer_email) {
      // Get user's first name if available
      let firstName = "Friend";
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", userId)
          .single();
        if (profile?.first_name) {
          firstName = profile.first_name;
        }
      }

      // Get friend codes for this user (created by the database trigger)
      let friendCodes: string[] = [];
      if (userId) {
        const { data: codes } = await supabase
          .from("friend_codes")
          .select("code")
          .eq("owner_id", userId)
          .eq("is_used", false);
        if (codes) {
          friendCodes = codes.map((c) => c.code);
        }
      }

      // Send confirmation email (non-blocking)
      sendPurchaseConfirmationEmail({
        to: session.customer_email,
        firstName,
        productName: STRIPE_PRODUCTS.CHALLENGE.name,
        amount: formatPrice(session.amount_total || STRIPE_PRODUCTS.CHALLENGE.amount),
        friendCodes,
      }).catch((err) => {
        console.error("Failed to send purchase confirmation email:", err);
      });

      // Enroll in post-purchase drip + cancel webinar nurture (non-blocking)
      enrollInDrip("purchase_completed", session.customer_email, {
        firstName,
        productName: STRIPE_PRODUCTS.CHALLENGE.name,
      }).catch((err) => console.error("Purchase drip enrollment error:", err));

      cancelDrip("webinar_registered", session.customer_email).catch((err) =>
        console.error("Webinar drip cancel error:", err)
      );

      // Enroll in friend code referral reminders (non-blocking)
      enrollInDrip("friend_codes_issued", session.customer_email, {
        firstName,
      }).catch((err) => console.error("Referral drip enrollment error:", err));

      // Enroll in community activation (non-blocking)
      enrollInDrip("community_activated", session.customer_email, {
        firstName,
      }).catch((err) => console.error("Community drip enrollment error:", err));
    }
  } else if (productType === "journal_subscription") {
    // Subscription is handled by invoice.paid event
  }
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: WebhookInvoice
) {
  // Access subscription from the invoice object
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) return;

  // Get userId from subscription metadata
  const userId = invoice.subscription_details?.metadata?.userId;
  if (!userId) {
    return;
  }

  // Check if subscription already exists
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (existingSub) {
    // Update existing subscription
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        current_period_end: invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);
  } else {
    // Create new subscription record
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    const lineItem = invoice.lines?.data?.[0];
    const priceId = lineItem?.price?.id || "";
    const interval = lineItem?.price?.recurring?.interval || "month";

    await supabase.from("subscriptions").insert({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId || "",
      stripe_price_id: priceId,
      status: "active",
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      interval: interval,
      current_period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      current_period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    });
  }
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  invoice: WebhookInvoice
) {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) return;

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: WebhookSubscription
) {
  const status = mapStripeStatus(subscription.status);

  await supabase
    .from("subscriptions")
    .update({
      status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: WebhookSubscription
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const email = session.customer_email;
  if (!email) return;

  // Only enroll in cart abandonment drip for challenge purchases
  const productType = session.metadata?.productType;
  if (productType !== "challenge") return;

  // Get first name from metadata or profile
  const firstName = session.metadata?.firstName || undefined;

  // Enroll in cart abandonment drip (non-blocking)
  enrollInDrip("cart_abandoned", email, {
    firstName,
    productType,
  }).catch((err) => console.error("Cart abandonment drip enrollment error:", err));
}

function mapStripeStatus(
  stripeStatus: string
): "active" | "past_due" | "canceled" | "unpaid" | "trialing" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}
