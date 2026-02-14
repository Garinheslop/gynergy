import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { email, source = "exit_intent" } = await request.json();

    // Basic email validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createClient();

    const { error } = await supabase.from("landing_leads").insert({
      email: normalizedEmail,
      source,
      captured_at: new Date().toISOString(),
    });

    // Handle duplicate email (unique constraint violation)
    if (error?.code === "23505") {
      // Still return success - don't reveal existing emails
      return NextResponse.json({ success: true, message: "Email registered" });
    }

    // Handle table not existing yet (for development)
    if (error?.code === "42P01") {
      // Table doesn't exist - log and return success anyway
      console.warn("landing_leads table does not exist yet");
      return NextResponse.json({ success: true, message: "Email captured" });
    }

    if (error) {
      console.error("Email capture error:", error);
      return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Email captured successfully" });
  } catch (error) {
    console.error("Email capture error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
