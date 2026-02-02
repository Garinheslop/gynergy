"use client";

import { useCallback } from "react";
import axios from "axios";

import { useDispatch, useSelector } from "@store/hooks";
import { videoActions } from "@store/modules/video/reducers";
import {
  CreateRoomRequest,
  RSVPStatus,
  VideoRoomStatus,
  videoRequestTypes,
} from "@resources/types/video";

const VIDEO_API_BASE = "/api/video";

export function useVideo() {
  const dispatch = useDispatch();
  const videoState = useSelector((state) => state.video);

  // Fetch user's rooms
  const fetchRooms = useCallback(
    async (options?: { status?: VideoRoomStatus; limit?: number }) => {
      if (videoState.rooms.loading) return;

      dispatch(videoActions.roomsRequested());
      try {
        const params = new URLSearchParams();
        if (options?.status) params.append("status", options.status);
        params.append("limit", (options?.limit || 20).toString());

        const response = await axios.get(
          `${VIDEO_API_BASE}/${videoRequestTypes.getRooms}?${params}`
        );
        dispatch(videoActions.roomsFetched({ rooms: response.data.rooms }));
        return response.data.rooms;
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to fetch rooms";
        dispatch(videoActions.roomsFailed(message));
        throw new Error(message);
      }
    },
    [dispatch, videoState.rooms.loading]
  );

  // Fetch single room
  const fetchRoom = useCallback(
    async (roomId: string) => {
      dispatch(videoActions.currentRoomRequested());
      try {
        const response = await axios.get(
          `${VIDEO_API_BASE}/${videoRequestTypes.getRoom}?roomId=${roomId}`
        );
        dispatch(
          videoActions.currentRoomFetched({
            room: response.data.room,
            participants: response.data.room.participants || [],
          })
        );
        return response.data.room;
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to fetch room";
        dispatch(videoActions.currentRoomFailed(message));
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Fetch upcoming rooms
  const fetchUpcoming = useCallback(
    async (limit: number = 10) => {
      dispatch(videoActions.upcomingRequested());
      try {
        const response = await axios.get(
          `${VIDEO_API_BASE}/${videoRequestTypes.getUpcoming}?limit=${limit}`
        );
        dispatch(videoActions.upcomingFetched({ rooms: response.data.rooms }));
        return response.data.rooms;
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to fetch upcoming rooms";
        dispatch(videoActions.upcomingFailed(message));
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Create room
  const createRoom = useCallback(
    async (data: CreateRoomRequest) => {
      try {
        const response = await axios.post(
          `${VIDEO_API_BASE}/${videoRequestTypes.createRoom}`,
          data
        );
        dispatch(videoActions.roomAdded(response.data.room));
        return response.data.room;
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to create room";
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Join room
  const joinRoom = useCallback(
    async (roomId: string, role?: string) => {
      dispatch(videoActions.connectionStarted());
      try {
        const response = await axios.post(
          `${VIDEO_API_BASE}/${videoRequestTypes.joinRoom}`,
          { roomId, role }
        );
        dispatch(
          videoActions.connectionEstablished({ authToken: response.data.authToken })
        );
        return response.data;
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to join room";
        dispatch(videoActions.connectionFailed(message));
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Leave room
  const leaveRoom = useCallback(
    async (roomId: string) => {
      try {
        await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.leaveRoom}`, {
          roomId,
        });
        dispatch(videoActions.connectionClosed());
        dispatch(videoActions.currentRoomCleared());
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to leave room";
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // End room
  const endRoom = useCallback(
    async (roomId: string) => {
      try {
        await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.endRoom}`, {
          roomId,
        });
        dispatch(videoActions.connectionClosed());
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to end room";
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Delete room
  const deleteRoom = useCallback(
    async (roomId: string) => {
      try {
        await axios.delete(
          `${VIDEO_API_BASE}/${videoRequestTypes.deleteRoom}?roomId=${roomId}`
        );
        dispatch(videoActions.roomRemoved(roomId));
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to delete room";
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // RSVP
  const rsvp = useCallback(
    async (roomId: string, status: RSVPStatus) => {
      try {
        await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.rsvp}`, {
          roomId,
          status,
        });
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to RSVP";
        throw new Error(message);
      }
    },
    []
  );

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    dispatch(videoActions.invitationsRequested());
    try {
      const response = await axios.get(
        `${VIDEO_API_BASE}/${videoRequestTypes.getInvitations}`
      );
      dispatch(
        videoActions.invitationsFetched({ invitations: response.data.invitations })
      );
      return response.data.invitations;
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch invitations";
      dispatch(videoActions.invitationsFailed(message));
      throw new Error(message);
    }
  }, [dispatch]);

  // Respond to invitation
  const respondToInvitation = useCallback(
    async (invitationId: string, status: "accepted" | "declined") => {
      try {
        await axios.post(
          `${VIDEO_API_BASE}/${videoRequestTypes.respondInvitation}`,
          { invitationId, status }
        );
        dispatch(videoActions.invitationResponded({ id: invitationId, status }));
      } catch (error) {
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to respond to invitation";
        throw new Error(message);
      }
    },
    [dispatch]
  );

  // Clear current room
  const clearCurrentRoom = useCallback(() => {
    dispatch(videoActions.currentRoomCleared());
  }, [dispatch]);

  return {
    // State
    rooms: videoState.rooms,
    currentRoom: videoState.currentRoom,
    upcoming: videoState.upcoming,
    invitations: videoState.invitations,
    templates: videoState.templates,
    connection: videoState.connection,

    // Actions
    fetchRooms,
    fetchRoom,
    fetchUpcoming,
    createRoom,
    joinRoom,
    leaveRoom,
    endRoom,
    deleteRoom,
    rsvp,
    fetchInvitations,
    respondToInvitation,
    clearCurrentRoom,
  };
}

export default useVideo;
