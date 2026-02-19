import { NextRequest, NextResponse } from "next/server";

import { WEBINAR_DATE_ONLY, WEBINAR_MAX_SEATS } from "@lib/config/webinar";
import { createClient } from "@lib/supabase-server";

/**
 * Webinar Seats API
 *
 * Returns the current registration count and seats remaining
 * for the webinar landing page.
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const webinarDate = searchParams.get("date") || WEBINAR_DATE_ONLY;

  try {
    const supabase = await createClient();

    // Count registrations for this webinar date
    const { count, error } = await supabase
      .from("webinar_registrations")
      .select("*", { count: "exact", head: true })
      .eq("webinar_date", webinarDate);

    if (error) {
      // If table doesn't exist, return default values
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          data: {
            totalSeats: WEBINAR_MAX_SEATS,
            registered: 0,
            seatsRemaining: WEBINAR_MAX_SEATS,
            percentageFilled: 0,
          },
        });
      }

      // eslint-disable-next-line no-console
      console.error("Error fetching seat count:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch seat count" },
        { status: 500 }
      );
    }

    const registered = count || 0;
    const seatsRemaining = Math.max(0, WEBINAR_MAX_SEATS - registered);
    const percentageFilled = Math.round((registered / WEBINAR_MAX_SEATS) * 100);

    return NextResponse.json({
      success: true,
      data: {
        totalSeats: WEBINAR_MAX_SEATS,
        registered,
        seatsRemaining,
        percentageFilled,
        // Add urgency flags
        isAlmostFull: seatsRemaining <= 10,
        isFull: seatsRemaining === 0,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Seats API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
