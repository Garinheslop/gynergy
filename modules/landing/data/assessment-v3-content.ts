/**
 * Five Pillar Assessment V3
 * ============================================
 * A deeply personalized assessment designed to make users
 * feel truly seen and understood - "how did they know?"
 *
 * 23 Questions across 4 sections:
 * - Section 1: The Dream (Q1-3) - Vision & Motivation
 * - Section 2: The Reality (Q4-6) - Where You Are Now
 * - Section 3: Five Pillars (Q7-21) - 3 per pillar, deep dive
 * - Section 4: The Hidden Self (Q22-23) - Truth & Readiness
 *
 * Key Features:
 * - Pattern reveals connecting earlier answers to later questions
 * - Dynamic subtexts based on previous responses
 * - Pillar progress bar showing current section
 * - Starts with vision/goals, eases into harder questions
 */

// ============================================
// TYPES
// ============================================

export type QuestionType = "single_choice" | "multi_select" | "slider" | "free_text";

// Section 1: The Dream
export type VisionGoal =
  | "financial_freedom"
  | "time_sovereignty"
  | "deeper_relationships"
  | "health_vitality"
  | "meaningful_impact"
  | "inner_peace";

export type DrivingMotivation =
  | "escaping_current"
  | "proving_something"
  | "family_legacy"
  | "personal_transformation"
  | "making_difference"
  | "finding_self";

export type SuccessDefinition =
  | "number_in_bank"
  | "freedom_schedule"
  | "family_present"
  | "health_energy"
  | "people_helped"
  | "inner_fulfillment";

// Section 2: The Reality
export type RevenueTier = "under_250k" | "250k_500k" | "500k_1m" | "1m_5m" | "5m_10m" | "10m_plus";

export type PriorCoaching = "never" | "free_content" | "under_1k" | "1k_5k" | "5k_15k" | "15k_plus";

// Section 3: Pillars - Wealth
export type WealthRelationship =
  | "slave_to_money"
  | "anxious_despite_enough"
  | "never_enough"
  | "comfortable_not_free"
  | "genuinely_free";

export type WorkLifeBalance =
  | "work_is_life"
  | "trying_to_balance"
  | "business_owns_me"
  | "intentional_boundaries"
  | "integrated_flow";

// Section 3: Pillars - Health
export type EnergyPattern =
  | "exhausted_always"
  | "caffeine_dependent"
  | "afternoon_crash"
  | "inconsistent"
  | "steady_energy";

export type BodyConnection =
  | "disconnected"
  | "only_when_pain"
  | "ignore_signals"
  | "learning_to_listen"
  | "fully_connected";

export type SleepPattern =
  | "struggle_sleep"
  | "poor_quality"
  | "need_substances"
  | "inconsistent"
  | "restorative";

// Section 3: Pillars - Relationships
export type PresenceWithFamily =
  | "physically_there"
  | "distracted_always"
  | "quality_rare"
  | "improving"
  | "fully_present";

export type VulnerabilityLevel =
  | "never_vulnerable"
  | "only_surface"
  | "with_few"
  | "learning"
  | "openly_authentic";

// Section 3: Pillars - Growth
export type ChallengeLevel =
  | "coasting"
  | "busy_not_growing"
  | "growing_wrong_direction"
  | "intentionally_growing"
  | "edge_of_comfort";

export type LearningMode =
  | "no_time"
  | "consuming_not_applying"
  | "sporadic"
  | "consistent"
  | "always_learning";

// Section 3: Pillars - Purpose
export type LegacyClarity =
  | "never_thought"
  | "scared_to_think"
  | "unclear"
  | "emerging"
  | "crystal_clear";

export type ImpactFeeling =
  | "making_money_only"
  | "impact_secondary"
  | "want_more_impact"
  | "some_impact"
  | "deeply_meaningful";

// Section 4: Hidden Self
export type TwoAmThought =
  | "worth_it"
  | "lost_identity"
  | "family_better_off"
  | "terrified_slow_down"
  | "performing_success"
  | "other";

export type Readiness =
  | "just_curious"
  | "scared_but_know"
  | "ready_to_explore"
  | "ready_to_invest"
  | "desperate";

export type PriorityPillar = "wealth" | "health" | "relationships" | "growth" | "purpose";

export type Interpretation = "elite" | "gap" | "critical";

// ============================================
// QUESTION INTERFACE
// ============================================

export interface AssessmentV3Question {
  id: string;
  section: 1 | 2 | 3 | 4;
  pillar?: PriorityPillar; // Only for section 3 questions
  type: QuestionType;
  question: string;
  subtext?: string;
  // Dynamic subtext based on previous answers
  dynamicSubtext?: (answers: AssessmentV3Answers) => string | undefined;
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
  maxSelections?: number;
}

// ============================================
// ANSWERS INTERFACE
// ============================================

export interface AssessmentV3Answers {
  // Section 1: The Dream
  vision_goal?: VisionGoal;
  driving_motivation?: DrivingMotivation;
  success_definition?: SuccessDefinition;

  // Section 2: The Reality
  external_rating?: number;
  revenue_tier?: RevenueTier;
  prior_coaching?: PriorCoaching;

