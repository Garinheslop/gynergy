import type {
  HeroContent,
  PillarInfo,
  ValueStackItem,
  TimelineItem,
  PricingContent,
  GrandPrizeContent,
  GuaranteeContent,
  AboutContent,
} from "../types";

/**
 * Calculate the next cohort start date.
 * Cohorts start on the 1st of each month.
 * If we're past the 15th, show next month's cohort.
 * If we're in the first half, show this month (if 1st hasn't passed) or next.
 */
function getNextCohortDate(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // If we're past the 15th of the month, show next month's cohort
  // This gives at least 2 weeks for enrollment
  if (day > 15) {
    // Next month's 1st
    return new Date(year, month + 1, 1, 0, 0, 0);
  }

  // If we're before the 1st (impossible) or on/before the 15th
  // and the 1st has already passed, show next month
  if (day >= 1) {
    return new Date(year, month + 1, 1, 0, 0, 0);
  }

  // Default: this month's 1st
  return new Date(year, month, 1, 0, 0, 0);
}

export const HERO_CONTENT: HeroContent = {
  brand: "G Y N E R G Y",
  headline: "45-DAY AWAKENING",
  subheadline: "CHALLENGE",
  hook: "For successful men who built everything and feel nothing. 45 days to fix the multiplier.",
  cohortDate: getNextCohortDate(),
  totalSeats: 15,
  seatsRemaining: 7,
  proof: {
    cohortsCompleted: 3,
    daysOfPractice: 497,
    revenueBuilt: "$40M+",
  },
};

export const PILLARS: PillarInfo[] = [
  {
    number: "01",
    name: "Wealth",
    description: "Revenue · Savings · Freedom",
    question: "Are you free, or does your success own you?",
  },
  {
    number: "02",
    name: "Health",
    description: "Energy · Fitness · Longevity",
    question: "Do you have energy, or are you running on fumes?",
  },
  {
    number: "03",
    name: "Relationships",
    description: "Partner · Family · Community",
    question: "Are your people close, or drifting?",
  },
  {
    number: "04",
    name: "Growth",
    description: "Leadership · Learning · Evolution",
    question: "Are you still being challenged, or coasting?",
  },
  {
    number: "05",
    name: "Purpose",
    description: "Service · Meaning · Legacy",
    question: "Does your success mean something, or is it hollow?",
  },
];

export const VALUE_STACK: ValueStackItem[] = [
  {
    icon: "01",
    name: "The Date Zero Gratitude Journal",
    description:
      "Your daily companion for 45 days. Morning pages: 3 specific gratitudes, 1 intention, 1 Daily Gratitude Action. Evening pages: wins, lessons, tomorrow's focus. Mood tracking. Affirmations. Weekly reflections. A point-scoring system that gamifies your transformation.",
    value: "$297",
  },
  {
    icon: "02",
    name: "8 Live Coaching Calls",
    description:
      "Weekly calls with Garin mapped to the Five Pillars. Onboarding kickoff, deep-dive teaching sessions, hot seat coaching, and a Day 45 completion ceremony where the grand prize winner is crowned. Recordings included.",
    value: "$2,000",
  },
  {
    icon: "03",
    name: "Brotherhood Community",
    description:
      "Private WhatsApp group with your cohort. Daily accountability. Real conversations. Not a Facebook group that dies after Week 2 — a brotherhood that holds the structure when motivation fades.",
    value: "$500",
  },
  {
    icon: "04",
    name: "Five Pillar Assessment",
    description:
      "Baseline scoring on Day 1. Reassessment on Day 45. You don't guess whether you transformed — you measure it. Your pillar improvement score is part of the grand prize criteria.",
    value: "$500",
  },
  {
    icon: "05",
    name: "2 Free Friend Codes (Accountability Trio)",
    description:
      "Research shows groups of three have 95% higher completion rates. Bring two men you trust — they get full challenge access at no cost. Hold each other accountable when motivation fades.",
    value: "$1,994",
  },
];

export const TIMELINE: TimelineItem[] = [
  {
    week: "Day 1",
    name: "Onboarding & Assessment",
    description: "Five Pillar baseline. Journal setup. Brotherhood intro.",
    isHighlight: true,
  },
  {
    week: "Week 1",
    name: "Wealth & Power",
    description: "Redefine what wealth means beyond the number.",
  },
  {
    week: "Week 2",
    name: "Health & Vitality",
    description: "Energy, movement, and the body-mind connection.",
  },
  {
    week: "Week 3",
    name: "Relationships & Love",
    description: "Rebuild what matters most. The conversations you've avoided.",
  },
  {
    week: "Week 4",
    name: "Growth & Evolution",
    description: "Leadership from within. Comfort zone demolition.",
  },
  {
    week: "Week 5",
    name: "Purpose & Legacy",
    description: "Why are you here? What will you leave behind?",
  },
  {
    week: "Week 6",
    name: "Integration & Mastery",
    description: "Weaving all five pillars into daily practice.",
  },
  {
    week: "Day 45",
    name: "Completion Ceremony",
    description: "Final assessment. Grand prize. Next chapter begins.",
    isHighlight: true,
  },
];

