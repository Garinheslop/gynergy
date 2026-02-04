"use client";
import { useState, useCallback } from "react";

import axios from "axios";

import { CharacterKey, ChatMessage, ChatResponse } from "@resources/types/ai";
import { useDispatch, useSelector } from "@store/hooks";
import { aiActions } from "@store/modules/ai/reducers";


interface UseAIChatReturn {
  // State
  characters: {
    data: Array<{
      key: CharacterKey;
      name: string;
      role: string;
    }>;
    loading: boolean;
    fetched: boolean;
    error: string;
  };
  activeCharacter: CharacterKey | null;
  suggestedCharacter: CharacterKey | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  loading: boolean;
  error: string;

  // Actions
  fetchCharacters: () => Promise<void>;
  fetchSuggestedCharacter: () => Promise<void>;
  setActiveCharacter: (key: CharacterKey) => void;
  sendMessage: (message: string) => Promise<void>;
  sendMessageStream: (message: string) => Promise<void>;
  clearChat: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const dispatch = useDispatch();
  const aiState = useSelector((state) => state.ai);

  const [localLoading, setLocalLoading] = useState(false);

  // Fetch characters from API
  const fetchCharacters = useCallback(async () => {
    if (aiState.characters.fetched || aiState.characters.loading) return;

    dispatch(aiActions.charactersRequested());
    try {
      const response = await axios.get("/api/ai/characters");
      dispatch(aiActions.charactersFetched({ characters: response.data.characters }));
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to fetch characters";
      dispatch(aiActions.charactersFailed(message));
    }
  }, [dispatch, aiState.characters.fetched, aiState.characters.loading]);

  // Fetch suggested character
  const fetchSuggestedCharacter = useCallback(async () => {
    try {
      const response = await axios.get("/api/ai/suggest-character");
      dispatch(aiActions.setSuggestedCharacter(response.data.suggestedCharacter));
    } catch (error) {
      console.error("Failed to fetch suggested character:", error);
    }
  }, [dispatch]);

  // Set active character
  const setActiveCharacter = useCallback(
    (key: CharacterKey) => {
      dispatch(aiActions.setActiveCharacter(key));
    },
    [dispatch]
  );

  // Send message (non-streaming)
  const sendMessage = useCallback(
    async (message: string) => {
      if (!aiState.activeCharacter) return;

      dispatch(aiActions.chatRequested());
      dispatch(
        aiActions.chatMessageAdded({
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        })
      );

      try {
        const response = await axios.post("/api/ai/chat", {
          message,
          characterKey: aiState.activeCharacter,
        });

        const chatResponse: ChatResponse = {
          message: response.data.message,
          characterName: response.data.characterName,
          characterKey: response.data.characterKey,
          chatSessionId: response.data.chatSessionId,
          tokensUsed: response.data.tokensUsed,
        };

        dispatch(aiActions.chatResponseReceived(chatResponse));
      } catch (error) {
        const errorMessage =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : "Failed to send message";
        dispatch(aiActions.chatFailed(errorMessage));
      }
    },
    [dispatch, aiState.activeCharacter]
  );

  // Send message with streaming
  const sendMessageStream = useCallback(
    async (message: string) => {
      if (!aiState.activeCharacter) return;

      // Add user message immediately
      dispatch(
        aiActions.chatMessageAdded({
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        })
      );

      dispatch(aiActions.streamStarted());
      setLocalLoading(true);

      try {
        const response = await fetch("/api/ai/chat-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            characterKey: aiState.activeCharacter,
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
                  characterName = parsed.characterName || aiState.activeCharacter;
                  tokensUsed = parsed.tokensUsed?.total || 0;
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        dispatch(
          aiActions.streamCompleted({
            characterName,
            characterKey: aiState.activeCharacter,
            tokensUsed,
          })
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to stream message";
        dispatch(aiActions.streamFailed(errorMessage));
      } finally {
        setLocalLoading(false);
      }
    },
    [dispatch, aiState.activeCharacter]
  );

  // Clear chat
  const clearChat = useCallback(() => {
    dispatch(aiActions.clearChat());
  }, [dispatch]);

  return {
    characters: aiState.characters,
    activeCharacter: aiState.activeCharacter,
    suggestedCharacter: aiState.suggestedCharacter,
    messages: aiState.chat.messages,
    isStreaming: aiState.chat.isStreaming,
    streamingContent: aiState.chat.streamingContent,
    loading: aiState.chat.loading || localLoading,
    error: aiState.chat.error,

    fetchCharacters,
    fetchSuggestedCharacter,
    setActiveCharacter,
    sendMessage,
    sendMessageStream,
    clearChat,
  };
}

export default useAIChat;
