export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { WEBINAR_DATE_ONLY, WEBINAR_MAX_SEATS, WEBINAR_TITLE } from "@lib/config/webinar";
import { sendWebinarConfirmationEmail } from "@lib/email/webinar";
import { enrollInDrip } from "@lib/services/dripService";
import { syncWebinarRegistration } from "@lib/services/ghlService";
import { createClient } from "@lib/supabase-server";
import { checkRateLimit, getClientIP, rateLimitHeaders } from "@lib/utils/rate-limit";

// Rate limit: 2 registrations per 5 minutes per IP
const REGISTRATION_RATE_LIMIT = {
  limit: 2,
  windowSeconds: 300,
  prefix: "webinar-register",
} as const;

type RegistrationOutcome =
  | { status: "success" }
  | { status: "already_registered" }
  | { status: "full" }
  | { status: "table_missing" }
  | { status: "error"; message: string };

/** Atomic registration via Postgres RPC (advisory lock prevents race condition) */
async function tryAtomicRegistration(
  supabase: ReturnType<typeof createClient>,
  email: string,
  firstName: string | null,
  dateOnly: string,
  source: string
): Promise<RegistrationOutcome | null> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc("register_webinar_seat", {
      p_email: email,
      p_first_name: firstName,
      p_webinar_date: dateOnly,
      p_source: source,
      p_max_seats: WEBINAR_MAX_SEATS,
    });

    if (rpcError || !rpcResult) return null; // RPC not available — use fallback

    const result = typeof rpcResult === "string" ? JSON.parse(rpcResult) : rpcResult;
    if (result.is_full) return { status: "full" };
    if (result.already_registered) return { status: "already_registered" };
    return { status: "success" };
  } catch {
    return null; // RPC not deployed yet — fall through to legacy path
  }
}

/** Fallback registration without advisory lock (used before RPC is deployed) */
async function tryFallbackRegistration(
  supabase: ReturnType<typeof createClient>,
  email: string,
  firstName: string | null,
  dateOnly: string,
  source: string
): Promise<RegistrationOutcome> {
  const { count } = await supabase
    .from("webinar_registrations")
    .select("*", { count: "exact", head: true })
    .eq("webinar_date", dateOnly);

  if (count !== null && count >= WEBINAR_MAX_SEATS) {
    return { status: "full" };
  }

  const { error } = await supabase.from("webinar_registrations").insert({
    email,
    first_name: firstName,
    webinar_date: dateOnly,
    source,
    registered_at: new Date().toISOString(),
  });

  if (error?.code === "23505") return { status: "already_registered" };
  if (error?.code === "42P01") return { status: "table_missing" };
  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

/** Fire-and-forget post-registration side effects */
function triggerPostRegistration(
  email: string,
  firstName: string | null,
  eventDate: Date,
  source: string
) {
  sendWebinarConfirmationEmail({
    to: email,
    firstName: firstName || undefined,
    webinarTitle: WEBINAR_TITLE,
    webinarDate: eventDate,
    durationMinutes: 90,
  }).catch((err) => console.error("Failed to send webinar confirmation email:", err));

  enrollInDrip("webinar_registered", email, {
    firstName,
    webinar_title: WEBINAR_TITLE,
  }).catch((err) => console.error("Drip enrollment error:", err));

  syncWebinarRegistration({
    email,
    firstName: firstName || undefined,
    webinarTitle: WEBINAR_TITLE,
    source,
  }).catch((err) => console.error("[ghl] Webinar sync error:", err));
}

export async function POST(request: Request) {
  try {
    // Rate limit check
    const clientIP = getClientIP(request);
    const rateCheck = checkRateLimit(clientIP, REGISTRATION_RATE_LIMIT);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests", message: "Please wait a moment before trying again." },
        { status: 429, headers: rateLimitHeaders(rateCheck) }
      );
    }

    const body = await request.json();
    const { email, firstName, webinarDate, source = "landing_page" } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address", message: "Please enter a valid email" },
        { status: 400 }
      );
    }

    // Honeypot check — silently succeed to not reveal bot detection
    if (body.website) {
      return NextResponse.json({ success: true, message: "Registration complete" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFirstName = firstName?.trim() || null;

    const eventDate = webinarDate ? new Date(webinarDate) : new Date(WEBINAR_DATE_ONLY);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date", message: "Invalid webinar date" },
        { status: 400 }
      );
    }

    const dateOnly = eventDate.toISOString().split("T")[0];
    const supabase = createClient();

    // Try atomic RPC first, fall back to non-atomic path
    const outcome =
      (await tryAtomicRegistration(
        supabase,
        normalizedEmail,
        normalizedFirstName,
        dateOnly,
        source
      )) ??
      (await tryFallbackRegistration(
        supabase,
        normalizedEmail,
        normalizedFirstName,
        dateOnly,
        source
      ));

    switch (outcome.status) {
      case "full":
        return NextResponse.json(
          {
            error: "Webinar is full",
            message: "This webinar has reached capacity. Join the waitlist for the next one.",
          },
          { status: 409 }
        );
      case "already_registered":
        return NextResponse.json({
          success: true,
          message: "You're already registered! Check your inbox for the confirmation email.",
          alreadyRegistered: true,
        });
      case "table_missing":
        console.warn("webinar_registrations table does not exist yet");
        return NextResponse.json({ success: true, message: "Registration complete" });
      case "error":
        console.error("Webinar registration error:", outcome.message);
        return NextResponse.json(
          {
            error: "Registration failed",
            message: "Failed to complete registration. Please try again.",
          },
          { status: 500 }
        );
      case "success":
        triggerPostRegistration(normalizedEmail, normalizedFirstName, eventDate, source);
        return NextResponse.json({
          success: true,
          message: "Registration complete! Check your email for confirmation.",
        });
    }
  } catch (error) {
    console.error("Webinar registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
