import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { is100msConfigured } from "@lib/services/100ms";
import {
  createBreakoutRooms as createBreakoutHmsRooms,
  generateSessionToken,
  endBreakoutRooms as endBreakoutHmsRooms,
} from "@lib/services/session-hms";
import type { BreakoutRoomRow, GroupSessionRow } from "@resources/types/session";
import { breakoutRowToBreakout } from "@resources/types/session";

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

// ============================================================================
// GET: Fetch breakout rooms for a session
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

  const { data: rooms } = await admin
    .from("breakout_rooms")
    .select("*")
    .eq("session_id", sessionId)
    .order("room_number", { ascending: true });

  // Get participant assignments
  const { data: participants } = await admin
    .from("session_participants")
    .select("user_id, current_breakout_id")
    .eq("session_id", sessionId)
    .not("current_breakout_id", "is", null);

  // Count participants per room
  const roomData = (rooms || []).map((room: BreakoutRoomRow) => {
    const count = (participants || []).filter(
      (p: { current_breakout_id: string | null }) => p.current_breakout_id === room.id
    ).length;
    return {
      ...breakoutRowToBreakout(room),
      participantCount: count,
    };
  });

  // Get current user's assignment
  const myAssignment = (participants || []).find((p: { user_id: string }) => p.user_id === user.id);

  return NextResponse.json({
    breakoutRooms: roomData,
    myBreakoutRoomId: myAssignment?.current_breakout_id || null,
  });
}

// ============================================================================
// POST: Breakout room actions
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
    case "assign":
      return handleAssign(user.id, body);
    case "start":
      return handleStart(user.id, body);
    case "join-breakout":
      return handleJoinBreakout(user.id, body);
    case "host-switch":
      return handleHostSwitch(user.id, body);
    case "return":
      return handleReturn(user.id, body);
    case "close":
      return handleClose(user.id, body);
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
    sessionId: string;
    rooms: Array<{ name: string; topic?: string }>;
    assignmentMethod?: string;
    durationSeconds?: number;
  }
) {
  if (!body.sessionId || !body.rooms || body.rooms.length === 0) {
    return NextResponse.json({ error: "sessionId and rooms are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can create breakout rooms" }, { status: 403 });
  }

  // Create 100ms rooms
  let hmsRooms: Array<{ hmsRoomId: string; name: string }> = [];
  if (is100msConfigured()) {
    try {
      hmsRooms = await createBreakoutHmsRooms(
        session.title,
        body.rooms.map((r) => r.name)
      );
    } catch (err) {
      console.error("Failed to create breakout 100ms rooms:", err);
    }
  }

  // Insert breakout room records
  const roomInserts = body.rooms.map((room, index) => ({
    session_id: body.sessionId,
    name: room.name,
    topic: room.topic || null,
    room_number: index + 1,
    hms_room_id: hmsRooms[index]?.hmsRoomId || null,
    status: "pending",
    max_participants: 8,
    assignment_method: body.assignmentMethod || "random",
    duration_seconds: body.durationSeconds || 600,
  }));

  const { data: rooms, error } = await admin.from("breakout_rooms").insert(roomInserts).select();

  if (error) {
    console.error("Failed to create breakout rooms:", error);
    return NextResponse.json({ error: "Failed to create breakout rooms" }, { status: 500 });
  }

  // If random assignment, assign participants now
  if (body.assignmentMethod === "random" || !body.assignmentMethod) {
    await autoAssignRandom(admin, body.sessionId, rooms || [], userId);
  }

  return NextResponse.json({
    success: true,
    breakoutRooms: (rooms || []).map((r: BreakoutRoomRow) => breakoutRowToBreakout(r)),
  });
}

async function autoAssignRandom(
  admin: ReturnType<typeof getAdminClient>,
  sessionId: string,
  rooms: BreakoutRoomRow[],
  hostUserId: string
) {
  // Get all participants (excluding host)
  const { data: participants } = await admin
    .from("session_participants")
    .select("user_id")
    .eq("session_id", sessionId)
    .neq("user_id", hostUserId);

  if (!participants || participants.length === 0 || rooms.length === 0) return;

  // Shuffle participants
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // Round-robin assignment
  for (let i = 0; i < shuffled.length; i++) {
    const room = rooms[i % rooms.length];
    await admin
      .from("session_participants")
      .update({ current_breakout_id: room.id })
      .eq("session_id", sessionId)
      .eq("user_id", shuffled[i].user_id);
  }
}

async function handleAssign(
  userId: string,
  body: { sessionId: string; assignments: Array<{ userId: string; breakoutRoomId: string }> }
) {
  if (!body.sessionId || !body.assignments) {
    return NextResponse.json({ error: "sessionId and assignments are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can assign breakout rooms" }, { status: 403 });
  }

  // Apply assignments
  for (const assignment of body.assignments) {
    await admin
      .from("session_participants")
      .update({ current_breakout_id: assignment.breakoutRoomId })
      .eq("session_id", body.sessionId)
      .eq("user_id", assignment.userId);
  }

  return NextResponse.json({ success: true });
}

