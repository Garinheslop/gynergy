import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { checkRateLimit, RateLimits } from "@lib/utils/rate-limit";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/webinar/qa
 * Get questions for a webinar
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get("webinarId");
    const status = searchParams.get("status");
    const isHost = searchParams.get("isHost") === "true";

    if (!webinarId) {
      return NextResponse.json({ error: "Missing webinarId" }, { status: 400 });
    }

    let query = supabase
      .from("webinar_qa")
      .select("*")
      .eq("webinar_id", webinarId)
      .order("asked_at", { ascending: false });

    // If not host, only show approved/answered questions
    if (!isHost) {
      query = query.in("status", ["approved", "answered"]);
    } else if (status) {
      query = query.eq("status", status);
    }

    const { data: questions, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("GET /api/webinar/qa error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/webinar/qa
 * Submit a question or update question status
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "submit":
        return handleSubmitQuestion(body);
      case "approve":
        return handleUpdateStatus(body.questionId, "approved");
      case "dismiss":
        return handleUpdateStatus(body.questionId, "dismissed");
      case "answer":
        return handleAnswer(body);
      case "upvote":
        return handleUpvote(body.questionId);
      case "pin":
        return handlePin(body.questionId, body.isPinned);
      default:
        return handleSubmitQuestion(body); // Default to submit
    }
  } catch (error) {
    console.error("POST /api/webinar/qa error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Submit a new question
 */
async function handleSubmitQuestion(body: {
  webinarId: string;
  question: string;
  email: string;
  name?: string;
  userId?: string;
}) {
  const { webinarId, question, email, name, userId } = body;

  if (!webinarId || !question || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Rate limit per email
  const rateCheck = checkRateLimit(email, RateLimits.webinarQA);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Please wait before submitting another question." },
      { status: 429 }
    );
  }

  // Verify webinar exists and is live or scheduled
  const { data: webinar } = await supabase
    .from("webinars")
    .select("id, qa_enabled, status")
    .eq("id", webinarId)
    .single();

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!webinar.qa_enabled) {
    return NextResponse.json({ error: "Q&A is not enabled for this webinar" }, { status: 400 });
  }

  // Create question
  const { data: newQuestion, error } = await supabase
    .from("webinar_qa")
    .insert({
      webinar_id: webinarId,
      question,
      asked_by_email: email,
      asked_by_name: name,
      asked_by_user_id: userId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to submit question:", error);
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }

  // Update attendance record (ignore errors if RPC doesn't exist)
  try {
    await supabase.rpc("increment_questions_asked", {
      p_webinar_id: webinarId,
      p_email: email,
    });
  } catch {
    // RPC might not exist yet, ignore
  }

  return NextResponse.json({
    success: true,
    question: newQuestion,
    message: "Question submitted! The host will review it shortly.",
  });
}

/**
 * Update question status (approve/dismiss)
 */
async function handleUpdateStatus(questionId: string, status: "approved" | "dismissed") {
  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from("webinar_qa")
    .update({ status })
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    question,
  });
}

/**
 * Answer a question
 */
async function handleAnswer(body: {
  questionId: string;
  answer: string;
  answeredByUserId?: string;
}) {
  const { questionId, answer, answeredByUserId } = body;

  if (!questionId || !answer) {
    return NextResponse.json({ error: "Missing questionId or answer" }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from("webinar_qa")
    .update({
      status: "answered",
      answer_text: answer,
      answered_at: new Date().toISOString(),
      answered_by_user_id: answeredByUserId,
    })
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    question,
  });
}

/**
 * Upvote a question
 */
async function handleUpvote(questionId: string) {
  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from("webinar_qa")
    .update({
      upvotes: supabase.rpc("increment", { row_id: questionId }),
    })
    .eq("id", questionId)
    .select()
    .single();

  // Fallback: manually increment
  if (error) {
    const { data: current } = await supabase
      .from("webinar_qa")
      .select("upvotes")
      .eq("id", questionId)
      .single();

    const { data: updated } = await supabase
      .from("webinar_qa")
      .update({ upvotes: (current?.upvotes || 0) + 1 })
      .eq("id", questionId)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      question: updated,
    });
  }

  return NextResponse.json({
    success: true,
    question,
  });
}

/**
 * Pin/unpin a question
 */
async function handlePin(questionId: string, isPinned: boolean) {
  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from("webinar_qa")
    .update({ is_pinned: isPinned })
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    question,
  });
}
