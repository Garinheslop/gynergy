/**
 * Drip Campaign Email Templates
 *
 * HTML + text templates for each drip email, keyed by template_key.
 * Reuses the base email wrapper from the main email service.
 */

// ============================================================================
// Base Styles & Wrapper (shared with main email service)
// ============================================================================

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4e; }
  .logo { text-align: center; margin-bottom: 30px; }
  .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h1 { color: #ffffff; font-size: 24px; margin: 0 0 16px 0; }
  h2 { color: #7dd3c0; font-size: 20px; margin: 0 0 12px 0; }
  p { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .highlight { color: #7dd3c0; }
  .button { display: inline-block; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
  .divider { height: 1px; background: #2a2a4e; margin: 30px 0; }
  .footer { text-align: center; margin-top: 30px; }
  .footer p { color: #666; font-size: 12px; }
  .quote-box { background: #0a0a0a; border-left: 3px solid #7dd3c0; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .quote-box p { color: #c0c0c0; font-style: italic; margin: 0; }
  .stat-box { background: #0a0a0a; border: 1px solid #2a2a4e; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0; }
  .stat-value { font-size: 36px; font-weight: bold; color: #7dd3c0; }
  .stat-label { font-size: 14px; color: #888; margin-top: 4px; }
`;

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">GYNERGY</span>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>The Gynergy Effect | Transforming Lives Through Gratitude</p>
      <p>Questions? Reply to this email or contact support@gynergy.app</p>
    </div>
  </div>
</body>
</html>`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gynergy.app";

// ============================================================================
// Template Registry
// ============================================================================

export interface DripTemplateData {
  html: string;
  text: string;
  subject: string;
}

type TemplateRenderer = (metadata: Record<string, any>) => DripTemplateData;

const templates: Record<string, TemplateRenderer> = {
  // ============================
  // WEBINAR REGISTRATION DRIP
  // ============================

  webinar_pre_assignment: (meta) => ({
    subject: "Your pre-webinar assignment",
    html: emailWrapper(`
      <h1>Before the Webinar, Do This One Thing</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>You're registered for <span class="highlight">${meta.webinar_title || "our upcoming webinar"}</span>. That puts you ahead of 90% of men who just "think about" making a change.</p>
      <p>But to get the most out of it, I need you to do one thing first:</p>
      <div class="quote-box">
        <p>Take the Five Pillar Assessment. It's 2 minutes and it will show you exactly where you stand across the 5 areas that matter most.</p>
      </div>
      <p>When you show up to the webinar knowing your scores, everything I share will hit differently — because you'll see exactly how it applies to <em>your</em> life.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/assessment" class="button">Take the Assessment</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Before the Webinar, Do This One Thing

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

You're registered for ${meta.webinar_title || "our upcoming webinar"}. That puts you ahead of 90% of men who just "think about" making a change.

But to get the most out of it, I need you to do one thing first:

Take the Five Pillar Assessment. It's 2 minutes and it will show you exactly where you stand across the 5 areas that matter most.

Take the Assessment: ${APP_URL}/assessment

When you show up to the webinar knowing your scores, everything I share will hit differently.

— Garin`,
  }),

  webinar_objection_handling: (meta) => ({
    subject: "The #1 reason men don't show up",
    html: emailWrapper(`
      <h1>The #1 Reason Men Don't Show Up</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>Want to know the biggest reason men register for something like this and then don't show up?</p>
      <p><strong style="color: #fff;">"I already know what I need to do."</strong></p>
      <p>That's the lie that keeps men stuck for years. Knowing and doing are different planets.</p>
      <p>The men in our community who've transformed their lives — their relationships, their health, their purpose — didn't just "know" what to do. They showed up, got accountable, and did the work.</p>
      <div class="quote-box">
        <p>"I thought I had it figured out. After one week in Gynergy, I realized I'd been lying to myself for years." — David, Challenge Graduate</p>
      </div>
      <p>Your spot is saved for <span class="highlight">${meta.webinar_title || "the webinar"}</span>. Don't let the lie win.</p>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `The #1 Reason Men Don't Show Up

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

Want to know the biggest reason men register for something like this and then don't show up?

"I already know what I need to do."

That's the lie that keeps men stuck for years. Knowing and doing are different planets.

The men in our community who've transformed their lives didn't just "know" what to do. They showed up, got accountable, and did the work.

"I thought I had it figured out. After one week in Gynergy, I realized I'd been lying to myself for years." — David, Challenge Graduate

Your spot is saved for ${meta.webinar_title || "the webinar"}. Don't let the lie win.

— Garin`,
  }),

  webinar_final_reminder: (meta) => ({
    subject: `Quick reminder: ${meta.webinar_title || "The webinar"} is coming up`,
    html: emailWrapper(`
      <h1>Almost Time</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>Just a heads up — <span class="highlight">${meta.webinar_title || "the webinar"}</span> is coming up soon.</p>
      <p>Here's what to expect:</p>
      <p>1. The biggest mistake men make when trying to "improve themselves"</p>
      <p>2. The 5 Pillars framework that's transformed 500+ men</p>
      <p>3. A live Q&A where you can ask anything</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/webinar" class="button">Join the Webinar</a>
      </div>
      <p>See you there.</p>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin & Yesi</p>
    `),
    text: `Almost Time

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

Just a heads up — ${meta.webinar_title || "the webinar"} is coming up soon.

Here's what to expect:
1. The biggest mistake men make when trying to "improve themselves"
2. The 5 Pillars framework that's transformed 500+ men
3. A live Q&A where you can ask anything

Join the Webinar: ${APP_URL}/webinar

See you there.

— Garin & Yesi`,
  }),

  // ============================
  // ASSESSMENT DRIP
  // ============================

  assessment_pain_point: (meta) => {
    const lowestPillar = meta.lowest_pillar || "one area";
    const score = meta.score || "your";

    return {
      subject: `Your ${lowestPillar} score is holding you back`,
      html: emailWrapper(`
        <h1>Let's Talk About Your ${capitalize(lowestPillar)} Score</h1>
        <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
        <p>When you took the Five Pillar Assessment, your overall score was <span class="highlight">${score}/50</span>.</p>
        <p>But here's what stood out: your <span class="highlight">${lowestPillar}</span> pillar is where the biggest opportunity lives.</p>
        <p>Here's what I've seen with hundreds of men: when that one low pillar comes up, everything else follows. It's like removing a bottleneck — suddenly progress accelerates everywhere.</p>
        <div class="quote-box">
          <p>The 45-Day Awakening Challenge is specifically designed to address each pillar systematically. Day by day. With accountability.</p>
        </div>
        <div style="text-align: center;">
          <a href="${APP_URL}/pricing" class="button">See the Challenge</a>
        </div>
        <div class="divider"></div>
        <p style="color: #7dd3c0;">— Garin</p>
      `),
      text: `Let's Talk About Your ${capitalize(lowestPillar)} Score

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

When you took the Five Pillar Assessment, your overall score was ${score}/50.

But here's what stood out: your ${lowestPillar} pillar is where the biggest opportunity lives.

Here's what I've seen with hundreds of men: when that one low pillar comes up, everything else follows. It's like removing a bottleneck.

The 45-Day Awakening Challenge is specifically designed to address each pillar systematically.

See the Challenge: ${APP_URL}/pricing

— Garin`,
    };
  },

  assessment_social_proof: (meta) => {
    const score = meta.score || "a similar";

    return {
      subject: `What men who scored ${score} did next`,
      html: emailWrapper(`
        <h1>What Happened After They Scored ${score}</h1>
        <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
        <p>You scored <span class="highlight">${score}/50</span> on the Five Pillar Assessment. Here's what other men in that range did next:</p>
        <p><strong style="color: #fff;">Some waited.</strong> They told themselves they'd "get to it later." Most of them are still waiting.</p>
        <p><strong style="color: #fff;">Others acted.</strong> They joined the 45-Day Awakening Challenge within a week of taking the assessment.</p>
        <p>Here's what happened to the men who acted:</p>
        <div class="stat-box">
          <div class="stat-value">87%</div>
          <div class="stat-label">reported meaningful improvement in their lowest pillar within 21 days</div>
        </div>
        <p>The difference wasn't talent. It wasn't privilege. It was simply deciding that "someday" is today.</p>
        <div style="text-align: center;">
          <a href="${APP_URL}/pricing" class="button">Start the Challenge</a>
        </div>
        <div class="divider"></div>
        <p style="color: #7dd3c0;">— Garin</p>
      `),
      text: `What Happened After They Scored ${score}

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

You scored ${score}/50 on the Five Pillar Assessment. Here's what other men in that range did next:

Some waited. They told themselves they'd "get to it later." Most of them are still waiting.

Others acted. They joined the 45-Day Awakening Challenge within a week.

87% reported meaningful improvement in their lowest pillar within 21 days.

The difference wasn't talent. It was simply deciding that "someday" is today.

Start the Challenge: ${APP_URL}/pricing

— Garin`,
    };
  },

  // ============================
  // PURCHASE DRIP
  // ============================

  purchase_day_zero_guide: (meta) => ({
    subject: "Day 0: How to get the most out of this",
    html: emailWrapper(`
      <h1>Welcome to Day 0, ${meta.firstName || "Champion"}</h1>
      <p>You made the decision. Now let's make sure it counts.</p>
      <p>Before Day 1 officially starts, here are the <span class="highlight">3 things</span> that separate men who transform from men who quit:</p>
      <h2>1. Set Your Morning Alarm</h2>
      <p>The morning journal takes 5-7 minutes. Do it before the world gets loud. Set an alarm 10 minutes earlier than usual.</p>
      <h2>2. Tell Someone</h2>
      <p>Text one person: "I just started a 45-day challenge." Accountability is the secret weapon.</p>
      <h2>3. Read the Date Zero Page</h2>
      <p>It sets the foundation for everything that follows.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Open Date Zero</a>
      </div>
      <div class="divider"></div>
      <p>Remember: You don't need to be perfect. You need to be consistent.</p>
      <p style="color: #7dd3c0;">— Garin & Yesi</p>
    `),
    text: `Welcome to Day 0, ${meta.firstName || "Champion"}

You made the decision. Now let's make sure it counts.

Before Day 1 officially starts, here are the 3 things that separate men who transform from men who quit:

1. SET YOUR MORNING ALARM
The morning journal takes 5-7 minutes. Do it before the world gets loud.

2. TELL SOMEONE
Text one person: "I just started a 45-day challenge." Accountability is the secret weapon.

3. READ THE DATE ZERO PAGE
It sets the foundation for everything that follows.

Open Date Zero: ${APP_URL}/date-zero-gratitude

Remember: You don't need to be perfect. You need to be consistent.

— Garin & Yesi`,
  }),

  purchase_first_three_days: (meta) => ({
    subject: "Your first 3 days matter most",
    html: emailWrapper(`
      <h1>How Are Your First 3 Days Going?</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>By now you've had a few days with the challenge. Here's what I want you to know:</p>
      <p><strong style="color: #fff;">If it feels awkward, you're doing it right.</strong></p>
      <p>Gratitude journaling feels strange at first. Writing down what you're excited about feels vulnerable. That's the point. You're building new neural pathways.</p>
      <p>Here's the pattern I see:</p>
      <p><span class="highlight">Days 1-3:</span> "This feels weird but okay"</p>
      <p><span class="highlight">Days 4-7:</span> "I'm starting to notice things differently"</p>
      <p><span class="highlight">Days 8-14:</span> "Something is shifting"</p>
      <p><span class="highlight">Days 15+:</span> "I can't imagine NOT doing this"</p>
      <p>You're in the foundation phase. Every entry matters. Even the short ones.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude/journal" class="button">Open Today's Journal</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `How Are Your First 3 Days Going?

Hey ${meta.firstName || "there"},

By now you've had a few days with the challenge. Here's what I want you to know:

If it feels awkward, you're doing it right.

Gratitude journaling feels strange at first. That's the point. You're building new neural pathways.

Here's the pattern:
- Days 1-3: "This feels weird but okay"
- Days 4-7: "I'm starting to notice things differently"
- Days 8-14: "Something is shifting"
- Days 15+: "I can't imagine NOT doing this"

You're in the foundation phase. Every entry matters.

Open Today's Journal: ${APP_URL}/date-zero-gratitude/journal

— Garin`,
  }),

  purchase_week_one_checkin: (meta) => ({
    subject: "Week 1 check-in: How are you feeling?",
    html: emailWrapper(`
      <h1>Week 1 Complete!</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>You've just finished your first week of the 45-Day Awakening Challenge. That's a <span class="highlight">huge</span> deal.</p>
      <div class="stat-box">
        <div class="stat-value">7</div>
        <div class="stat-label">days of showing up for yourself</div>
      </div>
      <p>Most men never make it past Day 3. You did. That says something about who you are.</p>
      <p>A few things to check in on:</p>
      <p><span class="highlight">Your streak:</span> Have you been consistent? If you missed a day, that's okay — just get back on today.</p>
      <p><span class="highlight">Your badges:</span> Check your progress page to see what you've unlocked.</p>
      <p><span class="highlight">The community:</span> You're not alone. Drop into the community and share a win from your week.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/dashboard" class="button">Check Your Progress</a>
      </div>
      <div class="divider"></div>
      <p>Week 2 is where the magic starts. Keep going.</p>
      <p style="color: #7dd3c0;">— Garin & Yesi</p>
    `),
    text: `Week 1 Complete!

Hey ${meta.firstName || "there"},

You've just finished your first week of the 45-Day Awakening Challenge. That's a huge deal.

7 days of showing up for yourself.

Most men never make it past Day 3. You did.

A few things to check in on:

YOUR STREAK: Have you been consistent? If you missed a day, just get back on today.
YOUR BADGES: Check your progress page to see what you've unlocked.
THE COMMUNITY: Drop in and share a win from your week.

Check Your Progress: ${APP_URL}/dashboard

Week 2 is where the magic starts. Keep going.

— Garin & Yesi`,
  }),
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Render a drip email template by key, with metadata for variable substitution.
 * Returns null if template not found.
 */
export function renderDripTemplate(
  templateKey: string,
  metadata: Record<string, any>
): DripTemplateData | null {
  const renderer = templates[templateKey];
  if (!renderer) {
    console.error(`[drip-templates] Unknown template key: ${templateKey}`);
    return null;
  }
  return renderer(metadata);
}

/**
 * Get all available template keys (for validation).
 */
export function getTemplateKeys(): string[] {
  return Object.keys(templates);
}

// ============================================================================
// Helpers
// ============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
