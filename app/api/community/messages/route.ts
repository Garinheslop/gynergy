export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";
import { checkRateLimit, rateLimitHeaders, RateLimits } from "@lib/utils/rate-limit";

interface MessageUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface DirectMessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  cohort_id: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender: MessageUser | MessageUser[] | null;
  recipient: MessageUser | MessageUser[] | null;
}

function resolveUser(u: MessageUser | MessageUser[] | null): MessageUser | null {
  if (!u) return null;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

function formatUser(u: MessageUser | null) {
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    profileImage: u.profile_image,
  };
}

// GET: List conversations or fetch thread with a specific user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { ...RateLimits.standard, prefix: "dm-read" });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("userId");

    // --- Thread mode: fetch messages with a specific user ---
    if (partnerId) {
      const cursor = searchParams.get("cursor");
      const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10) || 30, 50);

      let query = supabase
        .from("direct_messages")
        .select(
          `
          id, sender_id, recipient_id, content, is_read, read_at, created_at,
          sender:users!direct_messages_sender_id_fkey(id, first_name, last_name, profile_image),
          recipient:users!direct_messages_recipient_id_fkey(id, first_name, last_name, profile_image)
        `
        )
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cursor) {
        query = query.lt("created_at", cursor);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error("Fetch messages error:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
      }

      const typed = (messages ?? []) as unknown as DirectMessageRow[];

      // Mark unread messages from partner as read
      await supabase
        .from("direct_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      const formatted = typed.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        content: m.content,
        isRead: m.is_read,
        readAt: m.read_at,
        createdAt: m.created_at,
        sender: formatUser(resolveUser(m.sender)),
        recipient: formatUser(resolveUser(m.recipient)),
      }));

      const hasMore = typed.length === limit;
      const nextCursor = hasMore ? typed[typed.length - 1]?.created_at : null;

      return NextResponse.json({
        messages: formatted.reverse(), // Oldest first for display
        hasMore,
        nextCursor,
      });
    }

    // --- Conversations list mode ---
    // Fetch all messages involving this user, ordered by newest first
    const { data: allMessages, error: listError } = await supabase
      .from("direct_messages")
      .select(
        `
        id, sender_id, recipient_id, content, is_read, read_at, created_at,
        sender:users!direct_messages_sender_id_fkey(id, first_name, last_name, profile_image),
        recipient:users!direct_messages_recipient_id_fkey(id, first_name, last_name, profile_image)
      `
      )
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200); // Cap to prevent huge queries

    if (listError) {
      console.error("Fetch conversations error:", listError);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    const typedAll = (allMessages ?? []) as unknown as DirectMessageRow[];

    // Group by conversation partner
    const conversationMap = new Map<
      string,
      {
        partnerId: string;
        partner: ReturnType<typeof formatUser>;
        lastMessage: { content: string; createdAt: string; senderId: string };
        unreadCount: number;
      }
    >();

    for (const msg of typedAll) {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

      if (!conversationMap.has(otherId)) {
        // First message per partner (newest due to ordering)
        const otherUser =
          msg.sender_id === user.id ? resolveUser(msg.recipient) : resolveUser(msg.sender);

        conversationMap.set(otherId, {
          partnerId: otherId,
          partner: formatUser(otherUser),
          lastMessage: {
            content: msg.content,
            createdAt: msg.created_at,
            senderId: msg.sender_id,
          },
          unreadCount: 0,
        });
      }

      // Count unread messages FROM the partner
      if (msg.sender_id === otherId && msg.recipient_id === user.id && !msg.is_read) {
        const conv = conversationMap.get(otherId)!;
        conv.unreadCount += 1;
      }
    }

    // Sort by most recent message
    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    // Total unread across all conversations
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({ conversations, totalUnread });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { limit: 30, windowSeconds: 60, prefix: "dm-send" });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const { recipientId, content } = body;

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 });
    }

    // Verify recipient exists and is in the same cohort
    const { data: senderMembership } = await supabase
      .from("cohort_memberships")
      .select("cohort_id")
      .eq("user_id", user.id)
      .single();

    const cohortId = senderMembership?.cohort_id ?? null;

    if (cohortId) {
      const { data: recipientMembership } = await supabase
        .from("cohort_memberships")
        .select("cohort_id")
        .eq("user_id", recipientId)
        .eq("cohort_id", cohortId)
        .single();

      if (!recipientMembership) {
        return NextResponse.json({ error: "Recipient is not in your cohort" }, { status: 403 });
      }
    }

    // Check blocked (bidirectional) - use a simple check since we don't have the RPC here
    const { data: blocked } = await supabase
      .from("user_blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${user.id})`
      )
      .limit(1);

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ error: "Cannot send message to this user" }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        cohort_id: cohortId,
        content: content.trim(),
      })
      .select(
        `
        id, sender_id, recipient_id, content, is_read, read_at, created_at,
        sender:users!direct_messages_sender_id_fkey(id, first_name, last_name, profile_image),
        recipient:users!direct_messages_recipient_id_fkey(id, first_name, last_name, profile_image)
      `
      )
      .single();

    if (error) {
      console.error("Send message error:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    const typed = message as unknown as DirectMessageRow;

    // Create notification for recipient
    await supabase.from("user_notifications").insert({
      user_id: recipientId,
      category: "social",
      title: "New message",
      body: `You have a new message`,
      action_type: "navigate",
      action_data: { route: `/community/messages?userId=${user.id}`, senderId: user.id },
    });

    return NextResponse.json({
      message: {
        id: typed.id,
        senderId: typed.sender_id,
        recipientId: typed.recipient_id,
        content: typed.content,
        isRead: typed.is_read,
        readAt: typed.read_at,
        createdAt: typed.created_at,
        sender: formatUser(resolveUser(typed.sender)),
        recipient: formatUser(resolveUser(typed.recipient)),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Mark conversation as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rl = checkRateLimit(user.id, { ...RateLimits.standard, prefix: "dm-read" });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("direct_messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("sender_id", partnerId)
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Mark read error:", error);
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
