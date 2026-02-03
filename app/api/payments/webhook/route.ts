import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

import { verifyWebhookSignature } from "@lib/stripe";
import { createServiceClient } from "@lib/supabase-server";

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
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
      console.error("Error creating purchase record:", purchaseError);
      throw purchaseError;
    }

    // If user exists, also update their profile with Stripe customer ID
    if (userId) {
      // The database trigger will automatically:
      // 1. Create 2 friend codes
      // 2. Grant challenge access via user_entitlements

      console.log(`Challenge purchase completed for user ${userId}`);
    }
  } else if (productType === "journal_subscription") {
    // Subscription is handled by invoice.paid event
    console.log("Journal subscription checkout completed");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(supabase: ReturnType<typeof createServiceClient>, invoice: any) {
  // Access subscription from the invoice object
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) return;

  // Get userId from subscription metadata
  const userId = invoice.subscription_details?.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice: any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any
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
