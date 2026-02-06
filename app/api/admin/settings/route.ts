import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(_request: NextRequest) {
  const supabase = createClient();

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

  try {
    const { data: preferences } = await serviceClient
      .from("admin_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!preferences) {
      // Return defaults if no preferences exist
      return NextResponse.json({
        success: true,
        data: {
          defaultDateRange: "30d",
          sidebarCollapsed: false,
          ariaEnabled: true,
          ariaAutoInsights: true,
          emailNotifications: true,
          alertThresholds: {
            revenueDropPercent: 50,
            refundRatePercent: 5,
            churnRatePercent: 10,
            moderationBacklog: 10,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultDateRange: preferences.default_date_range || "30d",
        sidebarCollapsed: preferences.sidebar_collapsed || false,
        ariaEnabled: preferences.aria_enabled ?? true,
        ariaAutoInsights: preferences.aria_auto_insights ?? true,
        emailNotifications: preferences.email_notifications ?? true,
        alertThresholds: preferences.alert_thresholds || {
          revenueDropPercent: 50,
          refundRatePercent: 5,
          churnRatePercent: 10,
          moderationBacklog: 10,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

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

  try {
    const body = await request.json();

    const { error } = await serviceClient.from("admin_preferences").upsert(
      {
        user_id: user.id,
        default_date_range: body.defaultDateRange,
        sidebar_collapsed: body.sidebarCollapsed,
        aria_enabled: body.ariaEnabled,
        aria_auto_insights: body.ariaAutoInsights,
        email_notifications: body.emailNotifications,
        alert_thresholds: body.alertThresholds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Preferences saved",
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