  // Section 3: Wealth Pillar
  wealth_freedom?: number; // Slider 1-10
  wealth_relationship?: WealthRelationship;
  work_life_balance?: WorkLifeBalance;

  // Section 3: Health Pillar
  health_vitality?: number; // Slider 1-10
  energy_pattern?: EnergyPattern;
  body_connection?: BodyConnection;

  // Section 3: Relationships Pillar
  relationships_depth?: number; // Slider 1-10
  presence_with_family?: PresenceWithFamily;
  vulnerability_level?: VulnerabilityLevel;

  // Section 3: Growth Pillar
  growth_aliveness?: number; // Slider 1-10
  challenge_level?: ChallengeLevel;
  learning_mode?: LearningMode;

  // Section 3: Purpose Pillar
  purpose_clarity?: number; // Slider 1-10
  legacy_clarity?: LegacyClarity;
  impact_feeling?: ImpactFeeling;

  // Section 4: Hidden Self
  two_am_thought?: TwoAmThought;
  two_am_thought_other?: string;
  readiness?: Readiness;
  priority_pillar?: PriorityPillar;

  // Meta
  email?: string;
  first_name?: string;
}

// ============================================
// HELPER FUNCTIONS FOR DYNAMIC SUBTEXTS
// ============================================

function getVisionLabel(vision: VisionGoal | undefined): string {
  const labels: Record<VisionGoal, string> = {
    financial_freedom: "financial freedom",
    time_sovereignty: "time sovereignty",
    deeper_relationships: "deeper relationships",
    health_vitality: "health and vitality",
    meaningful_impact: "meaningful impact",
    inner_peace: "inner peace",
  };
  return vision ? labels[vision] : "your vision";
}

function _getMotivationInsight(motivation: DrivingMotivation | undefined): string {
  const insights: Record<DrivingMotivation, string> = {
    escaping_current: "you're running from something",
    proving_something: "you're driven by proof",
    family_legacy: "your family is your why",
    personal_transformation: "you're seeking transformation",
    making_difference: "impact drives you",
    finding_self: "you're on a journey of self-discovery",
  };
  return motivation ? insights[motivation] : "";
}

function getRevenueContext(revenue: RevenueTier | undefined): string {
  if (!revenue) return "";
  const contexts: Record<RevenueTier, string> = {
    under_250k: "in the early stages",
    "250k_500k": "building momentum",
    "500k_1m": "at a pivotal growth point",
    "1m_5m": "playing at a serious level",
    "5m_10m": "among the few who've made it here",
    "10m_plus": "at the top — yet here you are, still searching",
  };
  return contexts[revenue];
}

// ============================================
// QUESTIONS
// ============================================

