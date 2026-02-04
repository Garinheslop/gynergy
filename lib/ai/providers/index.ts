// AI Providers - Main entry point with fallback logic
import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import { AICompletionOptions, AICompletionResult, AIStreamChunk, AIProvider } from "./types";

export * from "./types";

// Provider priority (try OpenAI first, then Anthropic)
const providers: AIProvider[] = [openaiProvider, anthropicProvider];

// Get provider by name
export function getProvider(name: "openai" | "anthropic"): AIProvider | null {
  const provider = name === "openai" ? openaiProvider : anthropicProvider;
  return provider.isConfigured() ? provider : null;
}

// Check if any provider is configured
export function isAIConfigured(): boolean {
  return providers.some((p) => p.isConfigured());
}

// Complete with automatic fallback
export async function complete(
  options: AICompletionOptions,
  preferredProvider?: "openai" | "anthropic"
): Promise<AICompletionResult> {
  // Try preferred provider first if specified
  if (preferredProvider) {
    const preferred = getProvider(preferredProvider);
    if (preferred) {
      try {
        return await preferred.complete(options);
      } catch (error) {
        console.warn(
          `${preferredProvider} failed, trying fallback:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  // Try all providers in order
  let lastError: Error | null = null;
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    // Skip preferred if we already tried it
    if (preferredProvider && provider.name === preferredProvider) continue;

    try {
      return await provider.complete(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`${provider.name} failed:`, lastError.message);
    }
  }

  throw new Error(lastError?.message || "No AI providers configured or all providers failed");
}

// Stream with automatic fallback
export async function* stream(
  options: AICompletionOptions,
  preferredProvider?: "openai" | "anthropic"
): AsyncGenerator<AIStreamChunk> {
  // Try preferred provider first if specified
  if (preferredProvider) {
    const preferred = getProvider(preferredProvider);
    if (preferred) {
      try {
        for await (const chunk of preferred.stream(options)) {
          if (chunk.type === "error") {
            throw new Error(chunk.error);
          }
          yield chunk;
        }
        return;
      } catch (error) {
        console.warn(
          `${preferredProvider} stream failed, trying fallback:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  // Try all providers in order
  let lastError: Error | null = null;
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    // Skip preferred if we already tried it
    if (preferredProvider && provider.name === preferredProvider) continue;

    try {
      for await (const chunk of provider.stream(options)) {
        if (chunk.type === "error") {
          throw new Error(chunk.error);
        }
        yield chunk;
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`${provider.name} stream failed:`, lastError.message);
    }
  }

  yield {
    type: "error",
    error: lastError?.message || "No AI providers configured or all providers failed",
  };
}

// Quick check helper
export function getAvailableProviders(): string[] {
  return providers.filter((p) => p.isConfigured()).map((p) => p.name);
}
