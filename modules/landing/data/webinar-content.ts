import { WEBINAR_MAX_SEATS, WEBINAR_START_DATE } from "@lib/config/webinar";

import type {
  WebinarHeroContent,
  WebinarLearnContent,
  WebinarProofContent,
  WebinarScarcityContent,
} from "../types";

export const WEBINAR_HERO_CONTENT: WebinarHeroContent = {
  brand: "G Y N E R G Y",
  headline: "The $40M Builder's 10-Minute Practice",
  subheadline: "That Ended 15 Years of Emptiness — After Having Everything",
  eventTitle: "THE 5 PILLARS OF INTEGRATED POWER",
  eventSubtitle: "Free Live Training",
  presenter: "Garin Heslop | Founder, Gynergy | $40M Builder | 497 Days Straight",
  eventDate: WEBINAR_START_DATE,
  seatsTotal: WEBINAR_MAX_SEATS,
  seatsRemaining: 47,
  videoId: null, // Placeholder until video is ready
  videoPlatform: "youtube",
};

export const WEBINAR_LEARN_CONTENT: WebinarLearnContent = {
  label: "In 90 Minutes, You'll Walk Away With",
  items: [
    {
      title: "The Exact 10-Minute Morning Practice",
      description:
        "The same daily discipline I've done for 497 straight days — that touches all 5 pillars simultaneously. You'll leave with the template.",
    },
    {
      title: "Your Five Pillar Score",
      description:
        "The brutal self-audit that shows you exactly which pillar is bleeding. Most men are shocked by their number.",
    },
    {
      title: "The Emptiness Equation",
      description:
        "Why high achievers feel hollow despite having everything — and the simple math that explains how to fix it.",
    },
  ],
};

export const WEBINAR_PROOF_CONTENT: WebinarProofContent = {
  quote:
    "I went from participant to leader. Not because I was recruited — because I couldn't walk away from what it did to me.",
  author: "Matthew Zuraw",
  role: "LVL 5 LIFE Member",
  stats: [
    { value: "3", label: "Cohorts Completed" },
    { value: "497", label: "Days of Practice" },
    { value: "92%", label: "Report Feeling 'Present' Again" },
  ],
};

// Additional testimonials for social proof
export const WEBINAR_TESTIMONIALS = [
  {
    quote:
      "I built a $12M company and couldn't look my wife in the eye. After 45 days, she asked what changed. Everything.",
    author: "James K.",
    role: "CEO, Tech Startup",
    result: "Saved his marriage",
    avatar: "/images/testimonials/james.jpg",
  },
  {
    quote:
      "The assessment showed me I was a 6 in Purpose. Brutal. But knowing the number changed everything.",
    author: "David R.",
    role: "Private Equity Partner",
    result: "Purpose score: 6 → 9",
    avatar: "/images/testimonials/david.jpg",
  },
  {
    quote:
      "10 minutes a day. That's it. I've paid $50K for coaching that didn't do what this practice did in 30 days.",
    author: "Michael T.",
    role: "Real Estate Developer",
    result: "$50K coaching couldn't match it",
    avatar: "/images/testimonials/michael.jpg",
  },
  {
    quote:
      "My kids noticed first. 'Dad, you're actually here now.' That hit harder than any revenue milestone.",
    author: "Chris B.",
    role: "Agency Owner, 8-Figure Exit",
    result: "Present with his kids again",
    avatar: "/images/testimonials/chris.jpg",
  },
  {
    quote:
      "I was skeptical. A framework? Please. Then I saw my score. 23/50. I'm now at 41. Not perfect. But alive.",
    author: "Andrew M.",
    role: "Serial Entrepreneur",
    result: "Score: 23 → 41 in 45 days",
    avatar: "/images/testimonials/andrew.jpg",
  },
];

export const WEBINAR_SCARCITY_CONTENT: WebinarScarcityContent = {
  headline: "100 Seats. Live Only. No Replay.",
  subheadline: "I keep it small so I can actually engage with your questions",
  note: "You'll receive the Five Pillar Self-Assessment immediately after registration",
};

// Assessment bonus content
export const WEBINAR_ASSESSMENT_BONUS = {
  headline: "INSTANT BONUS",
  title: "The Five Pillar Self-Assessment",
  subtitle: "The Brutal Self-Audit That Made Grown Men Question Everything",
  description:
    "The moment you register, you'll take the same 5-question assessment that every member completes before Day 1. It takes 2 minutes. The number will haunt you until the webinar.",
  features: [
    "Know your exact score before we meet",
    "See which pillar is bleeding (most men guess wrong)",
    "Bring your number to the live training",
  ],
  cta: "Your score is waiting",
};

// Dream outcome section
export const WEBINAR_DREAM_OUTCOME = {
  headline: "Stop Building Empires That Feel Like Prisons",
  subheadline: "This Webinar Is For Men Who:",
  outcomes: [
    "Built everything and feel nothing",
    "Win in public but feel empty in private",
    "Have the money but not the meaning",
    "Are tired of performing success instead of living it",
    "Know something needs to change but don't know what",
  ],
  transformation:
    "In 90 minutes, you'll understand exactly why you feel this way — and what to do about it starting tomorrow morning.",
};

// Final CTA content
export const WEBINAR_FINAL_CTA = {
  headline: "Your Score Is Waiting. Your Seat Is Not.",
  subheadline:
    "You already know something needs to change. The only question is whether you'll keep knowing it — or finally do something about it.",
  urgency:
    "This isn't motivational fluff you'll forget by lunch. You'll leave with the exact template I use every morning — and your Five Pillar Score that shows exactly what to fix first.",
  guarantee:
    "Show up. If by minute 30 you're not learning something that changes how you see your life — leave. No hard feelings. But you won't.",
};

// Objection busters for final CTA
export const WEBINAR_OBJECTIONS = [
  {
    objection: "I don't have 90 minutes",
    response:
      "If you don't have 90 minutes to fix 15 years of feeling empty, that's the problem we're solving.",
  },
  {
    objection: "Another webinar...",
    response:
      "You leave with the template. Not motivation. The actual practice I've done 497 days straight.",
  },
  {
    objection: "Is this a sales pitch?",
    response:
      "Yes, I'll share how to go deeper. No, you don't need to buy anything to implement what you learn.",
  },
  {
    objection: "Can I get the replay?",
    response: "No. Live only. That's how I keep it valuable and how you actually show up.",
  },
];