export const ASSESSMENT_V3_QUESTIONS: AssessmentV3Question[] = [
  // ============================================
  // SECTION 1: THE DREAM (3 Questions)
  // ============================================
  {
    id: "vision_goal",
    section: 1,
    type: "single_choice",
    question: "If everything aligned perfectly, what would your life look like in 3 years?",
    subtext: "Don't think about what's realistic. What do you actually want?",
    options: [
      {
        value: "financial_freedom",
        label: "Financial freedom",
        description: "Work is optional, not mandatory",
      },
      {
        value: "time_sovereignty",
        label: "Time sovereignty",
        description: "My calendar reflects my priorities",
      },
      {
        value: "deeper_relationships",
        label: "Deeper relationships",
        description: "Real connection with people I love",
      },
      {
        value: "health_vitality",
        label: "Health and vitality",
        description: "Energy and presence in my body",
      },
      {
        value: "meaningful_impact",
        label: "Meaningful impact",
        description: "My work changes lives",
      },
      {
        value: "inner_peace",
        label: "Inner peace",
        description: "Quiet mind, content heart",
      },
    ],
  },
  {
    id: "driving_motivation",
    section: 1,
    type: "single_choice",
    question: "Be honest — what's really driving you right now?",
    dynamicSubtext: (answers) => {
      if (answers.vision_goal) {
        return `You want ${getVisionLabel(answers.vision_goal)}. But why? What's underneath that desire?`;
      }
      return "The surface goal is never the real goal.";
    },
    options: [
      {
        value: "escaping_current",
        label: "Escaping my current situation",
        description: "Something has to change",
      },
      {
        value: "proving_something",
        label: "Proving something",
        description: "To myself, to others, to the doubters",
      },
      {
        value: "family_legacy",
        label: "My family and their future",
        description: "Building something for them",
      },
      {
        value: "personal_transformation",
        label: "Personal transformation",
        description: "Becoming who I'm meant to be",
      },
      {
        value: "making_difference",
        label: "Making a difference",
        description: "Leaving the world better",
      },
      {
        value: "finding_self",
        label: "Finding myself again",
        description: "I've lost who I am",
      },
    ],
  },
  {
    id: "success_definition",
    section: 1,
    type: "single_choice",
    question: "How will you know when you've 'made it'?",
    dynamicSubtext: (answers) => {
      if (answers.driving_motivation === "proving_something") {
        return "When you're trying to prove something, the finish line keeps moving. What would actually satisfy you?";
      }
      if (answers.driving_motivation === "escaping_current") {
        return "Running from something eventually becomes running toward something. What does arrival look like?";
      }
      return "Most men never define this clearly. That's why success feels hollow.";
    },
    options: [
      {
        value: "number_in_bank",
        label: "A specific number in the bank",
        description: "Financial milestone",
      },
      {
        value: "freedom_schedule",
        label: "Total freedom in my schedule",
        description: "Time wealth",
      },
      {
        value: "family_present",
        label: "Being fully present with my family",
        description: "Relationship richness",
      },
      {
        value: "health_energy",
        label: "Feeling healthy and energized",
        description: "Physical vitality",
      },
      {
        value: "people_helped",
        label: "Number of people I've helped",
        description: "Impact metrics",
      },
      {
        value: "inner_fulfillment",
        label: "A feeling of inner fulfillment",
        description: "Can't be measured externally",
      },
    ],
  },

  // ============================================
  // SECTION 2: THE REALITY (3 Questions)
  // ============================================
  {
    id: "external_rating",
    section: 2,
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
  {
    id: "revenue_tier",
    section: 2,
    type: "single_choice",
    question: "What's the annual revenue of your business or practice?",
    dynamicSubtext: (answers) => {
      if (answers.external_rating && answers.external_rating >= 8) {
        return "Looks like things are going well on the outside. Let's see what's underneath.";
      }
      return "This helps us understand your context. All responses are confidential.";
    },
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
    id: "prior_coaching",
    section: 2,
    type: "single_choice",
    question: "How much have you invested in personal development, coaching, or self-work?",
    dynamicSubtext: (answers) => {
      if (answers.revenue_tier === "10m_plus" || answers.revenue_tier === "5m_10m") {
        return "At your level, most men have invested heavily in business growth. But how much in personal growth?";
      }
      return "Books, courses, coaches, retreats, therapy — the investments you've made in yourself.";
    },
    options: [
      {
        value: "never",
        label: "Haven't really invested yet",
        description: "Still figuring out what works",
      },
      {
        value: "free_content",
        label: "Mostly free content",
        description: "Books, podcasts, YouTube",
      },
      { value: "under_1k", label: "Under $1,000", description: "A few courses or books" },
      { value: "1k_5k", label: "$1,000 - $5,000", description: "Some programs or coaching" },
      { value: "5k_15k", label: "$5,000 - $15,000", description: "Serious investment in growth" },
      { value: "15k_plus", label: "$15,000+", description: "High-level coaching or programs" },
    ],
  },

  // ============================================
  // SECTION 3: WEALTH PILLAR (3 Questions)
  // ============================================
  {
    id: "wealth_freedom",
    section: 3,
    pillar: "wealth",
    type: "slider",
    question: "Your bank account says you're wealthy. Do you FEEL free?",
    dynamicSubtext: (answers) => {
      const revenueContext = getRevenueContext(answers.revenue_tier);
      if (revenueContext) {
        return `You're ${revenueContext}. But freedom isn't a number — it's a feeling.`;
      }
      return "Close your eyes and feel into this. Not the number. The feeling.";
    },
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Trapped by golden handcuffs",
      midLabel: "Free on paper, obligated in reality",
      highLabel: "Genuinely liberated",
    },
  },
  {
    id: "wealth_relationship",
    section: 3,
    pillar: "wealth",
    type: "single_choice",
    question: "What's your relationship with money right now?",
    dynamicSubtext: (answers) => {
      if (answers.wealth_freedom && answers.wealth_freedom <= 4) {
        return "You scored low on feeling free. Let's understand why.";
      }
      if (answers.vision_goal === "financial_freedom") {
        return "You said you want financial freedom. Here's what's in the way.";
      }
      return "Money is never just money. It's wrapped in meaning.";
    },
    options: [
      {
        value: "slave_to_money",
        label: "I'm a slave to it",
        description: "Every decision is about money",
      },
      {
        value: "anxious_despite_enough",
        label: "Anxious despite having enough",
        description: "The fear doesn't match reality",
      },
      { value: "never_enough", label: "Never enough", description: "The goalpost keeps moving" },
      {
        value: "comfortable_not_free",
        label: "Comfortable but not free",
        description: "Good position, still trapped",
      },
      {
        value: "genuinely_free",
        label: "Genuinely free",
        description: "Money is a tool, not a master",
      },
    ],
  },
  {
    id: "work_life_balance",
    section: 3,
    pillar: "wealth",
    type: "single_choice",
    question: "How integrated is your work with the rest of your life?",
    dynamicSubtext: (answers) => {
      if (answers.vision_goal === "time_sovereignty") {
        return "You want time sovereignty. Here's where you are now.";
      }
      if (answers.success_definition === "freedom_schedule") {
        return "You defined success as schedule freedom. Let's see the gap.";
      }
      return "Balance is a myth. Integration is the goal.";
    },
    options: [
      { value: "work_is_life", label: "Work IS my life", description: "There's no separation" },
      {
        value: "trying_to_balance",
        label: "Constantly trying to balance",
        description: "Failing at both",
      },
      {
        value: "business_owns_me",
        label: "The business owns me",
        description: "I'm trapped in my success",
      },
      {
        value: "intentional_boundaries",
        label: "Getting better at boundaries",
        description: "Still a struggle",
      },
      {
        value: "integrated_flow",
        label: "Work flows naturally",
        description: "Integrated, not balanced",
      },
    ],
  },

  // ============================================
  // SECTION 3: HEALTH PILLAR (3 Questions)
  // ============================================
  {
    id: "health_vitality",
    section: 3,
    pillar: "health",
    type: "slider",
    question: "When you wake up, does your body feel like a gift or a burden?",
    dynamicSubtext: (answers) => {
      if (answers.vision_goal === "health_vitality") {
        return "You said you want health and vitality. Let's see where you're starting from.";
      }
      if (answers.driving_motivation === "personal_transformation") {
        return "Transformation starts in the body. How's yours doing?";
      }
      return "Beyond the metrics — how does it feel to live in your body?";
    },
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Dragging myself through each day",
      midLabel: "Functional but not thriving",
      highLabel: "Energized and vital",
    },
  },
  {
    id: "energy_pattern",
    section: 3,
    pillar: "health",
    type: "single_choice",
    question: "What's your energy pattern throughout the day?",
    dynamicSubtext: (answers) => {
      if (answers.health_vitality && answers.health_vitality <= 4) {
        return "Your body is trying to tell you something. Let's understand the pattern.";
      }
      return "Energy isn't random. It follows patterns you can change.";
    },
    options: [
      {
        value: "exhausted_always",
        label: "Exhausted most of the time",
        description: "Running on empty",
      },
      {
        value: "caffeine_dependent",
        label: "Dependent on caffeine",
        description: "Coffee is life support",
      },
      {
        value: "afternoon_crash",
        label: "Morning OK, afternoon crash",
        description: "Energy cliff around 2-3pm",
      },
      { value: "inconsistent", label: "Good days and bad days", description: "Unpredictable" },
      {
        value: "steady_energy",
        label: "Steady energy all day",
        description: "Consistent vitality",
      },
    ],
  },
  {
    id: "body_connection",
    section: 3,
    pillar: "health",
    type: "single_choice",
    question: "How connected are you to your body's signals?",
    dynamicSubtext: (answers) => {
      if (
        answers.energy_pattern === "exhausted_always" ||
        answers.energy_pattern === "caffeine_dependent"
      ) {
        return "When you're running on empty, the body screams. Have you been listening?";
      }
      return "Your body is always communicating. Most high-achievers have stopped listening.";
    },
    options: [
      { value: "disconnected", label: "Completely disconnected", description: "I live in my head" },
      {
        value: "only_when_pain",
        label: "Only notice when there's pain",
        description: "Body as problem",
      },
      { value: "ignore_signals", label: "I notice but push through", description: "Override mode" },
      {
        value: "learning_to_listen",
        label: "Learning to pay attention",
        description: "Getting better",
      },
      { value: "fully_connected", label: "Deeply connected", description: "Body as ally" },
    ],
  },

  // ============================================
  // SECTION 3: RELATIONSHIPS PILLAR (3 Questions)
  // ============================================
  {
    id: "relationships_depth",
    section: 3,
    pillar: "relationships",
    type: "slider",
    question: "Does your partner/family actually SEE you — the real you?",
    dynamicSubtext: (answers) => {
      if (answers.vision_goal === "deeper_relationships") {
        return "You want deeper relationships. Here's the honest starting point.";
      }
      if (answers.success_definition === "family_present") {
        return "You said success means being present with family. How seen do you feel right now?";
      }
      return "Not the provider, not the success story — the real you underneath.";
    },
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "I've become a function, not a person",
      midLabel: "They see parts of me",
      highLabel: "Fully seen and loved anyway",
    },
  },
  {
    id: "presence_with_family",
    section: 3,
    pillar: "relationships",
    type: "single_choice",
    question: "When you're with the people you love, how present are you really?",
    dynamicSubtext: (answers) => {
      if (answers.relationships_depth && answers.relationships_depth <= 4) {
        return "Being seen requires being present. And you know you haven't been.";
      }
      if (answers.driving_motivation === "family_legacy") {
        return "Your family is your why. But are you actually with them?";
      }
      return "Present means your mind is where your body is.";
    },
    options: [
      {
        value: "physically_there",
        label: "Physically there, mentally elsewhere",
        description: "Body present, mind at work",
      },
      {
        value: "distracted_always",
        label: "Constantly checking my phone",
        description: "Half-attention",
      },
      {
        value: "quality_rare",
        label: "Rare moments of real presence",
        description: "Special occasions only",
      },
      {
        value: "improving",
        label: "Working on being more present",
        description: "Conscious effort",
      },
      {
        value: "fully_present",
        label: "Fully present most of the time",
        description: "Mind matches body",
      },
    ],
  },
  {
    id: "vulnerability_level",
    section: 3,
    pillar: "relationships",
    type: "single_choice",
    question: "How often do you let people see your struggles, fears, or doubts?",
    dynamicSubtext: (answers) => {
      if (answers.driving_motivation === "proving_something") {
        return "When you're proving something, vulnerability feels like weakness. It's not.";
      }
      if (answers.relationships_depth && answers.relationships_depth <= 5) {
        return "Being seen requires letting people in. Where are your walls?";
      }
      return "Armor protects you. It also isolates you.";
    },
    options: [
      {
        value: "never_vulnerable",
        label: "Never — I'm the strong one",
        description: "Walls firmly up",
      },
      { value: "only_surface", label: "Surface level only", description: "Edited version" },
      { value: "with_few", label: "With one or two people", description: "Selective openness" },
      { value: "learning", label: "Learning to open up", description: "Work in progress" },
      {
        value: "openly_authentic",
        label: "Openly authentic",
        description: "Comfortable with all of me",
      },
    ],
  },

  // ============================================
  // SECTION 3: GROWTH PILLAR (3 Questions)
  // ============================================
  {
    id: "growth_aliveness",
    section: 3,
    pillar: "growth",
    type: "slider",
    question: "Are you being challenged in ways that make you feel ALIVE?",
    dynamicSubtext: (answers) => {
      if (answers.driving_motivation === "personal_transformation") {
        return "You said you're seeking transformation. Growth requires challenge.";
      }
      if (answers.revenue_tier === "10m_plus" || answers.revenue_tier === "5m_10m") {
        return "At your level, the old challenges have been mastered. What's next?";
      }
      return "Not just busy. Not just productive. Alive.";
    },
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "Coasting on autopilot",
      midLabel: "Busy but not growing",
      highLabel: "Actively evolving",
    },
  },
  {
    id: "challenge_level",
    section: 3,
    pillar: "growth",
    type: "single_choice",
    question: "What's your relationship with challenge and discomfort?",
    dynamicSubtext: (answers) => {
      if (answers.growth_aliveness && answers.growth_aliveness <= 4) {
        return "Without challenge, success becomes a golden cage. Let's understand the pattern.";
      }
      return "Growth lives at the edge of comfort. Where's your edge?";
    },
    options: [
      {
        value: "coasting",
        label: "Coasting — I've mastered my game",
        description: "Competent but bored",
      },
      {
        value: "busy_not_growing",
        label: "Busy but not really growing",
        description: "Motion without progress",
      },
      {
        value: "growing_wrong_direction",
        label: "Growing in the wrong direction",
        description: "Optimizing the wrong game",
      },
      {
        value: "intentionally_growing",
        label: "Intentionally seeking growth",
        description: "Active edge-pushing",
      },
      { value: "edge_of_comfort", label: "Living at my edge", description: "Constant expansion" },
    ],
  },
  {
    id: "learning_mode",
    section: 3,
    pillar: "growth",
    type: "single_choice",
    question: "How are you learning and evolving right now?",
    dynamicSubtext: (answers) => {
      if (answers.prior_coaching === "15k_plus" || answers.prior_coaching === "5k_15k") {
        return "You've invested in growth before. Is it sticking?";
      }
      if (answers.prior_coaching === "never" || answers.prior_coaching === "free_content") {
        return "Growth doesn't happen by accident at your level. It requires intention.";
      }
      return "Consuming information isn't learning. Transformation is.";
    },
    options: [
      { value: "no_time", label: "No time for learning", description: "Too busy surviving" },
      {
        value: "consuming_not_applying",
        label: "Consuming but not applying",
        description: "Information hoarding",
      },
      { value: "sporadic", label: "Sporadic learning", description: "When crisis hits" },
      { value: "consistent", label: "Consistent learning habits", description: "Regular practice" },
      {
        value: "always_learning",
        label: "Always in learning mode",
        description: "Growth is lifestyle",
      },
    ],
  },

  // ============================================
  // SECTION 3: PURPOSE PILLAR (3 Questions)
  // ============================================
  {
    id: "purpose_clarity",
    section: 3,
    pillar: "purpose",
    type: "slider",
    question: "If you removed your title, your revenue, your achievements — what remains?",
    dynamicSubtext: (answers) => {
      if (answers.success_definition === "inner_fulfillment") {
        return "You said success is inner fulfillment. Let's see what's underneath the achievements.";
      }
      if (answers.vision_goal === "inner_peace" || answers.vision_goal === "meaningful_impact") {
        return "Your vision points toward meaning. How clear is it right now?";
      }
      return "What gives your life meaning beyond what you've accomplished?";
    },
    sliderConfig: {
      min: 1,
      max: 10,
      lowLabel: "I don't know who I am without my success",
      midLabel: "Some sense of meaning beyond work",
      highLabel: "Deep purpose that transcends achievement",
    },
  },
  {
    id: "legacy_clarity",
    section: 3,
    pillar: "purpose",
    type: "single_choice",
    question: "How clear are you on what you want your legacy to be?",
    dynamicSubtext: (answers) => {
      if (answers.purpose_clarity && answers.purpose_clarity <= 4) {
        return "Without clear purpose, achievement feels hollow. That's what you're sensing.";
      }
      if (answers.driving_motivation === "family_legacy") {
        return "You said family legacy drives you. What does that actually look like?";
      }
      return "Legacy isn't what you leave when you die. It's how you're living now.";
    },
    options: [
      {
        value: "never_thought",
        label: "Never really thought about it",
        description: "Too busy doing",
      },
      { value: "scared_to_think", label: "Scared to think about it", description: "Avoidance" },
      { value: "unclear", label: "Unclear — it keeps changing", description: "Searching" },
      { value: "emerging", label: "Starting to see it", description: "Emerging clarity" },
      { value: "crystal_clear", label: "Crystal clear", description: "Living it now" },
    ],
  },
  {
    id: "impact_feeling",
    section: 3,
    pillar: "purpose",
    type: "single_choice",
    question: "Does your work feel meaningful beyond the money it generates?",
    dynamicSubtext: (answers) => {
      if (answers.vision_goal === "meaningful_impact") {
        return "You want meaningful impact. Here's where you stand.";
      }
      if (answers.success_definition === "people_helped") {
        return "You measure success by people helped. How's that feeling right now?";
      }
      return "Success without meaning is just accumulation.";
    },
    options: [
      {
        value: "making_money_only",
        label: "It's just making money",
        description: "Means to an end",
      },
      {
        value: "impact_secondary",
        label: "Some impact, but secondary",
        description: "Business first",
      },
      { value: "want_more_impact", label: "I want more impact", description: "Hungry for meaning" },
      { value: "some_impact", label: "Making a difference", description: "Real but not enough" },
      {
        value: "deeply_meaningful",
        label: "Deeply meaningful work",
        description: "Work is calling",
      },
    ],
  },

  // ============================================
  // SECTION 4: THE HIDDEN SELF (2 Questions)
  // ============================================
  {
    id: "two_am_thought",
    section: 4,
    type: "single_choice",
    question: "When you can't sleep at 2am, what thought keeps surfacing?",
    dynamicSubtext: (answers) => {
      // Pattern reveal based on pillar scores
      const lowestPillar = getLowestPillarFromAnswers(answers);
      if (lowestPillar === "purpose") {
        return "Your Purpose pillar scored lowest. No surprise — the 2am thoughts are about meaning.";
      }
      if (lowestPillar === "relationships") {
        return "Your Relationships pillar scored lowest. The loneliness shows up in the dark.";
      }
      if (answers.driving_motivation === "escaping_current") {
        return "You said you're escaping something. Here's what finds you when you stop.";
      }
      return "Be honest. This is between you and yourself.";
    },
    options: [
      { value: "worth_it", label: '"Was all this worth it?"' },
      { value: "lost_identity", label: '"I don\'t know who I am anymore outside of work"' },
      {
        value: "family_better_off",
        label: '"My family would be better off with my money than with me"',
      },
      { value: "terrified_slow_down", label: '"I\'m terrified of what happens when I slow down"' },
      {
        value: "performing_success",
        label: "\"I'm performing a version of success I don't even want\"",
      },
      { value: "other", label: "Something else..." },
    ],
  },
  {
    id: "readiness",
    section: 4,
    type: "single_choice",
    question: "Be honest: How ready are you to do the work required to change this?",
    dynamicSubtext: (answers) => {
      // Create personalized pattern reveal
      const patterns: string[] = [];

      if (answers.vision_goal && answers.success_definition) {
        const visionLabel = getVisionLabel(answers.vision_goal);
        patterns.push(`You want ${visionLabel}`);
      }

      const lowestPillar = getLowestPillarFromAnswers(answers);
      if (lowestPillar) {
        const pillarNames: Record<PriorityPillar, string> = {
          wealth: "Wealth",
          health: "Health",
          relationships: "Relationships",
          growth: "Growth",
          purpose: "Purpose",
        };
        patterns.push(`Your ${pillarNames[lowestPillar]} pillar needs the most attention`);
      }

      if (patterns.length > 0) {
        return `${patterns.join(". ")}. The question is: are you ready?`;
      }

      return "Change requires more than insight. It requires commitment.";
    },
    options: [
      { value: "just_curious", label: "Just curious", description: "Not ready to change" },
      { value: "scared_but_know", label: "Scared but I know something needs to change" },
      { value: "ready_to_explore", label: "Ready to explore", description: "Need to see the path" },
      {
        value: "ready_to_invest",
        label: "Ready to invest",
        description: "Time, energy, and money",
      },
      { value: "desperate", label: "Desperate", description: "Something has to give" },
    ],
  },
  {
    id: "priority_pillar",
    section: 4,
    type: "single_choice",
    question:
      "If you could only fix ONE pillar in the next 90 days, which would create the biggest ripple effect?",
    dynamicSubtext: (answers) => {
      const lowestPillar = getLowestPillarFromAnswers(answers);
      if (lowestPillar) {
        const pillarNames: Record<PriorityPillar, string> = {
          wealth: "Wealth",
          health: "Health",
          relationships: "Relationships",
          growth: "Growth",
          purpose: "Purpose",
        };
        return `Based on your answers, ${pillarNames[lowestPillar]} scored lowest. But sometimes the biggest leverage is elsewhere.`;
      }
      return "The weakest pillar isn't always the most important to fix first.";
    },
    options: [
      { value: "wealth", label: "Wealth", description: "Not for the money — for the freedom" },
      { value: "health", label: "Health", description: "So I have energy for everything else" },
      {
        value: "relationships",
        label: "Relationships",
        description: "Especially with partner/kids",
      },
      { value: "growth", label: "Growth", description: "I need to feel alive again" },
      { value: "purpose", label: "Purpose", description: "I need my success to mean something" },
    ],
  },
];

