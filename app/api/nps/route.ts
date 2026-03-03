export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

/**
 * NPS (Net Promoter Score) API
 *
 * POST — Submit an NPS response (authenticated users only)
 * GET  — Retrieve aggregate NPS data (admin only)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { score, feedback, context } = body;

    // Validate score (1-10)
    if (!score || typeof score !== "number" || score < 1 || score > 10) {
      return NextResponse.json({ error: "Score must be between 1 and 10" }, { status: 400 });
    }

    // Validate context
    const validContexts = ["day_45", "day_75", "general"];
    if (context && !validContexts.includes(context)) {
      return NextResponse.json({ error: "Invalid context" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient.from("nps_responses").insert({
      user_id: user.id,
      score,
      feedback: feedback || null,
      context: context || "general",
    });

    if (error) {
      console.error("NPS insert error:", error);
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("NPS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aggregate NPS data
    const { data: responses, error } = await serviceClient
      .from("nps_responses")
      .select("score, feedback, context, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("NPS fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch NPS data" }, { status: 500 });
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json({
        success: true,
        data: { average: 0, count: 0, promoters: 0, detractors: 0, npsScore: 0, recent: [] },
      });
    }

    const scores = responses.map((r) => r.score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / scores.length) * 100);

    return NextResponse.json({
      success: true,
      data: {
        average: Math.round(average * 10) / 10,
        count: scores.length,
        promoters,
        detractors,
        npsScore,
        recent: responses.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("NPS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
