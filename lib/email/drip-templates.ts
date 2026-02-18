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
  // CART ABANDONMENT DRIP
  // ============================

  cart_abandoned_reminder: (meta) => ({
    subject: "You left something behind",
    html: emailWrapper(`
      <h1>Still Thinking It Over?</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>You were close. You had the checkout page open. And then something stopped you.</p>
      <p>I get it. $997 is a real number. And you should think it through.</p>
      <p>But here's what I want you to consider: <strong style="color: #fff;">the thing that stopped you isn't the money.</strong></p>
      <p>It's the voice that says <em>"This won't be different."</em></p>
      <p>That voice has kept you stuck for years. It's the same voice that told you another quarter of revenue would fix the emptiness. It didn't.</p>
      <div class="quote-box">
        <p>"I almost didn't click the button. Now I'm 30 days in and my wife asked me what changed. Everything." — James K., CEO</p>
      </div>
      <div style="text-align: center;">
        <a href="${APP_URL}" class="button">Complete Your Enrollment</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Still Thinking It Over?

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

You were close. You had the checkout page open. And then something stopped you.

I get it. $997 is a real number. And you should think it through.

But here's what I want you to consider: the thing that stopped you isn't the money. It's the voice that says "This won't be different."

"I almost didn't click the button. Now I'm 30 days in and my wife asked me what changed. Everything." — James K., CEO

Complete Your Enrollment: ${APP_URL}

— Garin`,
  }),

  cart_abandoned_proof: (meta) => ({
    subject: `What ${meta.firstName || "you"} would have missed`,
    html: emailWrapper(`
      <h1>What the Men Who Said "Yes" Found</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>Yesterday, you were on the checkout page for the 45-Day Awakening Challenge. Today, you're reading this email instead of journaling.</p>
      <p>Here's what happened to the men who clicked the button:</p>
      <div class="stat-box">
        <div class="stat-value">92%</div>
        <div class="stat-label">report feeling "present" again after completing the challenge</div>
      </div>
      <p><strong style="color: #fff;">Not motivated. Not hyped. Present.</strong> In their marriages. With their kids. At the dinner table.</p>
      <p>The challenge is 10 minutes a day for 45 days. Less time than you spend on your phone before breakfast.</p>
      <p>If $997 feels like a lot, I understand. That's why I also offer the daily journal practice on its own — <span class="highlight">$39.95/month</span>. Same morning practice. No calls or community. Just the work.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}" class="button">Start the Full Challenge — $997</a>
      </div>
      <p style="text-align: center; margin-top: 8px;">
        <a href="${APP_URL}/checkout/recovery" style="color: #7dd3c0; text-decoration: underline; font-size: 14px;">Or start with just the journal — $39.95/mo</a>
      </p>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `What the Men Who Said "Yes" Found

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

Yesterday, you were on the checkout page. Today, you're reading this email.

Here's what happened to the men who clicked the button:

92% report feeling "present" again after completing the challenge.

Not motivated. Not hyped. Present. In their marriages. With their kids. At the dinner table.

The challenge is 10 minutes a day for 45 days.

If $997 feels like a lot, I also offer the daily journal practice on its own — $39.95/month.

Start the Full Challenge: ${APP_URL}
Or start with just the journal: ${APP_URL}/checkout/recovery

— Garin`,
  }),

  cart_abandoned_final: (meta) => ({
    subject: "Last call: Your assessment score hasn't changed",
    html: emailWrapper(`
      <h1>Your Score Is Still the Same</h1>
      <p>Hey${meta.firstName ? ` ${meta.firstName}` : ""},</p>
      <p>A few days ago, you were ready to start the 45-Day Awakening Challenge. Something held you back.</p>
      <p>I'm not going to pressure you. But I want to leave you with one thought:</p>
      <div class="quote-box">
        <p>Your Five Pillar score hasn't changed since the last time you checked it. The emptiness equation is the same. The gap between what you've built and what you feel — it doesn't close on its own.</p>
      </div>
      <p>This is the last email I'll send about this. No more follow-ups. No more reminders.</p>
      <p>If the timing isn't right, I respect that. But if you're waiting for the "right time" — that's the trap. The right time was when you felt it. You felt it. That's why you were on the checkout page.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}" class="button">Claim Your Spot</a>
      </div>
      <p style="text-align: center; margin-top: 8px;">
        <a href="${APP_URL}/checkout/recovery" style="color: #7dd3c0; text-decoration: underline; font-size: 14px;">Start smaller with the journal — $39.95/mo</a>
      </p>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Your Score Is Still the Same

Hey${meta.firstName ? ` ${meta.firstName}` : ""},

A few days ago, you were ready to start the 45-Day Awakening Challenge. Something held you back.

I'm not going to pressure you. But I want to leave you with one thought:

Your Five Pillar score hasn't changed since the last time you checked it. The gap between what you've built and what you feel doesn't close on its own.

This is the last email I'll send about this. No more follow-ups.

If you're waiting for the "right time" — that's the trap. The right time was when you felt it.

Claim Your Spot: ${APP_URL}
Start smaller with the journal: ${APP_URL}/checkout/recovery

— Garin`,
  }),

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

  // ============================
  // MILESTONE CELEBRATIONS
  // ============================

  milestone_day_14: (meta) => ({
    subject: "Day 14: The habit is locking in",
    html: emailWrapper(`
      <h1>Day 14. You're Still Here.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <div class="stat-box">
        <div class="stat-value">14</div>
        <div class="stat-label">days of showing up for yourself</div>
      </div>
      <p>You've passed the point where most habits die. The men who make it to Day 14 have a <span class="highlight">94% completion rate</span> for the full 45 days.</p>
      <p>By now, your mornings feel different. That's not placebo. That's practice rewiring your brain.</p>
      <p>The next 2 weeks are where other people start noticing. Your wife. Your kids. Your team. They won't know what changed — they'll just feel it.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Keep the Streak Alive</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Day 14. You're Still Here.

Hey ${meta.firstName || "there"},

14 days of showing up for yourself.

You've passed the point where most habits die. The men who make it to Day 14 have a 94% completion rate for the full 45 days.

By now, your mornings feel different. That's not placebo. That's practice.

The next 2 weeks are where other people start noticing.

Keep the Streak Alive: ${APP_URL}/date-zero-gratitude

— Garin`,
  }),

  milestone_day_21: (meta) => ({
    subject: "Day 21: Other people are noticing",
    html: emailWrapper(`
      <h1>Day 21. The Habit Is Locked In.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <div class="stat-box">
        <div class="stat-value">21</div>
        <div class="stat-label">consecutive days of practice</div>
      </div>
      <p>This is where the science says the habit locks in. Three weeks of consistent practice has literally changed the neural pathways in your brain.</p>
      <p>Go back and read your Day 1 journal entry. Compare it to today's. <span class="highlight">That's the shift.</span></p>
      <p>Your lowest pillar has already started to move. If you haven't retaken the assessment, now is a good time to see where you stand.</p>
      <p>24 more days. You're closer to the end than the beginning.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/assessment" class="button">Retake the Assessment</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Day 21. The Habit Is Locked In.

Hey ${meta.firstName || "there"},

21 consecutive days of practice.

This is where the science says the habit locks in. Three weeks of consistent practice has literally changed the neural pathways in your brain.

Go back and read your Day 1 journal entry. Compare it to today's. That's the shift.

24 more days. You're closer to the end than the beginning.

Retake the Assessment: ${APP_URL}/assessment

— Garin`,
  }),

  milestone_day_30: (meta) => ({
    subject: "Day 30: You've done what 90% couldn't",
    html: emailWrapper(`
      <h1>Day 30. One Month.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <div class="stat-box">
        <div class="stat-value">30</div>
        <div class="stat-label">days of transformation</div>
      </div>
      <p>You've done what 90% of men who started this year couldn't do. You showed up. Every day. For 30 days.</p>
      <p>Someone in your life has noticed. Even if they haven't said it yet.</p>
      <p><strong style="color: #fff;">15 days to go.</strong> The finish line is in sight. Don't coast. The last two weeks are where the deepest shifts happen — because you stop performing the practice and start <em>being</em> the practice.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Day 31 Awaits</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Day 30. One Month.

Hey ${meta.firstName || "there"},

30 days of transformation.

You've done what 90% of men who started this year couldn't do. You showed up. Every day. For 30 days.

Someone in your life has noticed. Even if they haven't said it yet.

15 days to go. The finish line is in sight. Don't coast.

Day 31 Awaits: ${APP_URL}/date-zero-gratitude

— Garin`,
  }),

  milestone_day_45: (meta) => ({
    subject: "Day 45: You did it. Every single one.",
    html: emailWrapper(`
      <h1>Day 45. You Did It.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <div class="stat-box">
        <div class="stat-value">45</div>
        <div class="stat-label">days. Every single one.</div>
      </div>
      <p>You are now in the <span class="highlight">92%</span>. The men who report feeling <strong style="color: #fff;">present</strong> again. Not motivated. Not hyped. Present.</p>
      <p>In their marriages. With their kids. At the dinner table. In the mirror.</p>
      <h2>What Comes Next</h2>
      <p><span class="highlight">1. Retake the Assessment</span> — See how your Five Pillar score has changed. Most men gain 12-18 points.</p>
      <p><span class="highlight">2. Keep the Practice</span> — The challenge ends. The practice doesn't. Continue with the journal subscription to maintain your streak and momentum.</p>
      <p><span class="highlight">3. Join the Community</span> — Connect with other men who've completed the challenge. Share your story. Help someone on Day 3.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/assessment" class="button">Retake Your Assessment</a>
      </div>
      <p style="text-align: center; margin-top: 8px;">
        <a href="${APP_URL}/journal" style="color: #7dd3c0; text-decoration: underline; font-size: 14px;">Continue with the Journal — $39.95/mo</a>
      </p>
      <div class="divider"></div>
      <p>The challenge ends. This is who you are now.</p>
      <p style="color: #7dd3c0;">— Garin & Yesi</p>
    `),
    text: `Day 45. You Did It.

Hey ${meta.firstName || "there"},

45 days. Every single one.

You are now in the 92%. The men who report feeling present again. Not motivated. Not hyped. Present.

WHAT COMES NEXT:

1. RETAKE THE ASSESSMENT — See how your Five Pillar score has changed.
2. KEEP THE PRACTICE — Continue with the journal subscription.
3. JOIN THE COMMUNITY — Connect with other men who've completed the challenge.

Retake Your Assessment: ${APP_URL}/assessment
Continue with the Journal: ${APP_URL}/journal

The challenge ends. This is who you are now.

— Garin & Yesi`,
  }),

  // ============================
  // WIN-BACK / RE-ENGAGEMENT
  // ============================

  winback_gentle: (meta) => ({
    subject: "Your journal is waiting",
    html: emailWrapper(`
      <h1>Hey. It's Been a Few Days.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>Your journal is still here. Your streak paused — but you didn't break.</p>
      <p>Here's the thing about gaps: they're normal. <span class="highlight">Every man in this challenge has had one.</span> The ones who transformed aren't the ones who never missed a day. They're the ones who came back.</p>
      <p>One entry. That's all it takes to restart.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude/journal/morning" class="button">Open Today's Journal</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Hey. It's Been a Few Days.

Hey ${meta.firstName || "there"},

Your journal is still here. Your streak paused — but you didn't break.

The ones who transformed aren't the ones who never missed a day. They're the ones who came back.

One entry. That's all it takes to restart.

Open Today's Journal: ${APP_URL}/date-zero-gratitude/journal/morning

— Garin`,
  }),

  winback_pattern: (meta) => ({
    subject: "The gap gets harder to close",
    html: emailWrapper(`
      <h1>The Longer You Wait, the Harder It Gets</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>It's been about a week. And I know what's happening in your head.</p>
      <p>Your brain is building a story: <em>"I failed. I can't restart now. It's been too long."</em></p>
      <p><strong style="color: #fff;">That's not true.</strong></p>
      <p>There is no perfect streak. There's just showing up again. The gap between Day 7 and Day 8 is exactly the same whether it's been 24 hours or 7 days.</p>
      <div class="quote-box">
        <p>"I missed 5 days in Week 3. Almost quit. Came back and finished all 45. Those 5 days don't define my journey — coming back does." — Chris B.</p>
      </div>
      <p>Open the app. Write one sentence. The streak resets. You don't.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude/journal/morning" class="button">Come Back</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `The Longer You Wait, the Harder It Gets

Hey ${meta.firstName || "there"},

It's been about a week. Your brain is building a story: "I failed. I can't restart now."

That's not true. There is no perfect streak. There's just showing up again.

"I missed 5 days in Week 3. Almost quit. Came back and finished all 45." — Chris B.

Open the app. Write one sentence. The streak resets. You don't.

Come Back: ${APP_URL}/date-zero-gratitude/journal/morning

— Garin`,
  }),

  winback_final: (meta) => ({
    subject: "One entry. That's all.",
    html: emailWrapper(`
      <h1>One Entry.</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>This is my last check-in. I'm not going to guilt you. I'm not going to send motivational quotes.</p>
      <p>I'm just going to say this:</p>
      <p><strong style="color: #fff; font-size: 18px;">You started for a reason. That reason hasn't changed.</strong></p>
      <p>Open the app. Write one entry. It can be one sentence. It can be messy. It just has to exist.</p>
      <p>That's all. One entry and you're back.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude/journal/morning" class="button">Write One Entry</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `One Entry.

Hey ${meta.firstName || "there"},

This is my last check-in. I'm not going to guilt you.

You started for a reason. That reason hasn't changed.

Open the app. Write one entry. It can be one sentence. It just has to exist.

Write One Entry: ${APP_URL}/date-zero-gratitude/journal/morning

— Garin`,
  }),

  // ============================
  // REFERRAL REMINDERS
  // ============================

  referral_day3: (meta) => ({
    subject: "Your friend codes are worth $1,994",
    html: emailWrapper(`
      <h1>You Have 2 Gift Codes Waiting</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>When you enrolled in the challenge, you received <span class="highlight">2 friend codes</span>. Each one is worth $997 — full access to the entire 45-Day Awakening Challenge.</p>
      <div class="stat-box">
        <div class="stat-value">$1,994</div>
        <div class="stat-label">in gift codes sitting unused</div>
      </div>
      <p>Think of one person in your life who's built everything but doesn't feel any of it. The one who's "fine" when you ask. The one who'd never admit he's struggling.</p>
      <p><strong style="color: #fff;">He's the one who needs this.</strong></p>
      <p>Men who complete the challenge with an accountability partner are <span class="highlight">95% more likely to finish</span>. This isn't just a gift for them — it's a force multiplier for you.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Find Your Friend Codes</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `You Have 2 Gift Codes Waiting

Hey ${meta.firstName || "there"},

You received 2 friend codes worth $997 each — $1,994 total.

Think of one person who's built everything but doesn't feel any of it. He's the one who needs this.

Men who complete with an accountability partner are 95% more likely to finish.

Find Your Friend Codes: ${APP_URL}/date-zero-gratitude

— Garin`,
  }),

  referral_day14: (meta) => ({
    subject: "The men who share finish stronger",
    html: emailWrapper(`
      <h1>Accountability Changes Everything</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>You're 2 weeks in. You know this works. You've felt the shift.</p>
      <p>Here's something you might not know: <span class="highlight">the men who share their friend codes complete at a 40% higher rate</span> than men who go it alone.</p>
      <p>It's not about altruism. It's about accountability. When someone you respect is doing this alongside you, you show up differently.</p>
      <p>Your friend codes are still available. One text. One email. That's all it takes.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Share a Friend Code</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Accountability Changes Everything

Hey ${meta.firstName || "there"},

You're 2 weeks in. You know this works.

The men who share their friend codes complete at a 40% higher rate.

Your friend codes are still available. One text. That's all it takes.

Share a Friend Code: ${APP_URL}/date-zero-gratitude

— Garin`,
  }),

  referral_day30: (meta) => ({
    subject: "Last reminder: 2 spots reserved for your people",
    html: emailWrapper(`
      <h1>Your Codes Are Still Waiting</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>This is the last time I'll mention this. You have friend codes that haven't been used.</p>
      <p>In 15 days, your challenge ends. When it does, those codes become someone else's starting line.</p>
      <p>Think about who in your life could use 45 days of showing up for themselves. Text them. Send the code. Let them decide.</p>
      <p>The worst that happens? They say no. The best? You both finish this thing together.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/date-zero-gratitude" class="button">Send Your Codes</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Your Codes Are Still Waiting

Hey ${meta.firstName || "there"},

This is the last time I'll mention this. You have friend codes that haven't been used.

Think about who could use 45 days of showing up for themselves. Text them. Send the code.

Send Your Codes: ${APP_URL}/date-zero-gratitude

— Garin`,
  }),

  // ============================
  // COMMUNITY ACTIVATION
  // ============================

  community_welcome: (meta) => ({
    subject: "Welcome to the room",
    html: emailWrapper(`
      <h1>Welcome to the Brotherhood</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>You now have access to the Gynergy community — a room full of men who are done pretending everything is fine.</p>
      <h2>Your First 3 Steps</h2>
      <p><span class="highlight">1. Introduce yourself.</span> Don't write a novel. Name, what you do, and why you're here. Honest beats polished.</p>
      <p><span class="highlight">2. Read 3 posts.</span> You'll notice something: these men sound like you. That's on purpose.</p>
      <p><span class="highlight">3. Join a call.</span> Community calls happen weekly. Showing up once changes everything.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/community" class="button">Enter the Community</a>
      </div>
      <div class="divider"></div>
      <p>This isn't social media. Be honest. Be present. That's all we ask.</p>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Welcome to the Brotherhood

Hey ${meta.firstName || "there"},

You now have access to the Gynergy community.

YOUR FIRST 3 STEPS:
1. Introduce yourself. Name, what you do, why you're here.
2. Read 3 posts. These men sound like you. That's on purpose.
3. Join a call. Showing up once changes everything.

Enter the Community: ${APP_URL}/community

This isn't social media. Be honest. Be present.

— Garin`,
  }),

  community_first_call: (meta) => ({
    subject: "Your first call is this week",
    html: emailWrapper(`
      <h1>Join Your First Community Call</h1>
      <p>Hey ${meta.firstName || "there"},</p>
      <p>The community calls are where this gets real. Hearing other men talk about the same things you're feeling — that's the moment it stops being a "program" and starts being a practice.</p>
      <p><strong style="color: #fff;">What to expect:</strong></p>
      <p>A small group. Cameras optional but encouraged. No agenda beyond showing up honest.</p>
      <p>You don't need to share anything. You don't need to have answers. You just need to be in the room.</p>
      <div style="text-align: center;">
        <a href="${APP_URL}/community" class="button">Check the Call Schedule</a>
      </div>
      <div class="divider"></div>
      <p style="color: #7dd3c0;">— Garin</p>
    `),
    text: `Join Your First Community Call

Hey ${meta.firstName || "there"},

The community calls are where this gets real.

What to expect: A small group. Cameras optional. No agenda beyond showing up honest.

You don't need to share anything. Just be in the room.

Check the Call Schedule: ${APP_URL}/community

— Garin`,
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
