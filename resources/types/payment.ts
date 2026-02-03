// Payment & Subscription Types for 45-Day Awakening Challenge

export type PurchaseStatus = "pending" | "completed" | "failed" | "refunded";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | "trialing";
export type PurchaseType = "challenge" | "challenge_friend_code";
export type ChallengeAccessType = "purchased" | "friend_code" | null;

// Stripe product configuration
export const STRIPE_PRODUCTS = {
  CHALLENGE: {
    name: "45-Day Awakening Challenge",
    description:
      "Transform your life with our guided 45-day journey. Includes 2 friend codes for your accountability trio.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID,
    amount: 99700, // $997.00 in cents
  },
  JOURNAL_MONTHLY: {
    name: "Digital Journal Subscription",
    description: "Continue your journey with our guided digital journal. Monthly subscription.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID,
    amount: 3995, // $39.95 in cents
    interval: "month" as const,
  },
  JOURNAL_ANNUAL: {
    name: "Digital Journal Subscription (Annual)",
    description:
      "Continue your journey with our guided digital journal. Annual subscription - save $80!",
    priceId: process.env.NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID,
    amount: 39900, // $399.00 in cents (saves ~$80/year vs monthly)
    interval: "year" as const,
  },
} as const;

export interface Purchase {
  id: string;
  userId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  purchaseType: PurchaseType;
  amountCents: number;
  currency: string;
  status: PurchaseStatus;
  email: string | null;
  metadata: Record<string, unknown> | null;
  purchasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FriendCode {
  id: string;
  code: string;
  creatorId: string | null;
  purchaseId: string | null;
  usedById: string | null;
  usedAt: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  interval: "month" | "year";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserEntitlements {
  id: string;
  userId: string;
  hasChallengeAccess: boolean;
  challengeAccessType: ChallengeAccessType;
  challengeAccessGrantedAt: string | null;
  challengeExpiresAt: string | null;
  hasJournalAccess: boolean;
  journalSubscriptionId: string | null;
  hasCommunityAccess: boolean;
  communityAccessGrantedAt: string | null;
  updatedAt: string;
}

// API Request/Response types
export interface CreateCheckoutSessionRequest {
  productType: "challenge" | "journal_monthly" | "journal_annual";
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface RedeemFriendCodeRequest {
  code: string;
}

export interface RedeemFriendCodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetUserEntitlementsResponse {
  entitlements: UserEntitlements | null;
  friendCodes: FriendCode[];
}

// Webhook event types
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// Landing page pricing display
export interface PricingTier {
  name: string;
  price: string;
  priceSubtext?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaAction: "checkout" | "subscribe" | "friend_code";
  highlighted?: boolean;
  badge?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "45-Day Awakening Challenge",
    price: "$997",
    priceSubtext: "one-time",
    description: "Transform your life with guided daily practices and community support.",
    features: [
      "Full 45-day guided journey",
      "Morning & evening journaling prompts",
      "Daily Gratitude Actions",
      "Vision board & journey mapping",
      "Cohort community access",
      "2 friend codes included (Accountability Trio)",
      "Gamification & badges",
      "Video call sessions",
      "AI companion support",
      "Lifetime community access after completion",
    ],
    ctaText: "Start Your Journey",
    ctaAction: "checkout",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Join as a Friend",
    price: "FREE",
    priceSubtext: "with friend code",
    description: "Someone gifted you access! Enter your friend code to begin.",
    features: [
      "Full 45-day guided journey",
      "All challenge features",
      "Join your friend's accountability trio",
      "Community access",
    ],
    ctaText: "Redeem Friend Code",
    ctaAction: "friend_code",
  },
  {
    name: "Digital Journal",
    price: "$39.95",
    priceSubtext: "/month",
    description: "Continue your growth after completing the challenge.",
    features: [
      "Guided daily journaling",
      "Progress tracking",
      "Community access",
      "AI insights & analytics",
      "Personal growth reports",
      "Annual option: $399/year (save $80)",
    ],
    ctaText: "Subscribe After Challenge",
    ctaAction: "subscribe",
  },
];
