import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { checkRateLimit } from "@lib/utils/rate-limit";
import type { SessionChatRow, GroupSessionRow } from "@resources/types/session";
import { chatRowToMessage } from "@resources/types/session";

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

const SESSION_CHAT_RATE_LIMIT = { limit: 10, windowSeconds: 30, prefix: "session-chat" };

// ============================================================================
// GET: Fetch chat messages
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const breakoutRoomId = searchParams.get("breakoutRoomId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();

  let query = admin
    .from("session_chat")
    .select("*")
    .eq("session_id", sessionId)
    .eq("is_deleted", false)
    .order("sent_at", { ascending: true })
    .limit(limit);

  // Scope to breakout room if specified, otherwise main room only
  if (breakoutRoomId) {
    query = query.eq("breakout_room_id", breakoutRoomId);
  } else {
    query = query.is("breakout_room_id", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return NextResponse.json({
    messages: (data || []).map((row: SessionChatRow) => chatRowToMessage(row)),
  });
}

// ============================================================================
// POST: Chat actions
// ============================================================================

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "send":
      return handleSend(user.id, body);
    case "pin":
      return handlePin(user.id, body);
    case "delete":
      return handleDelete(user.id, body);
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// ============================================================================
// Handlers
// ============================================================================

async function handleSend(
  userId: string,
  body: {
    sessionId: string;
    message: string;
    userName?: string;
    breakoutRoomId?: string;
  }
) {
  if (!body.sessionId || !body.message) {
    return NextResponse.json({ error: "sessionId and message are required" }, { status: 400 });
  }

  if (body.message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
  }

  // Rate limit
  const rateCheck = checkRateLimit(userId, SESSION_CHAT_RATE_LIMIT);
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Sending too fast. Please wait a moment." }, { status: 429 });
  }

  const admin = getAdminClient();

  // Verify session exists and chat is enabled
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.chat_enabled) {
    return NextResponse.json({ error: "Chat is disabled for this session" }, { status: 403 });
  }

  const isHost = isHostOrCoHost(session, userId);

  const { data, error } = await admin
    .from("session_chat")
    .insert({
      session_id: body.sessionId,
      message: body.message,
      sent_by_user_id: userId,
      sent_by_name: body.userName || null,
      breakout_room_id: body.breakoutRoomId || null,
      is_host_message: isHost,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: chatRowToMessage(data),
  });
}

async function handlePin(
  userId: string,
  body: { sessionId: string; messageId: string; isPinned: boolean }
) {
  if (!body.sessionId || !body.messageId) {
    return NextResponse.json({ error: "sessionId and messageId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can pin messages" }, { status: 403 });
  }

  // Scope to both messageId AND sessionId to prevent cross-session IDOR
  const { data: updated, error } = await admin
    .from("session_chat")
    .update({ is_pinned: body.isPinned ?? true })
    .eq("id", body.messageId)
    .eq("session_id", body.sessionId)
    .select("id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to pin message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleDelete(userId: string, body: { sessionId: string; messageId: string }) {
  if (!body.sessionId || !body.messageId) {
    return NextResponse.json({ error: "sessionId and messageId are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify host
  const { data: session } = await admin
    .from("group_sessions")
    .select("*")
    .eq("id", body.sessionId)
    .single();

  if (!session || !isHostOrCoHost(session, userId)) {
    return NextResponse.json({ error: "Only hosts can delete messages" }, { status: 403 });
  }

  // Scope to both messageId AND sessionId to prevent cross-session IDOR
  const { data: updated, error } = await admin
    .from("session_chat")
    .update({ is_deleted: true })
    .eq("id", body.messageId)
    .eq("session_id", body.sessionId)
    .select("id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
