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
