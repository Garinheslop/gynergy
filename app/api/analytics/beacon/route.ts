import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

/**
 * Beacon API endpoint for reliable analytics delivery
 *
 * This endpoint receives analytics events via navigator.sendBeacon(),
 * which is designed to reliably send data even during page unload.
 *
 * Used for:
 * - Assessment abandonment tracking
 * - Error reporting
 * - Critical conversion events
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { event, properties, timestamp } = body;

    if (!event) {
      return NextResponse.json({ error: "Event name required" }, { status: 400 });
    }

    // Log to Supabase analytics table (create if needed)
    const supabase = await createClient();

    const { error } = await supabase.from("analytics_events").insert({
      event_name: event,
      properties: properties || {},
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      user_agent: request.headers.get("user-agent") || null,
      ip_hash: hashIP(request.headers.get("x-forwarded-for") || "unknown"),
    });

    if (error) {
      // Log but don't fail - analytics should never break the user experience
      // eslint-disable-next-line no-console
      console.error("Analytics beacon error:", error);

      // If table doesn't exist, just log to console for now
      if (error.code === "42P01") {
        // eslint-disable-next-line no-console
        console.log("[Analytics Beacon]", event, properties);
        return NextResponse.json({ success: true, logged: "console" });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Never fail on analytics - just log and return success
    // eslint-disable-next-line no-console
    console.error("Analytics beacon parse error:", error);
    return NextResponse.json({ success: true, error: "parse_failed" });
  }
}

/**
 * Simple hash function for IP anonymization
 * We don't store raw IPs, just a hash for deduplication
 */
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
