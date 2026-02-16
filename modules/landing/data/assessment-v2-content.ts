/**
 * Five Pillar Assessment V2
 * ============================================
 * A transformational assessment designed to create
 * genuine self-insight and prequalify leads.
 *
 * 15 Questions across 4 phases:
 * - Phase A: External Success (Q1-3) - Prequalification
 * - Phase B: Hidden Reality (Q4-8) - The Rupture
 * - Phase C: Five Pillars Deep (Q9-13) - Specific Scores
 * - Phase D: The Opening (Q14-15) - Readiness & Priority
 */

// ============================================
// TYPES
// ============================================

export type QuestionType = "single_choice" | "multi_select" | "slider" | "free_text";

export type RevenueTier =
  | "under_250k"
  | "250k_500k"
  | "500k_1m"
  | "1m_5m"
  | "5m_10m"
  | "10m_plus";

export type Achievement =
  | "built_business"
  | "led_team_10"
  | "financial_independence"
  | "marriage_10_years"
  | "physical_transformation"
  | "public_recognition";

export type TwoAmThought =
  | "worth_it"
  | "lost_identity"
  | "family_better_off"
  | "terrified_slow_down"
  | "performing_success"
  | "other";

export type LastPresent =
  | "last_week"
  | "last_month"
  | "last_6_months"
  | "last_year"
  | "cant_remember";

export type Sacrifice =
  | "health"
  | "marriage"
  | "kids"
  | "friendships"
  | "sense_of_self"
  | "peace_of_mind"
  | "joy"
  | "spiritual_life"
  | "not_sure";

export type MaskFrequency =
  | "rarely"
  | "sometimes_professional"
  | "often"
  | "almost_always"
  | "lost_self";

export type BodyTension =
  | "jaw"
  | "neck_shoulders"
  | "chest"
  | "stomach"
  | "lower_back"
  | "relaxed"
  | "disconnected";

export type Readiness =
  | "just_curious"
  | "scared_but_know"
  | "ready_to_explore"
  | "ready_to_invest"
  | "desperate";

export type PriorityPillar = "wealth" | "health" | "relationships" | "growth" | "purpose";

export type Interpretation = "elite" | "gap" | "critical";

export interface AssessmentQuestion {
  id: string;
  phase: "A" | "B" | "C" | "D";
  type: QuestionType;
  question: string;
  subtext?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  sliderConfig?: {
    min: number;
    max: number;
    lowLabel: string;
    midLabel?: string;
    highLabel: string;
  };
  maxSelections?: number; // For multi_select
  pillar?: PriorityPillar; // For pillar questions
}

export interface AssessmentAnswers {
  // Section A
  revenue_tier?: RevenueTier;
  achievements?: Achievement[];
  external_rating?: number;

  // Section B
  two_am_thought?: TwoAmThought;
  two_am_thought_other?: string;
  last_present?: LastPresent;
  sacrifices?: Sacrifice[];
  mask_frequency?: MaskFrequency;
  body_tension?: BodyTension;

  // Section C
  wealth_score?: number;
  health_score?: number;
  relationships_score?: number;
  growth_score?: number;
  purpose_score?: number;

  // Section D
  readiness?: Readiness;
  priority_pillar?: PriorityPillar;

  // Meta
  email?: string;
  first_name?: string;
}

// ============================================
// QUESTIONS
// ============================================

