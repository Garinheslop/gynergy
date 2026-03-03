export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

/**
 * Assessment History API
 *
 * Returns all assessment submissions for the authenticated user,
 * ordered by completion date. Used for retake comparison views.
 */

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Fetch user's email for matching (assessments may have been taken before account creation)
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email;

    // Fetch all assessments by user_id OR matching email
    const { data: assessments, error } = await serviceClient
      .from("assessment_results")
      .select(
        "id, wealth_score, health_score, relationships_score, growth_score, purpose_score, total_score, interpretation, is_retake, completed_at, created_at"
      )
      .or(`user_id.eq.${user.id},email.eq.${email}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Assessment history fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        assessments: assessments || [],
        count: assessments?.length || 0,
      },
    });
  } catch (error) {
    console.error("Assessment history API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