// ============================================
// HELPER: Get Lowest Pillar from Answers
// ============================================

function getLowestPillarFromAnswers(answers: AssessmentV3Answers): PriorityPillar | null {
  const pillarScores: Array<{ pillar: PriorityPillar; score: number }> = [
    { pillar: "wealth", score: answers.wealth_freedom || 10 },
    { pillar: "health", score: answers.health_vitality || 10 },
    { pillar: "relationships", score: answers.relationships_depth || 10 },
    { pillar: "growth", score: answers.growth_aliveness || 10 },
    { pillar: "purpose", score: answers.purpose_clarity || 10 },
  ];

  const lowest = pillarScores.reduce((min, curr) => (curr.score < min.score ? curr : min));
  return lowest.score < 10 ? lowest.pillar : null;
}

// ============================================
// PILLAR PROGRESS CONFIGURATION
// ============================================

export const PILLAR_SECTIONS = {
  1: { name: "The Dream", questionCount: 3 },
  2: { name: "The Reality", questionCount: 3 },
  3: {
    name: "Five Pillars",
    questionCount: 15,
    pillars: [
      { id: "wealth", name: "Wealth", icon: "💰", questions: 3 },
      { id: "health", name: "Health", icon: "❤️", questions: 3 },
      { id: "relationships", name: "Relationships", icon: "👥", questions: 3 },
      { id: "growth", name: "Growth", icon: "🌱", questions: 3 },
      { id: "purpose", name: "Purpose", icon: "🎯", questions: 3 },
    ],
  },
  4: { name: "Hidden Self", questionCount: 2 },
};

