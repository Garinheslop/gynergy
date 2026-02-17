/**
 * Assessment Report Email
 *
 * Comprehensive personalized email report sent after completing
 * the Five Pillar Assessment. This is the full "mirror" experience.
 */

import type {
  AssessmentAnswers,
  RevenueTier,
  TwoAmThought,
  LastPresent,
  Sacrifice,
  MaskFrequency,
  BodyTension,
  Readiness,
  PriorityPillar,
  Interpretation,
} from "@modules/landing/data/assessment-v2-content";

import { sendEmail } from "./index";

// ============================================
// EMAIL TRACKING HELPERS
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gynergy.app";

function generateEmailId(): string {
  return `asr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createTrackedUrl(
  originalUrl: string,
  emailId: string,
  recipientEmail: string,
  linkName: string,
  emailType: string = "assessment_report"
): string {
  const encodedUrl = Buffer.from(originalUrl).toString("base64");
  const encodedEmail = Buffer.from(recipientEmail).toString("base64");

  return `${BASE_URL}/api/email/track?type=click&id=${emailId}&email=${encodedEmail}&url=${encodedUrl}&name=${linkName}&et=${emailType}`;
}

function createTrackingPixel(
  emailId: string,
  recipientEmail: string,
  emailType: string = "assessment_report"
): string {
  const encodedEmail = Buffer.from(recipientEmail).toString("base64");

  return `<img src="${BASE_URL}/api/email/track?type=open&id=${emailId}&email=${encodedEmail}&et=${emailType}" width="1" height="1" style="display:none;width:1px;height:1px;" alt="" />`;
}

// ============================================
// TYPES
// ============================================

export interface AssessmentReportData extends AssessmentAnswers {
  totalScore: number;
  interpretation: Interpretation;
  lowestPillar: { pillar: PriorityPillar; score: number } | null;
  leadScore: number;
  // V3 extra data for enhanced personalization
  v3_data?: {
    vision_goal?: string;
    driving_motivation?: string;
    success_definition?: string;
    wealth_relationship?: string;
    work_life_balance?: string;
    energy_pattern?: string;
    body_connection?: string;
    presence_with_family?: string;
    vulnerability_level?: string;
    challenge_level?: string;
    learning_mode?: string;
    legacy_clarity?: string;
    impact_feeling?: string;
    patternReveals?: Array<{
      pattern: string;
      insight: string;
      recommendation: string;
    }>;
  };
}

// ============================================
// DISPLAY MAPPINGS
// ============================================

const REVENUE_DISPLAY: Record<RevenueTier, string> = {
  under_250k: "sub-$250K",
  "250k_500k": "$250K-$500K",
  "500k_1m": "$500K-$1M",
  "1m_5m": "$1M-$5M",
  "5m_10m": "$5M-$10M",
  "10m_plus": "$10M+",
};

const TWO_AM_DISPLAY: Record<TwoAmThought, { thought: string; insight: string }> = {
  worth_it: {
    thought: "Was all this worth it?",
    insight:
      "You did everything right. Hit the targets. Built the thing. And now you're looking back wondering if the game was even worth winning. This question doesn't go away — it gets louder. The good news: you're finally ready to hear the answer.",
  },
  lost_identity: {
    thought: "I don't know who I am anymore outside of work",
    insight:
      "Your identity has merged with your function. When someone asks 'who are you?' you answer with what you do. The man underneath has been waiting a long time to be seen. The 45-Day Challenge is designed specifically to separate who you ARE from what you DO.",
  },
  family_better_off: {
    thought: "My family would be better off with my money than with me",
    insight:
      "This is the thought you'd never say out loud. But it's been there. The brutal math of 'at least they'd have the money.' This thought is a signal, not a truth. It's telling you that presence has been sacrificed for provision. That can change.",
  },
  terrified_slow_down: {
    thought: "I'm terrified of what happens when I slow down",
    insight:
      "The hustle isn't just ambition — it's escape. You've been running so long you've forgotten what you're running from. Slowing down feels like dying because you've made stillness the enemy. The training will show you that stillness is where the answers live.",
  },
  performing_success: {
    thought: "I'm performing a version of success I don't even want",
    insight:
      "Somewhere along the way, you adopted someone else's scoreboard. Parents, society, peers — you've been winning a game you never chose to play. The exhaustion isn't from the work. It's from the performance. It's time to define success on YOUR terms.",
  },
  other: {
    thought: "Something else",
    insight:
      "Your 2am thought is yours alone. But the pattern is the same: the defended self cracks open in the dark, and truth seeps through. Whatever yours is, the training will help you face it.",
  },
};

const LAST_PRESENT_DISPLAY: Record<
  LastPresent,
  { timeframe: string; hours: string; insight: string }
> = {
  last_week: {
    timeframe: "within the last week",
    hours: "less than 168 hours",
    insight:
      "You still have access to presence. The door isn't closed. But ask yourself: was it a moment you created, or one that happened to you? The practice we teach is about creating presence on demand.",
  },
  last_month: {
    timeframe: "within the last month",
    hours: "roughly 700 hours",
    insight:
      "700+ hours of life have passed since you felt fully here. That's 700 hours of existing without truly living. The clock is always running. The question is whether you'll keep spending hours, or start investing them.",
  },
  last_6_months: {
    timeframe: "within the last 6 months",
    hours: "roughly 4,000 hours",
    insight:
      "4,000 hours. That's six months of your one life spent on autopilot. You've been so busy building a future that you've missed the present. But here's the truth: the future arrives as the present. This is it. And you can start reclaiming it in 10 minutes a day.",
  },
  last_year: {
    timeframe: "within the last year",
    hours: "roughly 8,700 hours",
    insight:
      "8,700 hours of life — more than a full working year — since you felt genuinely present. This isn't a failure. It's a pattern. And patterns can be broken. The men in our program often feel presence return within the first week.",
  },
  cant_remember: {
    timeframe: "so long you can't remember",
    hours: "unknown — and that's the problem",
    insight:
      "When was the last time you were truly here? If you can't remember, that's not a memory problem. It's a presence problem. You've been missing your own life. But you're here now. And that matters.",
  },
};

const BODY_TENSION_DISPLAY: Record<
  BodyTension,
  { location: string; meaning: string; insight: string }
> = {
  jaw: {
    location: "jaw and teeth",
    meaning: "held words, unexpressed anger, control",
    insight:
      "You're clenching against things you want to say but don't. The words you're swallowing are taking up residence in your body. The Challenge includes practices specifically designed to release what's been held.",
  },
  neck_shoulders: {
    location: "neck and shoulders",
    meaning: "carried responsibility, weight of expectations",
    insight:
      "You're literally carrying the weight. Every responsibility, every person depending on you — your body is keeping score. Part of the work is learning to put the weight down, even for 10 minutes a day.",
  },
  chest: {
    location: "chest",
    meaning: "suppressed emotion, grief, love withheld",
    insight:
      "The heart protects itself by closing. The tightness you feel is emotions you've told yourself you don't have time for. The gratitude practice opens this gradually and safely.",
  },
  stomach: {
    location: "stomach",
    meaning: "anxiety, fear, gut instincts being ignored",
    insight:
      "Your gut has been trying to tell you something. The knot is what happens when you override your intuition too many times. We'll help you start listening again.",
  },
  lower_back: {
    location: "lower back",
    meaning: "foundation stress, support fatigue, feeling unsupported",
    insight:
      "You're the foundation everyone else stands on. But who supports the support? Your back is asking that question. The Brotherhood community becomes part of your support structure.",
  },
  relaxed: {
    location: "no specific tension",
    meaning: "present and integrated — or disconnected",
    insight:
      "Either you've done significant work on yourself, or you've gotten very good at not feeling. The assessment will reveal which.",
  },
  disconnected: {
    location: "disconnected from body",
    meaning: "dissociation, numbness, survival mode",
    insight:
      "This is common in high-achievers. You've optimized so hard you've lost connection to the body that carries you. This is where we start — reconnecting you to the physical vessel that holds your success.",
  },
};

const SACRIFICE_DISPLAY: Record<Sacrifice, string> = {
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

const MASK_DISPLAY: Record<MaskFrequency, { frequency: string; insight: string }> = {
  rarely: {
    frequency: "rarely",
    insight: "You've maintained authenticity despite the pressures. This is rare and valuable.",
  },
  sometimes_professional: {
    frequency: "sometimes, in professional settings",
    insight:
      "A professional persona is normal. The question is whether you can take it off when you get home.",
  },
  often: {
    frequency: "often, in most interactions",
    insight:
      "The mask has become the default. You're expending energy maintaining an image even when it's not required. That energy drain is real.",
  },
  almost_always: {
    frequency: "almost always, even with family",
    insight:
      "When the mask is worn at home, something is deeply misaligned. The people who should see you most clearly are getting the performance instead.",
  },
  lost_self: {
    frequency: "so long you're not sure where the mask ends",
    insight:
      "This is the most honest answer. You've worn the mask so long it's fused to your face. The work ahead is about rediscovering the man underneath.",
  },
};

const PRIORITY_INSIGHTS: Record<
  PriorityPillar,
  { validation: string; whyFirst: string; ripple: string }
> = {
  wealth: {
    validation: "You chose Wealth — not for more money, but for freedom.",
    whyFirst:
      "This isn't about your bank account. It's about the golden handcuffs. You've built something that was supposed to set you free but instead became a prison. Fixing this first means restructuring not what you earn, but how you relate to what you've built.",
    ripple:
      "When your wealth serves you instead of owning you, you'll have the space to be present in your relationships, the energy to invest in your health, and the foundation to find purpose beyond the number.",
  },
  health: {
    validation: "You chose Health — because you need energy for everything else.",
    whyFirst:
      "Everything runs on energy. Your relationships, your business, your ability to find meaning — all of it requires a body that shows up. You've been running on fumes, using willpower where you should have vitality.",
    ripple:
      "When your body becomes an ally instead of a burden, everything else accelerates. More energy means more presence. More presence means deeper connection. The body is the foundation the other four pillars stand on.",
  },
  relationships: {
    validation: "You chose Relationships — especially with the people closest to you.",
    whyFirst:
      "Success means nothing without someone to share it with. You've built an empire but lost connection with the people it was supposed to be for. The loneliest place in the world is a big house with people who used to know you.",
    ripple:
      "When the people who matter actually SEE you again, everything changes. Your health improves because you have reasons to take care of yourself. Your purpose clarifies because you're not building alone. Connection is the multiplier.",
  },
  growth: {
    validation: "You chose Growth — because you need to feel alive again.",
    whyFirst:
      "You've mastered the game you've been playing. And now you're bored, coasting, optimizing a life you've outgrown. The edge that made you successful has dulled. You need a new challenge that actually means something.",
    ripple:
      "When you're challenged again, everything wakes up. Energy returns because you have something worth getting up for. Relationships improve because you're interesting again. Purpose emerges from the growth itself.",
  },
  purpose: {
    validation: "You chose Purpose — because your success needs to mean something.",
    whyFirst:
      "You can feel the hollowness. The achievement that was supposed to fill you left you empty. You've been asking 'what's the point?' and the answer keeps coming up short. This is the existential crisis successful men don't talk about.",
    ripple:
      "When your success has meaning, the grind becomes a mission. Your relationships deepen because you're connected to something larger. Your health improves because you're not escaping — you're building. Purpose is the multiplier that changes everything.",
  },
};

const READINESS_RESPONSES: Record<Readiness, { response: string; cta: string }> = {
  just_curious: {
    response:
      "That's honest. Most men start here. Curiosity is the crack in the armor. The fact that you completed this assessment means some part of you already knows something needs to change.\n\nThe March 3rd training isn't a commitment. It's 90 minutes to understand the full picture. No obligation. Just clarity about what's possible.",
    cta: "Save Your Seat (No Obligation)",
  },
  scared_but_know: {
    response:
      "Fear is appropriate. You built everything you have by not admitting fear. But this is different. This fear is the doorway.\n\nEvery man who's transformed through this work felt exactly what you're feeling right now. The question isn't whether you're scared. It's whether you'll let the fear make your decision.\n\nThe training will give you the complete picture. Then you can decide from clarity instead of fear.",
    cta: "Face It — Save Your Seat",
  },
  ready_to_explore: {
    response:
      "You want to see the path before you commit. Smart. That's exactly what the March 3rd training provides: the complete methodology, laid out.\n\nYou'll leave with:\n• The exact morning practice I've done for 497 days straight\n• Your Five Pillar Score explained in detail\n• The roadmap for transformation\n\nNo obligation to buy anything. Just the map.",
    cta: "See the Path — Register Free",
  },
  ready_to_invest: {
    response:
      "You're not shopping for a solution. You're ready to move.\n\nThe 45-Day Awakening Challenge starts next month. $997. Join men who are done waiting and ready to transform. The training will give you everything you need to know.\n\nBut if you already know, reply to this email. Let's talk directly about getting you started.",
    cta: "Register for Training (and Challenge Info)",
  },
  desperate: {
    response:
      "Something has to give. You know it.\n\nThe men who come to this work from desperation often see the fastest transformation — because they've stopped negotiating with themselves.\n\nThe March 3rd training is the first step. But if you need to move faster, reply to this email right now. We should talk.",
    cta: "I Need This — Register Now",
  },
};

const INTERPRETATION_DISPLAY: Record<Interpretation, { headline: string; message: string }> = {
  elite: {
    headline: "You're in the top 8%.",
    message:
      "Most men never hit this. You've done significant work — or you're naturally more integrated than most. The training will show you how to go even deeper and potentially mentor others on this journey.",
  },
  gap: {
    headline: "You're in 'The Gap.'",
    message:
      "One or two pillars are silently sabotaging the others. Men who score here often guess wrong about which pillar is actually bleeding. The training will show you exactly where to focus first — and why your intuition might be misleading you.",
  },
  critical: {
    headline: "You need to be in that room.",
    message:
      "This isn't a suggestion — it's a necessity. Men who score below 25 typically have 3+ pillars in crisis. The good news: they also see the fastest transformation because the gap is so clear.\n\nSomething brought you here today. Don't ignore it.",
  },
};

// ============================================
// V3 ENHANCED DISPLAY MAPPINGS
// ============================================

const V3_VISION_DISPLAY: Record<string, { vision: string; reflection: string }> = {
  freedom: {
    vision: "True Freedom",
    reflection:
      "You didn't build success to stay trapped. The golden handcuffs are real — and recognizing them is the first step to unlocking them.",
  },
  presence: {
    vision: "Being Present",
    reflection:
      "You've sacrificed presence for provision. The irony: you built everything for your family while becoming a stranger to them.",
  },
  health: {
    vision: "Reclaiming Your Body",
    reflection:
      "Your body has been the casualty of your ambition. You know the cost is compounding. The body you have at 50 is built by the decisions you make now.",
  },
  meaning: {
    vision: "Finding Meaning",
    reflection:
      "The success was supposed to mean something. It doesn't. Not yet. But that emptiness is a signal — it's pointing you somewhere.",
  },
  legacy: {
    vision: "Building a Legacy",
    reflection:
      "What will they say about you? Not the LinkedIn version. The real one. Legacy is built in daily presence, not in achievements.",
  },
};

const V3_MOTIVATION_DISPLAY: Record<string, { motivation: string; truth: string }> = {
  fear_missing: {
    motivation: "Fear of missing out on life",
    truth:
      "You're already missing it. That's not judgment — it's the truth you told us. The question is: how many more years will you let slip by?",
  },
  health_wake_up: {
    motivation: "A health scare or warning sign",
    truth:
      "Your body sent you a message. Most men ignore it until it's too late. You're listening. That matters.",
  },
  relationship_crisis: {
    motivation: "A relationship reaching a breaking point",
    truth:
      "Someone who matters is about to give up on you. Or already has. The work you do now determines what happens next.",
  },
  emptiness: {
    motivation: "Success feeling hollow",
    truth:
      "You won the game and found out the trophy was empty. This is the most common starting point for transformation — because you can't outrun it anymore.",
  },
  something_more: {
    motivation: "Knowing there must be something more",
    truth:
      "There is. The man you're becoming is waiting on the other side of this work. You've always known it.",
  },
};

// ============================================
// EMAIL GENERATION
// ============================================

export async function sendAssessmentReportEmail(
  data: AssessmentReportData
): Promise<{ success: boolean; error?: string }> {
  const firstName = data.first_name || "there";
  const email = data.email;

  if (!email) {
    return { success: false, error: "No email provided" };
  }

  // Generate unique email ID for tracking
  const emailId = generateEmailId();

  const html = generateAssessmentReportHtml(data, firstName, email, emailId);
  const text = generateAssessmentReportText(data, firstName);

  const subject =
    data.interpretation === "critical"
      ? `${firstName}, Your Five Pillar Score: ${data.totalScore}/50 — Here's What It Means`
      : `Your Five Pillar Assessment Results: ${data.totalScore}/50`;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
    replyTo: "garin@gynergy.app",
  });
}