async function handleStart(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can start breakout rooms" }, { status: 403 });
  }

  // Get pending breakout rooms
  const { data: rooms } = await admin
    .from("breakout_rooms")
    .select("*")
    .eq("session_id", body.sessionId)
    .eq("status", "pending");

  if (!rooms || rooms.length === 0) {
    return NextResponse.json({ error: "No breakout rooms to start" }, { status: 400 });
  }

  const now = new Date();

  // Activate all rooms
  for (const room of rooms) {
    const endsAt = new Date(now.getTime() + (room.duration_seconds || 600) * 1000);
    await admin
      .from("breakout_rooms")
      .update({
        status: "active",
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq("id", room.id);
  }

  // Fetch updated rooms
  const { data: updatedRooms } = await admin
    .from("breakout_rooms")
    .select("*")
    .eq("session_id", body.sessionId)
    .eq("status", "active");

  return NextResponse.json({
    success: true,
    breakoutRooms: (updatedRooms || []).map((r: BreakoutRoomRow) => breakoutRowToBreakout(r)),
  });
}

async function handleJoinBreakout(
  userId: string,
  body: { sessionId: string; breakoutRoomId: string }
) {
  if (!body.sessionId || !body.breakoutRoomId) {
    return NextResponse.json(
      { error: "sessionId and breakoutRoomId are required" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();

  // Get the breakout room
  const { data: room } = await admin
    .from("breakout_rooms")
    .select("*")
    .eq("id", body.breakoutRoomId)
    .eq("status", "active")
    .single();

  if (!room) {
    return NextResponse.json({ error: "Breakout room not found or not active" }, { status: 404 });
  }

  if (!room.hms_room_id) {
    return NextResponse.json({ error: "Breakout room has no 100ms room" }, { status: 500 });
  }

  // Generate auth token for breakout room
  const authToken = generateSessionToken(
    room.hms_room_id,
    userId,
    `breakout-${userId}`,
    "participant"
  );

  return NextResponse.json({
    success: true,
    authToken,
    hmsRoomId: room.hms_room_id,
    breakoutRoom: breakoutRowToBreakout(room),
  });
}

async function handleHostSwitch(
  userId: string,
  body: { sessionId: string; breakoutRoomId: string }
) {
  if (!body.sessionId || !body.breakoutRoomId) {
    return NextResponse.json(
      { error: "sessionId and breakoutRoomId are required" },
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
    return NextResponse.json(
      { error: "Only hosts can switch between breakout rooms" },
      { status: 403 }
    );
  }

  // Get the breakout room
  const { data: room } = await admin
    .from("breakout_rooms")
    .select("*")
    .eq("id", body.breakoutRoomId)
    .eq("status", "active")
    .single();

  if (!room || !room.hms_room_id) {
    return NextResponse.json({ error: "Breakout room not found or not active" }, { status: 404 });
  }

  // Generate host token for breakout room
  const authToken = generateSessionToken(room.hms_room_id, userId, `host-${userId}`, "host");

  return NextResponse.json({
    success: true,
    authToken,
    hmsRoomId: room.hms_room_id,
    breakoutRoom: breakoutRowToBreakout(room),
  });
}

async function handleReturn(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can trigger return to main" }, { status: 403 });
  }

  // Set all active breakout rooms to "returning" — Realtime picks this up
  await admin
    .from("breakout_rooms")
    .update({ status: "returning" })
    .eq("session_id", body.sessionId)
    .eq("status", "active");

  // Clear participant breakout assignments
  await admin
    .from("session_participants")
    .update({ current_breakout_id: null })
    .eq("session_id", body.sessionId);

  return NextResponse.json({ success: true });
}

async function handleClose(userId: string, body: { sessionId: string }) {
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can close breakout rooms" }, { status: 403 });
  }

  // Get active/returning breakout rooms
  const { data: rooms } = await admin
    .from("breakout_rooms")
    .select("hms_room_id")
    .eq("session_id", body.sessionId)
    .in("status", ["active", "returning", "pending"]);

  // End 100ms rooms
  if (rooms && is100msConfigured()) {
    const hmsIds = rooms
      .filter((r: { hms_room_id: string | null }) => r.hms_room_id)
      .map((r: { hms_room_id: string | null }) => r.hms_room_id as string);

    if (hmsIds.length > 0) {
      try {
        await endBreakoutHmsRooms(hmsIds);
      } catch (err) {
        console.warn("Failed to end some breakout HMS rooms:", err);
      }
    }
  }

  // Update DB
  const now = new Date().toISOString();
  await admin
    .from("breakout_rooms")
    .update({ status: "closed", ended_at: now })
    .eq("session_id", body.sessionId)
    .in("status", ["active", "returning", "pending"]);

  // Clear participant assignments
  await admin
    .from("session_participants")
    .update({ current_breakout_id: null })
    .eq("session_id", body.sessionId);

  return NextResponse.json({ success: true });
}
