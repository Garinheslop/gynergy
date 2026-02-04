import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  VideoState,
  VideoRoomWithDetails,
  ParticipantWithUser,
  VideoRoomInvitation,
  VideoRoomTemplate,
} from "@resources/types/video";

const initialState: VideoState = {
  rooms: {
    data: [],
    loading: false,
    fetched: false,
    error: "",
  },
  currentRoom: {
    data: null,
    participants: [],
    loading: false,
    error: "",
  },
  upcoming: {
    data: [],
    loading: false,
    error: "",
  },
  invitations: {
    data: [],
    loading: false,
    error: "",
  },
  templates: {
    data: [],
    loading: false,
    fetched: false,
  },
  connection: {
    isConnected: false,
    isConnecting: false,
    authToken: null,
    error: "",
  },
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    // Rooms
    roomsRequested: (state) => {
      state.rooms.loading = true;
      state.rooms.error = "";
    },
    roomsFetched: (state, action: PayloadAction<{ rooms: VideoRoomWithDetails[] }>) => {
      state.rooms.data = action.payload.rooms;
      state.rooms.loading = false;
      state.rooms.fetched = true;
      state.rooms.error = "";
    },
    roomsFailed: (state, action: PayloadAction<string>) => {
      state.rooms.loading = false;
      state.rooms.error = action.payload;
    },
    roomAdded: (state, action: PayloadAction<VideoRoomWithDetails>) => {
      state.rooms.data.unshift(action.payload);
    },
    roomUpdated: (state, action: PayloadAction<VideoRoomWithDetails>) => {
      const index = state.rooms.data.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms.data[index] = action.payload;
      }
      if (state.currentRoom.data?.id === action.payload.id) {
        state.currentRoom.data = action.payload;
      }
    },
    roomRemoved: (state, action: PayloadAction<string>) => {
      state.rooms.data = state.rooms.data.filter((r) => r.id !== action.payload);
      if (state.currentRoom.data?.id === action.payload) {
        state.currentRoom.data = null;
      }
    },

    // Current Room
    currentRoomRequested: (state) => {
      state.currentRoom.loading = true;
      state.currentRoom.error = "";
    },
    currentRoomFetched: (
      state,
      action: PayloadAction<{
        room: VideoRoomWithDetails;
        participants: ParticipantWithUser[];
      }>
    ) => {
      state.currentRoom.data = action.payload.room;
      state.currentRoom.participants = action.payload.participants;
      state.currentRoom.loading = false;
      state.currentRoom.error = "";
    },
    currentRoomFailed: (state, action: PayloadAction<string>) => {
      state.currentRoom.loading = false;
      state.currentRoom.error = action.payload;
    },
    currentRoomCleared: (state) => {
      state.currentRoom.data = null;
      state.currentRoom.participants = [];
      state.currentRoom.loading = false;
      state.currentRoom.error = "";
    },
    participantJoined: (state, action: PayloadAction<ParticipantWithUser>) => {
      const exists = state.currentRoom.participants.some((p) => p.userId === action.payload.userId);
      if (!exists) {
        state.currentRoom.participants.push(action.payload);
      }
    },
    participantLeft: (state, action: PayloadAction<string>) => {
      state.currentRoom.participants = state.currentRoom.participants.filter(
        (p) => p.userId !== action.payload
      );
    },
    participantUpdated: (state, action: PayloadAction<ParticipantWithUser>) => {
      const index = state.currentRoom.participants.findIndex(
        (p) => p.userId === action.payload.userId
      );
      if (index !== -1) {
        state.currentRoom.participants[index] = action.payload;
      }
    },

    // Upcoming Rooms
    upcomingRequested: (state) => {
      state.upcoming.loading = true;
      state.upcoming.error = "";
    },
    upcomingFetched: (state, action: PayloadAction<{ rooms: VideoRoomWithDetails[] }>) => {
      state.upcoming.data = action.payload.rooms;
      state.upcoming.loading = false;
      state.upcoming.error = "";
    },
    upcomingFailed: (state, action: PayloadAction<string>) => {
      state.upcoming.loading = false;
      state.upcoming.error = action.payload;
    },

    // Invitations
    invitationsRequested: (state) => {
      state.invitations.loading = true;
      state.invitations.error = "";
    },
    invitationsFetched: (state, action: PayloadAction<{ invitations: VideoRoomInvitation[] }>) => {
      state.invitations.data = action.payload.invitations;
      state.invitations.loading = false;
      state.invitations.error = "";
    },
    invitationsFailed: (state, action: PayloadAction<string>) => {
      state.invitations.loading = false;
      state.invitations.error = action.payload;
    },
    invitationAdded: (state, action: PayloadAction<VideoRoomInvitation>) => {
      state.invitations.data.unshift(action.payload);
    },
    invitationRemoved: (state, action: PayloadAction<string>) => {
      state.invitations.data = state.invitations.data.filter((i) => i.id !== action.payload);
    },
    invitationResponded: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const invitation = state.invitations.data.find((i) => i.id === action.payload.id);
      if (invitation) {
        invitation.status = action.payload.status as "pending" | "accepted" | "declined";
      }
    },

    // Templates
    templatesRequested: (state) => {
      state.templates.loading = true;
    },
    templatesFetched: (state, action: PayloadAction<{ templates: VideoRoomTemplate[] }>) => {
      state.templates.data = action.payload.templates;
      state.templates.loading = false;
      state.templates.fetched = true;
    },

    // Connection
    connectionStarted: (state) => {
      state.connection.isConnecting = true;
      state.connection.error = "";
    },
    connectionEstablished: (state, action: PayloadAction<{ authToken: string }>) => {
      state.connection.isConnected = true;
      state.connection.isConnecting = false;
      state.connection.authToken = action.payload.authToken;
      state.connection.error = "";
    },
    connectionFailed: (state, action: PayloadAction<string>) => {
      state.connection.isConnected = false;
      state.connection.isConnecting = false;
      state.connection.error = action.payload;
    },
    connectionClosed: (state) => {
      state.connection.isConnected = false;
      state.connection.isConnecting = false;
      state.connection.authToken = null;
      state.connection.error = "";
    },

    // Reset
    resetVideoState: () => initialState,
  },
});

export const videoActions = videoSlice.actions;
export default videoSlice;
