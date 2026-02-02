// AI Chat Store - Actions and Thunks
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { aiActions } from "./reducers";
import { ai } from "@store/configs/urls";
import { CharacterKey, ChatResponse, ChatMessage, aiRequestTypes } from "@resources/types/ai";

// Re-export actions
export { aiActions } from "./reducers";

// Fetch all characters
export const fetchCharacters = createAsyncThunk(
  "ai/fetchCharacters",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(aiActions.charactersRequested());
      const response = await axios.get(`/api/${ai}/${aiRequestTypes.getCharacters}`);
      dispatch(aiActions.charactersFetched({ characters: response.data.characters }));
      return response.data.characters;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch characters";
      dispatch(aiActions.charactersFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Fetch suggested character based on user state
export const fetchSuggestedCharacter = createAsyncThunk(
  "ai/fetchSuggestedCharacter",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/${ai}/suggest-character`);
      dispatch(aiActions.setSuggestedCharacter(response.data.suggestedCharacter));
      return response.data.suggestedCharacter;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch suggested character";
      return rejectWithValue(message);
    }
  }
);

// Send chat message (non-streaming)
export const sendChatMessage = createAsyncThunk(
  "ai/sendChatMessage",
  async (
    {
      message,
      characterKey,
      sessionId,
    }: {
      message: string;
      characterKey: CharacterKey;
      sessionId?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(aiActions.chatRequested());

      // Add user message immediately
      dispatch(
        aiActions.chatMessageAdded({
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        })
      );

      const response = await axios.post(`/api/${ai}/${aiRequestTypes.chat}`, {
        message,
        characterKey,
        sessionId,
      });

      const chatResponse: ChatResponse = {
        message: response.data.message,
        characterName: response.data.characterName,
        characterKey: response.data.characterKey,
        chatSessionId: response.data.chatSessionId,
        tokensUsed: response.data.tokensUsed,
      };

      dispatch(aiActions.chatResponseReceived(chatResponse));
      return chatResponse;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to send message";
      dispatch(aiActions.chatFailed(message));
      return rejectWithValue(message);
    }
  }
);

// Send chat message with streaming
export const sendChatMessageStream = createAsyncThunk(
  "ai/sendChatMessageStream",
  async (
    {
      message,
      characterKey,
      sessionId,
    }: {
      message: string;
      characterKey: CharacterKey;
      sessionId?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // Add user message immediately
      dispatch(
        aiActions.chatMessageAdded({
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        })
      );

      dispatch(aiActions.streamStarted());

      const response = await fetch("/api/ai/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          characterKey,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start stream");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let characterName = "";
      let tokensUsed = 0;
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;
        const value = result.value;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "content" && parsed.content) {
                dispatch(aiActions.streamChunkReceived(parsed.content));
              } else if (parsed.type === "done") {
                characterName = parsed.characterName || characterKey;
                tokensUsed = parsed.tokensUsed?.total || 0;
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              if (data.trim()) {
                console.warn("Failed to parse SSE data:", data);
              }
            }
          }
        }
      }

      dispatch(
        aiActions.streamCompleted({
          characterName,
          characterKey,
          tokensUsed,
        })
      );

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to stream message";
      dispatch(aiActions.streamFailed(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch chat history for a character
export const fetchChatHistory = createAsyncThunk(
  "ai/fetchChatHistory",
  async (
    { characterId, limit = 20 }: { characterId: string; limit?: number },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const response = await axios.get(`/api/${ai}/${aiRequestTypes.getChatHistory}`, {
        params: { characterId, limit },
      });

      const state = getState() as { ai: { activeCharacter: CharacterKey | null } };
      const characterKey = state.ai.activeCharacter;

      if (characterKey) {
        dispatch(
          aiActions.historyLoaded({
            characterKey,
            messages: response.data.history as ChatMessage[],
          })
        );
      }

      return response.data.history;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch chat history";
      return rejectWithValue(message);
    }
  }
);

// End chat session
export const endCurrentChatSession = createAsyncThunk(
  "ai/endChatSession",
  async (chatSessionId: string, { rejectWithValue }) => {
    try {
      await axios.post(`/api/${ai}/${aiRequestTypes.endChatSession}`, {
        chatSessionId,
      });
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to end chat session";
      return rejectWithValue(message);
    }
  }
);

// Rate chat session
export const rateChatSession = createAsyncThunk(
  "ai/rateChatSession",
  async (
    {
      chatSessionId,
      rating,
      feedback,
    }: {
      chatSessionId: string;
      rating: number;
      feedback?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await axios.post(`/api/${ai}/${aiRequestTypes.rateChatSession}`, {
        chatSessionId,
        rating,
        feedback,
      });
      return { success: true };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to rate chat session";
      return rejectWithValue(message);
    }
  }
);

// Set active character
export const setActiveCharacter = (characterKey: CharacterKey) => {
  return aiActions.setActiveCharacter(characterKey);
};

// Clear chat
export const clearChat = () => {
  return aiActions.clearChat();
};