// ============================================
// INTERPRETATION & SCORING
// ============================================

export function calculateV3TotalScore(answers: AssessmentV3Answers): number {
  return (
    (answers.wealth_freedom || 0) +
    (answers.health_vitality || 0) +
    (answers.relationships_depth || 0) +
    (answers.growth_aliveness || 0) +
    (answers.purpose_clarity || 0)
  );
}

export function getV3Interpretation(totalScore: number): Interpretation {
  if (totalScore >= 40) return "elite";
  if (totalScore >= 25) return "gap";
  return "critical";
}

export function getV3LowestPillar(
  answers: AssessmentV3Answers
): { pillar: PriorityPillar; score: number } | null {
  return getLowestPillarFromAnswers(answers)
    ? {
        pillar: getLowestPillarFromAnswers(answers)!,
        score: Math.min(
          answers.wealth_freedom || 10,
          answers.health_vitality || 10,
          answers.relationships_depth || 10,
          answers.growth_aliveness || 10,
          answers.purpose_clarity || 10
        ),
      }
    : null;
}

export function calculateV3LeadScore(answers: AssessmentV3Answers): number {
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
  const lowest = getV3LowestPillar(answers);
  const totalScore = calculateV3TotalScore(answers);
  let gapSeverity = 1;
  if (lowest && lowest.score <= 3) gapSeverity = 3;
  else if (totalScore <= 30) gapSeverity = 2;

  return revenueScore * readinessScore * gapSeverity;
}

