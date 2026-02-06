import { NextResponse } from "next/server";

import { runAllAlertChecks } from "@lib/services/adminAlerts";
import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET() {
  const supabase = createClient();

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

  try {
    const serviceClient = createServiceClient();

    // Run all alert checks
    const alerts = await runAllAlertChecks(serviceClient);

    // Sort by severity (error > warning > info > success)
    const severityOrder = { error: 0, warning: 1, info: 2, success: 3 };
    alerts.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
