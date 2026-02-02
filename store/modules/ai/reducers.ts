// AI Chat Store - Reducers
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CharacterKey, ChatMessage, ChatResponse } from "@resources/types/ai";

interface CharacterInfo {
  key: CharacterKey;
  name: string;
  role: string;
  personality: {
    traits: string[];
    communicationStyle: string;
    approachToGuidance: string;
    energyType: string;
  };
  voiceTone: string[];
  focusAreas: string[];
}

interface AIState {
  // Characters
  characters: {
    data: CharacterInfo[];
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  // Active character
  activeCharacter: CharacterKey | null;
  suggestedCharacter: CharacterKey | null;
  // Chat
  chat: {
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingContent: string;
    lastResponse: ChatResponse | null;
    chatSessionId: string | null;
    loading: boolean;
    error: string;
  };
  // History (for resuming conversations)
  history: {
    [characterKey: string]: ChatMessage[];
  };
}

const initialState: AIState = {
  characters: {
    data: [],
    loading: false,
    fetched: false,
    error: "",
  },
  activeCharacter: null,
  suggestedCharacter: null,
  chat: {
    messages: [],
    isStreaming: false,
    streamingContent: "",
    lastResponse: null,
    chatSessionId: null,
    loading: false,
    error: "",
  },
  history: {},
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    // Characters
    charactersRequested: (state) => {
      state.characters.loading = true;
      state.characters.error = "";
    },
    charactersFetched: (state, action: PayloadAction<{ characters: CharacterInfo[] }>) => {
      state.characters.data = action.payload.characters;
      state.characters.loading = false;
      state.characters.fetched = true;
    },
    charactersFailed: (state, action: PayloadAction<string>) => {
      state.characters.loading = false;
      state.characters.error = action.payload;
    },

    // Active character
    setActiveCharacter: (state, action: PayloadAction<CharacterKey>) => {
      state.activeCharacter = action.payload;
      // Load history if available
      if (state.history[action.payload]) {
        state.chat.messages = state.history[action.payload];
      } else {
        state.chat.messages = [];
      }
    },
    setSuggestedCharacter: (state, action: PayloadAction<CharacterKey>) => {
      state.suggestedCharacter = action.payload;
    },

    // Chat
    chatRequested: (state) => {
      state.chat.loading = true;
      state.chat.error = "";
    },
    chatMessageAdded: (state, action: PayloadAction<ChatMessage>) => {
      state.chat.messages.push(action.payload);
    },
    chatResponseReceived: (state, action: PayloadAction<ChatResponse>) => {
      state.chat.loading = false;
      state.chat.lastResponse = action.payload;
      state.chat.chatSessionId = action.payload.chatSessionId;
      // Add assistant message
      state.chat.messages.push({
        role: "assistant",
        content: action.payload.message,
        timestamp: new Date().toISOString(),
      });
      // Save to history
      if (state.activeCharacter) {
        state.history[state.activeCharacter] = [...state.chat.messages];
      }
    },
    chatFailed: (state, action: PayloadAction<string>) => {
      state.chat.loading = false;
      state.chat.error = action.payload;
    },

    // Streaming
    streamStarted: (state) => {
      state.chat.isStreaming = true;
      state.chat.streamingContent = "";
      state.chat.error = "";
    },
    streamChunkReceived: (state, action: PayloadAction<string>) => {
      state.chat.streamingContent += action.payload;
    },
    streamCompleted: (
      state,
      action: PayloadAction<{
        characterName: string;
        characterKey: CharacterKey;
        tokensUsed?: number;
      }>
    ) => {
      state.chat.isStreaming = false;
      // Add the complete streamed message
      const fullContent = state.chat.streamingContent;
      state.chat.messages.push({
        role: "assistant",
        content: fullContent,
        timestamp: new Date().toISOString(),
      });
      state.chat.streamingContent = "";
      state.chat.lastResponse = {
        message: fullContent,
        characterName: action.payload.characterName,
        characterKey: action.payload.characterKey,
        chatSessionId: state.chat.chatSessionId || "",
        tokensUsed: action.payload.tokensUsed,
      };
      // Save to history
      if (state.activeCharacter) {
        state.history[state.activeCharacter] = [...state.chat.messages];
      }
    },
    streamFailed: (state, action: PayloadAction<string>) => {
      state.chat.isStreaming = false;
      state.chat.streamingContent = "";
      state.chat.error = action.payload;
    },

    // Clear chat
    clearChat: (state) => {
      state.chat.messages = [];
      state.chat.streamingContent = "";
      state.chat.lastResponse = null;
      state.chat.chatSessionId = null;
      state.chat.error = "";
      // Clear history for active character
      if (state.activeCharacter) {
        delete state.history[state.activeCharacter];
      }
    },

    // Load history
    historyLoaded: (
      state,
      action: PayloadAction<{ characterKey: CharacterKey; messages: ChatMessage[] }>
    ) => {
      state.history[action.payload.characterKey] = action.payload.messages;
      if (state.activeCharacter === action.payload.characterKey) {
        state.chat.messages = action.payload.messages;
      }
    },

    // Reset state
    resetAIState: () => initialState,
  },
});

export const aiActions = aiSlice.actions;
export default aiSlice.reducer;