// ============================================
// PATTERN REVEALS FOR EMAIL REPORT
// ============================================

export interface PatternReveal {
  pattern: string;
  insight: string;
  recommendation: string;
}

export function generatePatternReveals(answers: AssessmentV3Answers): PatternReveal[] {
  const patterns: PatternReveal[] = [];

  // Vision vs Reality pattern
  if (answers.vision_goal === "time_sovereignty" && answers.work_life_balance === "work_is_life") {
    patterns.push({
      pattern: "The Time Paradox",
      insight:
        "You dream of time freedom but work IS your life. This isn't laziness — it's identity. You've made productivity your worth.",
      recommendation:
        "Start by defining who you are when you're not working. That man needs to exist first.",
    });
  }

  if (
    answers.vision_goal === "deeper_relationships" &&
    answers.vulnerability_level === "never_vulnerable"
  ) {
    patterns.push({
      pattern: "The Intimacy Block",
      insight:
        "You want deeper relationships but never show vulnerability. You can't be deeply connected while wearing armor.",
      recommendation:
        "Depth requires risk. Start small — share one struggle with someone you trust this week.",
    });
  }

  // Motivation vs Behavior pattern
  if (
    answers.driving_motivation === "family_legacy" &&
    answers.presence_with_family === "physically_there"
  ) {
    patterns.push({
      pattern: "The Provider Trap",
      insight:
        "Your family is your 'why' — but you're not actually with them. You're building a future while missing the present.",
      recommendation:
        "Your kids don't need your money. They need your attention. One hour of presence beats a year of provision.",
    });
  }

  // Success definition vs current state
  if (
    answers.success_definition === "inner_fulfillment" &&
    answers.purpose_clarity &&
    answers.purpose_clarity <= 4
  ) {
    patterns.push({
      pattern: "The Fulfillment Gap",
      insight:
        "You defined success as inner fulfillment but scored low on purpose. You know what success ISN'T — you haven't found what it IS.",
      recommendation:
        "Stop chasing. Start asking: what would I do even if no one paid me? The answer is closer than you think.",
    });
  }

  // High achiever, low aliveness
  if (
    (answers.revenue_tier === "5m_10m" || answers.revenue_tier === "10m_plus") &&
    answers.growth_aliveness &&
    answers.growth_aliveness <= 4
  ) {
    patterns.push({
      pattern: "The Golden Cage",
      insight:
        "You've built something remarkable but feel dead inside. Success was supposed to feel better than this.",
      recommendation:
        "You don't need to burn it down. You need a new edge to climb. What challenge genuinely scares you?",
    });
  }

  // Energy-body disconnect
  if (answers.energy_pattern === "exhausted_always" && answers.body_connection === "disconnected") {
    patterns.push({
      pattern: "The Disconnection Loop",
      insight:
        "You're exhausted AND disconnected from your body. You've optimized so hard you've lost the foundation.",
      recommendation:
        "Your body isn't broken — it's been ignored. Start with 5 minutes of stillness. Just feel what's there.",
    });
  }

  // 2am thought alignment
  if (
    answers.two_am_thought === "performing_success" &&
    answers.success_definition === "number_in_bank"
  ) {
    patterns.push({
      pattern: "The Performance Trap",
      insight:
        "You measure success by numbers but lie awake feeling like a fraud. The scoreboard you're using isn't yours.",
      recommendation:
        "Write down YOUR definition of success. Not your father's. Not society's. Yours. Then measure against that.",
    });
  }

  if (answers.two_am_thought === "lost_identity" && answers.driving_motivation === "finding_self") {
    patterns.push({
      pattern: "The Identity Crisis",
      insight:
        "You're searching for yourself because you genuinely don't know who you are anymore. This isn't weakness — it's awakening.",
      recommendation:
        "The man you're looking for isn't lost. He's buried under layers of 'should.' Start peeling them back.",
    });
  }

  return patterns;
}