export const ASSESSMENT_V2_QUESTIONS: AssessmentQuestion[] = [
  // ============================================
  // PHASE A: EXTERNAL SUCCESS
  // ============================================
  {
    id: "revenue_tier",
    phase: "A",
    type: "single_choice",
    question: "What's the rough annual revenue of your business or practice?",
    subtext: "This helps us understand your context. All responses are confidential.",
    options: [
      { value: "under_250k", label: "Under $250K", description: "Early stage or side project" },
      { value: "250k_500k", label: "$250K - $500K", description: "Growing business" },
      { value: "500k_1m", label: "$500K - $1M", description: "Established operation" },
      { value: "1m_5m", label: "$1M - $5M", description: "Scaling company" },
      { value: "5m_10m", label: "$5M - $10M", description: "Mid-market business" },
      { value: "10m_plus", label: "$10M+", description: "Enterprise level" },
    ],
  },
  {
    id: "achievements",
    phase: "A",
    type: "multi_select",
    question: "Which of these have you accomplished?",
    subtext: "Select all that apply. We're building a picture of what you've built.",
    maxSelections: 6,
    options: [
      { value: "built_business", label: "Built a business from scratch" },
      { value: "led_team_10", label: "Led a team of 10+ people" },
      { value: "financial_independence", label: "Achieved financial independence" },
      { value: "marriage_10_years", label: "Maintained marriage 10+ years" },
      { value: "physical_transformation", label: "Major physical transformation" },
      { value: "public_recognition", label: "Public recognition in your field" },
    ],
  },
  {
    id: "external_rating",
    phase: "A",
    type: "slider",
    question: "If a stranger looked at your life on paper, what would they rate it?",
    subtext: "Resume, bank account, family photos, social media — the external view.",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Struggling",
      midLabel: "Solid",
      highLabel: "Exceptional",
    },
  },

  // ============================================
  // PHASE B: HIDDEN REALITY
  // ============================================
  {
    id: "two_am_thought",
    phase: "B",
    type: "single_choice",
    question:
      "When you can't sleep at 2am, what thought keeps surfacing that you'd never admit to anyone?",
    subtext: "Be honest. This is between you and yourself.",
    options: [
      { value: "worth_it", label: '"Was all this worth it?"' },
      {
        value: "lost_identity",
        label: '"I don\'t know who I am anymore outside of work"',
      },
      {
        value: "family_better_off",
        label: '"My family would be better off with my money than with me"',
      },
      {
        value: "terrified_slow_down",
        label: '"I\'m terrified of what happens when I slow down"',
      },
      {
        value: "performing_success",
        label: '"I\'m performing a version of success I don\'t even want"',
      },
      { value: "other", label: "Something else..." },
    ],
  },
  {
    id: "last_present",
    phase: "B",
    type: "single_choice",
    question:
      "When was the last time you felt genuinely PRESENT — not thinking about work, not planning, just... here?",
    options: [
      { value: "last_week", label: "Within the last week" },
      { value: "last_month", label: "Within the last month" },
      { value: "last_6_months", label: "Within the last 6 months" },
      { value: "last_year", label: "Within the last year" },
      { value: "cant_remember", label: "I genuinely can't remember" },
    ],
  },
  {
    id: "sacrifices",
    phase: "B",
    type: "multi_select",
    question: "What has your success cost you that you don't talk about?",
    subtext: "Select up to 3. The hidden invoice.",
    maxSelections: 3,
    options: [
      { value: "health", label: "My health (sleep, body, energy)" },
      { value: "marriage", label: "My marriage/relationship" },
      { value: "kids", label: "My relationship with my kids" },
      { value: "friendships", label: "My friendships" },
      { value: "sense_of_self", label: "My sense of self" },
      { value: "peace_of_mind", label: "My peace of mind" },
      { value: "joy", label: "My ability to feel joy" },
      { value: "spiritual_life", label: "My spiritual life" },
      { value: "not_sure", label: "I'm not sure anymore" },
    ],
  },
  {
    id: "mask_frequency",
    phase: "B",
    type: "single_choice",
    question:
      "How often do you feel like you're performing a version of yourself rather than being yourself?",
    options: [
      {
        value: "rarely",
        label: "Rarely",
        description: "I'm authentic most of the time",
      },
      {
        value: "sometimes_professional",
        label: "Sometimes",
        description: "In professional settings",
      },
      {
        value: "often",
        label: "Often",
        description: "In most interactions",
      },
      {
        value: "almost_always",
        label: "Almost always",
        description: "Even with family",
      },
      {
        value: "lost_self",
        label: "I've worn the mask so long...",
        description: "I'm not sure where it ends",
      },
    ],
  },
  {
    id: "body_tension",
    phase: "B",
    type: "single_choice",
    question: "Right now, in this moment, where do you feel tension in your body?",
    subtext: "Close your eyes for a second. Notice where you're holding.",
    options: [
      { value: "jaw", label: "Jaw/teeth (clenched)" },
      { value: "neck_shoulders", label: "Neck/shoulders (carrying weight)" },
      { value: "chest", label: "Chest (tightness, shallow breathing)" },
      { value: "stomach", label: "Stomach (knotted, anxious)" },
      { value: "lower_back", label: "Lower back (burden, support fatigue)" },
      { value: "relaxed", label: "I feel relaxed" },
      { value: "disconnected", label: "I'm not sure — I'm disconnected from my body" },
    ],
  },

  // ============================================
  // PHASE C: FIVE PILLARS DEEP SCAN
  // ============================================
  {
    id: "wealth_score",
    phase: "C",
    type: "slider",
    pillar: "wealth",
    question:
      "Your bank account says you're wealthy. But close your eyes and feel into this: Do you feel FREE?",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Trapped by golden handcuffs",
      midLabel: "Free on paper, obligated in reality",
      highLabel: "Genuinely liberated",
    },
  },
  {
    id: "health_score",
    phase: "C",
    type: "slider",
    pillar: "health",
    question:
      "Beyond the metrics — when you wake up, does your body feel like a gift or a burden?",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Dragging myself through each day",
      midLabel: "Functional but not thriving",
      highLabel: "Energized and vital",
    },
  },
  {
    id: "relationships_score",
    phase: "C",
    type: "slider",
    pillar: "relationships",
    question:
      "Does your partner/family actually SEE you — the real you, not the provider, not the success story?",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "I've become a function, not a person",
      midLabel: "They see parts of me",
      highLabel: "Fully seen and loved anyway",
    },
  },
  {
    id: "growth_score",
    phase: "C",
    type: "slider",
    pillar: "growth",
    question:
      "Are you still being challenged in ways that make you feel ALIVE, or are you optimizing a life you've outgrown?",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Coasting on autopilot",
      midLabel: "Busy but not growing",
      highLabel: "Actively evolving",
    },
  },
  {
    id: "purpose_score",
    phase: "C",
    type: "slider",
    pillar: "purpose",
    question:
      "If you removed your title, your revenue, your achievements — what remains that gives your life meaning?",
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "I don't know who I am without my success",
      midLabel: "Some sense of meaning beyond work",
      highLabel: "Deep purpose that transcends achievement",
    },
  },

  // ============================================
  // PHASE D: THE OPENING
  // ============================================
  {
    id: "readiness",
    phase: "D",
    type: "single_choice",
    question: "Be honest: How ready are you to do the work required to change this?",
    options: [
      {
        value: "just_curious",
        label: "Just curious",
        description: "Not ready to change",
      },
      {
        value: "scared_but_know",
        label: "Scared but I know something needs to change",
      },
      {
        value: "ready_to_explore",
        label: "Ready to explore",
        description: "Need to see the path",
      },
      {
        value: "ready_to_invest",
        label: "Ready to invest",
        description: "Time, energy, and money",
      },
      {
        value: "desperate",
        label: "Desperate",
        description: "Something has to give",
      },
    ],
  },
  {
    id: "priority_pillar",
    phase: "D",
    type: "single_choice",
    question:
      "If you could only fix ONE pillar in the next 90 days, which would create the biggest ripple effect?",
    options: [
      {
        value: "wealth",
        label: "Wealth",
        description: "Not for the money — for the freedom",
      },
      {
        value: "health",
        label: "Health",
        description: "So I have energy for everything else",
      },
      {
        value: "relationships",
        label: "Relationships",
        description: "Especially with partner/kids",
      },
      {
        value: "growth",
        label: "Growth",
        description: "I need to feel alive again",
      },
      {
        value: "purpose",
        label: "Purpose",
        description: "I need my success to mean something",
      },
    ],
  },
];

