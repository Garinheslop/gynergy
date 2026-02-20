import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { checkRateLimit } from "@lib/utils/rate-limit";
import type { HandRaiseRow, GroupSessionRow } from "@resources/types/session";
import { handRaiseRowToHandRaise } from "@resources/types/session";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUser(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function isHostOrCoHost(session: GroupSessionRow, userId: string): boolean {
  return session.host_id === userId || (session.co_host_ids || []).includes(userId);
}

const HAND_RAISE_RATE_LIMIT = { limit: 3, windowSeconds: 60, prefix: "session-hand" };

// ============================================================================
// GET: Fetch hand raise queue
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("hand_raises")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["raised", "acknowledged", "active"])
    .order("raised_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch hand raises" }, { status: 500 });
  }

  return NextResponse.json({
    handRaises: (data || []).map((row: HandRaiseRow) => handRaiseRowToHandRaise(row)),
  });
}

// ============================================================================
// POST: Hand raise actions
// ============================================================================

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "raise":
      return handleRaise(user.id, body);
    case "lower":
      return handleLower(user.id, body);
    case "acknowledge":
      return handleAcknowledge(user.id, body);
    case "activate":
      return handleActivate(user.id, body);
    case "complete":
      return handleComplete(user.id, body);
    case "dismiss":
      return handleDismiss(user.id, body);
    case "extend":
      return handleExtend(user.id, body);
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// ============================================================================
// Handlers
// ============================================================================

async function handleRaise(
  userId: string,
  body: { sessionId: string; topic?: string; userName?: string }
) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Rate limit
  const rateCheck = checkRateLimit(userId, HAND_RAISE_RATE_LIMIT);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Please wait before raising your hand again" },
      { status: 429 }
    );
  }

  const admin = getAdminClient();

  // Check if user already has an active raise
  const { data: existing } = await admin
    .from("hand_raises")
    .select("id")
    .eq("session_id", body.sessionId)
    .eq("user_id", userId)
    .in("status", ["raised", "acknowledged", "active"])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "You already have your hand raised" }, { status: 409 });
  }

  const { data, error } = await admin
    .from("hand_raises")
    .insert({
      session_id: body.sessionId,
      user_id: userId,
      status: "raised",
      user_name: body.userName || null,
      topic: body.topic || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to raise hand:", error);
    return NextResponse.json({ error: "Failed to raise hand" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    handRaise: handRaiseRowToHandRaise(data),
  });
}

async function handleLower(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  await admin
    .from("hand_raises")
    .update({ status: "dismissed", completed_at: new Date().toISOString() })
    .eq("session_id", body.sessionId)
    .eq("user_id", userId)
    .in("status", ["raised", "acknowledged"]);

  return NextResponse.json({ success: true });
}

async function handleAcknowledge(userId: string, body: { sessionId: string; handRaiseId: string }) {
  if (!body.sessionId || !body.handRaiseId) {
    return NextResponse.json({ error: "sessionId and handRaiseId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can acknowledge hand raises" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("hand_raises")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .eq("status", "raised")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Hand raise not found or already processed" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    handRaise: handRaiseRowToHandRaise(data),
  });
}

async function handleActivate(userId: string, body: { sessionId: string; handRaiseId: string }) {
  if (!body.sessionId || !body.handRaiseId) {
    return NextResponse.json({ error: "sessionId and handRaiseId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can activate hot seats" }, { status: 403 });
  }

  // Deactivate any currently active hot seat
  await admin
    .from("hand_raises")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      hot_seat_ended_at: new Date().toISOString(),
    })
    .eq("session_id", body.sessionId)
    .eq("status", "active");

  // Activate the selected hand raise
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("hand_raises")
    .update({
      status: "active",
      active_at: now,
      hot_seat_started_at: now,
      hot_seat_duration_seconds: session.hot_seat_duration_seconds || 300,
    })
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .in("status", ["raised", "acknowledged"])
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Hand raise not found or already processed" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    handRaise: handRaiseRowToHandRaise(data),
  });
}

async function handleComplete(userId: string, body: { sessionId: string; handRaiseId: string }) {
  if (!body.sessionId || !body.handRaiseId) {
    return NextResponse.json({ error: "sessionId and handRaiseId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can complete hot seats" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("hand_raises")
    .update({
      status: "completed",
      completed_at: now,
      hot_seat_ended_at: now,
    })
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: "Failed to complete hot seat" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleDismiss(userId: string, body: { sessionId: string; handRaiseId: string }) {
  if (!body.sessionId || !body.handRaiseId) {
    return NextResponse.json({ error: "sessionId and handRaiseId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can dismiss hand raises" }, { status: 403 });
  }

  await admin
    .from("hand_raises")
    .update({
      status: "dismissed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .in("status", ["raised", "acknowledged"]);

  return NextResponse.json({ success: true });
}

async function handleExtend(
  userId: string,
  body: { sessionId: string; handRaiseId: string; extraSeconds: number }
) {
  if (!body.sessionId || !body.handRaiseId || !body.extraSeconds) {
    return NextResponse.json(
      { error: "sessionId, handRaiseId, and extraSeconds are required" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can extend hot seats" }, { status: 403 });
  }

  // Get current hand raise
  const { data: handRaise } = await admin
    .from("hand_raises")
    .select("time_extended_seconds")
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .eq("status", "active")
    .single();

  if (!handRaise) {
    return NextResponse.json({ error: "Active hot seat not found" }, { status: 404 });
  }

  const newExtended = (handRaise.time_extended_seconds || 0) + body.extraSeconds;

  const { data, error } = await admin
    .from("hand_raises")
    .update({ time_extended_seconds: newExtended })
    .eq("id", body.handRaiseId)
    .eq("session_id", body.sessionId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to extend time" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    handRaise: handRaiseRowToHandRaise(data),
  });
}