// ============================================
// CONTENT STRINGS
// ============================================

export const ASSESSMENT_V3_CONTENT = {
  title: "Five Pillar Assessment",
  subtitle: "23 questions. 12 minutes. The truth you've been avoiding.",
  instruction: "Answer honestly. This is between you and yourself.",
  sections: {
    1: {
      name: "The Dream",
      description: "Let's start with what you actually want.",
      icon: "✨",
    },
    2: {
      name: "The Reality",
      description: "Now, where are you really?",
      icon: "📍",
    },
    3: {
      name: "The Five Pillars",
      description: "Rate each area of your life with complete honesty.",
      icon: "🏛️",
    },
    4: {
      name: "The Hidden Self",
      description: "The truth that surfaces in the dark.",
      icon: "🌙",
    },
  },
  completionCTA: "Your score is waiting. So is the insight that explains it.",
  shareText:
    "I just took the Five Pillar Assessment. My score: {score}/50. The questions hit different. What's yours?",
};

// ============================================
// TWO AM THOUGHT INTERPRETATIONS (Kept from V2)
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
    insight:
      "Your 2am thought is yours alone. But the pattern is the same: the defended self cracks open in the dark, and truth seeps through.",
  },
};

// ============================================
// READINESS-BASED CTA MESSAGING (Updated for V3)
// ============================================