// ============================================
// INTERPRETATIONS
// ============================================

export const SCORE_INTERPRETATIONS: Record<
  Interpretation,
  {
    label: string;
    range: [number, number];
    headline: string;
    message: string;
    urgency: "low" | "medium" | "high";
  }
> = {
  elite: {
    label: "Elite",
    range: [40, 50],
    headline: "You're in the top 8%.",
    message:
      "Most men never hit this. You've done the work — or you're close. The training will show you how to go even deeper and potentially mentor others on the journey.",
    urgency: "low",
  },
  gap: {
    label: "The Gap",
    range: [25, 39],
    headline: "You're in 'The Gap.'",
    message:
      "One or two pillars are silently sabotaging the others. Men who score here often guess wrong about which pillar is actually bleeding. The training will show you exactly where to focus first.",
    urgency: "medium",
  },
  critical: {
    label: "Critical",
    range: [5, 24],
    headline: "You need to be in that room.",
    message:
      "This isn't a suggestion — it's a necessity. Men who score below 25 typically have 3+ pillars in crisis. The good news: they also see the fastest transformation. Something brought you here today. Don't ignore it.",
    urgency: "high",
  },
};

// ============================================
// BODY TENSION INTERPRETATIONS
// ============================================

export const BODY_TENSION_MEANINGS: Record<
  BodyTension,
  {
    location: string;
    meaning: string;
    insight: string;
  }
