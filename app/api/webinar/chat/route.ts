import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * Pin/unpin a message
 */
async function handlePinMessage(messageId: string, isPinned: boolean) {
  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
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
 * Delete a message (soft delete)
 */
async function handleDeleteMessage(messageId: string, deletedByUserId?: string) {
  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
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