export const V3_READINESS_RESPONSES: Record<
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
      "That's honest. Most men start here. Curiosity is the crack in the armor. The fact that you completed this assessment means some part of you already knows. The training isn't a commitment. It's 90 minutes to understand the full picture.",
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
      "You want to see the path before you commit. Smart. That's exactly what the training provides: the complete methodology, laid out. You'll leave with the exact morning practice I've done for 500+ days straight. No obligation to buy anything. Just the map.",
    cta: "See the Path — Register Free",
    ctaVariant: "medium",
  },
  ready_to_invest: {
    label: "Ready to Invest",
    response:
      "You're not shopping for a solution. You're ready to move. The 45-Day Awakening Challenge starts soon. $997. Join men who are done waiting and ready to transform. The training will give you everything you need to know. But if you already know, reply to the email report — let's talk directly.",
    cta: "Register for Training (and Challenge Info)",
    ctaVariant: "strong",
  },
  desperate: {
    label: "Desperate",
    response:
      "Something has to give. You know it. The men who come to this work from desperation often see the fastest transformation — because they've stopped negotiating with themselves. The training is the first step. But if you need to move faster, reply to your email report. We should talk.",
    cta: "I Need This — Register Now",
    ctaVariant: "strong",
  },
};

// ============================================
// PILLAR INSIGHTS (Updated for V3)
// ============================================

export const V3_PRIORITY_INSIGHTS: Record<
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
// DISPLAY HELPERS
// ============================================

export const REVENUE_DISPLAY: Record<RevenueTier, string> = {
  under_250k: "sub-$250K",
  "250k_500k": "$250K-$500K",
  "500k_1m": "$500K-$1M",
  "1m_5m": "$1M-$5M",
  "5m_10m": "$5M-$10M",
  "10m_plus": "$10M+",
};

export const VISION_DISPLAY: Record<VisionGoal, string> = {
  financial_freedom: "Financial freedom",
  time_sovereignty: "Time sovereignty",
  deeper_relationships: "Deeper relationships",
  health_vitality: "Health and vitality",
  meaningful_impact: "Meaningful impact",
  inner_peace: "Inner peace",
};

export const MOTIVATION_DISPLAY: Record<DrivingMotivation, string> = {
  escaping_current: "Escaping your current situation",
  proving_something: "Proving something",
  family_legacy: "Family and legacy",
  personal_transformation: "Personal transformation",
  making_difference: "Making a difference",
  finding_self: "Finding yourself again",
};