> = {
  jaw: {
    location: "jaw and teeth",
    meaning: "held words, unexpressed anger, control",
    insight:
      "You're clenching against things you want to say but don't. The words you're swallowing are taking up residence in your body.",
  },
  neck_shoulders: {
    location: "neck and shoulders",
    meaning: "carried responsibility, weight of expectations",
    insight:
      "You're literally carrying the weight. Every responsibility, every person depending on you — your body is keeping score.",
  },
  chest: {
    location: "chest",
    meaning: "suppressed emotion, grief, love withheld",
    insight:
      "The heart protects itself by closing. The tightness you feel is emotions you've told yourself you don't have time for.",
  },
  stomach: {
    location: "stomach",
    meaning: "anxiety, fear, gut instincts being ignored",
    insight:
      "Your gut has been trying to tell you something. The knot is what happens when you override your intuition too many times.",
  },
  lower_back: {
    location: "lower back",
    meaning: "foundation stress, support fatigue, feeling unsupported",
    insight:
      "You're the foundation everyone else stands on. But who supports the support? Your back is asking that question.",
  },
  relaxed: {
    location: "relaxed",
    meaning: "present, integrated, or disconnected",
    insight: "Either you've done significant work on yourself, or you've gotten very good at not feeling.",
  },
  disconnected: {
    location: "disconnected",
    meaning: "dissociation, numbness, survival mode",
    insight:
      "This is common in high-achievers. You've optimized so hard you've lost connection to the body that carries you. This is where we start.",
  },
};

// ============================================
// TWO AM THOUGHT INTERPRETATIONS
// ============================================

export const TWO_AM_MEANINGS: Record<
  TwoAmThought,
  {
    thought: string;
    pattern: string;
    insight: string;
  }
