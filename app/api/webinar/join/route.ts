import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getHLSStreamUrl } from "@lib/services/webinar-hms";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get authenticated user ID from request cookies.
 * Returns null if not authenticated (e.g. email-only webinar viewers).
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
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
  } catch {
    return null;
  }
}

/**
 * POST /api/webinar/join
 * Join a webinar as a viewer
 * Returns the HLS stream URL for watching
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webinarId, slug, email, firstName } = body;

    // Must have webinarId or slug
    if (!webinarId && !slug) {
      return NextResponse.json({ error: "Missing webinarId or slug" }, { status: 400 });
    }

    // Must have email
    if (!email) {
      return NextResponse.json({ error: "Email is required to join" }, { status: 400 });
    }

    // Get webinar
    const { data: webinar, error: fetchError } = await supabase
      .from("webinars")
      .select("*")
      .eq(webinarId ? "id" : "slug", webinarId || slug)
      .single();

    if (fetchError || !webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // Check webinar status
    if (webinar.status === "cancelled") {
      return NextResponse.json({ error: "This webinar has been cancelled" }, { status: 400 });
    }

    if (webinar.status === "draft") {
      return NextResponse.json({ error: "This webinar is not yet published" }, { status: 400 });
    }

    if (webinar.status === "ended") {
      return NextResponse.json(
        {
          error: "This webinar has ended.",
          replayAvailable: webinar.replay_available,
          replaySlug: webinar.slug,
        },
        { status: 410 }
      );
    }

    // Derive userId from auth session — never trust the client
    const authenticatedUserId = await getAuthenticatedUserId();

    // Check/create attendance record
    const { data: existingAttendance } = await supabase
      .from("webinar_attendance")
      .select("*")
      .eq("webinar_id", webinar.id)
      .eq("email", email)
      .single();

    let attendance = existingAttendance;

    if (!attendance) {
      // Create new attendance record — userId derived server-side
      const { data: newAttendance, error: attendanceError } = await supabase
        .from("webinar_attendance")
        .insert({
          webinar_id: webinar.id,
          email,
          first_name: firstName,
          user_id: authenticatedUserId,
          registration_source: "direct",
        })
        .select()
        .single();

      if (attendanceError) {
        console.error("Failed to create attendance:", attendanceError);
        return NextResponse.json({ error: "Failed to register for webinar" }, { status: 500 });
      }

      attendance = newAttendance;
    }

    // If webinar is live, get HLS stream URL
    let hlsStreamUrl: string | null = null;
    const isLive = webinar.status === "live";

    if (isLive && webinar.hms_room_id) {
      hlsStreamUrl =
        webinar.hls_stream_url || (await getHLSStreamUrl(webinar.hms_room_id).catch(() => null));

      // Mark as joined
      await supabase
        .from("webinar_attendance")
        .update({
          joined_at: new Date().toISOString(),
          attended_live: true,
        })
        .eq("id", attendance.id);
    }

    // Return webinar info
    return NextResponse.json({
      success: true,
      webinar: {
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        status: webinar.status,
        scheduledStart: webinar.scheduled_start,
        scheduledEnd: webinar.scheduled_end,
        chatEnabled: webinar.chat_enabled,
        qaEnabled: webinar.qa_enabled,
      },
      attendance: {
        id: attendance.id,
        registeredAt: attendance.registered_at,
        joinedAt: attendance.joined_at,
      },
      isLive,
      hlsStreamUrl,
      // For scheduled webinars, return countdown info
      startsIn: !isLive ? new Date(webinar.scheduled_start).getTime() - Date.now() : null,
    });
  } catch (error) {
    console.error("POST /api/webinar/join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/webinar/join
 * Update attendance (e.g., when leaving).
 * Requires the caller to own the attendance record (by email match via auth or
 * by providing the email that matches the record).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { attendanceId, action, email } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: "Missing attendanceId" }, { status: 400 });
    }

    // Verify the caller owns this attendance record
    const { data: attendance } = await supabase
      .from("webinar_attendance")
      .select("id, email, user_id")
      .eq("id", attendanceId)
      .single();

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    // Ownership check: authenticated user_id OR matching email
    const authenticatedUserId = await getAuthenticatedUserId();
    const ownerByUserId = authenticatedUserId && attendance.user_id === authenticatedUserId;
    const ownerByEmail = email && attendance.email === email;

    if (!ownerByUserId && !ownerByEmail) {
      return NextResponse.json(
        { error: "Not authorized to update this attendance record" },
        { status: 403 }
      );
    }

    if (action === "leave") {
      const { error } = await supabase
        .from("webinar_attendance")
        .update({
          left_at: new Date().toISOString(),
        })
        .eq("id", attendanceId);

      if (error) {
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "replay") {
      const { error } = await supabase
        .from("webinar_attendance")
        .update({
          watched_replay: true,
        })
        .eq("id", attendanceId);

      if (error) {
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/webinar/join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