export const PRICING_CONTENT: PricingContent = {
  stackItems: [
    { name: "Date Zero Gratitude Journal", value: "$297" },
    { name: "8 Live Coaching Calls", value: "$2,000" },
    { name: "Brotherhood Community Access", value: "$500" },
    { name: "Five Pillar Assessment (x2)", value: "$500" },
    { name: "2 Friend Codes (Accountability Trio)", value: "$1,994" },
  ],
  totalValue: "$5,291",
  wasPrice: "$3,297",
  nowPrice: "$997",
  priceNote: "One-time investment · No recurring fees",
  paymentPlan: {
    payments: 3,
    amount: "$349",
    totalWithPlan: "$1,047",
  },
  earlyBirdBonus: {
    title: "Early Bird Bonus",
    description: "First 10 enrollees receive a 1:1 strategy call with Garin (value: $500)",
  },
};

export const GRAND_PRIZE: GrandPrizeContent = {
  label: "Grand Prize",
  amount: "$21,500",
  name: "LVL 5 LIFE Membership",
  description:
    "One challenger with the highest combined score wins a full year of LVL 5 LIFE — our elite mastermind for men committed to mastery across all five pillars.",
  scoringCriteria: [
    { name: "Journal Completion Rate", percentage: "25%" },
    { name: "Five Pillar Improvement", percentage: "25%" },
    { name: "Daily Gratitude Actions", percentage: "20%" },
    { name: "Community Engagement", percentage: "15%" },
    { name: "Peer Nominations", percentage: "15%" },
  ],
};

export const GUARANTEE: GuaranteeContent = {
  days: 14,
  title: "14-Day Money Back Guarantee",
  description:
    "Complete the first two weeks. If you show up, do the work, and genuinely feel this isn't for you — we'll refund every cent. No questions asked. We only want men who are ready.",
};

export const ABOUT: AboutContent = {
  name: "Garin Heslop",
  photoPlaceholder: "Photo placeholder",
  stats: [
    { value: "15+", label: "Years Coaching" },
    { value: "$40M+", label: "Revenue Built" },
    { value: "500+", label: "Men Transformed" },
    { value: "3", label: "Cohorts Complete" },
  ],
  bio: [
    "I built three companies, hit every financial target I set, and spent a decade feeling like something was fundamentally broken inside me.",
    "The Date Zero methodology came from my own breakdown — and the systematic rebuild that followed. It's not theory. It's the exact process I used to go from successful and hollow to integrated and alive.",
    "I don't teach productivity hacks or morning routines. I teach men how to stop running from themselves and start living a life that actually means something.",
  ],
};

export const QUALIFICATION = {
  forYou: [
    "You've achieved financial success but feel a gap between what you have and what you feel",
    "You've tried therapy, coaching, or self-help — and you're still searching for the thing that actually works",
    "You know you're capable of more but can't articulate what \"more\" means beyond money",
    "You want structured accountability, not another motivational podcast",
    "You're willing to invest 10 minutes a day for 45 days to find out what you've been missing",
  ],
  notForYou: [
    "You're looking for a quick fix or a motivational high that fades by Friday",
    "You're not willing to be honest with yourself or other men",
    'You think personal growth is "soft" or beneath you',
    "You need to be convinced that your life could be better",
    "You're not ready to commit 10 minutes daily — no exceptions",
  ],
};

export const MORTALITY_MATH = {
  totalHours: 700000,
  remainingAt40: 350000,
  challengeDays: 45,
  percentOfLife: "0.3%",
  question: "How many of your remaining hours will you waste being successful and empty?",
  insight: "In that 0.3%, you could change the trajectory of the other 99.7%.",
};

export const PROBLEM_CONTENT = {
  headline: "You're not broken.",
  subheadline: "You're optimized for the wrong thing.",
  paragraphs: [
    "You built the company. Hit the revenue target. Got the body. Maybe even kept the marriage together. On paper, you're winning.",
    "In private, you're running on fumes, disconnected from the people who matter, and wondering if this is really it.",
    "The problem isn't discipline. You have more discipline than 99% of men alive. The problem is that you optimized one pillar of your life — usually wealth — while the other four quietly collapsed. And when one pillar falls, it doesn't subtract from your life. It divides everything you've built.",
  ],
  multiplierExample: {
    scores: [
      { pillar: "Wealth", score: 9, isLow: false },
      { pillar: "Health", score: 8, isLow: false },
      { pillar: "Relationships", score: 3, isLow: true },
      { pillar: "Growth", score: 7, isLow: false },
      { pillar: "Purpose", score: 2, isLow: true },
    ],
    equation: "9 × 8 × 3 × 7 × 2 = fractured",
    insight:
      'That "3" in relationships and "2" in purpose aren\'t just weaknesses — they\'re dividing everything else by a fraction. Your 9 in wealth means nothing when your purpose is a 2. Integration multiplies. Fragmentation destroys.',
  },
};

export const FRIEND_CONTENT = {
  headline: "Bring a Friend. Or Two.",
  subheadline: "The Accountability Trio",
  paragraphs: [
    "Research shows groups of three have the highest completion rates. That's why every Challenge enrollment includes 2 friend codes.",
    "Share them with two men you trust. Start the journey together. Hold each other accountable when motivation fades.",
    "This isn't a solo mission. It's a brotherhood.",
  ],
  circles: [
    { label: "You", price: "$997" },
    { label: "Friend 1", price: "FREE" },
    { label: "Friend 2", price: "FREE" },
  ],
};
