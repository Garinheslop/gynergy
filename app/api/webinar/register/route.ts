import { NextResponse } from "next/server";

import { sendWebinarConfirmationEmail } from "@lib/email/webinar";
import { enrollInDrip } from "@lib/services/dripService";
import { createClient } from "@lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, webinarDate, source = "landing_page" } = body;

    // Basic email validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address", message: "Please enter a valid email" },
        { status: 400 }
      );
    }

    // Honeypot check - if 'website' field is filled, it's likely a bot
    if (body.website) {
      // Silently return success to not reveal bot detection
      return NextResponse.json({ success: true, message: "Registration complete" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFirstName = firstName?.trim() || null;

    // Validate webinar date
    const eventDate = webinarDate ? new Date(webinarDate) : new Date("2026-03-03");
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date", message: "Invalid webinar date" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert without select - anon role doesn't have SELECT permission
    const { error } = await supabase.from("webinar_registrations").insert({
      email: normalizedEmail,
      first_name: normalizedFirstName,
      webinar_date: eventDate.toISOString().split("T")[0], // Just the date part
      source,
      registered_at: new Date().toISOString(),
    });

    // Handle duplicate registration (unique constraint violation)
    if (error?.code === "23505") {
      return NextResponse.json({
        success: true,
        message: "You're already registered! Check your inbox for the confirmation email.",
        alreadyRegistered: true,
      });
    }

    // Handle table not existing yet (for development)
    if (error?.code === "42P01") {
      console.warn("webinar_registrations table does not exist yet");
      return NextResponse.json({
        success: true,
        message: "Registration complete",
        registrationId: null,
      });
    }

    if (error) {
      console.error("Webinar registration error:", error);
      return NextResponse.json(
        {
          error: "Registration failed",
          message: "Failed to complete registration. Please try again.",
        },
        { status: 500 }
      );
    }

    // Send confirmation email with calendar invite
    try {
      await sendWebinarConfirmationEmail({
        to: normalizedEmail,
        firstName: normalizedFirstName || undefined,
        webinarTitle: "The 5 Pillars of Integrated Power",
        webinarDate: eventDate,
        durationMinutes: 90,
      });
    } catch (emailError) {
      // Log but don't fail registration if email fails
      // eslint-disable-next-line no-console
      console.error("Failed to send webinar confirmation email:", emailError);
    }

    // Enroll in post-webinar drip campaign (non-blocking)
    enrollInDrip("webinar_registered", normalizedEmail, {
      firstName: normalizedFirstName,
      webinar_title: "The 5 Pillars of Integrated Power",
    }).catch((err) => console.error("Drip enrollment error:", err));

    return NextResponse.json({
      success: true,
      message: "Registration complete! Check your email for confirmation.",
    });
  } catch (error) {
    console.error("Webinar registration error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
