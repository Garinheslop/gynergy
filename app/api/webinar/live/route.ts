import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

import {
  createWebinarRoom,
  getWebinarRoomCode,
  startHLSStreaming,
  getHLSStreamUrl,
  endWebinarSession,
  getViewerCount,
  generateBroadcasterToken,
  getWebinarConfig,
} from "@lib/services/webinar-hms";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extract authenticated user ID from request cookies.
 * Returns null if not authenticated.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
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
  return user?.id || null;
}

/**
 * Verify the authenticated user is the host (or co-host) of a webinar.
 * Returns { authorized, userId, error } — use the admin supabase client for lookup.
 */
async function verifyHostAuth(webinarId: string): Promise<{
  authorized: boolean;
  userId?: string;
  error?: string;
  status?: number;
}> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { authorized: false, error: "Authentication required", status: 401 };
  }

  const { data: webinar } = await supabase
    .from("webinars")
    .select("host_user_id, co_host_user_ids")
    .eq("id", webinarId)
    .single();

  if (!webinar) {
    return { authorized: false, error: "Webinar not found", status: 404 };
  }

  const isHost = webinar.host_user_id === userId;
  const isCoHost = webinar.co_host_user_ids?.includes(userId);

  if (!isHost && !isCoHost) {
    return { authorized: false, error: "Not authorized to manage this webinar", status: 403 };
  }

  return { authorized: true, userId };
}

