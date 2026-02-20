import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type {
  SessionState,
  GroupSession,
  SessionParticipant,
  HandRaise,
  BreakoutRoom,
  SessionChatMessage,
  HotSeatTimerState,
} from "@resources/types/session";

const initialState: SessionState = {
  sessions: {
    data: [],
    loading: false,
    fetched: false,
    error: "",
  },
  currentSession: {
    data: null,
    participants: [],
    loading: false,
    error: "",
  },
  handRaises: {
    data: [],
    loading: false,
  },
  breakoutRooms: {
    data: [],
    loading: false,
  },
  hotSeat: {
    active: null,
    timerState: null,
  },
  chat: {
    messages: [],
    loading: false,
  },
  connection: {
    isConnected: false,
    isConnecting: false,
    authToken: null,
    error: "",
  },
  breakoutConnection: {
    isInBreakout: false,
    breakoutRoomId: null,
    breakoutAuthToken: null,
  },
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    // Sessions list
    sessionsRequested: (state) => {
      state.sessions.loading = true;
      state.sessions.error = "";
    },
    sessionsFetched: (state, action: PayloadAction<{ sessions: GroupSession[] }>) => {
      state.sessions.data = action.payload.sessions;
      state.sessions.loading = false;
      state.sessions.fetched = true;
      state.sessions.error = "";
    },
    sessionsFailed: (state, action: PayloadAction<string>) => {
      state.sessions.loading = false;
      state.sessions.error = action.payload;
    },

    // Current session
    currentSessionRequested: (state) => {
      state.currentSession.loading = true;
      state.currentSession.error = "";
    },
    currentSessionFetched: (
      state,
      action: PayloadAction<{ session: GroupSession; participants: SessionParticipant[] }>
    ) => {
      state.currentSession.data = action.payload.session;
      state.currentSession.participants = action.payload.participants;
      state.currentSession.loading = false;
      state.currentSession.error = "";
    },
    currentSessionFailed: (state, action: PayloadAction<string>) => {
      state.currentSession.loading = false;
      state.currentSession.error = action.payload;
    },
    currentSessionCleared: (state) => {
      state.currentSession.data = null;
      state.currentSession.participants = [];
      state.currentSession.loading = false;
      state.currentSession.error = "";
    },
    sessionUpdated: (state, action: PayloadAction<GroupSession>) => {
      if (state.currentSession.data?.id === action.payload.id) {
        state.currentSession.data = action.payload;
      }
      const idx = state.sessions.data.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.sessions.data[idx] = action.payload;
      }
    },

    // Participants
    participantJoined: (state, action: PayloadAction<SessionParticipant>) => {
      const exists = state.currentSession.participants.some(
        (p) => p.userId === action.payload.userId
      );
      if (!exists) {
        state.currentSession.participants.push(action.payload);
      }
    },
    participantLeft: (state, action: PayloadAction<string>) => {
      state.currentSession.participants = state.currentSession.participants.filter(
        (p) => p.userId !== action.payload
      );
    },
    participantUpdated: (state, action: PayloadAction<SessionParticipant>) => {
      const idx = state.currentSession.participants.findIndex(
        (p) => p.userId === action.payload.userId
      );
      if (idx !== -1) {
        state.currentSession.participants[idx] = action.payload;
      }
    },

    // Hand raises
    handRaisesFetched: (state, action: PayloadAction<HandRaise[]>) => {
      state.handRaises.data = action.payload;
      state.handRaises.loading = false;
    },
    handRaiseAdded: (state, action: PayloadAction<HandRaise>) => {
      const exists = state.handRaises.data.some((h) => h.id === action.payload.id);
      if (!exists) {
        state.handRaises.data.push(action.payload);
      }
    },
    handRaiseUpdated: (state, action: PayloadAction<HandRaise>) => {
      const idx = state.handRaises.data.findIndex((h) => h.id === action.payload.id);
      if (idx !== -1) {
        state.handRaises.data[idx] = action.payload;
      }
      // Update hot seat if this is the active one
      if (action.payload.status === "active") {
        state.hotSeat.active = action.payload;
      } else if (state.hotSeat.active?.id === action.payload.id) {
        state.hotSeat.active = null;
        state.hotSeat.timerState = null;
      }
    },
    handRaiseRemoved: (state, action: PayloadAction<string>) => {
      state.handRaises.data = state.handRaises.data.filter((h) => h.id !== action.payload);
      if (state.hotSeat.active?.id === action.payload) {
        state.hotSeat.active = null;
        state.hotSeat.timerState = null;
      }
    },

    // Hot seat
    hotSeatActivated: (state, action: PayloadAction<HandRaise>) => {
      state.hotSeat.active = action.payload;
    },
    hotSeatTimerUpdated: (state, action: PayloadAction<HotSeatTimerState | null>) => {
      state.hotSeat.timerState = action.payload;
    },
    hotSeatCleared: (state) => {
      state.hotSeat.active = null;
      state.hotSeat.timerState = null;
    },

    // Breakout rooms
    breakoutRoomsFetched: (state, action: PayloadAction<BreakoutRoom[]>) => {
      state.breakoutRooms.data = action.payload;
      state.breakoutRooms.loading = false;
    },
    breakoutRoomUpdated: (state, action: PayloadAction<BreakoutRoom>) => {
      const idx = state.breakoutRooms.data.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.breakoutRooms.data[idx] = action.payload;
      } else {
        state.breakoutRooms.data.push(action.payload);
      }
    },
    breakoutRoomsCleared: (state) => {
      state.breakoutRooms.data = [];
    },

    // Breakout connection
    enteredBreakout: (
      state,
      action: PayloadAction<{ breakoutRoomId: string; authToken: string }>
    ) => {
      state.breakoutConnection.isInBreakout = true;
      state.breakoutConnection.breakoutRoomId = action.payload.breakoutRoomId;
      state.breakoutConnection.breakoutAuthToken = action.payload.authToken;
    },
    exitedBreakout: (state) => {
      state.breakoutConnection.isInBreakout = false;
      state.breakoutConnection.breakoutRoomId = null;
      state.breakoutConnection.breakoutAuthToken = null;
    },

    // Chat
    chatMessagesFetched: (state, action: PayloadAction<SessionChatMessage[]>) => {
      state.chat.messages = action.payload;
      state.chat.loading = false;
    },
    chatMessageAdded: (state, action: PayloadAction<SessionChatMessage>) => {
      const exists = state.chat.messages.some((m) => m.id === action.payload.id);
      if (!exists) {
        state.chat.messages.push(action.payload);
      }
    },
    chatMessageUpdated: (state, action: PayloadAction<SessionChatMessage>) => {
      const idx = state.chat.messages.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) {
        state.chat.messages[idx] = action.payload;
      }
    },
    chatMessagesCleared: (state) => {
      state.chat.messages = [];
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
      // Clear all session-scoped state to prevent stale data on next join
      state.handRaises.data = [];
      state.handRaises.loading = false;
      state.hotSeat.active = null;
      state.hotSeat.timerState = null;
      state.chat.messages = [];
      state.chat.loading = false;
      state.breakoutRooms.data = [];
      state.breakoutRooms.loading = false;
      state.breakoutConnection.isInBreakout = false;
      state.breakoutConnection.breakoutRoomId = null;
      state.breakoutConnection.breakoutAuthToken = null;
    },

    // Reset
    resetSessionState: () => initialState,
  },
});

export const sessionActions = sessionSlice.actions;
export default sessionSlice;
