/**
 * Community Events API
 *
 * GET - Fetch upcoming and past community events (video calls + webinars)
 * POST - RSVP to an event
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";
import {
  CommunityEvent,
  CommunityEventsResponse,
  EventAttendee,
} from "@resources/types/communityEvent";

// ── GET: Fetch community events ───────────────────────

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch upcoming events (scheduled or live, starting from 2 hours ago to catch "just ended")
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: upcomingRooms, error: upcomingError } = await supabase
      .from("video_rooms")
      .select(
        `
        *,
        host:users!video_rooms_host_id_fkey(
          id,
          raw_user_meta_data
        ),
        participants:video_room_participants(
          user_id,
          rsvp_status,
          role,
          user:users!video_room_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        )
      `
      )
      .in("room_type", ["cohort_call", "community_checkin"])
      .in("status", ["scheduled", "live", "ended"])
      .gte("scheduled_start", twoHoursAgo)
      .order("scheduled_start", { ascending: true })
      .limit(20);

    if (upcomingError) {
      console.error("Error fetching upcoming events:", upcomingError);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    // Fetch past events (ended more than 2 hours ago, last 10)
    const { data: pastRooms, error: pastError } = await supabase
      .from("video_rooms")
      .select(
        `
        *,
        host:users!video_rooms_host_id_fkey(
          id,
          raw_user_meta_data
        ),
        participants:video_room_participants(
          user_id,
          rsvp_status,
          role,
          user:users!video_room_participants_user_id_fkey(
            id,
            raw_user_meta_data
          )
        )
      `
      )
      .in("room_type", ["cohort_call", "community_checkin"])
      .eq("status", "ended")
      .lt("scheduled_start", twoHoursAgo)
      .order("scheduled_start", { ascending: false })
      .limit(10);

    if (pastError) {
      console.error("Error fetching past events:", pastError);
      // Non-fatal: return empty past events
    }

    // Transform rooms to CommunityEvent format
    const transformRoom = (room: Record<string, unknown>): CommunityEvent => {
      const host = room.host as Record<string, unknown> | null;
      const participants = (room.participants as Record<string, unknown>[]) || [];
      const hostMeta = (host?.raw_user_meta_data as Record<string, string>) || {};

      const rsvpAccepted = participants.filter((p) => p.rsvp_status === "accepted");
      const userParticipant = participants.find((p) => p.user_id === user.id);

      const scheduledStart = room.scheduled_start as string;
      const scheduledEnd = room.scheduled_end as string | undefined;
      const durationMinutes = scheduledEnd
        ? Math.round(
            (new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000
          )
        : 60;

      return {
        id: room.id as string,
        title: (room.title as string) || "Community Call",
        description: room.description as string | undefined,
        format: (room.room_type as string) === "cohort_call" ? "video_call" : "video_call",
        scheduledStart,
        scheduledEnd: scheduledEnd,
        durationMinutes,
        status: room.status as CommunityEvent["status"],
        actualStart: room.actual_start as string | undefined,
        actualEnd: room.actual_end as string | undefined,
        hostId: room.host_id as string,
        hostName:
          hostMeta.full_name ||
          hostMeta.name ||
          `${hostMeta.firstName || ""} ${hostMeta.lastName || ""}`.trim() ||
          "Host",
        hostAvatar: hostMeta.avatar_url || hostMeta.profileImage,
        participantCount: participants.filter((p) => p.role !== undefined).length,
        maxParticipants: (room.max_participants as number) || 50,
        rsvpCount: rsvpAccepted.length,
        userRsvpStatus: userParticipant
          ? (userParticipant.rsvp_status as CommunityEvent["userRsvpStatus"])
          : undefined,
        roomId: room.room_id as string,
        hmsRoomId: room.room_id as string,
        recordingEnabled: (room.recording_enabled as boolean) || false,
        recordingUrl: room.recording_url as string | undefined,
        isRecurring: (room.is_recurring as boolean) || false,
        recurrenceRule: room.recurrence_rule as string | undefined,
        cohortId: room.cohort_id as string | undefined,
        createdAt: room.created_at as string,
      };
    };

    // Build attendees map
    const buildAttendees = (rooms: Record<string, unknown>[]): Record<string, EventAttendee[]> => {
      const attendees: Record<string, EventAttendee[]> = {};

      for (const room of rooms) {
        const roomId = room.id as string;
        const participants = (room.participants as Record<string, unknown>[]) || [];

        attendees[roomId] = participants
          .filter((p) => p.rsvp_status === "accepted")
          .slice(0, 6) // Limit for avatar stack display
          .map((p) => {
            const pUser = p.user as Record<string, unknown> | null;
            const meta = (pUser?.raw_user_meta_data as Record<string, string>) || {};
            return {
              userId: p.user_id as string,
              userName:
                meta.full_name ||
                meta.name ||
                `${meta.firstName || ""} ${meta.lastName || ""}`.trim() ||
                "Member",
              userAvatar: meta.avatar_url || meta.profileImage,
              rsvpStatus: p.rsvp_status as EventAttendee["rsvpStatus"],
            };
          });
      }

      return attendees;
    };

    const allRooms = [...(upcomingRooms || []), ...(pastRooms || [])];
    const attendeesMap = buildAttendees(allRooms as unknown as Record<string, unknown>[]);

    // Split into upcoming (scheduled/live/just-ended) and past
    const upcoming: CommunityEvent[] = (upcomingRooms || [])
      .map((r) => transformRoom(r as unknown as Record<string, unknown>))
      .filter((e) => {
        // Keep scheduled, live, and recently ended (< 2 hours)
        if (e.status === "live" || e.status === "scheduled") return true;
        if (e.status === "ended") {
          const endedAt = e.actualEnd || e.scheduledEnd || e.scheduledStart;
          const hoursSinceEnd = (Date.now() - new Date(endedAt).getTime()) / 3600000;
          return hoursSinceEnd <= 2;
        }
        return false;
      });

    const past: CommunityEvent[] = (pastRooms || []).map((r) =>
      transformRoom(r as unknown as Record<string, unknown>)
    );

    const response: CommunityEventsResponse = {
      upcoming,
      past,
      attendees: attendeesMap,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST: RSVP to an event ────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId, status } = body as {
      eventId: string;
      status: "accepted" | "declined" | "maybe";
    };

    if (!eventId || !status) {
      return NextResponse.json({ error: "eventId and status are required" }, { status: 400 });
    }

    if (!["accepted", "declined", "maybe"].includes(status)) {
      return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
    }

    // Verify the event exists and is not ended/cancelled
    const { data: room, error: roomError } = await supabase
      .from("video_rooms")
      .select("id, status, max_participants")
      .eq("id", eventId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (room.status === "cancelled") {
      return NextResponse.json({ error: "Event has been cancelled" }, { status: 400 });
    }

    // Upsert participant record with RSVP
    const { error: upsertError } = await supabase.from("video_room_participants").upsert(
      {
        room_id: eventId,
        user_id: user.id,
        rsvp_status: status,
        role: "participant",
      },
      {
        onConflict: "room_id,user_id",
      }
    );

    if (upsertError) {
      console.error("RSVP upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to update RSVP" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("RSVP API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
