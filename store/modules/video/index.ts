// Video Store - Actions and Thunks
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import { videoActions } from "./reducers";
import {
  videoRequestTypes,
  CreateRoomRequest,
  RSVPStatus,
  VideoRoomStatus,
} from "@resources/types/video";

// Re-export actions
export { videoActions } from "./reducers";

const VIDEO_API_BASE = "/api/video";

// Fetch user's rooms
export const fetchRooms = createAsyncThunk(
  "video/fetchRooms",
  async (
    { status, limit = 20 }: { status?: VideoRoomStatus; limit?: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(videoActions.roomsRequested());
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      params.append("limit", limit.toString());

      const response = await axios.get(
        `${VIDEO_API_BASE}/${videoRequestTypes.getRooms}?${params}`
      );
      dispatch(videoActions.roomsFetched({ rooms: response.data.rooms }));
      return response.data.rooms;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch rooms";
      dispatch(videoActions.roomsFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Fetch single room
export const fetchRoom = createAsyncThunk(
  "video/fetchRoom",
  async (roomId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(videoActions.currentRoomRequested());
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
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch room";
      dispatch(videoActions.currentRoomFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Fetch upcoming rooms
export const fetchUpcoming = createAsyncThunk(
  "video/fetchUpcoming",
  async (limit: number = 10, { dispatch, rejectWithValue }) => {
    try {
      dispatch(videoActions.upcomingRequested());
      const response = await axios.get(
        `${VIDEO_API_BASE}/${videoRequestTypes.getUpcoming}?limit=${limit}`
      );
      dispatch(videoActions.upcomingFetched({ rooms: response.data.rooms }));
      return response.data.rooms;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch upcoming rooms";
      dispatch(videoActions.upcomingFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Create room
export const createRoom = createAsyncThunk(
  "video/createRoom",
  async (data: CreateRoomRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${VIDEO_API_BASE}/${videoRequestTypes.createRoom}`,
        data
      );
      dispatch(videoActions.roomAdded(response.data.room));
      return response.data.room;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to create room";
      return rejectWithValue(message);
    }
  }
);

// Join room
export const joinRoom = createAsyncThunk(
  "video/joinRoom",
  async (
    { roomId, role }: { roomId: string; role?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(videoActions.connectionStarted());
      const response = await axios.post(
        `${VIDEO_API_BASE}/${videoRequestTypes.joinRoom}`,
        { roomId, role }
      );
      dispatch(
        videoActions.connectionEstablished({ authToken: response.data.authToken })
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to join room";
      dispatch(videoActions.connectionFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Leave room
export const leaveRoom = createAsyncThunk(
  "video/leaveRoom",
  async (roomId: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.leaveRoom}`, {
        roomId,
      });
      dispatch(videoActions.connectionClosed());
      dispatch(videoActions.currentRoomCleared());
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to leave room";
      return rejectWithValue(message);
    }
  }
);

// End room
export const endRoom = createAsyncThunk(
  "video/endRoom",
  async (roomId: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.endRoom}`, {
        roomId,
      });
      dispatch(
        videoActions.roomUpdated({
          id: roomId,
          status: "ended",
        } as never)
      );
      dispatch(videoActions.connectionClosed());
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to end room";
      return rejectWithValue(message);
    }
  }
);

// Delete room
export const deleteRoom = createAsyncThunk(
  "video/deleteRoom",
  async (roomId: string, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(
        `${VIDEO_API_BASE}/${videoRequestTypes.deleteRoom}?roomId=${roomId}`
      );
      dispatch(videoActions.roomRemoved(roomId));
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to delete room";
      return rejectWithValue(message);
    }
  }
);

// RSVP to room
export const rsvpToRoom = createAsyncThunk(
  "video/rsvp",
  async (
    { roomId, status }: { roomId: string; status: RSVPStatus },
    { rejectWithValue }
  ) => {
    try {
      await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.rsvp}`, {
        roomId,
        status,
      });
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to RSVP";
      return rejectWithValue(message);
    }
  }
);

// Fetch invitations
export const fetchInvitations = createAsyncThunk(
  "video/fetchInvitations",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(videoActions.invitationsRequested());
      const response = await axios.get(
        `${VIDEO_API_BASE}/${videoRequestTypes.getInvitations}`
      );
      dispatch(
        videoActions.invitationsFetched({ invitations: response.data.invitations })
      );
      return response.data.invitations;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch invitations";
      dispatch(videoActions.invitationsFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Send invitations
export const sendInvitations = createAsyncThunk(
  "video/sendInvitations",
  async (
    {
      roomId,
      inviteeIds,
      message,
    }: { roomId: string; inviteeIds: string[]; message?: string },
    { rejectWithValue }
  ) => {
    try {
      await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.sendInvitation}`, {
        roomId,
        inviteeIds,
        message,
      });
      return { success: true };
    } catch (error: unknown) {
      const message_ =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to send invitations";
      return rejectWithValue(message_);
    }
  }
);

// Respond to invitation
export const respondToInvitation = createAsyncThunk(
  "video/respondToInvitation",
  async (
    { invitationId, status }: { invitationId: string; status: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await axios.post(`${VIDEO_API_BASE}/${videoRequestTypes.respondInvitation}`, {
        invitationId,
        status,
      });
      dispatch(videoActions.invitationResponded({ id: invitationId, status }));
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to respond to invitation";
      return rejectWithValue(message);
    }
  }
);

// Fetch templates
export const fetchTemplates = createAsyncThunk(
  "video/fetchTemplates",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(videoActions.templatesRequested());
      const response = await axios.get(
        `${VIDEO_API_BASE}/${videoRequestTypes.getTemplates}`
      );
      dispatch(videoActions.templatesFetched({ templates: response.data.templates }));
      return response.data.templates;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch templates";
      return rejectWithValue(message);
    }
  }
);

// Add note
export const addNote = createAsyncThunk(
  "video/addNote",
  async (
    {
      roomId,
      content,
      isPrivate = true,
    }: { roomId: string; content: string; isPrivate?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${VIDEO_API_BASE}/${videoRequestTypes.addNote}`,
        { roomId, content, isPrivate }
      );
      return response.data.note;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to add note";
      return rejectWithValue(message);
    }
  }
);
