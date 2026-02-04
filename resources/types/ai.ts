// AI Character Types
// For Yesi & Garin interactive coaching system

export type CharacterKey = "yesi" | "garin";

export type RelationshipStage = "introduction" | "building" | "established" | "deep";

export type ConversationRole = "user" | "assistant" | "system";

// AI Character definition from database
export interface AICharacter {
  id: string;
  key: CharacterKey;
  name: string;
  role: string;
  avatarUrl: string | null;
  personality: {
    traits: string[];
    communicationStyle: string;
    approachToGuidance: string;
    energyType: string;
  };
  systemPrompt: string;
  voiceTone: string[];
  focusAreas: string[];
  signatureExpressions: string[];
  isActive: boolean;
  createdAt: string;
}

// Conversation message
export interface AIConversation {
  id: string;
  userId: string;
  sessionId: string | null;
  characterId: string;
  role: ConversationRole;
  content: string;
  persona: string | null;
  contextSnapshot: Record<string, unknown> | null;
  importanceScore: number;
  isMilestone: boolean;
  tokensUsed: number | null;
  createdAt: string;
}

// User's AI context (persistent memory)
export interface AIUserContext {
  id: string;
  userId: string;
  preferredCharacter: CharacterKey | null;
  recentThemes: string[];
  moodPatterns: {
    trend: "improving" | "stable" | "declining";
    averageScore: number;
    recentScores: number[];
  } | null;
  gratitudeThemes: string[];
  struggleAreas: string[];
  celebrationMoments: {
    type: string;
    date: string;
    description: string;
  }[];
  relationshipStage: RelationshipStage;
  totalConversations: number;
  lastConversationAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Chat session
export interface AIChatSession {
  id: string;
  userId: string;
  characterId: string;
  bookSessionId: string | null;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  contextUsed: Record<string, unknown> | null;
  satisfactionRating: number | null;
  feedback: string | null;
  isActive: boolean;
}

// Context for AI prompts
export interface UserContextForAI {
  user: {
    name: string;
    dayInJourney: number;
    currentStreak: {
      morning: number;
      evening: number;
      gratitude: number;
      combined: number;
    };
  };
  recentJournals: {
    type: "morning" | "evening" | "weekly";
    date: string;
    moodScore?: number;
    highlights: string[];
  }[];
  recentDGAs: {
    date: string;
    reflection: string;
    theme?: string;
  }[];
  badges: {
    recent: {
      name: string;
      unlockedAt: string;
    }[];
    total: number;
  };
  milestones: {
    reached: number[];
    next: number;
  };
  moodTrend: "improving" | "stable" | "declining";
  relationshipStage: RelationshipStage;
}

// Message for AI API
export interface ChatMessage {
  role: ConversationRole;
  content: string;
  timestamp?: string;
}

// Chat request
export interface ChatRequest {
  message: string;
  characterKey: CharacterKey;
  sessionId?: string;
  chatSessionId?: string;
}

// Chat response
export interface ChatResponse {
  message: string;
  characterName: string;
  characterKey: CharacterKey;
  chatSessionId: string;
  tokensUsed?: number;
}

// Streaming chat response chunk
export interface ChatStreamChunk {
  type: "content" | "done" | "error";
  content?: string;
  error?: string;
  tokensUsed?: number;
}

// API request types
export const aiRequestTypes = {
  getCharacters: "characters",
  getCharacter: "character",
  chat: "chat",
  chatStream: "chat-stream",
  getChatHistory: "history",
  getChatSession: "session",
  endChatSession: "end-session",
  rateChatSession: "rate-session",
  getUserContext: "user-context",
  updateUserContext: "update-context",
} as const;

// Token budget configuration
export const TOKEN_BUDGET = {
  total: 4000,
  recentMessages: 1500,
  userProfile: 500,
  recentJournals: 800,
  badges: 400,
  moodTrend: 200,
  systemOverhead: 600,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  messagesPerMinute: 10,
  messagesPerHour: 60,
  messagesPerDay: 200,
} as const;
