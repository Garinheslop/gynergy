export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { v4 as uuidv4 } from "uuid";

import {
  createRoom as hmsCreateRoom,
  generateAuthToken,
  endRoom as hmsEndRoom,
  is100msConfigured,
  getActivePeers,
  removePeer,
} from "@lib/services/100ms";
import { createClient } from "@lib/supabase-server";
import {
  videoRequestTypes,
  CreateRoomRequest,
  RSVPStatus,
  ParticipantRole,
  VideoRoomStatus,
} from "@resources/types/video";

// GET handlers
export async function GET(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    // GET: Get user's rooms
    if (requestType === videoRequestTypes.getRooms) {
      const status = url.searchParams.get("status") as VideoRoomStatus | null;
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      let query = supabase
        .from("video_rooms")
        .select(
          `
          *,
          host:users!video_rooms_host_id_fkey(id, name, avatar_url),
          participants:video_room_participants(count)
        `
        )
        .or(`host_id.eq.${user.id}`)
        .order("scheduled_start", { ascending: true })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data: rooms, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ rooms });
    }

    // GET: Get single room
    if (requestType === videoRequestTypes.getRoom) {
      const roomId = url.searchParams.get("roomId");

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      const { data: room, error } = await supabase
        .from("video_rooms")
        .select(
          `
          *,
          host:users!video_rooms_host_id_fkey(id, name, avatar_url),
          participants:video_room_participants(
            id, user_id, role, rsvp_status, joined_at,
            user:users(id, name, avatar_url)
          )
        `
        )
        .eq("id", roomId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ room });
    }

    // GET: Get upcoming rooms
    if (requestType === videoRequestTypes.getUpcoming) {
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      const { data: rooms, error } = await supabase.rpc("get_user_upcoming_rooms", {
        p_user_id: user.id,
        p_limit: limit,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ rooms });
    }

    // GET: Get participants
    if (requestType === videoRequestTypes.getParticipants) {
      const roomId = url.searchParams.get("roomId");

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      const { data: participants, error } = await supabase
        .from("video_room_participants")
        .select(
          `
          *,
          user:users(id, name, avatar_url, email)
        `
        )
        .eq("room_id", roomId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ participants });
    }

    // GET: Get invitations
    if (requestType === videoRequestTypes.getInvitations) {
      const { data: invitations, error } = await supabase
        .from("video_room_invitations")
        .select(
          `
          *,
          room:video_rooms(id, title, room_type, scheduled_start, host:users(name)),
          inviter:users!video_room_invitations_invited_by_fkey(name)
        `
        )
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ invitations });
    }

    // GET: Get notes
    if (requestType === videoRequestTypes.getNotes) {
      const roomId = url.searchParams.get("roomId");

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      const { data: notes, error } = await supabase
        .from("video_call_notes")
        .select("*")
        .eq("room_id", roomId)
        .or(`author_id.eq.${user.id},is_private.eq.false`)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ notes });
    }

    // GET: Get templates
    if (requestType === videoRequestTypes.getTemplates) {
      const { data: templates, error } = await supabase
        .from("video_room_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ templates });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Video API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handlers
export async function POST(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // POST: Create room
    if (requestType === videoRequestTypes.createRoom) {
      if (!is100msConfigured()) {
        return NextResponse.json({ error: "Video service not configured" }, { status: 503 });
      }

      const createRequest = body as CreateRoomRequest;

      if (!createRequest.title || !createRequest.roomType) {
        return NextResponse.json({ error: "Title and room type are required" }, { status: 400 });
      }

      // Create room in 100ms
      const hmsRoom = await hmsCreateRoom({
        name: `${createRequest.title}-${uuidv4().slice(0, 8)}`,
        description: createRequest.description,
        recordingEnabled: createRequest.recordingEnabled,
      });

      // Save room to database
      const { data: room, error } = await supabase
        .from("video_rooms")
        .insert({
          room_id: hmsRoom.id,
          room_type: createRequest.roomType,
          title: createRequest.title,
          description: createRequest.description,
          cohort_id: createRequest.cohortId,
          host_id: user.id,
          scheduled_start: createRequest.scheduledStart,
          scheduled_end: createRequest.scheduledEnd,
          max_participants: createRequest.maxParticipants || 100,
          is_recurring: createRequest.isRecurring || false,
          recurrence_rule: createRequest.recurrenceRule,
          recording_enabled: createRequest.recordingEnabled || false,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Add host as participant
      await supabase.from("video_room_participants").insert({
        room_id: room.id,
        user_id: user.id,
        role: "host",
        rsvp_status: "accepted",
      });

      return NextResponse.json({ room });
    }

    // POST: Join room
    if (requestType === videoRequestTypes.joinRoom) {
      if (!is100msConfigured()) {
        return NextResponse.json({ error: "Video service not configured" }, { status: 503 });
      }

      const { roomId, role = "participant" } = body;

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      // Get room from database
      const { data: room, error: roomError } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      // Check if room is joinable
      if (room.status === "ended" || room.status === "cancelled") {
        return NextResponse.json({ error: "Room is no longer active" }, { status: 400 });
      }

      // Determine role (host gets host role, others get participant)
      const actualRole: ParticipantRole =
        room.host_id === user.id ? "host" : (role as ParticipantRole);

      // Generate auth token
      const peerId = uuidv4();
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      const authToken = generateAuthToken({
        roomId: room.room_id,
        peerId,
        role: actualRole,
        userId: user.id,
        userName: userData?.name,
      });

      // Update or create participant record
      const { error: participantError } = await supabase.from("video_room_participants").upsert(
        {
          room_id: room.id,
          user_id: user.id,
          role: actualRole,
          rsvp_status: "accepted",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "room_id,user_id" }
      );

      if (participantError) {
        console.error("Participant upsert error:", participantError);
      }

      // Update room status if not already live
      if (room.status === "scheduled") {
        await supabase
          .from("video_rooms")
          .update({
            status: "live",
            actual_start: new Date().toISOString(),
          })
          .eq("id", roomId);
      }

      return NextResponse.json({
        authToken: authToken.token,
        roomId: room.room_id,
        role: actualRole,
        roomDetails: room,
      });
    }

    // POST: Leave room
    if (requestType === videoRequestTypes.leaveRoom) {
      const { roomId } = body;

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      // Update participant record
      const { error } = await supabase
        .from("video_room_participants")
        .update({
          left_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: End room
    if (requestType === videoRequestTypes.endRoom) {
      const { roomId } = body;

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      // Verify user is host
      const { data: room, error: roomError } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      if (room.host_id !== user.id) {
        return NextResponse.json({ error: "Only the host can end the room" }, { status: 403 });
      }

      // End room in 100ms
      try {
        await hmsEndRoom(room.room_id, true);
      } catch (hmsError) {
        console.error("HMS end room error:", hmsError);
        // Continue anyway to update our database
      }

      // Update room status
      const { error } = await supabase
        .from("video_rooms")
        .update({
          status: "ended",
          actual_end: new Date().toISOString(),
        })
        .eq("id", roomId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: RSVP
    if (requestType === videoRequestTypes.rsvp) {
      const { roomId, status } = body as { roomId: string; status: RSVPStatus };

      if (!roomId || !status) {
        return NextResponse.json({ error: "Room ID and status are required" }, { status: 400 });
      }

      const { error } = await supabase.from("video_room_participants").upsert(
        {
          room_id: roomId,
          user_id: user.id,
          rsvp_status: status,
        },
        { onConflict: "room_id,user_id" }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: Send invitation
    if (requestType === videoRequestTypes.sendInvitation) {
      const { roomId, inviteeIds, message } = body;

      if (!roomId || !inviteeIds || !inviteeIds.length) {
        return NextResponse.json(
          { error: "Room ID and invitee IDs are required" },
          { status: 400 }
        );
      }

      // Verify user is host
      const { data: room, error: roomError } = await supabase
        .from("video_rooms")
        .select("host_id")
        .eq("id", roomId)
        .single();

      if (roomError || !room || room.host_id !== user.id) {
        return NextResponse.json({ error: "Only the host can send invitations" }, { status: 403 });
      }

      // Create invitations
      const invitations = inviteeIds.map((inviteeId: string) => ({
        room_id: roomId,
        invitee_id: inviteeId,
        invited_by: user.id,
        message,
        status: "pending",
      }));

      const { error } = await supabase
        .from("video_room_invitations")
        .upsert(invitations, { onConflict: "room_id,invitee_id" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: Respond to invitation
    if (requestType === videoRequestTypes.respondInvitation) {
      const { invitationId, status } = body;

      if (!invitationId || !status) {
        return NextResponse.json(
          { error: "Invitation ID and status are required" },
          { status: 400 }
        );
      }

      const { data: invitation, error } = await supabase
        .from("video_room_invitations")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("invitee_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If accepted, add as participant
      if (status === "accepted" && invitation) {
        await supabase.from("video_room_participants").upsert(
          {
            room_id: invitation.room_id,
            user_id: user.id,
            role: "participant",
            rsvp_status: "accepted",
          },
          { onConflict: "room_id,user_id" }
        );
      }

      return NextResponse.json({ success: true });
    }

    // POST: Remove participant
    if (requestType === videoRequestTypes.removeParticipant) {
      const { roomId, participantUserId, reason } = body;

      if (!roomId || !participantUserId) {
        return NextResponse.json(
          { error: "Room ID and participant user ID are required" },
          { status: 400 }
        );
      }

      // Verify user is host
      const { data: room, error: roomError } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !room || room.host_id !== user.id) {
        return NextResponse.json(
          { error: "Only the host can remove participants" },
          { status: 403 }
        );
      }

      // Remove from 100ms if room is live
      if (room.status === "live") {
        try {
          const { peers } = await getActivePeers(room.room_id);
          const peer = peers.find((p) => p.user_id === participantUserId);
          if (peer) {
            await removePeer(room.room_id, peer.peer_id, reason);
          }
        } catch (hmsError) {
          console.error("HMS remove peer error:", hmsError);
        }
      }

      // Update database
      const { error } = await supabase
        .from("video_room_participants")
        .update({
          left_at: new Date().toISOString(),
        })
        .eq("room_id", roomId)
        .eq("user_id", participantUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: Add note
    if (requestType === videoRequestTypes.addNote) {
      const { roomId, content, isPrivate = true } = body;

      if (!roomId || !content) {
        return NextResponse.json({ error: "Room ID and content are required" }, { status: 400 });
      }

      const { data: note, error } = await supabase
        .from("video_call_notes")
        .insert({
          room_id: roomId,
          author_id: user.id,
          content,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ note });
    }

    // POST: Update note
    if (requestType === videoRequestTypes.updateNote) {
      const { noteId, content, isPrivate } = body;

      if (!noteId) {
        return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
      }

      const updateData: { content?: string; is_private?: boolean } = {};
      if (content !== undefined) updateData.content = content;
      if (isPrivate !== undefined) updateData.is_private = isPrivate;

      const { error } = await supabase
        .from("video_call_notes")
        .update(updateData)
        .eq("id", noteId)
        .eq("author_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: Delete note
    if (requestType === videoRequestTypes.deleteNote) {
      const { noteId } = body;

      if (!noteId) {
        return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
      }

      const { error } = await supabase
        .from("video_call_notes")
        .delete()
        .eq("id", noteId)
        .eq("author_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Video API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);

    // DELETE: Delete room
    if (requestType === videoRequestTypes.deleteRoom) {
      const roomId = url.searchParams.get("roomId");

      if (!roomId) {
        return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
      }

      // Verify user is host
      const { data: room, error: roomError } = await supabase
        .from("video_rooms")
        .select("host_id, status")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      if (room.host_id !== user.id) {
        return NextResponse.json({ error: "Only the host can delete the room" }, { status: 403 });
      }

      // Can only delete scheduled or cancelled rooms
      if (room.status === "live") {
        return NextResponse.json(
          { error: "Cannot delete a live room. End it first." },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("video_rooms").delete().eq("id", roomId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Video API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
