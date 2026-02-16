import { NextResponse } from "next/server";

import { sendAssessmentReportEmail } from "@lib/email/assessment-report";
import { createClient } from "@lib/supabase-server";
import {
  calculateTotalScore,
  getInterpretation,
  getLowestPillar,
  calculateLeadScore,
} from "@modules/landing/data/assessment-v2-content";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extract all assessment data
    const {
      email,
      first_name,
      // Section A
      revenue_tier,
      achievements,
      prior_coaching,
      external_rating,
      // Section B
      two_am_thought,
      two_am_thought_other,
      last_present,
      sacrifices,
      mask_frequency,
      body_tension,
      // Section C
      wealth_score,
      health_score,
      relationships_score,
      growth_score,
      purpose_score,
      // Section D
      readiness,
      priority_pillar,
      // Meta
      completed_at,
      time_to_complete_seconds,
      source = "direct",
      referrer_url,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body;

    // Validate required fields
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createClient();

    // Insert assessment result (without select to avoid RLS issues)
    const { error } = await supabase.from("assessment_results").insert({
      email: normalizedEmail,
      first_name: first_name || null,
      // Section A
      revenue_tier,
      achievements: achievements || [],
      prior_coaching,
      external_rating,
      // Section B
      two_am_thought,
      two_am_thought_other,
      last_present,
      sacrifices: sacrifices || [],
      mask_frequency,
      body_tension,
      // Section C
      wealth_score,
      health_score,
      relationships_score,
      growth_score,
      purpose_score,
      // Section D
      readiness,
      priority_pillar,
      // Tracking
      source,
      referrer_url,
      utm_source,
      utm_medium,
      utm_campaign,
      // Timestamps
      completed_at: completed_at || new Date().toISOString(),
      time_to_complete_seconds,
    });

    if (error) {
      console.error("Assessment submission error:", error);

      // Handle duplicate (same email within short time)
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Assessment already recorded",
          duplicate: true,
        });
      }

      return NextResponse.json(
        { error: "Failed to save assessment", details: error.message },
        { status: 500 }
      );
    }

    // Calculate derived values for the email report
    const totalScore = calculateTotalScore(body);
    const interpretation = getInterpretation(totalScore);
    const lowestPillar = getLowestPillar(body);
    const leadScore = calculateLeadScore(body);

    // Send personalized email report
    const emailResult = await sendAssessmentReportEmail({
      ...body,
      email: normalizedEmail,
      first_name: first_name || undefined,
      totalScore,
      interpretation,
      lowestPillar,
      leadScore,
    });

    if (!emailResult.success) {
      console.error("Failed to send assessment email:", emailResult.error);
      // Don't fail the request - assessment is saved, email can be retried
    }

    return NextResponse.json({
      success: true,
      message: "Assessment saved successfully",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Assessment submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
