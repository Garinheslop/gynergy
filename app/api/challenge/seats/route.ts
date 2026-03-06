export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createServiceClient } from "@lib/supabase-server";

/**
 * Challenge Seats API
 *
 * Returns the current enrollment count and seats remaining
 * for the upcoming or active cohort's challenge landing page.
 * Public endpoint — no auth required (landing page fetches this).
 */

const CHALLENGE_MAX_SEATS = 15;

export async function GET() {
  try {
    const supabase = createServiceClient();
    // Find the next upcoming or currently active non-personal book session
    const { data: session, error: sessionError } = await supabase
      .from("book_sessions")
      .select("id, max_enrollments, start_date, status")
      .eq("is_personal", false)
      .in("status", ["upcoming", "active"])
      .order("start_date", { ascending: true })
      .limit(1)
      .single();

    if (sessionError || !session) {
      // No upcoming/active session — return defaults
      return NextResponse.json({
        success: true,
        data: {
          totalSeats: CHALLENGE_MAX_SEATS,
          enrolled: 0,
          seatsRemaining: CHALLENGE_MAX_SEATS,
          isAlmostFull: false,
          isFull: false,
        },
      });
    }

    const maxSeats = session.max_enrollments || CHALLENGE_MAX_SEATS;

    // Count enrollments for this session
    const { count, error: countError } = await supabase
      .from("session_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id);

    if (countError) {
      console.error("Error counting enrollments:", countError);
      return NextResponse.json({
        success: true,
        data: {
          totalSeats: maxSeats,
          enrolled: 0,
          seatsRemaining: maxSeats,
          isAlmostFull: false,
          isFull: false,
        },
      });
    }

    const enrolled = count || 0;
    const seatsRemaining = Math.max(0, maxSeats - enrolled);

    return NextResponse.json({
      success: true,
      data: {
        totalSeats: maxSeats,
        enrolled,
        seatsRemaining,
        isAlmostFull: seatsRemaining <= 5,
        isFull: seatsRemaining === 0,
      },
    });
  } catch (error) {
    console.error("Challenge seats API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
