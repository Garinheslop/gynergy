// AI Provider Types

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AICompletionResult {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: "openai" | "anthropic";
}

export interface AIStreamChunk {
  type: "content" | "done" | "error";
  content?: string;
  error?: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AIProvider {
  name: "openai" | "anthropic";
  isConfigured: () => boolean;
  complete: (options: AICompletionOptions) => Promise<AICompletionResult>;
  stream: (options: AICompletionOptions) => AsyncGenerator<AIStreamChunk>;
}

// Default models
export const DEFAULT_MODELS = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
} as const;

// Token limits
export const TOKEN_LIMITS = {
  maxCompletion: 1000,
  maxContext: 8000,
} as const;
