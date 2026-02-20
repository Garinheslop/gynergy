/**
 * Webinar Email Service
 *
 * Handles all webinar-related emails:
 * - Registration confirmation with calendar invite
 * - Reminder emails (24h, 1h before)
 * - Post-webinar follow-up
 */

import { sendEmail, EmailResult } from "./index";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.gynergy.app";

// Email tracking helpers
function generateEmailId(): string {
  return `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createTrackedUrl(
  originalUrl: string,
  emailId: string,
  recipientEmail: string,
  linkName: string,
  emailType: string
): string {
  const encodedUrl = Buffer.from(originalUrl).toString("base64");
  const encodedEmail = Buffer.from(recipientEmail).toString("base64");
  return `${BASE_URL}/api/email/track?type=click&id=${emailId}&email=${encodedEmail}&url=${encodedUrl}&name=${linkName}&et=${emailType}`;
}

function createTrackingPixel(emailId: string, recipientEmail: string, emailType: string): string {
  const encodedEmail = Buffer.from(recipientEmail).toString("base64");
  return `<img src="${BASE_URL}/api/email/track?type=open&id=${emailId}&email=${encodedEmail}&et=${emailType}" width="1" height="1" style="display:none;" alt="" />`;
}

// Escape text for ICS format per RFC 5545 Section 3.3.11
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // backslash first
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Generate ICS calendar file content
function generateICSContent(params: {
  title: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
  location: string;
  organizer: string;
}): string {
  const { title, description, startDate, durationMinutes, location, organizer } = params;

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Format dates in ICS format (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const uid = `webinar-${startDate.getTime()}@gynergy.app`;
  const now = formatICSDate(new Date());

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gynergy//Webinar//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${escapeICS(title)}
DESCRIPTION:${escapeICS(description)}
LOCATION:${escapeICS(location)}
ORGANIZER;CN=${escapeICS(organizer)}:mailto:hello@gynergy.app
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeICS(title)} tomorrow
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeICS(title)} in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// Generate Google Calendar URL
function generateGoogleCalendarUrl(params: {
  title: string;
  description: string;
  startDate: Date;
  durationMinutes: number;
  location: string;
}): string {
  const { title, description, startDate, durationMinutes, location } = params;

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Format: YYYYMMDDTHHMMSSZ
  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const params_url = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params_url.toString()}`;
}

