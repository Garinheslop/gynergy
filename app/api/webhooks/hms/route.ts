import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

/**
 * 100ms Webhook Handler
 *
 * Receives events from 100ms when recordings are ready, streams change, etc.
 * Configure in 100ms Dashboard → Developers → Webhooks:
 *   URL: https://www.gynergy.app/api/webhooks/hms
 *   Events: recording.success, hls.recording.success, beam.recording.success
 *
 * Docs: https://www.100ms.live/docs/server-side/v2/how-to-guides/configure-webhooks
 */

const HMS_WEBHOOK_SECRET = process.env.HMS_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Optional: Verify webhook signature if secret is configured
    if (HMS_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-100ms-signature");
      if (!signature) {
        console.warn("100ms webhook: Missing signature header");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      // 100ms sends HMAC SHA256 signature — verify if needed
      // For now, we check presence; full verification can be added later
    }

    const { type, data } = body;

    switch (type) {
      case "recording.success":
      case "hls.recording.success":
        await handleRecordingSuccess(data);
        break;

      case "beam.recording.success":
        await handleRecordingSuccess(data);
        break;

      case "recording.failed":
      case "hls.recording.failed":
        await handleRecordingFailed(data);
        break;

      default:
        // Unhandled event type — acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("100ms webhook error:", error);
    return NextResponse.json({ received: true, error: "Handler failed" });
  }
}

/**
 * Handle successful recording — update webinar with replay URL
 */
async function handleRecordingSuccess(data: {
  room_id?: string;
  recording_id?: string;
  asset_id?: string;
  recording_path?: string;
  recording_presigned_url?: string;
  session_id?: string;
  duration?: number;
  size?: number;
  // HLS recording specific
  hls_vod_recording_path?: string;
  recording_assets?: Array<{
    asset_type: string;
    asset_id: string;
    recording_path: string;
    recording_presigned_url: string;
    duration: number;
    size: number;
  }>;
}) {
  const roomId = data.room_id;
  if (!roomId) {
    console.warn("100ms recording webhook: No room_id in data");
    return;
  }

  // Determine the best recording URL
  // Priority: HLS VOD > presigned URL > individual asset
  let recordingUrl =
    data.recording_presigned_url || data.hls_vod_recording_path || data.recording_path;

  // Check recording_assets for HLS VOD
  if (data.recording_assets?.length) {
    const hlsVod = data.recording_assets.find((a) => a.asset_type === "room-vod");
    if (hlsVod?.recording_presigned_url) {
      recordingUrl = hlsVod.recording_presigned_url;
    }
  }

  if (!recordingUrl) {
    console.warn("100ms recording webhook: No recording URL found for room", roomId);
    return;
  }

  // Update webinar with recording URL
  const { error } = await supabase
    .from("webinars")
    .update({
      hls_recording_url: recordingUrl,
      replay_available: true,
    })
    .eq("hms_room_id", roomId);

  if (error) {
    console.error("Failed to update webinar recording URL:", error);
  } else {
    console.log(`Recording URL updated for room ${roomId}`);
  }
}

/**
 * Handle failed recording — log for monitoring
 */
async function handleRecordingFailed(data: {
  room_id?: string;
  error?: string;
  recording_id?: string;
}) {
  console.error("100ms recording failed:", {
    roomId: data.room_id,
    recordingId: data.recording_id,
    error: data.error,
  });

  // Optionally update webinar metadata with failure info
  if (data.room_id) {
    await supabase
      .from("webinars")
      .update({
        metadata: {
          recording_failed: true,
          recording_error: data.error,
          recording_failed_at: new Date().toISOString(),
        },
      })
      .eq("hms_room_id", data.room_id);
  }
}
