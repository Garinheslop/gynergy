import { NextRequest, NextResponse } from "next/server";

import { sendStreakReminderEmail } from "@lib/email";
import { createServiceClient } from "@lib/supabase-server";

/**
 * Streak Reminder Cron Job
 *
 * Runs daily at 9 PM UTC. Sends email reminders to users who:
 * - Have an active streak (morning_streak > 0)
 * - Haven't completed today's morning journal
 * - Have streak_warning_enabled and email_enabled in their notification preferences
 *
 * Vercel Cron: configured in vercel.json
 */

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const today = new Date().toISOString().split("T")[0];

    const results = {
      eligible: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get users with active streaks who want streak warnings
    const { data: enrollments, error: enrollError } = await supabase
      .from("session_enrollments")
      .select(
        `
        user_id,
        morning_streak,
        enrollment_date,
        users!inner ( id, email, first_name )
      `
      )
      .gt("morning_streak", 0);

    if (enrollError) {
      // Table may not exist yet
      if (enrollError.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "session_enrollments table not found, skipping",
        });
      }
      console.error("Error fetching enrollments:", enrollError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch enrollments" },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active streaks found",
        results,
      });
    }

    // Get notification preferences for these users
    const userIds = enrollments.map((e) => e.user_id);
    const { data: preferences } = await supabase
      .from("user_notification_preferences")
      .select("user_id, streak_warning_enabled, email_enabled")
      .in("user_id", userIds);

    const prefMap = new Map((preferences || []).map((p) => [p.user_id, p]));

    // Get today's journal entries to check who already completed
    const { data: todayEntries } = await supabase
      .from("journal_entries")
      .select("user_id")
      .eq("date", today)
      .eq("journal_type", "morning")
      .in("user_id", userIds);

    const completedToday = new Set((todayEntries || []).map((e) => e.user_id));

    // Check which users already received a streak reminder today
    const { data: sentToday } = await supabase
      .from("email_tracking")
      .select("recipient_email")
      .eq("email_type", "streak_reminder")
      .gte("timestamp", `${today}T00:00:00Z`);

    const alreadySent = new Set((sentToday || []).map((r) => r.recipient_email));

    // Process each enrollment
    for (const enrollment of enrollments) {
      const user = enrollment.users as unknown as {
        id: string;
        email: string;
        first_name: string;
      };

      if (!user?.email) continue;

      results.eligible++;

      // Skip if already completed today
      if (completedToday.has(enrollment.user_id)) {
        results.skipped++;
        continue;
      }

      // Skip if already sent reminder today
      if (alreadySent.has(user.email)) {
        results.skipped++;
        continue;
      }

      // Check notification preferences (default to enabled)
      const pref = prefMap.get(enrollment.user_id);
      if (pref && (!pref.streak_warning_enabled || !pref.email_enabled)) {
        results.skipped++;
        continue;
      }

      // Calculate day number from enrollment
      const enrollmentDate = new Date(enrollment.enrollment_date);
      const dayNumber =
        Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const firstName = user.first_name || user.email.split("@")[0];

      try {
        const result = await sendStreakReminderEmail({
          to: user.email,
          firstName,
          currentStreak: enrollment.morning_streak,
          dayNumber,
        });

        if (result.success) {
          results.sent++;
        } else {
          results.errors.push(`Failed: ${user.email} - ${result.error}`);
        }
      } catch (err) {
        results.errors.push(`Error: ${user.email} - ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Streak reminder check complete",
      results,
    });
  } catch (error) {
    console.error("Streak reminder cron error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