// ============================================
// GET - Get webinar status or list
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get("id");
    const slug = searchParams.get("slug");
    const action = searchParams.get("action");

    // Get single webinar by ID or slug
    if (webinarId || slug) {
      const { data: webinar, error } = await supabase
        .from("webinars")
        .select("*")
        .eq(webinarId ? "id" : "slug", webinarId || slug)
        .single();

      if (error || !webinar) {
        return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
      }

      // If requesting status, include live info
      if (action === "status" && webinar.hms_room_id) {
        const viewerCount = await getViewerCount(webinar.hms_room_id).catch(() => 0);
        const hlsStreamUrl =
          webinar.status === "live"
            ? await getHLSStreamUrl(webinar.hms_room_id).catch(() => null)
            : null;

        return NextResponse.json({
          webinar,
          viewerCount,
          isLive: webinar.status === "live",
          hlsStreamUrl,
        });
      }

      return NextResponse.json({ webinar });
    }

    // List webinars
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = supabase
      .from("webinars")
      .select("*")
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: webinars, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch webinars" }, { status: 500 });
    }

    return NextResponse.json({ webinars });
  } catch (error) {
    console.error("GET /api/webinar/live error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// POST - Create webinar or perform actions
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create":
        return handleCreate(body);
      case "go-live":
        return handleGoLive(body);
      case "end":
        return handleEnd(body);
      case "get-host-token":
        return handleGetHostToken(body);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/webinar/live error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Create a new webinar
 */
async function handleCreate(body: {
  title: string;
  description?: string;
  slug: string;
  scheduledStart: string;
  scheduledEnd?: string;
  maxAttendees?: number;
  hostUserId?: string;
  chatEnabled?: boolean;
  qaEnabled?: boolean;
  recordingEnabled?: boolean;
}) {
  const {
    title,
    description,
    slug,
    scheduledStart,
    scheduledEnd,
    maxAttendees = 500,
    hostUserId,
    chatEnabled = true,
    qaEnabled = true,
    recordingEnabled = true,
  } = body;

  // Validate required fields
  if (!title || !slug || !scheduledStart) {
    return NextResponse.json(
      { error: "Missing required fields: title, slug, scheduledStart" },
      { status: 400 }
    );
  }

  // Check if slug is unique
  const { data: existing } = await supabase.from("webinars").select("id").eq("slug", slug).single();

  if (existing) {
    return NextResponse.json({ error: "A webinar with this slug already exists" }, { status: 400 });
  }

  // Check 100ms configuration
  const config = getWebinarConfig();
  let hmsRoomId: string | null = null;
  let hmsRoomCode: string | null = null;

  if (config.hasCredentials && config.hasWebinarTemplate) {
    try {
      // Create 100ms room
      const room = await createWebinarRoom({
        name: `webinar-${slug}`,
        description: title,
      });
      hmsRoomId = room.id;

      // Get room code for easy joining
      hmsRoomCode = await getWebinarRoomCode(room.id);
    } catch (error) {
      console.error("Failed to create 100ms room:", error);
      // Continue without 100ms - can be set up later
    }
  }

  // Create webinar in database
  const { data: webinar, error } = await supabase
    .from("webinars")
    .insert({
      title,
      description,
      slug,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      max_attendees: maxAttendees,
      host_user_id: hostUserId,
      chat_enabled: chatEnabled,
      qa_enabled: qaEnabled,
      recording_enabled: recordingEnabled,
      hms_room_id: hmsRoomId,
      hms_room_code: hmsRoomCode,
      hms_template_id: config.templateId,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create webinar:", error);
    return NextResponse.json({ error: "Failed to create webinar" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    webinar,
    hmsRoomId,
    hmsRoomCode,
    hmsConfigured: !!(hmsRoomId && hmsRoomCode),
  });
}

/**
 * Start live streaming (go live)
 */
async function handleGoLive(body: { webinarId: string }) {
  const { webinarId } = body;

  if (!webinarId) {
    return NextResponse.json({ error: "Missing webinarId" }, { status: 400 });
  }

  // Verify caller is host
  const auth = await verifyHostAuth(webinarId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  }

  // Get webinar
  const { data: webinar, error: fetchError } = await supabase
    .from("webinars")
    .select("*")
    .eq("id", webinarId)
    .single();

  if (fetchError || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  // Check if already live
  if (webinar.status === "live") {
    return NextResponse.json({ error: "Webinar is already live" }, { status: 400 });
  }

  // Check if 100ms room exists
  if (!webinar.hms_room_id) {
    return NextResponse.json(
      { error: "100ms room not configured for this webinar" },
      { status: 400 }
    );
  }

  try {
    // Start HLS streaming
    const hlsState = await startHLSStreaming({
      roomId: webinar.hms_room_id,
      recordingEnabled: webinar.recording_enabled,
    });

    // Get the stream URL
    const hlsStreamUrl = hlsState.variants?.[0]?.url || null;

    // Update webinar status
    const { data: updatedWebinar, error: updateError } = await supabase
      .from("webinars")
      .update({
        status: "live",
        actual_start: new Date().toISOString(),
        hls_stream_url: hlsStreamUrl,
      })
      .eq("id", webinarId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      webinar: updatedWebinar,
      hlsStreamUrl,
      message: "Webinar is now live!",
    });
  } catch (error) {
    console.error("Failed to go live:", error);
    return NextResponse.json({ error: "Failed to start live streaming" }, { status: 500 });
  }
}

/**
 * End the webinar
 */
async function handleEnd(body: { webinarId: string; saveRecording?: boolean }) {
  const { webinarId, saveRecording = true } = body;

  if (!webinarId) {
    return NextResponse.json({ error: "Missing webinarId" }, { status: 400 });
  }

  // Verify caller is host
  const auth = await verifyHostAuth(webinarId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  }

  // Get webinar
  const { data: webinar, error: fetchError } = await supabase
    .from("webinars")
    .select("*")
    .eq("id", webinarId)
    .single();

  if (fetchError || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  let recordingUrl: string | null = null;

  try {
    // End 100ms session if configured
    if (webinar.hms_room_id) {
      await endWebinarSession(webinar.hms_room_id);

      // If recording was enabled, the HLS VOD will be available
      // The recording URL is usually provided via webhook, but we can note it should be available
      if (saveRecording && webinar.recording_enabled) {
        // Recording will be processed asynchronously by 100ms
        // URL will be available via webhook or API polling
        recordingUrl = `pending-${webinar.hms_room_id}`;
      }
    }

    // Update webinar status
    const { data: updatedWebinar, error: updateError } = await supabase
      .from("webinars")
      .update({
        status: "ended",
        actual_end: new Date().toISOString(),
        replay_available: saveRecording && webinar.recording_enabled,
      })
      .eq("id", webinarId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      webinar: updatedWebinar,
      recordingUrl,
      message: "Webinar ended successfully",
    });
  } catch (error) {
    console.error("Failed to end webinar:", error);
    return NextResponse.json({ error: "Failed to end webinar" }, { status: 500 });
  }
}

/**
 * Get host token for broadcasting.
 * Uses the authenticated session user — does NOT trust userId from body.
 */
async function handleGetHostToken(body: { webinarId: string; userName?: string }) {
  const { webinarId, userName } = body;

  if (!webinarId) {
    return NextResponse.json({ error: "Missing webinarId" }, { status: 400 });
  }

  // Verify caller is host (uses session cookies, not body)
  const auth = await verifyHostAuth(webinarId);
  if (!auth.authorized || !auth.userId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
  }

  // Get webinar for room ID
  const { data: webinar, error: fetchError } = await supabase
    .from("webinars")
    .select("hms_room_id")
    .eq("id", webinarId)
    .single();

  if (fetchError || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!webinar.hms_room_id) {
    return NextResponse.json(
      { error: "100ms room not configured for this webinar" },
      { status: 400 }
    );
  }

  try {
    const token = generateBroadcasterToken({
      roomId: webinar.hms_room_id,
      peerId: uuidv4(),
      userId: auth.userId,
      userName,
    });

    return NextResponse.json({
      success: true,
      token: token.token,
      roomId: webinar.hms_room_id,
      role: token.role,
    });
  } catch (error) {
    console.error("Failed to generate host token:", error);
    return NextResponse.json({ error: "Failed to generate host token" }, { status: 500 });
  }
}
