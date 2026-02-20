import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { is100msConfigured } from "@lib/services/100ms";
import { createSessionRoom, generateSessionToken, endSessionRoom } from "@lib/services/session-hms";
import type { GroupSessionRow } from "@resources/types/session";
import { sessionRowToSession } from "@resources/types/session";

// Admin client for DB writes
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Get authenticated user from cookies
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

// Verify caller is host or co-host
function isHostOrCoHost(session: GroupSessionRow, userId: string): boolean {
  return session.host_id === userId || (session.co_host_ids || []).includes(userId);
}

// ============================================================================
// GET: Fetch session(s)
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");
  const upcoming = searchParams.get("upcoming");

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();

  // Single session by ID
  if (sessionId) {
    const { data, error } = await admin
      .from("group_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get participants
    const { data: participants } = await admin
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId);

    return NextResponse.json({
      session: sessionRowToSession(data),
      participants: participants || [],
    });
  }

  // Upcoming sessions for user
  if (upcoming === "true") {
    const { data } = await admin
      .from("session_participants")
      .select("session_id")
      .eq("user_id", user.id);

    const sessionIds = (data || []).map((p: { session_id: string }) => p.session_id);

    if (sessionIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    const { data: sessions } = await admin
      .from("group_sessions")
      .select("*")
      .in("id", sessionIds)
      .in("status", ["scheduled", "live"])
      .order("scheduled_start", { ascending: true });

    return NextResponse.json({
      sessions: (sessions || []).map((s: GroupSessionRow) => sessionRowToSession(s)),
    });
  }

  return NextResponse.json({ error: "Missing id or upcoming parameter" }, { status: 400 });
}

// ============================================================================
// POST: Session actions
// ============================================================================

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "create":
      return handleCreate(user.id, body);
    case "join":
      return handleJoin(user.id, body);
    case "start":
      return handleStart(user.id, body);
    case "leave":
      return handleLeave(user.id, body);
    case "end":
      return handleEnd(user.id, body);
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// ============================================================================
// Handlers
// ============================================================================

async function handleCreate(
  userId: string,
  body: {
    title: string;
    description?: string;
    sessionType?: string;
    scheduledStart: string;
    scheduledEnd?: string;
    maxParticipants?: number;
    hotSeatEnabled?: boolean;
    hotSeatDurationSeconds?: number;
    breakoutEnabled?: boolean;
    chatEnabled?: boolean;
    recordingEnabled?: boolean;
    cohortId?: string;
  }
) {
  if (!body.title || !body.scheduledStart) {
    return NextResponse.json({ error: "title and scheduledStart are required" }, { status: 400 });
  }

  const admin = getAdminClient();
  let hmsRoomId: string | null = null;

  // Create 100ms room if configured
  if (is100msConfigured()) {
    try {
      hmsRoomId = await createSessionRoom(body.title);
    } catch (err) {
      console.error("Failed to create 100ms room:", err);
    }
  }

  const { data, error } = await admin
    .from("group_sessions")
    .insert({
      title: body.title,
      description: body.description || null,
      session_type: body.sessionType || "group_coaching",
      scheduled_start: body.scheduledStart,
      scheduled_end: body.scheduledEnd || null,
      hms_room_id: hmsRoomId,
      host_id: userId,
      max_participants: body.maxParticipants || 25,
      hot_seat_enabled: body.hotSeatEnabled ?? true,
      hot_seat_duration_seconds: body.hotSeatDurationSeconds || 300,
      breakout_enabled: body.breakoutEnabled ?? true,
      chat_enabled: body.chatEnabled ?? true,
      recording_enabled: body.recordingEnabled ?? true,
      cohort_id: body.cohortId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Add host as participant
  await admin.from("session_participants").insert({
    session_id: data.id,
    user_id: userId,
    role: "host",
    rsvp_status: "accepted",
  });

  return NextResponse.json({
    success: true,
    session: sessionRowToSession(data),
    hmsRoomId,
  });
}

async function handleJoin(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Fetch session
  const { data: session, error: sessionErr } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "ended" || session.status === "cancelled") {
    return NextResponse.json({ error: "Session is no longer active" }, { status: 410 });
  }

  // Determine role
  const role = isHostOrCoHost(session, userId)
    ? session.host_id === userId
      ? "host"
      : "co-host"
    : "participant";

  // Upsert participant record
  const { data: participant } = await admin
    .from("session_participants")
    .upsert(
      {
        session_id: body.sessionId,
        user_id: userId,
        role,
        rsvp_status: "accepted",
        joined_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" }
    )
    .select()
    .single();

  // Generate 100ms auth token
  let authToken = "";
  if (session.hms_room_id) {
    try {
      const hmsRole = role === "participant" ? "participant" : role;
      authToken = generateSessionToken(
        session.hms_room_id,
        userId,
        participant?.id || userId,
        hmsRole as "host" | "co-host" | "participant"
      );
    } catch (err) {
      console.error("Failed to generate auth token:", err);
    }
  }

  // Get all participants
  const { data: participants } = await admin
    .from("session_participants")
    .select("*")
    .eq("session_id", body.sessionId);

  return NextResponse.json({
    success: true,
    authToken,
    role,
    session: sessionRowToSession(session),
    participants: participants || [],
  });
}

async function handleStart(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can start sessions" }, { status: 403 });
  }

  const { data: updated, error } = await admin
    .from("group_sessions")
    .update({
      status: "live",
      actual_start: new Date().toISOString(),
    })
    .eq("id", body.sessionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    session: sessionRowToSession(updated),
  });
}

async function handleLeave(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  await admin
    .from("session_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", body.sessionId)
    .eq("user_id", userId);

  return NextResponse.json({ success: true });
}

async function handleEnd(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can end sessions" }, { status: 403 });
  }

  // End 100ms room
  if (session.hms_room_id) {
    try {
      await endSessionRoom(session.hms_room_id);
    } catch (err) {
      console.warn("Failed to end 100ms room:", err);
    }
  }

  // End any active breakout rooms
  const { data: breakouts } = await admin
    .from("breakout_rooms")
    .select("hms_room_id")
    .eq("session_id", body.sessionId)
    .in("status", ["pending", "active"]);

  if (breakouts) {
    for (const br of breakouts) {
      if (br.hms_room_id) {
        try {
          await endSessionRoom(br.hms_room_id);
        } catch (err) {
          console.warn("Failed to end breakout room:", err);
        }
      }
    }

    await admin
      .from("breakout_rooms")
      .update({ status: "closed", ended_at: new Date().toISOString() })
      .eq("session_id", body.sessionId)
      .in("status", ["pending", "active"]);
  }

  // Update session
  const { data: updated } = await admin
    .from("group_sessions")
    .update({
      status: "ended",
      actual_end: new Date().toISOString(),
    })
    .eq("id", body.sessionId)
    .select()
    .single();

  return NextResponse.json({
    success: true,
    session: updated ? sessionRowToSession(updated) : null,
  });
}
