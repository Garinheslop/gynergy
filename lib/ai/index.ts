// AI Module - Main entry point
// Combines character config, context manager, and AI providers

import { CharacterKey } from "@resources/types/ai";

import { buildCharacterSystemPrompt, getCharacter, suggestCharacter } from "./character-config";
import {
  fetchUserContext,
  fetchConversationHistory,
  trimConversationHistory,
  buildUserContextString,
  saveConversationMessage,
  getOrCreateChatSession,
  endChatSession,
} from "./context-manager";
import { complete, stream, isAIConfigured, AIMessage, AIStreamChunk } from "./providers";

export * from "./character-config";
export * from "./context-manager";
export * from "./providers";

export interface ChatOptions {
  userId: string;
  characterKey: CharacterKey;
  message: string;
  sessionId?: string;
  characterId?: string;
}

export interface ChatResult {
  response: string;
  characterName: string;
  characterKey: CharacterKey;
  chatSessionId: string | null;
  tokensUsed: number;
}

// Main chat function
export async function chat(options: ChatOptions): Promise<ChatResult> {
  const { userId, characterKey, message, characterId } = options;

  // Ensure AI is configured
  if (!isAIConfigured()) {
    throw new Error("No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
  }

  // Get character config
  const character = getCharacter(characterKey);

  // Fetch user context
  const userContext = await fetchUserContext(userId);
  if (!userContext) {
    throw new Error("Could not fetch user context");
  }

  // Get or create chat session
  const chatSessionId = characterId
    ? await getOrCreateChatSession(userId, characterId)
    : null;

  // Fetch and trim conversation history
  let conversationHistory: AIMessage[] = [];
  if (characterId) {
    const history = await fetchConversationHistory(userId, characterId, 20);
    const trimmed = trimConversationHistory(history);
    conversationHistory = trimmed.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  // Build system prompt with user context
  const userContextString = buildUserContextString(userContext);
  const systemPrompt = buildCharacterSystemPrompt(characterKey, userContextString);

  // Build messages array
  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: message },
  ];

  // Call AI provider
  const result = await complete({
    messages,
    temperature: 0.8,
    maxTokens: 800,
  });

  // Save conversation messages
  if (characterId) {
    await saveConversationMessage(userId, characterId, "user", message, options.sessionId);
    await saveConversationMessage(
      userId,
      characterId,
      "assistant",
      result.content,
      options.sessionId,
      result.tokensUsed.total
    );
  }

  return {
    response: result.content,
    characterName: character.name,
    characterKey,
    chatSessionId,
    tokensUsed: result.tokensUsed.total,
  };
}

// Streaming chat function
export async function* chatStream(
  options: ChatOptions
): AsyncGenerator<AIStreamChunk & { characterName?: string; characterKey?: CharacterKey }> {
  const { userId, characterKey, message, characterId } = options;

  // Ensure AI is configured
  if (!isAIConfigured()) {
    yield {
      type: "error",
      error: "No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
    };
    return;
  }

  // Get character config
  const character = getCharacter(characterKey);

  // Fetch user context
  const userContext = await fetchUserContext(userId);
  if (!userContext) {
    yield { type: "error", error: "Could not fetch user context" };
    return;
  }

  // Fetch and trim conversation history
  let conversationHistory: AIMessage[] = [];
  if (characterId) {
    const history = await fetchConversationHistory(userId, characterId, 20);
    const trimmed = trimConversationHistory(history);
    conversationHistory = trimmed.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  // Build system prompt with user context
  const userContextString = buildUserContextString(userContext);
  const systemPrompt = buildCharacterSystemPrompt(characterKey, userContextString);

  // Build messages array
  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: message },
  ];

  // Save user message
  if (characterId) {
    await saveConversationMessage(userId, characterId, "user", message, options.sessionId);
  }

  // Stream response
  let fullResponse = "";
  let totalTokens = 0;

  for await (const chunk of stream({ messages, temperature: 0.8, maxTokens: 800 })) {
    if (chunk.type === "content" && chunk.content) {
      fullResponse += chunk.content;
      yield {
        ...chunk,
        characterName: character.name,
        characterKey,
      };
    } else if (chunk.type === "done") {
      totalTokens = chunk.tokensUsed?.total || 0;
      // Save assistant response
      if (characterId && fullResponse) {
        await saveConversationMessage(
          userId,
          characterId,
          "assistant",
          fullResponse,
          options.sessionId,
          totalTokens
        );
      }
      yield {
        ...chunk,
        characterName: character.name,
        characterKey,
      };
    } else if (chunk.type === "error") {
      yield chunk;
    }
  }
}

// Helper to suggest a character based on user state
export async function suggestCharacterForUser(userId: string): Promise<CharacterKey> {
  const userContext = await fetchUserContext(userId);

  if (!userContext) {
    return "yesi"; // Default to Yesi for new users
  }

  // Determine if streak was recently broken
  const { currentStreak } = userContext.user;
  const streakBroken =
    currentStreak.morning === 0 ||
    currentStreak.evening === 0 ||
    currentStreak.gratitude === 0;

  // Check for recent struggles (declining mood or missing entries)
  const recentStruggle = userContext.moodTrend === "declining";

  return suggestCharacter({
    moodTrend: userContext.moodTrend,
    streakBroken,
    recentStruggle,
    dayInJourney: userContext.user.dayInJourney,
  });
}

// Export session management functions
export { endChatSession };