> = {
  worth_it: {
    thought: "Was all this worth it?",
    pattern: "Achievement without fulfillment",
    insight:
      "You did everything right. Hit the targets. Built the thing. And now you're looking back wondering if the game was even worth winning. This question doesn't go away — it gets louder.",
  },
  lost_identity: {
    thought: "I don't know who I am anymore outside of work",
    pattern: "Identity fusion with role",
    insight:
      "Your identity has merged with your function. When someone asks 'who are you?' you answer with what you do. The man underneath has been waiting a long time to be seen.",
  },
  family_better_off: {
    thought: "My family would be better off with my money than with me",
    pattern: "Provider guilt, presence absence",
    insight:
      "This is the thought you'd never say out loud. But it's been there. The brutal math of 'at least they'd have the money.' This thought is a signal, not a truth.",
  },
  terrified_slow_down: {
    thought: "I'm terrified of what happens when I slow down",
    pattern: "Avoidance through achievement",
    insight:
      "The hustle isn't just ambition — it's escape. You've been running so long you've forgotten what you're running from. Slowing down feels like dying because you've made stillness the enemy.",
  },
  performing_success: {
    thought: "I'm performing a version of success I don't even want",
    pattern: "Inherited definition of success",
    insight:
      "Somewhere along the way, you adopted someone else's scoreboard. Parents, society, peers — you've been winning a game you never chose to play. The exhaustion isn't from the work. It's from the performance.",
  },
  other: {
    thought: "Something else",
    pattern: "Unique experience",
    insight: "Your 2am thought is yours alone. But the pattern is the same: the defended self cracks open in the dark, and truth seeps through.",
  },
};

// ============================================
// LAST PRESENT INTERPRETATIONS
// ============================================

export const LAST_PRESENT_MEANINGS: Record<
  LastPresent,
  {
    timeframe: string;
    hoursSince: string;
    insight: string;
  }
> = {
  last_week: {
    timeframe: "within the last week",
    hoursSince: "less than 168 hours",
    insight:
      "You still have access to presence. The door isn't closed. But ask yourself: was it a moment you created, or one that happened to you?",
  },
  last_month: {
    timeframe: "within the last month",
    hoursSince: "roughly 700 hours",
    insight:
      "700+ hours of life have passed since you felt fully here. That's 700 hours of existing without truly living. The clock is always running.",
  },
  last_6_months: {
    timeframe: "within the last 6 months",
    hoursSince: "roughly 4,000 hours",
    insight:
      "4,000 hours. That's six months of your one life spent on autopilot. You've been so busy building a future that you've missed the present. The future arrives as the present. This is it.",
  },
  last_year: {
    timeframe: "within the last year",
    hoursSince: "roughly 8,700 hours",
    insight:
      "8,700 hours of life — more than a full working year — since you felt genuinely present. This isn't a failure. It's a pattern. And patterns can be broken.",
  },
  cant_remember: {
    timeframe: "I can't remember",
    hoursSince: "unknown — and that's the problem",
    insight:
      "When was the last time you were truly here? If you can't remember, that's not a memory problem. It's a presence problem. You've been missing your own life.",
  },
};

// ============================================
// READINESS-BASED CTA MESSAGING
// ============================================

export const READINESS_RESPONSES: Record<
  Readiness,
  {
    label: string;
    response: string;
    cta: string;
    ctaVariant: "soft" | "medium" | "strong";
  }
> = {
  just_curious: {
    label: "Just Curious",
    response:
      "That's honest. Most men start here. Curiosity is the crack in the armor. The fact that you completed this assessment means some part of you already knows. The March 3rd training isn't a commitment. It's 90 minutes to understand the full picture.",
    cta: "Save Your Seat (No Obligation)",
    ctaVariant: "soft",
  },
  scared_but_know: {
    label: "Scared But Aware",
    response:
      "Fear is appropriate. You built everything you have by not admitting fear. But this is different. This fear is the doorway. Every man who's transformed through this work felt exactly what you're feeling right now. The question isn't whether you're scared. It's whether you'll let the fear make your decision.",
    cta: "Face It — Save Your Seat",
    ctaVariant: "medium",
  },
  ready_to_explore: {
    label: "Ready to Explore",
    response:
      "You want to see the path before you commit. Smart. That's exactly what the March 3rd training provides: the complete methodology, laid out. You'll leave with the exact morning practice I've done for 497 days straight. No obligation to buy anything. Just the map.",
    cta: "See the Path — Register Free",
    ctaVariant: "medium",
  },
  ready_to_invest: {
    label: "Ready to Invest",
    response:
      "You're not shopping for a solution. You're ready to move. The 45-Day Awakening Challenge starts next month. $997. Limited to 15 men per cohort. The training will give you everything you need to know. But if you already know, reply to the email report — let's talk directly.",
    cta: "Register for Training (and Challenge Info)",
    ctaVariant: "strong",
  },
  desperate: {
    label: "Desperate",
    response:
      "Something has to give. You know it. The men who come to this work from desperation often see the fastest transformation — because they've stopped negotiating with themselves. The March 3rd training is the first step. But if you need to move faster, reply to your email report. We should talk.",
    cta: "I Need This — Register Now",
    ctaVariant: "strong",
  },
};