// Base email styles
const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4e; }
  .logo { text-align: center; margin-bottom: 30px; }
  .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.3em; }
  h1 { color: #ffffff; font-size: 24px; margin: 0 0 16px 0; }
  h2 { color: #7dd3c0; font-size: 18px; margin: 24px 0 12px 0; }
  p { color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .highlight { color: #7dd3c0; }
  .button { display: inline-block; background: linear-gradient(90deg, #7dd3c0, #5fb3a0); color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 8px 4px; }
  .button-secondary { display: inline-block; background: transparent; color: #7dd3c0; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid #7dd3c0; margin: 8px 4px; }
  .divider { height: 1px; background: #2a2a4e; margin: 30px 0; }
  .event-box { background: rgba(125, 211, 192, 0.1); border: 1px solid rgba(125, 211, 192, 0.3); border-radius: 12px; padding: 24px; margin: 20px 0; }
  .event-title { font-size: 20px; font-weight: bold; color: #ffffff; margin: 0 0 8px 0; }
  .event-date { font-size: 18px; color: #7dd3c0; margin: 0 0 4px 0; }
  .event-time { font-size: 14px; color: #888; margin: 0; }
  .checklist { margin: 20px 0; padding-left: 0; list-style: none; }
  .checklist li { padding: 8px 0 8px 32px; position: relative; color: #a0a0a0; }
  .checklist li:before { content: "✓"; position: absolute; left: 0; color: #7dd3c0; font-weight: bold; }
  .footer { text-align: center; margin-top: 30px; }
  .footer p { color: #666; font-size: 12px; }
  .calendar-buttons { text-align: center; margin: 20px 0; }
`;

function emailWrapper(
  content: string,
  trackingPixel: string = "",
  recipientEmail: string = ""
): string {
  const unsubscribeUrl = recipientEmail
    ? `${BASE_URL}/api/email/unsubscribe?email=${Buffer.from(recipientEmail).toString("base64")}&type=webinar`
    : "";

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
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from webinar emails</a></p>` : ""}
    </div>
  </div>
  ${trackingPixel}
</body>
</html>`;
}

/**
 * Send webinar registration confirmation email
 */
export async function sendWebinarConfirmationEmail(params: {
  to: string;
  firstName?: string;
  webinarTitle: string;
  webinarDate: Date;
  durationMinutes?: number;
}): Promise<EmailResult> {
  const { to, firstName, webinarTitle, webinarDate, durationMinutes = 90 } = params;

  const emailId = generateEmailId();
  const emailType = "webinar_confirmation";
  const displayName = firstName || "there";

  // Format date for display
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };

  const formattedDate = webinarDate.toLocaleDateString("en-US", dateOptions);
  const formattedTime = webinarDate.toLocaleTimeString("en-US", timeOptions);

  // Generate calendar links
  const calendarDescription = `${webinarTitle}\n\nJoin Garin Heslop for a live training on the Five Pillars of Integrated Power.\n\nJoin link: ${BASE_URL}/webinar/live`;

  const googleCalUrl = generateGoogleCalendarUrl({
    title: webinarTitle,
    description: calendarDescription,
    startDate: webinarDate,
    durationMinutes,
    location: `${BASE_URL}/webinar/live`,
  });

  // Create tracked URLs
  const assessmentUrl = createTrackedUrl(
    `${BASE_URL}/assessment`,
    emailId,
    to,
    "take_assessment",
    emailType
  );
  const googleCalTrackedUrl = createTrackedUrl(
    googleCalUrl,
    emailId,
    to,
    "add_to_google_calendar",
    emailType
  );
  const webinarUrl = createTrackedUrl(
    `${BASE_URL}/webinar`,
    emailId,
    to,
    "webinar_link",
    emailType
  );

  const trackingPixel = createTrackingPixel(emailId, to, emailType);

  const html = emailWrapper(
    `
    <h1>You're In, ${displayName}!</h1>
    <p>Your seat is confirmed for the live training. Here are the details:</p>

    <div class="event-box">
      <p class="event-title">${webinarTitle}</p>
      <p class="event-date">${formattedDate}</p>
      <p class="event-time">${formattedTime}</p>
    </div>

    <div class="calendar-buttons">
      <a href="${googleCalTrackedUrl}" class="button">Add to Google Calendar</a>
    </div>

    <div class="divider"></div>

    <h2>⚡ Your Pre-Webinar Assignment</h2>
    <p>Before we meet, complete the <span class="highlight">Five Pillar Self-Assessment</span>. It takes 2 minutes and reveals which pillar is silently bleeding.</p>
    <p style="font-size: 14px; color: #888;">Bring your score to the live training. You'll need it.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${assessmentUrl}" class="button">Take the Assessment Now</a>
    </div>

    <div class="divider"></div>

    <h2>What to Expect</h2>
    <ul class="checklist">
      <li>The exact 10-minute morning practice I've done for 497 straight days</li>
      <li>The Emptiness Equation — why high achievers feel hollow</li>
      <li>Your Five Pillar Score interpretation</li>
      <li>Live Q&A with me</li>
    </ul>

    <div class="divider"></div>

    <p style="text-align: center;">
      <a href="${webinarUrl}" class="button-secondary">Save Webinar Link</a>
    </p>

    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 24px;">
      No replay. Live only. Show up ready.
    </p>
  `,
    trackingPixel,
    to
  );

  const text = `
You're In, ${displayName}!

Your seat is confirmed for the live training.

${webinarTitle}
${formattedDate}
${formattedTime}

Add to Google Calendar: ${googleCalUrl}

---

YOUR PRE-WEBINAR ASSIGNMENT

Before we meet, complete the Five Pillar Self-Assessment. It takes 2 minutes and reveals which pillar is silently bleeding.

Take the Assessment: ${BASE_URL}/assessment

Bring your score to the live training. You'll need it.

---

WHAT TO EXPECT

• The exact 10-minute morning practice I've done for 497 straight days
• The Emptiness Equation — why high achievers feel hollow
• Your Five Pillar Score interpretation
• Live Q&A with me

---

Save this link: ${BASE_URL}/webinar/live

No replay. Live only. Show up ready.

— Garin
Gynergy

Unsubscribe: ${BASE_URL}/api/email/unsubscribe?email=${Buffer.from(to).toString("base64")}&type=webinar
  `.trim();

  // Generate ICS calendar attachment
  const icsContent = generateICSContent({
    title: webinarTitle,
    description: `Join Garin Heslop for a live training on the Five Pillars of Integrated Power.\n\nJoin link: ${BASE_URL}/webinar/live`,
    startDate: webinarDate,
    durationMinutes,
    location: `${BASE_URL}/webinar/live`,
    organizer: "Garin Heslop",
  });

  return sendEmail({
    to,
    subject: `You're in! ${webinarTitle} — ${formattedDate}`,
    html,
    text,
    attachments: [
      {
        filename: "webinar-invite.ics",
        content: Buffer.from(icsContent, "utf-8"),
        contentType: "text/calendar",
      },
    ],
  });
}

/**
 * Send webinar reminder email (24h or 1h before)
 */
export async function sendWebinarReminderEmail(params: {
  to: string;
  firstName?: string;
  webinarTitle: string;
  webinarDate: Date;
  reminderType: "24h" | "1h";
  assessmentCompleted?: boolean;
  assessmentScore?: number;
}): Promise<EmailResult> {
  const {
    to,
    firstName,
    webinarTitle,
    webinarDate,
    reminderType,
    assessmentCompleted = false,
    assessmentScore,
  } = params;

  const emailId = generateEmailId();
  const emailType = `webinar_reminder_${reminderType}`;
  const displayName = firstName || "there";

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };
  const formattedTime = webinarDate.toLocaleTimeString("en-US", timeOptions);

  const is24h = reminderType === "24h";
  const urgencyText = is24h ? "tomorrow" : "in 1 hour";
  const subject = is24h ? `Tomorrow: ${webinarTitle}` : `Starting in 1 HOUR: ${webinarTitle}`;

  // Create tracked URLs
  const webinarUrl = createTrackedUrl(
    `${BASE_URL}/webinar/live`,
    emailId,
    to,
    "join_webinar",
    emailType
  );
  const assessmentUrl = createTrackedUrl(
    `${BASE_URL}/assessment`,
    emailId,
    to,
    "take_assessment",
    emailType
  );

  const trackingPixel = createTrackingPixel(emailId, to, emailType);

  const assessmentSection = assessmentCompleted
    ? `
    <div class="event-box">
      <p style="margin: 0; color: #7dd3c0;">✓ Assessment Complete</p>
      ${assessmentScore ? `<p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #fff;">Your Score: ${assessmentScore}/50</p>` : ""}
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #888;">Bring this number to the training. We'll decode it together.</p>
    </div>
  `
    : `
    <div class="event-box" style="border-color: rgba(255, 193, 7, 0.5); background: rgba(255, 193, 7, 0.1);">
      <p style="margin: 0; color: #ffc107;">⚠️ Assessment Not Complete</p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #a0a0a0;">Take the 2-minute Five Pillar Assessment before the webinar. You'll need your score.</p>
      <div style="text-align: center; margin-top: 16px;">
        <a href="${assessmentUrl}" class="button">Take Assessment Now</a>
      </div>
    </div>
  `;

  const html = emailWrapper(
    `
    <h1>${is24h ? "See You Tomorrow" : "We're Live in 1 Hour"}, ${displayName}!</h1>
    <p>Just a quick reminder — the live training starts <span class="highlight">${urgencyText}</span>.</p>

    <div class="event-box">
      <p class="event-title">${webinarTitle}</p>
      <p class="event-date">${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)} @ ${formattedTime}</p>
    </div>

    ${assessmentSection}

    <div class="divider"></div>

    <div style="text-align: center;">
      <a href="${webinarUrl}" class="button">${is24h ? "Save Join Link" : "Join Now"}</a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 24px;">
      ${is24h ? "See you tomorrow. Come ready." : "We're starting. Don't be late."}
    </p>
  `,
    trackingPixel,
    to
  );

  const text = `
${is24h ? "See You Tomorrow" : "We're Live in 1 Hour"}, ${displayName}!

Just a quick reminder — the live training starts ${urgencyText}.

${webinarTitle}
${urgencyText.charAt(0).toUpperCase() + urgencyText.slice(1)} @ ${formattedTime}

${assessmentCompleted ? `✓ Assessment Complete${assessmentScore ? ` - Your Score: ${assessmentScore}/50` : ""}` : `⚠️ Assessment Not Complete - Take it now: ${BASE_URL}/assessment`}

Join the webinar: ${BASE_URL}/webinar/live

${is24h ? "See you tomorrow. Come ready." : "We're starting. Don't be late."}

— Garin

Unsubscribe: ${BASE_URL}/api/email/unsubscribe?email=${Buffer.from(to).toString("base64")}&type=webinar
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send post-webinar follow-up email
 */
export async function sendWebinarFollowUpEmail(params: {
  to: string;
  firstName?: string;
  attended: boolean;
  webinarTitle: string;
}): Promise<EmailResult> {
  const { to, firstName, attended, webinarTitle } = params;

  const emailId = generateEmailId();
  const emailType = attended ? "webinar_followup_attended" : "webinar_followup_missed";
  const displayName = firstName || "there";

  const challengeUrl = createTrackedUrl(
    `${BASE_URL}/pricing`,
    emailId,
    to,
    "join_challenge",
    emailType
  );
  // Reserved for future replay feature
  const _replayUrl = createTrackedUrl(
    `${BASE_URL}/webinar/replay`,
    emailId,
    to,
    "watch_replay",
    emailType
  );

  const trackingPixel = createTrackingPixel(emailId, to, emailType);

  if (attended) {
    const html = emailWrapper(
      `
      <h1>Proud of You, ${displayName}.</h1>
      <p>You showed up. That's more than most will ever do.</p>
      <p>You now have:</p>
      <ul class="checklist">
        <li>The 10-Minute Morning Practice template</li>
        <li>Your Five Pillar Score</li>
        <li>The Emptiness Equation framework</li>
      </ul>

      <div class="divider"></div>

      <h2>What's Next?</h2>
      <p>The 45-Day Awakening Challenge starts soon. This is where we go deeper — daily accountability, community support, and the full transformation protocol.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${challengeUrl}" class="button">Join the Challenge</a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        Limited spots. Same intimate group size as today.
      </p>

      <div class="divider"></div>

      <p>Start the practice tomorrow morning. 10 minutes. That's all it takes to begin.</p>
      <p style="color: #7dd3c0;">— Garin</p>
    `,
      trackingPixel,
      to
    );

    return sendEmail({
      to,
      subject: `You showed up. Here's what's next.`,
      html,
      text: `
Proud of You, ${displayName}.

You showed up. That's more than most will ever do.

You now have:
• The 10-Minute Morning Practice template
• Your Five Pillar Score
• The Emptiness Equation framework

WHAT'S NEXT?

The 45-Day Awakening Challenge starts soon. This is where we go deeper — daily accountability, community support, and the full transformation protocol.

Join the Challenge: ${BASE_URL}/pricing

Limited spots. Same intimate group size as today.

Start the practice tomorrow morning. 10 minutes. That's all it takes to begin.

— Garin

Unsubscribe: ${BASE_URL}/api/email/unsubscribe?email=${Buffer.from(to).toString("base64")}&type=webinar
      `.trim(),
    });
  } else {
    // Missed the webinar
    const html = emailWrapper(
      `
      <h1>You Missed It, ${displayName}.</h1>
      <p>Life happens. I get it.</p>
      <p>But here's the thing — the men who showed up today walked away with clarity most people spend years searching for.</p>

      <div class="divider"></div>

      <p>I don't do replays. That's how I keep the training valuable and ensure people actually show up.</p>
      <p>But I do want you to have a chance to experience this.</p>

      <div class="divider"></div>

      <h2>Here's What I Can Offer</h2>
      <p>The next live training is coming. When it does, you'll be the first to know.</p>
      <p>In the meantime, your Five Pillar Assessment score is still waiting. Start there.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${BASE_URL}/assessment" class="button">Take the Assessment</a>
      </div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        When you know your number, everything else makes sense.
      </p>

      <p style="color: #7dd3c0; margin-top: 24px;">— Garin</p>
    `,
      trackingPixel,
      to
    );

    return sendEmail({
      to,
      subject: `You missed ${webinarTitle} — here's what to do now`,
      html,
      text: `
You Missed It, ${displayName}.

Life happens. I get it.

But here's the thing — the men who showed up today walked away with clarity most people spend years searching for.

I don't do replays. That's how I keep the training valuable and ensure people actually show up.

But I do want you to have a chance to experience this.

HERE'S WHAT I CAN OFFER

The next live training is coming. When it does, you'll be the first to know.

In the meantime, your Five Pillar Assessment score is still waiting. Start there.

Take the Assessment: ${BASE_URL}/assessment

When you know your number, everything else makes sense.

— Garin

Unsubscribe: ${BASE_URL}/api/email/unsubscribe?email=${Buffer.from(to).toString("base64")}&type=webinar
      `.trim(),
    });
  }
}

// Export ICS generation for direct download
export { generateICSContent };
