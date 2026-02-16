import { NextRequest, NextResponse } from "next/server";

import { sendWebinarReminderEmail } from "@lib/email/webinar";
import { createClient } from "@lib/supabase-server";

/**
 * Webinar Reminder Cron Job
 *
 * This endpoint should be called periodically (e.g., every hour) by a cron service.
 * It checks for upcoming webinars and sends reminder emails:
 * - 24 hours before: Send 24h reminder to all registrants
 * - 1 hour before: Send 1h reminder to all registrants
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/webinar-reminders",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 */

// Verify the request is from a cron service (optional security)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Optional: Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const results = {
      checked: 0,
      sent24h: 0,
      sent1h: 0,
      errors: [] as string[],
    };

    // Get upcoming webinars (scheduled within next 25 hours)
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: webinars, error: webinarError } = await supabase
      .from("webinars")
      .select("id, title, scheduled_start, status")
      .gte("scheduled_start", now.toISOString())
      .lte("scheduled_start", twentyFiveHoursFromNow.toISOString())
      .eq("status", "scheduled");

    if (webinarError) {
      // If table doesn't exist, try with hardcoded webinar date
      if (webinarError.code === "42P01") {
        // Use hardcoded webinar date for now
        const hardcodedWebinar = {
          id: "default",
          title: "The 5 Pillars of Integrated Power",
          scheduled_start: new Date("2026-03-03T17:30:00-08:00"),
        };

        const hoursUntil =
          (hardcodedWebinar.scheduled_start.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if we should send reminders
        if (hoursUntil > 23 && hoursUntil <= 25) {
          await sendReminders(supabase, hardcodedWebinar, "24h", results);
        } else if (hoursUntil > 0.5 && hoursUntil <= 1.5) {
          await sendReminders(supabase, hardcodedWebinar, "1h", results);
        }

        return NextResponse.json({
          success: true,
          message: "Reminder check complete (using hardcoded date)",
          results,
        });
      }

      // eslint-disable-next-line no-console
      console.error("Error fetching webinars:", webinarError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch webinars" },
        { status: 500 }
      );
    }

    // Process each upcoming webinar
    for (const webinar of webinars || []) {
      results.checked++;
      const webinarDate = new Date(webinar.scheduled_start);
      const hoursUntil = (webinarDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // 24-hour reminder window (23-25 hours before)
      if (hoursUntil > 23 && hoursUntil <= 25) {
        await sendReminders(supabase, webinar, "24h", results);
      }

      // 1-hour reminder window (0.5-1.5 hours before)
      if (hoursUntil > 0.5 && hoursUntil <= 1.5) {
        await sendReminders(supabase, webinar, "1h", results);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reminder check complete",
      results,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Webinar reminder cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

interface WebinarInfo {
  id: string;
  title: string;
  scheduled_start: Date | string;
}

interface Results {
  checked: number;
  sent24h: number;
  sent1h: number;
  errors: string[];
}

async function sendReminders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  webinar: WebinarInfo,
  reminderType: "24h" | "1h",
  results: Results
) {
  const webinarDate =
    webinar.scheduled_start instanceof Date
      ? webinar.scheduled_start
      : new Date(webinar.scheduled_start);

  const webinarDateStr = webinarDate.toISOString().split("T")[0];

  // Get registrations that haven't received this reminder yet
  const { data: registrations, error: regError } = await supabase
    .from("webinar_registrations")
    .select("email, first_name")
    .eq("webinar_date", webinarDateStr);

  if (regError) {
    if (regError.code !== "42P01") {
      results.errors.push(`Failed to fetch registrations: ${regError.message}`);
    }
    return;
  }

  // Check which registrants have already received this reminder
  const { data: sentReminders } = await supabase
    .from("email_tracking")
    .select("recipient_email")
    .eq("email_type", `webinar_reminder_${reminderType}`)
    .gte("timestamp", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()); // Last 2 hours

  const sentEmails = new Set(sentReminders?.map((r) => r.recipient_email) || []);

  // Check if registrants have completed assessment (for personalized reminder)
  for (const reg of registrations || []) {
    if (sentEmails.has(reg.email)) {
      continue; // Already sent reminder
    }

    // Check if they completed assessment
    let assessmentCompleted = false;
    let assessmentScore: number | undefined;

    try {
      const { data: assessment } = await supabase
        .from("assessment_results")
        .select("wealth_score, health_score, relationships_score, growth_score, purpose_score")
        .eq("email", reg.email)
        .single();

      if (assessment) {
        assessmentCompleted = true;
        assessmentScore =
          (assessment.wealth_score || 0) +
          (assessment.health_score || 0) +
          (assessment.relationships_score || 0) +
          (assessment.growth_score || 0) +
          (assessment.purpose_score || 0);
      }
    } catch {
      // Assessment table might not exist or no result
    }

    // Send reminder
    try {
      const result = await sendWebinarReminderEmail({
        to: reg.email,
        firstName: reg.first_name || undefined,
        webinarTitle: webinar.title,
        webinarDate,
        reminderType,
        assessmentCompleted,
        assessmentScore,
      });

      if (result.success) {
        if (reminderType === "24h") {
          results.sent24h++;
        } else {
          results.sent1h++;
        }
      } else {
        results.errors.push(`Failed to send to ${reg.email}: ${result.error}`);
      }
    } catch (error) {
      results.errors.push(`Error sending to ${reg.email}: ${error}`);
    }
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
