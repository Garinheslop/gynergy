/**
 * Email Service
 *
 * Centralized email sending using Resend.
 * All transactional emails go through this service.
 */

import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "Gynergy <hello@gynergy.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@gynergy.com",
} as const;

// Email types
export type EmailType =
  | "welcome"
  | "purchase_confirmation"
  | "streak_reminder"
  | "password_reset"
  | "friend_code";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error("Email service error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
}): Promise<EmailResult> {
  const { to, firstName } = params;

  const html = generateWelcomeEmailHtml(firstName);
  const text = generateWelcomeEmailText(firstName);

  return sendEmail({
    to,
    subject: `Welcome to Gynergy, ${firstName}! Your Journey Begins`,
    html,
    text,
  });
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(params: {
  to: string;
  firstName: string;
  productName: string;
  amount: string;
  friendCodes?: string[];
}): Promise<EmailResult> {
  const { to, firstName, productName, amount, friendCodes } = params;

  const html = generatePurchaseConfirmationHtml(firstName, productName, amount, friendCodes);
  const text = generatePurchaseConfirmationText(firstName, productName, amount, friendCodes);

  return sendEmail({
    to,
    subject: `Your Gynergy Purchase Confirmation - ${productName}`,
    html,
    text,
  });
}

/**
 * Send streak reminder email
 */
export async function sendStreakReminderEmail(params: {
  to: string;
  firstName: string;
  currentStreak: number;
  dayNumber: number;
}): Promise<EmailResult> {
  const { to, firstName, currentStreak, dayNumber } = params;

  const html = generateStreakReminderHtml(firstName, currentStreak, dayNumber);
  const text = generateStreakReminderText(firstName, currentStreak, dayNumber);

  return sendEmail({
    to,
    subject: `${firstName}, Don't Break Your ${currentStreak}-Day Streak!`,
    html,
    text,
  });
}

/**
 * Send friend code email
 */
export async function sendFriendCodeEmail(params: {
  to: string;
  firstName: string;
  friendCodes: string[];
}): Promise<EmailResult> {
  const { to, firstName, friendCodes } = params;

  const html = generateFriendCodeHtml(firstName, friendCodes);
  const text = generateFriendCodeText(firstName, friendCodes);

  return sendEmail({
    to,
    subject: `${firstName}, Here Are Your Friend Codes!`,
    html,
    text,
  });
}

/**
 * Send notification when a friend code is redeemed
 */
export async function sendFriendCodeRedeemedEmail(params: {
  to: string;
  creatorFirstName: string;
  redeemerFirstName: string;
  code: string;
}): Promise<EmailResult> {
  const { to, creatorFirstName, redeemerFirstName, code } = params;

  const html = generateFriendCodeRedeemedHtml(creatorFirstName, redeemerFirstName, code);
  const text = generateFriendCodeRedeemedText(creatorFirstName, redeemerFirstName, code);

  return sendEmail({
    to,
    subject: `${redeemerFirstName} just joined using your friend code!`,
    html,
    text,
  });
}

// ============================================================================
// Email HTML Templates
// ============================================================================

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4e; }
  .logo { text-align: center; margin-bottom: 30px; }
  .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h1 { color: #ffffff; font-size: 24px; margin: 0 0 16px 0; }
  p { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .highlight { color: #7dd3c0; }
  .button { display: inline-block; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
  .divider { height: 1px; background: #2a2a4e; margin: 30px 0; }
  .code-box { background: #0a0a0a; border: 2px dashed #7dd3c0; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
  .code { font-family: monospace; font-size: 24px; color: #7dd3c0; letter-spacing: 2px; }
  .footer { text-align: center; margin-top: 30px; }
  .footer p { color: #666; font-size: 12px; }
  .stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
  .stat { text-align: center; }
  .stat-value { font-size: 32px; font-weight: bold; color: #7dd3c0; }
  .stat-label { font-size: 12px; color: #888; text-transform: uppercase; }
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
      <p>Questions? Reply to this email or contact support@gynergy.com</p>
    </div>
  </div>
</body>
</html>`;
}

function generateWelcomeEmailHtml(firstName: string): string {
  return emailWrapper(`
    <h1>Welcome to the Journey, ${firstName}!</h1>
    <p>You've taken the first step toward transformation. The Gynergy community is here to support you every step of the way.</p>
    <div class="divider"></div>
    <p><strong class="highlight">What's next?</strong></p>
    <p>1. Complete your profile to personalize your experience</p>
    <p>2. Explore the 45-Day Awakening Challenge</p>
    <p>3. Connect with fellow journeyers in our community</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/dashboard" class="button">Start Your Journey</a>
    </div>
    <div class="divider"></div>
    <p>We're honored to be part of your transformation. Let's make every day count.</p>
    <p style="color: #7dd3c0;">— Garin & Yesi</p>
  `);
}

function generateWelcomeEmailText(firstName: string): string {
  return `
Welcome to the Journey, ${firstName}!

You've taken the first step toward transformation. The Gynergy community is here to support you every step of the way.

What's next?
1. Complete your profile to personalize your experience
2. Explore the 45-Day Awakening Challenge
3. Connect with fellow journeyers in our community

Start your journey: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/dashboard

We're honored to be part of your transformation. Let's make every day count.

— Garin & Yesi
The Gynergy Effect
  `.trim();
}

function generatePurchaseConfirmationHtml(
  firstName: string,
  productName: string,
  amount: string,
  friendCodes?: string[]
): string {
  const friendCodesSection = friendCodes?.length
    ? `
    <div class="divider"></div>
    <p><strong class="highlight">Your Friend Codes</strong></p>
    <p>Share the gift of transformation! You have ${friendCodes.length} friend codes to give away:</p>
    ${friendCodes.map((code) => `<div class="code-box"><span class="code">${code}</span></div>`).join("")}
    <p style="font-size: 14px;">Each code gives a friend free access to the challenge. Share wisely!</p>
  `
    : "";

  return emailWrapper(`
    <h1>Thank You, ${firstName}!</h1>
    <p>Your purchase has been confirmed. Welcome to the inner circle.</p>
    <div class="divider"></div>
    <p><strong>Order Details:</strong></p>
    <p>Product: <span class="highlight">${productName}</span></p>
    <p>Amount: <span class="highlight">${amount}</span></p>
    <p>Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    ${friendCodesSection}
    <div class="divider"></div>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/date-zero-gratitude" class="button">Begin the Challenge</a>
    </div>
    <p>Your 45-day transformation awaits. Let's make it legendary.</p>
  `);
}

function generatePurchaseConfirmationText(
  firstName: string,
  productName: string,
  amount: string,
  friendCodes?: string[]
): string {
  const friendCodesSection = friendCodes?.length
    ? `
Your Friend Codes:
${friendCodes.map((code) => `  ${code}`).join("\n")}
Each code gives a friend free access to the challenge.
`
    : "";

  return `
Thank You, ${firstName}!

Your purchase has been confirmed. Welcome to the inner circle.

Order Details:
- Product: ${productName}
- Amount: ${amount}
- Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
${friendCodesSection}
Begin the Challenge: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/date-zero-gratitude

Your 45-day transformation awaits. Let's make it legendary.

— The Gynergy Team
  `.trim();
}

function generateStreakReminderHtml(
  firstName: string,
  currentStreak: number,
  dayNumber: number
): string {
  return emailWrapper(`
    <h1>Hey ${firstName}, Your Streak is Waiting!</h1>
    <div style="text-align: center; margin: 30px 0;">
      <div class="stat">
        <div class="stat-value">${currentStreak}</div>
        <div class="stat-label">Day Streak</div>
      </div>
    </div>
    <p>You're on <span class="highlight">Day ${dayNumber}</span> of your 45-day journey. Don't let today be the day you break your momentum!</p>
    <p>Just 5 minutes of journaling can keep your streak alive and your transformation on track.</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/date-zero-gratitude/journal" class="button">Complete Today's Journal</a>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #888;">Remember: Consistency beats perfection. Even a short entry counts.</p>
  `);
}

function generateStreakReminderText(
  firstName: string,
  currentStreak: number,
  dayNumber: number
): string {
  return `
Hey ${firstName}, Your Streak is Waiting!

Current Streak: ${currentStreak} days
You're on Day ${dayNumber} of your 45-day journey.

Don't let today be the day you break your momentum!

Just 5 minutes of journaling can keep your streak alive and your transformation on track.

Complete Today's Journal: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/date-zero-gratitude/journal

Remember: Consistency beats perfection. Even a short entry counts.

— The Gynergy Team
  `.trim();
}

function generateFriendCodeHtml(firstName: string, friendCodes: string[]): string {
  return emailWrapper(`
    <h1>${firstName}, Share the Gift!</h1>
    <p>You have <span class="highlight">${friendCodes.length} friend codes</span> to share with people you care about.</p>
    <p>Each code gives someone free access to the 45-Day Awakening Challenge — a $997 value!</p>
    ${friendCodes.map((code) => `<div class="code-box"><span class="code">${code}</span></div>`).join("")}
    <div class="divider"></div>
    <p><strong>How to share:</strong></p>
    <p>1. Send a code to a friend via text or email</p>
    <p>2. They visit <span class="highlight">gynergy.com/redeem</span></p>
    <p>3. They enter the code and get instant access</p>
    <div class="divider"></div>
    <p style="font-size: 14px;">Tip: Choose people who are ready for transformation. These codes are precious — use them wisely!</p>
  `);
}

function generateFriendCodeText(firstName: string, friendCodes: string[]): string {
  return `
${firstName}, Share the Gift!

You have ${friendCodes.length} friend codes to share with people you care about.
Each code gives someone free access to the 45-Day Awakening Challenge — a $997 value!

Your Codes:
${friendCodes.map((code) => `  ${code}`).join("\n")}

How to share:
1. Send a code to a friend via text or email
2. They visit gynergy.com/redeem
3. They enter the code and get instant access

Tip: Choose people who are ready for transformation!

— The Gynergy Team
  `.trim();
}

function generateFriendCodeRedeemedHtml(
  creatorFirstName: string,
  redeemerFirstName: string,
  code: string
): string {
  return emailWrapper(`
    <h1>Great News, ${creatorFirstName}!</h1>
    <p><span class="highlight">${redeemerFirstName}</span> just joined Gynergy using your friend code!</p>
    <div class="code-box">
      <span class="code">${code}</span>
      <p style="margin-top: 8px; font-size: 14px; color: #888;">Code redeemed</p>
    </div>
    <div class="divider"></div>
    <p>Your gift of transformation is already making a difference. ${redeemerFirstName} is now part of our community and ready to begin their 45-day journey.</p>
    <p>Consider reaching out to support them along the way — accountability partners see <span class="highlight">3x better results!</span></p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/community" class="button">Visit Community</a>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #888;">Thank you for spreading the gift of gratitude.</p>
  `);
}

function generateFriendCodeRedeemedText(
  creatorFirstName: string,
  redeemerFirstName: string,
  code: string
): string {
  return `
Great News, ${creatorFirstName}!

${redeemerFirstName} just joined Gynergy using your friend code: ${code}

Your gift of transformation is already making a difference. ${redeemerFirstName} is now part of our community and ready to begin their 45-day journey.

Consider reaching out to support them along the way — accountability partners see 3x better results!

Visit the Community: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.gynergy.com"}/community

Thank you for spreading the gift of gratitude.

— The Gynergy Team
  `.trim();
}
