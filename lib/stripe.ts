import Stripe from "stripe";

// Lazy initialization of Stripe to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeInstance;
}

// Product configuration (lazy evaluated)
export const STRIPE_PRODUCTS = {
  CHALLENGE: {
    get priceId() {
      return process.env.NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID || "";
    },
    amount: 99700, // $997.00
    name: "45-Day Awakening Challenge",
  },
  JOURNAL_MONTHLY: {
    get priceId() {
      return process.env.NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID || "";
    },
    amount: 3995, // $39.95
    name: "Digital Journal (Monthly)",
  },
  JOURNAL_ANNUAL: {
    get priceId() {
      return process.env.NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID || "";
    },
    amount: 39900, // $399.00 (saves ~$80/year)
    name: "Digital Journal (Annual)",
  },
} as const;

export type ProductType = keyof typeof STRIPE_PRODUCTS;

/**
 * Create a Stripe checkout session for challenge purchase
 */
export async function createChallengeCheckoutSession({
  userId,
  email,
  successUrl,
  cancelUrl,
}: {
  userId?: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: STRIPE_PRODUCTS.CHALLENGE.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    metadata: {
      userId: userId || "",
      productType: "challenge",
    },
    payment_intent_data: {
      metadata: {
        userId: userId || "",
        productType: "challenge",
      },
    },
  });

  return session;
}

/**
 * Create a Stripe checkout session for journal subscription
 */
export async function createSubscriptionCheckoutSession({
  userId,
  email,
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
}: {
  userId: string;
  email?: string;
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      productType: "journal_subscription",
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  };

  // Use existing customer or email
  if (customerId) {
    sessionConfig.customer = customerId;
  } else if (email) {
    sessionConfig.customer_email = email;
  }

  // Add trial period if specified
  if (trialDays) {
    sessionConfig.subscription_data!.trial_period_days = trialDays;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session;
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer({
  email,
  userId,
  name,
}: {
  email: string;
  userId: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update metadata if needed
    if (!customer.metadata.userId) {
      await stripe.customers.update(customer.id, {
        metadata: { userId },
      });
    }

    return customer;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  return customer;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Format amount in cents to currency string
 */
export function formatPrice(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}
