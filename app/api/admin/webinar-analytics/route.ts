import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

/**
 * Webinar Analytics API
 *
 * Fetches webinar registration, attendance, and engagement metrics
 * for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "30d";

  // Calculate date range
  const now = new Date();
  const daysAgo = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  try {
    const supabase = await createClient();

    // Fetch registrations
    const { data: registrations, error: registrationsError } = await supabase
      .from("webinar_registrations")
      .select("*")
      .gte("registered_at", startDate.toISOString())
      .order("registered_at", { ascending: false });

    if (registrationsError && registrationsError.code !== "42P01") {
      // eslint-disable-next-line no-console
      console.error("Error fetching registrations:", registrationsError);
    }

    // Fetch attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from("webinar_attendance")
      .select("*")
      .gte("joined_at", startDate.toISOString())
      .order("joined_at", { ascending: false });

    if (attendanceError && attendanceError.code !== "42P01") {
      // eslint-disable-next-line no-console
      console.error("Error fetching attendance:", attendanceError);
    }

    // Fetch email tracking for webinar emails
    const emailStats = { sent: 0, opened: 0, clicked: 0 };
    try {
      const { data: emailEvents } = await supabase
        .from("email_tracking")
        .select("event_type")
        .like("email_type", "webinar_%")
        .gte("timestamp", startDate.toISOString());

      if (emailEvents) {
        emailEvents.forEach((event) => {
          if (event.event_type === "sent") emailStats.sent++;
          if (event.event_type === "opened") emailStats.opened++;
          if (event.event_type === "clicked") emailStats.clicked++;
        });
      }
    } catch {
      // Table might not exist
    }

    // Calculate metrics
    const registrationList = registrations || [];
    const attendanceList = attendance || [];

    const totalRegistrations = registrationList.length;
    const totalAttended = attendanceList.filter((a) => a.attended_live).length;
    const totalWatchedReplay = attendanceList.filter((a) => a.watched_replay).length;

    // Funnel metrics
    const attendanceRate = totalRegistrations > 0 ? (totalAttended / totalRegistrations) * 100 : 0;
    const noShowRate =
      totalRegistrations > 0
        ? ((totalRegistrations - totalAttended) / totalRegistrations) * 100
        : 0;

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    registrationList.forEach((reg) => {
      const source = reg.source || "unknown";
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });

    const sourceData = Object.entries(sourceBreakdown)
      .map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // Daily registration trend
    const dailyRegistrations: Record<string, number> = {};
    registrationList.forEach((reg) => {
      const date = new Date(reg.registered_at).toISOString().split("T")[0];
      dailyRegistrations[date] = (dailyRegistrations[date] || 0) + 1;
    });

    const trendData = Object.entries(dailyRegistrations)
      .map(([date, count]) => ({ date, registrations: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Engagement metrics from attendance
    let totalQuestions = 0;
    let totalChatMessages = 0;
    attendanceList.forEach((a) => {
      totalQuestions += a.questions_asked || 0;
      totalChatMessages += a.chat_messages_sent || 0;
    });

    // Funnel data for chart
    const funnelData = [
      { name: "Registered", value: totalRegistrations, fill: "#6366f1" },
      { name: "Attended Live", value: totalAttended, fill: "#8b5cf6" },
      { name: "Watched Replay", value: totalWatchedReplay, fill: "#a855f7" },
      { name: "Email Opened", value: emailStats.opened, fill: "#d946ef" },
      { name: "CTA Clicked", value: emailStats.clicked, fill: "#22c55e" },
    ];

    // Recent registrations
    const recentRegistrations = registrationList.slice(0, 10).map((reg) => ({
      email: reg.email,
      firstName: reg.first_name || "—",
      source: reg.source || "direct",
      registeredAt: reg.registered_at,
      attended: attendanceList.some((a) => a.email === reg.email && a.attended_live),
    }));

    const responseData = {
      overview: {
        totalRegistrations,
        totalAttended,
        totalWatchedReplay,
        attendanceRate,
        noShowRate,
        avgQuestionsPerAttendee: totalAttended > 0 ? totalQuestions / totalAttended : 0,
        avgChatMessagesPerAttendee: totalAttended > 0 ? totalChatMessages / totalAttended : 0,
      },
      funnel: funnelData,
      sources: sourceData,
      trend: trendData,
      emailPerformance: {
        sent: emailStats.sent || totalRegistrations,
        opened: emailStats.opened,
        clicked: emailStats.clicked,
        openRate: emailStats.sent > 0 ? (emailStats.opened / emailStats.sent) * 100 : 0,
        clickRate: emailStats.opened > 0 ? (emailStats.clicked / emailStats.opened) * 100 : 0,
      },
      engagement: {
        totalQuestions,
        totalChatMessages,
        questionsPerAttendee: totalAttended > 0 ? (totalQuestions / totalAttended).toFixed(1) : "0",
        chatMessagesPerAttendee:
          totalAttended > 0 ? (totalChatMessages / totalAttended).toFixed(1) : "0",
      },
      recentRegistrations,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Webinar analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