// ============================================
// PILLAR PRIORITY INSIGHTS
// ============================================

export const PRIORITY_INSIGHTS: Record<
  PriorityPillar,
  {
    pillar: string;
    validation: string;
    whyFirst: string;
    rippleEffect: string;
  }
> = {
  wealth: {
    pillar: "Wealth",
    validation: "You chose Wealth — not for more money, but for freedom.",
    whyFirst:
      "This isn't about your bank account. It's about the golden handcuffs. You've built something that was supposed to set you free but instead became a prison. Fixing this first means restructuring not what you earn, but how you relate to what you've built.",
    rippleEffect:
      "When your wealth serves you instead of owning you, you'll have the space to be present in your relationships, the energy to invest in your health, and the foundation to find purpose beyond the number.",
  },
  health: {
    pillar: "Health",
    validation: "You chose Health — so you have energy for everything else.",
    whyFirst:
      "Everything runs on energy. Your relationships, your business, your ability to find meaning — all of it requires a body that shows up. You've been running on fumes, using willpower where you should have vitality.",
    rippleEffect:
      "When your body becomes an ally instead of a burden, everything else accelerates. More energy means more presence. More presence means deeper connection. The body is the foundation the other four pillars stand on.",
  },
  relationships: {
    pillar: "Relationships",
    validation: "You chose Relationships — especially with the people closest to you.",
    whyFirst:
      "Success means nothing without someone to share it with. You've built an empire but lost connection with the people it was supposed to be for. The loneliest place in the world is a big house with people who used to know you.",
    rippleEffect:
      "When the people who matter actually SEE you again, everything changes. Your health improves because you have reasons to take care of yourself. Your purpose clarifies because you're not building alone. Connection is the multiplier.",
  },
  growth: {
    pillar: "Growth",
    validation: "You chose Growth — because you need to feel alive again.",
    whyFirst:
      "You've mastered the game you've been playing. And now you're bored, coasting, optimizing a life you've outgrown. The edge that made you successful has dulled. You need a new challenge that actually means something.",
    rippleEffect:
      "When you're challenged again, everything wakes up. Energy returns because you have something worth getting up for. Relationships improve because you're interesting again. Purpose emerges from the growth itself.",
  },
  purpose: {
    pillar: "Purpose",
    validation: "You chose Purpose — because your success needs to mean something.",
    whyFirst:
      "You can feel the hollowness. The achievement that was supposed to fill you left you empty. You've been asking 'what's the point?' and the answer keeps coming up short. This is the existential crisis successful men don't talk about.",
    rippleEffect:
      "When your success has meaning, the grind becomes a mission. Your relationships deepen because you're connected to something larger. Your health improves because you're not escaping — you're building. Purpose is the multiplier that changes everything.",
  },
};

// ============================================
// REVENUE TIER DISPLAY
// ============================================

export const REVENUE_DISPLAY: Record<RevenueTier, string> = {
  under_250k: "sub-$250K",
  "250k_500k": "$250K-$500K",
  "500k_1m": "$500K-$1M",
  "1m_5m": "$1M-$5M",
  "5m_10m": "$5M-$10M",
  "10m_plus": "$10M+",
};

// ============================================
// ACHIEVEMENT DISPLAY
// ============================================

