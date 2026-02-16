import { NextResponse } from "next/server";

import { sendAssessmentReportEmail } from "@lib/email/assessment-report";
import { createClient } from "@lib/supabase-server";
import {
  calculateTotalScore,
  getInterpretation,
  getLowestPillar,
  calculateLeadScore,
} from "@modules/landing/data/assessment-v2-content";
import {
  calculateV3TotalScore,
  getV3Interpretation,
  getV3LowestPillar,
  calculateV3LeadScore,
  generatePatternReveals,
} from "@modules/landing/data/assessment-v3-content";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Determine if this is V3 assessment (has V3-specific fields)
    const isV3 = Boolean(
      body.vision_goal ||
      body.wealth_freedom ||
      body.health_vitality ||
      body.source === "v3_assessment"
    );

    // Extract common fields
    const {
      email,
      first_name,
      revenue_tier,
      prior_coaching,
      external_rating,
      two_am_thought,
      two_am_thought_other,
      readiness,
      priority_pillar,
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

    if (isV3) {
      // Handle V3 Assessment
      const {
        // Section 1: The Dream
        vision_goal,
        driving_motivation,
        success_definition,
        // Section 3: Pillar sliders (V3 names)
        wealth_freedom,
        wealth_relationship,
        work_life_balance,
        health_vitality,
        energy_pattern,
        body_connection,
        relationships_depth,
        presence_with_family,
        vulnerability_level,
        growth_aliveness,
        challenge_level,
        learning_mode,
        purpose_clarity,
        legacy_clarity,
        impact_feeling,
      } = body;

      // Map V3 slider scores to V2 column names
      const insertData = {
        email: normalizedEmail,
        first_name: first_name || null,
        // Section A (reality)
        revenue_tier,
        prior_coaching,
        external_rating,
        // Map V3 sliders to V2 column names
        wealth_score: wealth_freedom,
        health_score: health_vitality,
        relationships_score: relationships_depth,
        growth_score: growth_aliveness,
        purpose_score: purpose_clarity,
        // Section B (kept from V3)
        two_am_thought,
        two_am_thought_other,
        // Section D
        readiness,
        priority_pillar,
        // Store V3-specific data as JSON in a text field or separate columns
        // For now, we'll store in source to identify version
        source: "v3_assessment",
        referrer_url,
        utm_source,
        utm_medium,
        utm_campaign,
        // Timestamps
        completed_at: completed_at || new Date().toISOString(),
        time_to_complete_seconds,
      };

      const { error } = await supabase.from("assessment_results").insert(insertData);

      if (error) {
        console.error("V3 Assessment submission error:", error);

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

      // Calculate V3 derived values
      const totalScore = calculateV3TotalScore(body);
      const interpretation = getV3Interpretation(totalScore);
      const lowestPillar = getV3LowestPillar(body);
      const leadScore = calculateV3LeadScore(body);
      const patternReveals = generatePatternReveals(body);

      // Send V3 personalized email report
      const emailResult = await sendAssessmentReportEmail({
        // Map V3 to V2 field names for email template
        email: normalizedEmail,
        first_name: first_name || undefined,
        revenue_tier,
        prior_coaching,
        external_rating,
        two_am_thought,
        two_am_thought_other,
        readiness,
        priority_pillar,
        // Map V3 slider names to V2 for email
        wealth_score: wealth_freedom,
        health_score: health_vitality,
        relationships_score: relationships_depth,
        growth_score: growth_aliveness,
        purpose_score: purpose_clarity,
        // Calculated values
        totalScore,
        interpretation,
        lowestPillar,
        leadScore,
        // V3 extras for enhanced email
        v3_data: {
          vision_goal,
          driving_motivation,
          success_definition,
          wealth_relationship,
          work_life_balance,
          energy_pattern,
          body_connection,
          presence_with_family,
          vulnerability_level,
          challenge_level,
          learning_mode,
          legacy_clarity,
          impact_feeling,
          patternReveals,
        },
      });

      if (!emailResult.success) {
        console.error("Failed to send V3 assessment email:", emailResult.error);
      }

      return NextResponse.json({
        success: true,
        message: "V3 Assessment saved successfully",
        emailSent: emailResult.success,
        version: "v3",
      });
    }

    // Handle V2 Assessment (original logic)
    const {
      achievements,
      last_present,
      sacrifices,
      mask_frequency,
      body_tension,
      wealth_score,
      health_score,
      relationships_score,
      growth_score,
      purpose_score,
    } = body;

    const { error } = await supabase.from("assessment_results").insert({
      email: normalizedEmail,
      first_name: first_name || null,
      revenue_tier,
      achievements: achievements || [],
      prior_coaching,
      external_rating,
      two_am_thought,
      two_am_thought_other,
      last_present,
      sacrifices: sacrifices || [],
      mask_frequency,
      body_tension,
      wealth_score,
      health_score,
      relationships_score,
      growth_score,
      purpose_score,
      readiness,
      priority_pillar,
      source,
      referrer_url,
      utm_source,
      utm_medium,
      utm_campaign,
      completed_at: completed_at || new Date().toISOString(),
      time_to_complete_seconds,
    });

    if (error) {
      console.error("Assessment submission error:", error);

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
    }

    return NextResponse.json({
      success: true,
      message: "Assessment saved successfully",
      emailSent: emailResult.success,
      version: "v2",
    });
  } catch (error) {
    console.error("Assessment submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
