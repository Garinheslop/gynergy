import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { getRecordings } from "@lib/services/webinar-hms";

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Replay window: 48 hours after webinar ends
const REPLAY_WINDOW_HOURS = 48;

/**
 * GET /api/webinar/replay
 * Get replay data for a webinar (stream URL, expiry, title)
 *
 * Query params:
 *   - slug: webinar slug (required)
 *
 * Returns:
 *   - 200: { title, streamUrl, expiresAt, posterUrl? }
 *   - 404: webinar not found or replay not available
 *   - 410: replay has expired (48-hour window closed)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
    }

    // Fetch webinar by slug
    const { data: webinar, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // Must be ended with replay available
    if (webinar.status !== "ended" || !webinar.replay_available) {
      return NextResponse.json({ error: "Replay not available" }, { status: 404 });
    }

    // Calculate expiry (48 hours after actual_end)
    const endTime = webinar.actual_end
      ? new Date(webinar.actual_end)
      : new Date(webinar.scheduled_end || webinar.scheduled_start);
    const expiresAt = new Date(endTime.getTime() + REPLAY_WINDOW_HOURS * 60 * 60 * 1000);

    // Check if expired (server-side enforcement)
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: "Replay has expired" }, { status: 410 });
    }

    // Get replay URL — check database first, then try 100ms recordings API
    let streamUrl = webinar.hls_recording_url || webinar.replay_url;

    if (!streamUrl && webinar.hms_room_id) {
      // Try to fetch recording from 100ms
      try {
        const recordings = await getRecordings(webinar.hms_room_id);
        const completedRecording = recordings.find((r) => r.status === "completed" && r.asset_url);

        if (completedRecording?.asset_url) {
          streamUrl = completedRecording.asset_url;

          // Cache the URL in the database for future requests
          await supabase
            .from("webinars")
            .update({ hls_recording_url: streamUrl })
            .eq("id", webinar.id);
        }
      } catch (recordingError) {
        console.error("Failed to fetch 100ms recordings:", recordingError);
      }
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: "Replay recording is still processing. Please try again later." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: webinar.title,
      streamUrl,
      expiresAt: expiresAt.toISOString(),
      posterUrl: webinar.thumbnail_url || undefined,
    });
  } catch (error) {
    console.error("GET /api/webinar/replay error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/webinar/replay
 * Track replay view analytics
 *
 * Body: { slug, email, action: "track_view" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, email, action } = body;

    if (action !== "track_view" || !slug || !email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Find webinar by slug
    const { data: webinar } = await supabase
      .from("webinars")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // Update attendance record to mark replay watched
    await supabase
      .from("webinar_attendance")
      .update({ watched_replay: true })
      .eq("webinar_id", webinar.id)
      .eq("email", email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/webinar/replay error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
