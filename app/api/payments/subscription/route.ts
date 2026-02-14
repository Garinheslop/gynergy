export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  cancelSubscription,
  getSubscription,
  resumeSubscription,
  getCustomerInvoices,
  formatPrice,
} from "@lib/stripe";
import { createClient } from "@lib/supabase-server";

// GET: Get subscription details and billing history
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user entitlements to find subscription
    const { data: entitlements, error: entitlementsError } = await supabase
      .from("user_entitlements")
      .select("journal_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (entitlementsError && entitlementsError.code !== "PGRST116") {
      console.error("Error fetching entitlements:", entitlementsError);
      return NextResponse.json({ error: "Failed to fetch entitlements" }, { status: 500 });
    }

    if (!entitlements?.journal_subscription_id) {
      return NextResponse.json({
        subscription: null,
        invoices: [],
        message: "No active subscription found",
      });
    }

    // Get subscription from database
    const { data: dbSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", entitlements.journal_subscription_id)
      .single();

    if (subError || !dbSubscription) {
      return NextResponse.json({
        subscription: null,
        invoices: [],
        message: "Subscription not found",
      });
    }

    // Get full subscription details from Stripe
    let stripeSubscription;
    try {
      stripeSubscription = await getSubscription(dbSubscription.stripe_subscription_id);
    } catch {
      // Subscription may have been deleted in Stripe
      return NextResponse.json({
        subscription: {
          id: dbSubscription.id,
          status: dbSubscription.status,
          currentPeriodEnd: dbSubscription.current_period_end,
          cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
          stripeError: true,
        },
        invoices: [],
      });
    }

    // Get billing history if we have customer ID
    let invoices: {
      id: string;
      amount: string;
      status: string | null;
      date: number;
      pdfUrl: string | null;
    }[] = [];
    if (stripeSubscription.customer) {
      const customerId =
        typeof stripeSubscription.customer === "string"
          ? stripeSubscription.customer
          : stripeSubscription.customer.id;
      try {
        const stripeInvoices = await getCustomerInvoices(customerId, 10);
        invoices = stripeInvoices.map((inv) => ({
          id: inv.id,
          amount: formatPrice(inv.amount_paid),
          status: inv.status,
          date: inv.created,
          pdfUrl: inv.invoice_pdf ?? null,
        }));
      } catch (e) {
        console.error("Error fetching invoices:", e);
      }
    }

    // Access subscription period data (accessing raw object properties)
    const subData = stripeSubscription as unknown as {
      current_period_start: number;
      current_period_end: number;
    };

    // Format subscription response
    const subscription = {
      id: dbSubscription.id,
      stripeSubscriptionId: dbSubscription.stripe_subscription_id,
      status: stripeSubscription.status,
      currentPeriodStart: subData.current_period_start,
      currentPeriodEnd: subData.current_period_end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      cancelAt: stripeSubscription.cancel_at,
      canceledAt: stripeSubscription.canceled_at,
      planName:
        stripeSubscription.items.data[0]?.price?.nickname ||
        (stripeSubscription.items.data[0]?.price?.recurring?.interval === "year"
          ? "Digital Journal (Annual)"
          : "Digital Journal (Monthly)"),
      planAmount: formatPrice(stripeSubscription.items.data[0]?.price?.unit_amount || 0),
      planInterval: stripeSubscription.items.data[0]?.price?.recurring?.interval || "month",
    };

    return NextResponse.json({
      subscription,
      invoices,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Cancel subscription
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { immediate = false } = body;

    // Get user's subscription
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("journal_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!entitlements?.journal_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Get Stripe subscription ID from database
    const { data: dbSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", entitlements.journal_subscription_id)
      .single();

    if (subError || !dbSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Cancel in Stripe (at period end by default, immediate if specified)
    const cancelledSubscription = await cancelSubscription(
      dbSubscription.stripe_subscription_id,
      !immediate // cancelAtPeriodEnd = true by default
    );

    // Update database
    await supabase
      .from("subscriptions")
      .update({
        status: immediate ? "canceled" : cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        canceled_at: cancelledSubscription.canceled_at
          ? new Date(cancelledSubscription.canceled_at * 1000).toISOString()
          : null,
      })
      .eq("id", entitlements.journal_subscription_id);

    // If immediate cancellation, revoke journal access
    if (immediate) {
      await supabase
        .from("user_entitlements")
        .update({
          has_journal_access: false,
          journal_subscription_id: null,
        })
        .eq("user_id", user.id);
    }

    // Access period end from raw object
    const cancelledSubData = cancelledSubscription as unknown as { current_period_end: number };

    return NextResponse.json({
      success: true,
      message: immediate
        ? "Subscription cancelled immediately"
        : "Subscription will be cancelled at the end of the billing period",
      cancelAtPeriodEnd: !immediate,
      currentPeriodEnd: cancelledSubData.current_period_end,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}

// PUT: Resume subscription (undo cancellation)
export async function PUT() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user's subscription
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("journal_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!entitlements?.journal_subscription_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Get Stripe subscription ID from database
    const { data: dbSubscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, cancel_at_period_end")
      .eq("id", entitlements.journal_subscription_id)
      .single();

    if (subError || !dbSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (!dbSubscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Resume in Stripe
    const resumedSubscription = await resumeSubscription(dbSubscription.stripe_subscription_id);

    // Update database
    await supabase
      .from("subscriptions")
      .update({
        status: resumedSubscription.status,
        cancel_at_period_end: false,
        canceled_at: null,
      })
      .eq("id", entitlements.journal_subscription_id);

    return NextResponse.json({
      success: true,
      message: "Subscription resumed successfully",
      status: resumedSubscription.status,
    });
  } catch (error) {
    console.error("Resume subscription error:", error);
    return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 });
  }
}
