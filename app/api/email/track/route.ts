import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// 1x1 transparent GIF for open tracking
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * Email Tracking API
 *
 * Handles two types of requests:
 * 1. Open tracking: GET /api/email/track?type=open&id=xxx&email=xxx
 *    Returns a 1x1 transparent GIF
 *
 * 2. Click tracking: GET /api/email/track?type=click&id=xxx&email=xxx&url=xxx&name=xxx
 *    Records click and redirects to destination URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const type = searchParams.get("type"); // 'open' or 'click'
  const emailId = searchParams.get("id"); // Unique email ID
  const recipientEmail = searchParams.get("email"); // Recipient email (base64 encoded)
  const emailType = searchParams.get("et") || "unknown"; // Email type

  // For click tracking
  const destinationUrl = searchParams.get("url"); // Destination URL (base64 encoded)
  const linkName = searchParams.get("name"); // Link identifier

  // Validate required params
  if (!type || !emailId) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  // Decode email if provided
  const decodedEmail = recipientEmail
    ? Buffer.from(recipientEmail, "base64").toString("utf-8")
    : null;

  // Record the event
  try {
    const supabase = await createClient();

    const trackingData = {
      email_id: emailId,
      email_type: emailType,
      recipient_email: decodedEmail || "unknown",
      event_type: type,
      link_url: destinationUrl ? Buffer.from(destinationUrl, "base64").toString("utf-8") : null,
      link_name: linkName || null,
      user_agent: request.headers.get("user-agent") || null,
      ip_hash: hashIP(request.headers.get("x-forwarded-for") || "unknown"),
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from("email_tracking").insert(trackingData);

    if (error) {
      // Log but don't fail - tracking should never break the user experience
      // eslint-disable-next-line no-console
      console.error("Email tracking error:", error);

      // If table doesn't exist, just log
      if (error.code === "42P01") {
        // eslint-disable-next-line no-console
        console.log("[Email Tracking]", type, emailId, linkName);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Email tracking error:", error);
  }

  // Handle response based on type
  if (type === "open") {
    // Return 1x1 transparent GIF
    return new NextResponse(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  if (type === "click" && destinationUrl) {
    // Decode and redirect to destination
    const decodedUrl = Buffer.from(destinationUrl, "base64").toString("utf-8");

    // Add UTM parameters if not already present
    const url = new URL(decodedUrl);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.set("utm_source", "email");
      url.searchParams.set("utm_medium", "email");
      url.searchParams.set("utm_campaign", `${emailType}_${emailId}`);
      if (linkName) {
        url.searchParams.set("utm_content", linkName);
      }
    }

    return NextResponse.redirect(url.toString(), 302);
  }

  // Fallback
  return new NextResponse("OK", { status: 200 });
}

/**
 * Simple hash function for IP anonymization
 */
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
