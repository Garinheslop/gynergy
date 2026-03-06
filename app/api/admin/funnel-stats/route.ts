export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

/**
 * Marketing Funnel Stats API
 *
 * Aggregates conversion data across the full funnel:
 * Assessment → Webinar → Purchase
 * Plus email campaign performance.
 */

export async function GET(request: NextRequest) {
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
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "30d";

  // Calculate date range
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range] || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Parallel queries for funnel data
    const [
      assessmentsResult,
      webinarRegsResult,
      purchasesResult,
      emailTrackingResult,
      dripEnrollmentsResult,
    ] = await Promise.all([
      // Total assessments in range
      serviceClient
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate),

      // Webinar registrations in range
      serviceClient
        .from("webinar_registrations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate),

      // Purchases in range (challenge purchases via session_enrollments)
      serviceClient
        .from("session_enrollments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate),

      // Email tracking events in range
      serviceClient
        .from("email_tracking")
        .select("email_type, event_type")
        .gte("timestamp", startDate),

      // Active drip enrollments
      serviceClient.from("drip_enrollments").select("campaign_id, status").eq("status", "active"),
    ]);

    const assessments = assessmentsResult.count || 0;
    const webinarRegs = webinarRegsResult.count || 0;
    const purchases = purchasesResult.count || 0;

    // Calculate email metrics
    const emailEvents = emailTrackingResult.data || [];
    const emailsSent = emailEvents.filter((e) => e.event_type === "sent").length;
    const emailsOpened = emailEvents.filter((e) => e.event_type === "open").length;
    const emailsClicked = emailEvents.filter((e) => e.event_type === "click").length;
    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    const clickRate = emailsOpened > 0 ? (emailsClicked / emailsOpened) * 100 : 0;

    // Email performance by campaign type
    const campaignPerformance: Record<string, { sent: number; opened: number; clicked: number }> =
      {};
    for (const event of emailEvents) {
      const campaign = event.email_type || "unknown";
      if (!campaignPerformance[campaign]) {
        campaignPerformance[campaign] = { sent: 0, opened: 0, clicked: 0 };
      }
      if (event.event_type === "sent") campaignPerformance[campaign].sent++;
      if (event.event_type === "open") campaignPerformance[campaign].opened++;
      if (event.event_type === "click") campaignPerformance[campaign].clicked++;
    }

    // Format campaign data for charts
    const emailCampaignData = Object.entries(campaignPerformance)
      .map(([name, data]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        sent: data.sent,
        opened: data.opened,
        clicked: data.clicked,
        openRate: data.sent > 0 ? Number(((data.opened / data.sent) * 100).toFixed(1)) : 0,
        clickRate: data.opened > 0 ? Number(((data.clicked / data.opened) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 10); // Top 10 campaigns

    // Active drip enrollments count
    const activeDripEnrollments = dripEnrollmentsResult.data?.length || 0;

    // Revenue estimate (purchases × $997)
    const estimatedRevenue = purchases * 997;

    return NextResponse.json({
      success: true,
      data: {
        funnel: {
          assessments,
          webinarRegistrations: webinarRegs,
          purchases,
          conversionRates: {
            assessmentToWebinar:
              assessments > 0 ? Number(((webinarRegs / assessments) * 100).toFixed(1)) : 0,
            webinarToPurchase:
              webinarRegs > 0 ? Number(((purchases / webinarRegs) * 100).toFixed(1)) : 0,
            assessmentToPurchase:
              assessments > 0 ? Number(((purchases / assessments) * 100).toFixed(1)) : 0,
          },
        },
        email: {
          totalSent: emailsSent,
          totalOpened: emailsOpened,
          totalClicked: emailsClicked,
          openRate: Number(openRate.toFixed(1)),
          clickRate: Number(clickRate.toFixed(1)),
          campaignData: emailCampaignData,
        },
        drip: {
          activeEnrollments: activeDripEnrollments,
        },
        revenue: {
          estimated: estimatedRevenue,
          purchases,
        },
        range,
      },
    });
  } catch (error) {
    console.error("Error fetching funnel stats:", error);
    return NextResponse.json({ error: "Failed to fetch funnel data" }, { status: 500 });
  }
}