export const ACHIEVEMENT_DISPLAY: Record<Achievement, string> = {
  built_business: "Built a business from scratch",
  led_team_10: "Led a team of 10+ people",
  financial_independence: "Achieved financial independence",
  marriage_10_years: "Maintained marriage 10+ years",
  physical_transformation: "Completed a major physical transformation",
  public_recognition: "Earned public recognition in your field",
};

// ============================================
// SACRIFICE DISPLAY
// ============================================

export const SACRIFICE_DISPLAY: Record<Sacrifice, string> = {
  health: "your health (sleep, body, energy)",
  marriage: "your marriage/relationship",
  kids: "your relationship with your kids",
  friendships: "your friendships",
  sense_of_self: "your sense of self",
  peace_of_mind: "your peace of mind",
  joy: "your ability to feel joy",
  spiritual_life: "your spiritual life",
  not_sure: "something you can't quite name anymore",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateTotalScore(answers: AssessmentAnswers): number {
  return (
    (answers.wealth_score || 0) +
    (answers.health_score || 0) +
    (answers.relationships_score || 0) +
    (answers.growth_score || 0) +
    (answers.purpose_score || 0)
  );
}

export function getInterpretation(totalScore: number): Interpretation {
  if (totalScore >= 40) return "elite";
  if (totalScore >= 25) return "gap";
  return "critical";
}

export function getLowestPillar(
  answers: AssessmentAnswers
): { pillar: PriorityPillar; score: number } | null {
  const pillars: Array<{ pillar: PriorityPillar; score: number }> = [
    { pillar: "wealth", score: answers.wealth_score || 10 },
    { pillar: "health", score: answers.health_score || 10 },
    { pillar: "relationships", score: answers.relationships_score || 10 },
    { pillar: "growth", score: answers.growth_score || 10 },
    { pillar: "purpose", score: answers.purpose_score || 10 },
  ];

  return pillars.reduce((lowest, current) =>
    current.score < lowest.score ? current : lowest
  );
}

export function calculateLeadScore(answers: AssessmentAnswers): number {
  // Revenue tier (1-6)
  const revenueScores: Record<RevenueTier, number> = {
    under_250k: 1,
    "250k_500k": 2,
    "500k_1m": 3,
    "1m_5m": 4,
    "5m_10m": 5,
    "10m_plus": 6,
  };
  const revenueScore = answers.revenue_tier ? revenueScores[answers.revenue_tier] : 1;

  // Readiness (1-10)
  const readinessScores: Record<Readiness, number> = {
    just_curious: 1,
    scared_but_know: 3,
    ready_to_explore: 5,
    ready_to_invest: 8,
    desperate: 10,
  };
  const readinessScore = answers.readiness ? readinessScores[answers.readiness] : 1;

  // Gap severity (1-3)
  const lowest = getLowestPillar(answers);
  const totalScore = calculateTotalScore(answers);
  let gapSeverity = 1;
  if (lowest && lowest.score <= 3) gapSeverity = 3;
  else if (totalScore <= 30) gapSeverity = 2;

  return revenueScore * readinessScore * gapSeverity;
}

// ============================================
// CONTENT STRINGS
// ============================================

export const ASSESSMENT_V2_CONTENT = {
  title: "Five Pillar Assessment",
  subtitle: "15 questions. 10 minutes. The truth you've been avoiding.",
  instruction: "Answer honestly. This is between you and yourself.",
  phases: {
    A: {
      name: "Your External Success",
      description: "First, let's establish what you've built.",
    },
    B: {
      name: "The Hidden Reality",
      description: "Now, let's look at what's underneath.",
    },
    C: {
      name: "The Five Pillars",
      description: "Rate each area of your life with complete honesty.",
    },
    D: {
      name: "The Opening",
      description: "Finally, let's talk about what's next.",
    },
  },
  completionCTA: "Your score is waiting. So is the training that explains it.",
  shareText:
    "I just took the Five Pillar Assessment. My score: {score}/50. The questions hit different. What's yours?",
};
