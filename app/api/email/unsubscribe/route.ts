import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

/**
 * Email Unsubscribe API
 *
 * GET /api/email/unsubscribe?email=xxx&type=webinar
 *
 * Records the unsubscribe preference and shows a confirmation page.
 * Email param is base64 encoded.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedEmail = searchParams.get("email");
  const emailType = searchParams.get("type") || "all";

  if (!encodedEmail) {
    return new NextResponse(unsubscribePage("Invalid unsubscribe link.", false), {
      headers: { "Content-Type": "text/html" },
    });
  }

  let email: string;
  try {
    email = Buffer.from(encodedEmail, "base64").toString("utf-8");
  } catch {
    return new NextResponse(unsubscribePage("Invalid unsubscribe link.", false), {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const supabase = await createClient();

    // Record unsubscribe preference
    await supabase.from("email_preferences").upsert(
      {
        email,
        [`unsubscribed_${emailType}`]: true,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
  } catch (err) {
    // Log but don't fail — even if DB write fails, show success to user
    console.error("Unsubscribe DB error:", err);
  }

  // Mask email for display: g***n@example.com
  const maskedEmail = email.replace(
    /^(.)(.*)(@.*)$/,
    (_, first, middle, domain) => `${first}${"*".repeat(Math.min(middle.length, 4))}${domain}`
  );

  return new NextResponse(unsubscribePage(maskedEmail, true), {
    headers: { "Content-Type": "text/html" },
  });
}

function unsubscribePage(emailOrMessage: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Unsubscribed" : "Error"} — GYNERGY</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #a0a0a0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { max-width: 480px; text-align: center; padding: 40px; background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #2a2a4e; border-radius: 16px; }
    .logo { font-size: 24px; font-weight: bold; letter-spacing: 0.3em; color: #7dd3c0; margin-bottom: 24px; }
    h1 { color: #fff; font-size: 20px; margin: 0 0 12px; }
    p { line-height: 1.6; margin: 0 0 16px; }
    .email { color: #7dd3c0; }
    a { color: #7dd3c0; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GYNERGY</div>
    ${
      success
        ? `<h1>You've been unsubscribed.</h1>
           <p><span class="email">${emailOrMessage}</span> will no longer receive webinar emails.</p>
           <p>Changed your mind? Just <a href="https://www.gynergy.app/webinar">register again</a> and you'll be back on the list.</p>`
        : `<h1>Something went wrong.</h1>
           <p>${emailOrMessage}</p>
           <p>Contact <a href="mailto:support@gynergy.app">support@gynergy.app</a> for help.</p>`
    }
  </div>
</body>
</html>`;
}
