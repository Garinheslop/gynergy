import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { sendWebinarFollowUpEmail } from "@lib/email/webinar";

/**
 * Webinar Follow-Up Cron Job
 *
 * Runs every hour. Finds webinars that ended 2-6 hours ago
 * and sends follow-up emails:
 * - Attended: "You showed up" + challenge upsell
 * - Missed: "You missed it" + next training CTA
 *
 * Vercel Cron: Added to vercel.json
 * schedule: "0 * * * *" (every hour)
 */

const CRON_SECRET = process.env.CRON_SECRET;

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = {
      webinarsChecked: 0,
      attendedEmails: 0,
      missedEmails: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Find webinars that ended 2-6 hours ago (window to catch them once)
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const { data: webinars, error: webinarError } = await supabase
      .from("webinars")
      .select("id, title, slug, actual_end")
      .eq("status", "ended")
      .gte("actual_end", sixHoursAgo.toISOString())
      .lte("actual_end", twoHoursAgo.toISOString());

    if (webinarError) {
      console.error("Error fetching ended webinars:", webinarError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch webinars" },
        { status: 500 }
      );
    }

    if (!webinars?.length) {
      return NextResponse.json({
        success: true,
        message: "No recently ended webinars found",
        results,
      });
    }

    for (const webinar of webinars) {
      results.webinarsChecked++;

      // Get the webinar date for registration lookup
      const webinarDate = webinar.actual_end
        ? new Date(webinar.actual_end).toISOString().split("T")[0]
        : null;

      // Get all registrations for this webinar
      const { data: registrations, error: regError } = await supabase
        .from("webinar_registrations")
        .select("email, first_name")
        .eq("webinar_date", webinarDate);

      if (regError) {
        results.errors.push(
          `Failed to fetch registrations for ${webinar.slug}: ${regError.message}`
        );
        continue;
      }

      // Get attendance records to know who actually showed up
      const { data: attendances } = await supabase
        .from("webinar_attendance")
        .select("email, attended_live")
        .eq("webinar_id", webinar.id);

      const attendedEmails = new Set(
        (attendances || []).filter((a) => a.attended_live).map((a) => a.email)
      );

      // Check which follow-ups have already been sent (dedup)
      const { data: sentFollowups } = await supabase
        .from("email_tracking")
        .select("recipient_email")
        .in("email_type", ["webinar_followup_attended", "webinar_followup_missed"])
        .gte("timestamp", sixHoursAgo.toISOString());

      const alreadySent = new Set(sentFollowups?.map((r) => r.recipient_email) || []);

      // Send follow-up to each registrant
      for (const reg of registrations || []) {
        if (alreadySent.has(reg.email)) {
          results.skipped++;
          continue;
        }

        const attended = attendedEmails.has(reg.email);

        try {
          const result = await sendWebinarFollowUpEmail({
            to: reg.email,
            firstName: reg.first_name || undefined,
            attended,
            webinarTitle: webinar.title,
          });

          if (result.success) {
            if (attended) {
              results.attendedEmails++;
            } else {
              results.missedEmails++;
            }
          } else {
            results.errors.push(`Failed to send to ${reg.email}: ${result.error}`);
          }
        } catch (error) {
          results.errors.push(`Error sending to ${reg.email}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up emails sent",
      results,
    });
  } catch (error) {
    console.error("Webinar follow-up cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