// ============================================
// HTML TEMPLATE
// ============================================

function generateAssessmentReportHtml(
  data: AssessmentReportData,
  firstName: string,
  recipientEmail: string,
  emailId: string
): string {
  const {
    totalScore,
    interpretation,
    external_rating,
    two_am_thought,
    last_present,
    sacrifices,
    mask_frequency,
    body_tension,
    wealth_score,
    health_score,
    relationships_score,
    growth_score,
    purpose_score,
    readiness,
    priority_pillar,
    lowestPillar,
    revenue_tier,
    v3_data,
  } = data;

  // Create tracked webinar URL
  const webinarUrl = createTrackedUrl(
    "https://gynergy.app/webinar",
    emailId,
    recipientEmail,
    "webinar_cta"
  );

  // V3 Enhanced Sections
  const isV3 = Boolean(v3_data);
  const patternReveals = v3_data?.patternReveals || [];
  const visionGoal = v3_data?.vision_goal;
  const drivingMotivation = v3_data?.driving_motivation;

  // Build sections
  const contrastSection =
    external_rating && external_rating >= 7 && totalScore < 35
      ? `
    <div style="background: #1a1a1a; border-left: 3px solid #b8943e; padding: 20px; margin: 20px 0;">
      <p style="color: #ffffff; margin: 0; font-size: 16px; line-height: 1.6;">
        A stranger would rate your life <span style="color: #b8943e; font-weight: bold;">${external_rating}/10</span>.<br>
        But you know the truth is <span style="color: #b8943e; font-weight: bold;">${totalScore}/50</span>.<br>
        <em style="color: #888;">That gap is what we fix.</em>
      </p>
    </div>
  `
      : "";

  const twoAmSection =
    two_am_thought && two_am_thought !== "other"
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        At 2am, you've been asking yourself:
      </p>
      <p style="color: #ffffff; font-size: 20px; font-style: italic; margin: 0 0 16px 0;">
        "${TWO_AM_DISPLAY[two_am_thought].thought}"
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${TWO_AM_DISPLAY[two_am_thought].insight}
      </p>
    </div>
  `
      : "";

  const presenceSection =
    last_present && last_present !== "last_week"
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Time Since You Felt Present
      </p>
      <p style="color: #b8943e; font-size: 28px; font-weight: bold; margin: 0 0 12px 0;">
        ${LAST_PRESENT_DISPLAY[last_present].hours}
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${LAST_PRESENT_DISPLAY[last_present].insight}
      </p>
    </div>
  `
      : "";

  const sacrificesSection =
    sacrifices && sacrifices.length > 0
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        The Hidden Invoice of Your Success
      </p>
      <ul style="color: #ffffff; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
        ${sacrifices.map((s) => `<li>${SACRIFICE_DISPLAY[s as Sacrifice]}</li>`).join("")}
      </ul>
      <p style="color: #888; font-size: 14px; font-style: italic; margin: 16px 0 0 0;">
        These aren't failures. They're the costs of optimization without integration.
      </p>
    </div>
  `
      : "";

  const bodySection =
    body_tension && body_tension !== "relaxed"
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Your Body Has Been Keeping Score
      </p>
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0;">
        Tension in your <span style="color: #b8943e;">${BODY_TENSION_DISPLAY[body_tension].location}</span>:
        <span style="color: #b8943e;">${BODY_TENSION_DISPLAY[body_tension].meaning}</span>
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${BODY_TENSION_DISPLAY[body_tension].insight}
      </p>
    </div>
  `
      : "";

  const maskSection =
    mask_frequency && mask_frequency !== "rarely"
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        The Mask
      </p>
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0;">
        You said you're performing rather than being yourself <span style="color: #b8943e;">${MASK_DISPLAY[mask_frequency].frequency}</span>.
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${MASK_DISPLAY[mask_frequency].insight}
      </p>
    </div>
  `
      : "";

  const pillarColor = (score: number | undefined) => {
    if (!score) return "#666";
    if (score >= 7) return "#b8943e";
    if (score >= 4) return "#b8943e99";
    return "#dc3545";
  };

  const prioritySection = priority_pillar
    ? `
    <div style="background: linear-gradient(135deg, #2a2a0a 0%, #1a1a0a 100%); border: 1px solid #b8943e44; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Your Leverage Point
      </p>
      <p style="color: #b8943e; font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">
        ${PRIORITY_INSIGHTS[priority_pillar].validation}
      </p>
      <p style="color: #ffffff; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
        ${PRIORITY_INSIGHTS[priority_pillar].whyFirst}
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; font-style: italic; margin: 0;">
        ${PRIORITY_INSIGHTS[priority_pillar].ripple}
      </p>
    </div>
  `
    : "";

  const readinessSection = readiness
    ? `
    <div style="background: #1a1a1a; border: 1px solid #b8943e; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #ffffff; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; white-space: pre-line;">
        ${READINESS_RESPONSES[readiness].response}
      </p>
      <div style="text-align: center;">
        <a href="${webinarUrl}" style="display: inline-block; background: linear-gradient(90deg, #b8943e, #d4a843); color: #0a0a0a; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 4px;">
          ${READINESS_RESPONSES[readiness].cta}
        </a>
      </div>
    </div>
  `
    : "";

  // V3: Vision & Motivation Section
  const visionSection =
    visionGoal && V3_VISION_DISPLAY[visionGoal]
      ? `
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border: 1px solid #b8943e44; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        What You're Really After
      </p>
      <p style="color: #b8943e; font-size: 22px; font-weight: bold; margin: 0 0 12px 0;">
        ${V3_VISION_DISPLAY[visionGoal].vision}
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${V3_VISION_DISPLAY[visionGoal].reflection}
      </p>
    </div>
  `
      : "";

  const motivationSection =
    drivingMotivation && V3_MOTIVATION_DISPLAY[drivingMotivation]
      ? `
    <div style="background: #1a1a1a; padding: 24px; margin: 24px 0; border-radius: 4px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        What Brought You Here
      </p>
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 12px 0;">
        ${V3_MOTIVATION_DISPLAY[drivingMotivation].motivation}
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${V3_MOTIVATION_DISPLAY[drivingMotivation].truth}
      </p>
    </div>
  `
      : "";

  // V3: Pattern Reveals Section (the "how did they know?" moments)
  const patternRevealsSection =
    patternReveals.length > 0
      ? `
    <div style="margin: 40px 0;">
      <h2 style="color: #b8943e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 10px; margin: 0 0 20px 0;">
        ✦ What We See In Your Answers
      </h2>
      <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; font-style: italic;">
        Your answers revealed patterns. Here's what they mean.
      </p>
      ${patternReveals
        .map(
          (reveal) => `
        <div style="background: linear-gradient(135deg, #1a1a0a 0%, #0f0f0a 100%); border-left: 3px solid #b8943e; padding: 20px; margin: 16px 0; border-radius: 0 4px 4px 0;">
          <p style="color: #b8943e; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">
            ${reveal.pattern}
          </p>
          <p style="color: #ffffff; font-size: 15px; line-height: 1.7; margin: 0 0 12px 0;">
            ${reveal.insight}
          </p>
          <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6; margin: 0; padding-top: 8px; border-top: 1px solid #333;">
            <span style="color: #b8943e;">→</span> ${reveal.recommendation}
          </p>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : "";

  // Check if V3 to customize closing
  const isV3Assessment = isV3 && patternReveals.length > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Five Pillar Assessment Results</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; color: #ffffff;">
  <div style="max-width: 640px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <p style="font-size: 14px; letter-spacing: 0.5em; color: #b8943e; margin: 0 0 10px 0;">G Y N E R G Y</p>
      <p style="font-size: 24px; color: #b8943e44; margin: 0;">&infin;</p>
    </div>

    <!-- Score -->
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
        Your Five Pillar Score
      </p>
      <p style="font-size: 72px; font-weight: bold; color: #b8943e; margin: 0; line-height: 1;">
        ${totalScore}<span style="font-size: 32px; color: #ffffff44;">/50</span>
      </p>
    </div>

    <!-- Interpretation -->
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid ${
      interpretation === "critical" ? "#dc354566" : "#b8943e44"
    }; padding: 24px; margin: 24px 0; border-radius: 4px; text-align: center;">
      <p style="color: #b8943e; font-size: 24px; font-weight: bold; margin: 0 0 12px 0;">
        ${INTERPRETATION_DISPLAY[interpretation].headline}
      </p>
      <p style="color: #ffffff; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-line;">
        ${INTERPRETATION_DISPLAY[interpretation].message}
      </p>
    </div>

    <!-- The Mirror Section -->
    <div style="margin: 40px 0;">
      <h2 style="color: #b8943e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 10px; margin: 0 0 20px 0;">
        The Mirror
      </h2>

      <p style="color: #ffffff; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        ${firstName},
      </p>

      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You took the Five Pillar Assessment. Here's what you told us — and what it means.
      </p>

      ${
        revenue_tier
          ? `
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You've built a <span style="color: #b8943e; font-weight: bold;">${REVENUE_DISPLAY[revenue_tier]}</span> business.
        By every external metric, you're winning.
      </p>
      `
          : ""
      }

      ${contrastSection}
    </div>

    <!-- V3: Vision & Motivation -->
    ${visionSection}
    ${motivationSection}

    <!-- Insights -->
    ${twoAmSection}
    ${presenceSection}
    ${sacrificesSection}
    ${bodySection}
    ${maskSection}

    <!-- V3: Pattern Reveals -->
    ${patternRevealsSection}

    <!-- Pillar Breakdown -->
    <div style="margin: 40px 0;">
      <h2 style="color: #b8943e; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #333; padding-bottom: 10px; margin: 0 0 20px 0;">
        The Multiplier Equation
      </h2>

      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: ${pillarColor(wealth_score)};">${wealth_score || "?"}</span>
        <span style="color: #666; margin: 0 8px;">×</span>
        <span style="font-size: 24px; font-weight: bold; color: ${pillarColor(health_score)};">${health_score || "?"}</span>
        <span style="color: #666; margin: 0 8px;">×</span>
        <span style="font-size: 24px; font-weight: bold; color: ${pillarColor(relationships_score)};">${relationships_score || "?"}</span>
        <span style="color: #666; margin: 0 8px;">×</span>
        <span style="font-size: 24px; font-weight: bold; color: ${pillarColor(growth_score)};">${growth_score || "?"}</span>
        <span style="color: #666; margin: 0 8px;">×</span>
        <span style="font-size: 24px; font-weight: bold; color: ${pillarColor(purpose_score)};">${purpose_score || "?"}</span>
        <span style="color: #666; margin: 0 16px;">=</span>
        <span style="font-size: 24px; font-weight: bold; color: ${
          interpretation === "critical"
            ? "#dc3545"
            : interpretation === "gap"
              ? "#b8943e99"
              : "#b8943e"
        };">
          ${interpretation === "critical" ? "Fractured" : interpretation === "gap" ? "Divided" : "Multiplied"}
        </span>
      </div>

      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: ${lowestPillar?.pillar === "wealth" && (lowestPillar?.score || 0) <= 5 ? "#dc3545" : "#a0a0a0"};">Wealth${lowestPillar?.pillar === "wealth" && (lowestPillar?.score || 0) <= 5 ? " ←" : ""}</td>
          <td style="padding: 8px 0;">
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${pillarColor(wealth_score)}; height: 100%; width: ${(wealth_score || 0) * 10}%;"></div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${pillarColor(wealth_score)}; font-weight: bold; width: 40px;">${wealth_score || "?"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${lowestPillar?.pillar === "health" && (lowestPillar?.score || 0) <= 5 ? "#dc3545" : "#a0a0a0"};">Health${lowestPillar?.pillar === "health" && (lowestPillar?.score || 0) <= 5 ? " ←" : ""}</td>
          <td style="padding: 8px 0;">
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${pillarColor(health_score)}; height: 100%; width: ${(health_score || 0) * 10}%;"></div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${pillarColor(health_score)}; font-weight: bold; width: 40px;">${health_score || "?"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${lowestPillar?.pillar === "relationships" && (lowestPillar?.score || 0) <= 5 ? "#dc3545" : "#a0a0a0"};">Relationships${lowestPillar?.pillar === "relationships" && (lowestPillar?.score || 0) <= 5 ? " ←" : ""}</td>
          <td style="padding: 8px 0;">
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${pillarColor(relationships_score)}; height: 100%; width: ${(relationships_score || 0) * 10}%;"></div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${pillarColor(relationships_score)}; font-weight: bold; width: 40px;">${relationships_score || "?"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${lowestPillar?.pillar === "growth" && (lowestPillar?.score || 0) <= 5 ? "#dc3545" : "#a0a0a0"};">Growth${lowestPillar?.pillar === "growth" && (lowestPillar?.score || 0) <= 5 ? " ←" : ""}</td>
          <td style="padding: 8px 0;">
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${pillarColor(growth_score)}; height: 100%; width: ${(growth_score || 0) * 10}%;"></div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${pillarColor(growth_score)}; font-weight: bold; width: 40px;">${growth_score || "?"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${lowestPillar?.pillar === "purpose" && (lowestPillar?.score || 0) <= 5 ? "#dc3545" : "#a0a0a0"};">Purpose${lowestPillar?.pillar === "purpose" && (lowestPillar?.score || 0) <= 5 ? " ←" : ""}</td>
          <td style="padding: 8px 0;">
            <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${pillarColor(purpose_score)}; height: 100%; width: ${(purpose_score || 0) * 10}%;"></div>
            </div>
          </td>
          <td style="padding: 8px 0; text-align: right; color: ${pillarColor(purpose_score)}; font-weight: bold; width: 40px;">${purpose_score || "?"}</td>
        </tr>
      </table>

      ${
        lowestPillar && (lowestPillar.score || 0) <= 5
          ? `
      <p style="color: #dc3545; font-size: 14px; text-align: center; margin: 16px 0;">
        That ${lowestPillar.score} in ${lowestPillar.pillar.charAt(0).toUpperCase() + lowestPillar.pillar.slice(1)} isn't just a weakness — it's dividing everything else.
      </p>
      `
          : ""
      }
    </div>

    <!-- Priority Section -->
    ${prioritySection}

    <!-- Readiness CTA -->
    ${readinessSection}

    <!-- Closing -->
    <div style="margin: 40px 0; text-align: center;">
      <div style="height: 1px; background: #333; margin: 30px 0;"></div>

      <p style="color: #ffffff; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        ${firstName},
      </p>

      ${
        isV3Assessment
          ? `
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You answered 23 questions. But you revealed much more than that.
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        The patterns above aren't guesses — they're reflections of what you told us, connected in ways you might not have seen.
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Your score — <span style="color: #b8943e;">${totalScore}/50</span> — is the starting point. The patterns are the roadmap.
      </p>
      `
          : `
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Most assessments tell you what you already know. I designed this one to show you what you've been avoiding.
      </p>
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Your score — <span style="color: #b8943e;">${totalScore}/50</span> — isn't a judgment. It's a starting point.
      </p>
      `
      }

      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.8; margin: 0 0 30px 0;">
        You built an empire that looks like freedom but feels like a prison.<br>
        <strong style="color: #ffffff;">It doesn't have to stay that way.</strong>
      </p>

      <a href="${webinarUrl}" style="display: inline-block; background: linear-gradient(90deg, #b8943e, #d4a843); color: #0a0a0a; padding: 16px 40px; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 4px;">
        Save Your Seat — March 3rd Training
      </a>

      <p style="color: #b8943e; font-size: 16px; margin: 30px 0 0 0;">
        — Garin
      </p>
    </div>

    ${
      body_tension && body_tension !== "relaxed" && body_tension !== "disconnected"
        ? `
    <!-- P.S. -->
    <div style="margin: 30px 0; padding: 20px; background: #111; border-radius: 4px;">
      <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0;">
        <strong style="color: #a0a0a0;">P.S.</strong> You said your body holds tension in your ${BODY_TENSION_DISPLAY[body_tension].location}.
        Before the training, try this: three times today, put your hand on that spot and take 5 slow breaths.
        Notice what happens. That's where we start.
      </p>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #222;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
        The Gynergy Effect | Transforming Lives Through Integration
      </p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        Questions? Reply directly to this email — I read every one.
      </p>
    </div>

    <!-- Email Open Tracking Pixel -->
    ${createTrackingPixel(emailId, recipientEmail)}

  </div>
</body>
</html>
`;
}

// ============================================
// TEXT VERSION
// ============================================

function generateAssessmentReportText(data: AssessmentReportData, firstName: string): string {
  const {
    totalScore,
    interpretation,
    two_am_thought,
    last_present,
    sacrifices,
    body_tension,
    wealth_score,
    health_score,
    relationships_score,
    growth_score,
    purpose_score,
    readiness,
    priority_pillar,
    lowestPillar,
    v3_data,
  } = data;

  const patternReveals = v3_data?.patternReveals || [];
  const visionGoal = v3_data?.vision_goal;
  const drivingMotivation = v3_data?.driving_motivation;

  let text = `
GYNERGY
Five Pillar Assessment Results

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR SCORE: ${totalScore}/50

${INTERPRETATION_DISPLAY[interpretation].headline}
${INTERPRETATION_DISPLAY[interpretation].message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE MIRROR

${firstName},

You took the Five Pillar Assessment. Here's what you told us — and what it means.
`;

  // V3: Vision Section
  if (visionGoal && V3_VISION_DISPLAY[visionGoal]) {
    text += `
WHAT YOU'RE REALLY AFTER:
${V3_VISION_DISPLAY[visionGoal].vision}

${V3_VISION_DISPLAY[visionGoal].reflection}
`;
  }

  // V3: Motivation Section
  if (drivingMotivation && V3_MOTIVATION_DISPLAY[drivingMotivation]) {
    text += `
WHAT BROUGHT YOU HERE:
${V3_MOTIVATION_DISPLAY[drivingMotivation].motivation}

${V3_MOTIVATION_DISPLAY[drivingMotivation].truth}
`;
  }

  if (two_am_thought && two_am_thought !== "other") {
    text += `
AT 2AM, YOU'VE BEEN ASKING YOURSELF:
"${TWO_AM_DISPLAY[two_am_thought].thought}"

${TWO_AM_DISPLAY[two_am_thought].insight}
`;
  }

  if (last_present && last_present !== "last_week") {
    text += `
TIME SINCE YOU FELT PRESENT:
${LAST_PRESENT_DISPLAY[last_present].hours}

${LAST_PRESENT_DISPLAY[last_present].insight}
`;
  }

  if (sacrifices && sacrifices.length > 0) {
    text += `
THE HIDDEN INVOICE OF YOUR SUCCESS:
${sacrifices.map((s) => `• ${SACRIFICE_DISPLAY[s as Sacrifice]}`).join("\n")}
`;
  }

  if (body_tension && body_tension !== "relaxed") {
    text += `
YOUR BODY HAS BEEN KEEPING SCORE:
Tension in your ${BODY_TENSION_DISPLAY[body_tension].location}: ${BODY_TENSION_DISPLAY[body_tension].meaning}

${BODY_TENSION_DISPLAY[body_tension].insight}
`;
  }

  // V3: Pattern Reveals Section
  if (patternReveals.length > 0) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✦ WHAT WE SEE IN YOUR ANSWERS

Your answers revealed patterns. Here's what they mean.

`;
    patternReveals.forEach((reveal) => {
      text += `▸ ${reveal.pattern}
${reveal.insight}

→ ${reveal.recommendation}

`;
    });
  }

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE MULTIPLIER EQUATION

${wealth_score || "?"} × ${health_score || "?"} × ${relationships_score || "?"} × ${growth_score || "?"} × ${purpose_score || "?"} = ${interpretation === "critical" ? "Fractured" : interpretation === "gap" ? "Divided" : "Multiplied"}

Wealth:        ${"█".repeat(wealth_score || 0)}${"░".repeat(10 - (wealth_score || 0))} ${wealth_score || "?"}/10
Health:        ${"█".repeat(health_score || 0)}${"░".repeat(10 - (health_score || 0))} ${health_score || "?"}/10
Relationships: ${"█".repeat(relationships_score || 0)}${"░".repeat(10 - (relationships_score || 0))} ${relationships_score || "?"}/10
Growth:        ${"█".repeat(growth_score || 0)}${"░".repeat(10 - (growth_score || 0))} ${growth_score || "?"}/10
Purpose:       ${"█".repeat(purpose_score || 0)}${"░".repeat(10 - (purpose_score || 0))} ${purpose_score || "?"}/10
`;

  if (lowestPillar && (lowestPillar.score || 0) <= 5) {
    text += `
↑ That ${lowestPillar.score} in ${lowestPillar.pillar} isn't just a weakness — it's dividing everything else.
`;
  }

  if (priority_pillar) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR LEVERAGE POINT

${PRIORITY_INSIGHTS[priority_pillar].validation}

${PRIORITY_INSIGHTS[priority_pillar].whyFirst}

${PRIORITY_INSIGHTS[priority_pillar].ripple}
`;
  }

  if (readiness) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT'S NEXT

${READINESS_RESPONSES[readiness].response}

→ Register for the March 3rd Training: https://gynergy.app/webinar
`;
  }

  text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${firstName},

Most assessments tell you what you already know.
I designed this one to show you what you've been avoiding.

Your score — ${totalScore}/50 — isn't a judgment. It's a starting point.

You built an empire that looks like freedom but feels like a prison.
It doesn't have to stay that way.

— Garin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Reply directly to this email — I read every one.

The Gynergy Effect | https://gynergy.app
`;

  return text.trim();
}
