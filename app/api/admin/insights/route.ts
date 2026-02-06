import { NextRequest, NextResponse } from "next/server";

import { generateInsights } from "@lib/services/ariaInsights";
import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(_request: NextRequest) {
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

  const serviceClient = createServiceClient();

  try {
    // Generate proactive insights
    const insights = await generateInsights(serviceClient);

    return NextResponse.json({
      success: true,
      data: insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
