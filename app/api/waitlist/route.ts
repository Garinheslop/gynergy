export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

/**
 * Waitlist API
 *
 * POST: Join the waitlist when cohort is full
 * GET: Admin-only — view all waitlist entries
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, source } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Determine the next cohort month (same logic as landing page)
    const now = new Date();
    const nextMonth = now.getDate() > 15 ? now.getMonth() + 2 : now.getMonth() + 1;
    const cohortDate = new Date(now.getFullYear(), nextMonth, 1);
    const cohortMonth = cohortDate.toISOString().slice(0, 7); // "2026-04"

    const { data, error } = await supabase
      .from("waitlist")
      .upsert(
        {
          email,
          first_name: firstName || null,
          cohort_month: cohortMonth,
          source: source || "landing",
        },
        { onConflict: "email,cohort_month" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "You're on the waitlist! We'll notify you when the next cohort opens.",
      waitlistId: data.id,
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  const { data: entries, error } = await serviceClient
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: entries });
}
