import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { checkRateLimit, RateLimits } from "@lib/utils/rate-limit";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify the caller is the host of the webinar that owns a chat message.
 */
async function verifyHostForMessage(messageId: string): Promise<{
  authorized: boolean;
  error?: string;
  status?: number;
}> {
  // Get authenticated user from cookies
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return { authorized: false, error: "Authentication required", status: 401 };
  }

  // Look up message → webinar → host
  const { data: message } = await supabase
    .from("webinar_chat")
    .select("webinar_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    return { authorized: false, error: "Message not found", status: 404 };
  }

  const { data: webinar } = await supabase
    .from("webinars")
    .select("host_user_id, co_host_user_ids")
    .eq("id", message.webinar_id)
    .single();

  if (!webinar) {
    return { authorized: false, error: "Webinar not found", status: 404 };
  }

  const isHost = webinar.host_user_id === user.id;
  const isCoHost = webinar.co_host_user_ids?.includes(user.id);

  if (!isHost && !isCoHost) {
    return { authorized: false, error: "Not authorized", status: 403 };
  }

  return { authorized: true };
}

/**
 * GET /api/webinar/chat
 * Get chat messages for a webinar
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get("webinarId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const after = searchParams.get("after"); // Message ID to get messages after

    if (!webinarId) {
      return NextResponse.json({ error: "Missing webinarId" }, { status: 400 });
    }

    let query = supabase
      .from("webinar_chat")
      .select("*")
      .eq("webinar_id", webinarId)
      .eq("is_deleted", false)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (after) {
      // Get messages after a specific message for real-time updates
      const { data: afterMessage } = await supabase
        .from("webinar_chat")
        .select("sent_at")
        .eq("id", after)
        .single();

      if (afterMessage) {
        query = query.gt("sent_at", afterMessage.sent_at);
      }
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Return in chronological order
    return NextResponse.json({
      messages: messages?.reverse() || [],
    });
  } catch (error) {
    console.error("GET /api/webinar/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/webinar/chat
 * Send a chat message or moderate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "send":
        return handleSendMessage(body);
      case "pin":
        return handlePinMessage(body.messageId, body.isPinned);
      case "delete":
        return handleDeleteMessage(body.messageId, body.deletedByUserId);
      default:
        return handleSendMessage(body); // Default to send
    }
  } catch (error) {
    console.error("POST /api/webinar/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Send a new chat message
 */
async function handleSendMessage(body: {
  webinarId: string;
  message: string;
  email: string;
  name?: string;
  userId?: string;
  isHost?: boolean;
}) {
  const { webinarId, message, email, name, userId, isHost = false } = body;

  if (!webinarId || !message || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Rate limit per email
  const rateCheck = checkRateLimit(email, RateLimits.webinarChat);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Slow down! You can send another message in a few seconds." },
      { status: 429 }
    );
  }

  // Basic message validation
  if (message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
  }

  // Verify webinar exists and has chat enabled
  const { data: webinar } = await supabase
    .from("webinars")
    .select("id, chat_enabled, status")
    .eq("id", webinarId)
    .single();

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!webinar.chat_enabled) {
    return NextResponse.json({ error: "Chat is not enabled for this webinar" }, { status: 400 });
  }

  // Only allow chat during live webinars
  if (webinar.status !== "live") {
    return NextResponse.json(
      { error: "Chat is only available during live webinars" },
      { status: 400 }
    );
  }

  // Create message
  const { data: chatMessage, error } = await supabase
    .from("webinar_chat")
    .insert({
      webinar_id: webinarId,
      message,
      sent_by_email: email,
      sent_by_name: name,
      sent_by_user_id: userId,
      is_host_message: isHost,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Update attendance record (ignore errors if RPC doesn't exist)
  try {
    await supabase.rpc("increment_chat_messages", {
      p_webinar_id: webinarId,
      p_email: email,
    });
  } catch {
    // RPC might not exist yet, ignore
  }

  return NextResponse.json({
    success: true,
    chatMessage,
  });
}

/**
 * Pin/unpin a message (host-only)
 */
async function handlePinMessage(messageId: string, isPinned: boolean) {
  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  const auth = await verifyHostForMessage(messageId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  }

  const { data: message, error } = await supabase
    .from("webinar_chat")
    .update({ is_pinned: isPinned })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    chatMessage: message,
  });
}

/**
 * Delete a message (host-only, soft delete)
 */
async function handleDeleteMessage(messageId: string, deletedByUserId?: string) {
  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  const auth = await verifyHostForMessage(messageId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  }

  const { data: message, error } = await supabase
    .from("webinar_chat")
    .update({
      is_deleted: true,
      deleted_by_user_id: deletedByUserId,
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    chatMessage: message,
  });
}
