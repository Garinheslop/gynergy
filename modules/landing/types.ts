// Landing Page Types

export interface PillarScore {
  pillar: "Wealth" | "Health" | "Relationships" | "Growth" | "Purpose";
  score: number;
}

export interface PillarChange {
  pillar: string;
  before: number;
  after: number;
}

export interface Testimonial {
  id: string;
  name: string;
  initials: string;
  role: string;
  quote: string;
  pillarChanges: PillarChange[];
  /** Optional photo URL - falls back to initials if not provided */
  photoUrl?: string;
  /** Optional video testimonial URL */
  videoUrl?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PillarInfo {
  number: string;
  name: string;
  description: string;
  question: string;
}

export interface ValueStackItem {
  icon: string;
  name: string;
  description: string;
  value: string;
}

export interface TimelineItem {
  week: string;
  name: string;
  description: string;
  isHighlight?: boolean;
}

export interface CTAContent {
  text: string;
  action: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export interface HeroContent {
  brand: string;
  headline: string;
  subheadline: string;
  hook: string;
  cohortDate: Date;
  totalSeats: number;
  seatsRemaining: number;
  proof: {
    cohortsCompleted: number;
    daysOfPractice: number;
    revenueBuilt: string;
  };
}

export interface PricingContent {
  stackItems: {
    name: string;
    value: string;
  }[];
  totalValue: string;
  wasPrice: string;
  nowPrice: string;
  priceNote: string;
  paymentPlan?: {
    payments: number;
    amount: string;
    totalWithPlan: string;
  };
  earlyBirdBonus?: {
    title: string;
    description: string;
  };
}

export interface GrandPrizeContent {
  label: string;
  amount: string;
  name: string;
  description: string;
  scoringCriteria: {
    name: string;
    percentage: string;
  }[];
}

export interface GuaranteeContent {
  days: number;
  title: string;
  description: string;
  /** Optional additional paragraph explaining the "why" */
  reason?: string;
  /** Optional memorable tagline (e.g., "That's the Garin-Tee") */
  tagline?: string;
}

export interface AboutContent {
  name: string;
  photoPlaceholder: string;
  stats: {
    value: string;
    label: string;
  }[];
  bio: string[];
}

// ============================================
// WEBINAR TYPES
// ============================================

export interface WebinarHeroContent {
  brand: string;
  headline: string;
  subheadline: string;
  eventTitle: string;
  eventSubtitle: string;
  presenter: string;
  eventDate: Date;
  seatsTotal: number;
  seatsRemaining: number;
  videoId: string | null;
  videoPlatform: "youtube" | "vimeo";
}

export interface WebinarLearnItem {
  title: string;
  description: string;
}

export interface WebinarLearnContent {
  label: string;
  items: WebinarLearnItem[];
}

export interface WebinarProofStat {
  value: string;
  label: string;
}

export interface WebinarProofContent {
  quote: string;
  author: string;
  role: string;
  stats: WebinarProofStat[];
}

export interface WebinarScarcityContent {
  headline: string;
  subheadline: string;
  note: string;
}

export interface WebinarRegistration {
  email: string;
  firstName?: string;
  registeredAt: Date;
  webinarDate: Date;
  source: "landing_page" | "exit_intent" | "direct";
}

// ============================================
// ASSESSMENT TYPES
// ============================================

export type PillarName = "Wealth" | "Health" | "Relationships" | "Growth" | "Purpose";

export interface AssessmentQuestion {
  pillar: PillarName;
  question: string;
  lowLabel: string;
  highLabel: string;
}

export interface AssessmentResult {
  pillarScores: Record<PillarName, number>;
  totalScore: number;
  interpretation: "elite" | "gap" | "critical";
  completedAt: Date;
  email?: string;
}

export interface AssessmentInterpretation {
  range: [number, number];
  interpretation: "elite" | "gap" | "critical";
  message: string;
}

export interface AssessmentContent {
  title: string;
  subtitle: string;
  instruction: string;
  completionCTA: string;
  shareText: string;
}
