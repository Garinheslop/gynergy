export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  chat,
  getAllCharacters,
  getCharacter,
  suggestCharacterForUser,
  fetchConversationHistory,
  endChatSession,
  fetchUserContext,
  buildUserContextString,
} from "@lib/ai";
import { createClient } from "@lib/supabase-server";
import {
  aiRequestTypes,
  CharacterKey,
  ConversationExportFormat,
  ConversationExportData,
} from "@resources/types/ai";

// GET handlers
export async function GET(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    // GET: All characters
    if (requestType === aiRequestTypes.getCharacters) {
      const characters = getAllCharacters();
      return NextResponse.json({
        characters: characters.map((c) => ({
          key: c.key,
          name: c.name,
          role: c.role,
          personality: c.personality,
          voiceTone: c.voiceTone,
          focusAreas: c.focusAreas,
        })),
      });
    }

    // GET: Single character
    if (requestType === aiRequestTypes.getCharacter) {
      const characterKey = url.searchParams.get("key") as CharacterKey;
      if (!characterKey) {
        return NextResponse.json({ error: "Character key is required" }, { status: 400 });
      }
      const character = getCharacter(characterKey);
      return NextResponse.json({
        character: {
          key: character.key,
          name: character.name,
          role: character.role,
          personality: character.personality,
          voiceTone: character.voiceTone,
          focusAreas: character.focusAreas,
          signatureExpressions: character.signatureExpressions,
        },
      });
    }

    // GET: Chat history
    if (requestType === aiRequestTypes.getChatHistory) {
      const characterId = url.searchParams.get("characterId");
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      if (!characterId) {
        return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
      }

      const history = await fetchConversationHistory(user.id, characterId, limit);
      return NextResponse.json({ history });
    }

    // GET: User context (for debugging/admin)
    if (requestType === aiRequestTypes.getUserContext) {
      const context = await fetchUserContext(user.id);
      if (!context) {
        return NextResponse.json({ error: "Could not fetch user context" }, { status: 500 });
      }
      return NextResponse.json({
        context,
        contextString: buildUserContextString(context),
      });
    }

    // GET: Suggest character for user
    if (requestType === "suggest-character") {
      const suggestedCharacter = await suggestCharacterForUser(user.id);
      return NextResponse.json({ suggestedCharacter });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handlers
export async function POST(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // POST: Regular chat (non-streaming)
    if (requestType === aiRequestTypes.chat) {
      const { message, characterKey, sessionId, chatSessionId: _chatSessionId } = body;

      if (!message || !characterKey) {
        return NextResponse.json(
          { error: "Message and character key are required" },
          { status: 400 }
        );
      }

      // Get character ID from database
      const { data: character } = await supabase
        .from("ai_characters")
        .select("id")
        .eq("key", characterKey)
        .single();

      const result = await chat({
        userId: user.id,
        characterKey,
        message,
        sessionId,
        characterId: character?.id,
      });

      return NextResponse.json({
        message: result.response,
        characterName: result.characterName,
        characterKey: result.characterKey,
        chatSessionId: result.chatSessionId,
        tokensUsed: result.tokensUsed,
      });
    }

    // POST: End chat session
    if (requestType === aiRequestTypes.endChatSession) {
      const { chatSessionId } = body;
      if (!chatSessionId) {
        return NextResponse.json({ error: "Chat session ID is required" }, { status: 400 });
      }
      await endChatSession(chatSessionId);
      return NextResponse.json({ success: true });
    }

    // POST: Rate chat session
    if (requestType === aiRequestTypes.rateChatSession) {
      const { chatSessionId, rating, feedback } = body;
      if (!chatSessionId || !rating) {
        return NextResponse.json(
          { error: "Chat session ID and rating are required" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("ai_chat_sessions")
        .update({
          satisfaction_rating: rating,
          feedback: feedback || null,
        })
        .eq("id", chatSessionId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // POST: Export conversation
    if (requestType === aiRequestTypes.exportConversation) {
      const {
        chatSessionId,
        characterKey,
        format = "json" as ConversationExportFormat,
        startDate,
        endDate,
      } = body;

      if (!characterKey) {
        return NextResponse.json({ error: "Character key is required" }, { status: 400 });
      }

      // Get character info
      const character = getCharacter(characterKey);

      // Get character ID from database
      const { data: dbCharacter } = await supabase
        .from("ai_characters")
        .select("id")
        .eq("key", characterKey)
        .single();

      if (!dbCharacter) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }

      // Build query for conversations
      let query = supabase
        .from("ai_conversations")
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .eq("character_id", dbCharacter.id)
        .order("created_at", { ascending: true });

      if (chatSessionId) {
        query = query.eq("session_id", chatSessionId);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data: conversations, error: convError } = await query;

      if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 });
      }

      const messages = (conversations || []).map((c) => ({
        role: c.role as "user" | "assistant" | "system",
        content: c.content,
        timestamp: c.created_at,
      }));

      const exportData: ConversationExportData = {
        characterName: character.name,
        characterKey: character.key,
        exportedAt: new Date().toISOString(),
        messages,
        metadata: {
          totalMessages: messages.length,
          dateRange: {
            start: messages[0]?.timestamp || new Date().toISOString(),
            end: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
          },
        },
      };

      // Format based on requested format
      if (format === "markdown") {
        const markdown = formatAsMarkdown(exportData);
        return new NextResponse(markdown, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="conversation-${characterKey}-${Date.now()}.md"`,
          },
        });
      }

      if (format === "text") {
        const text = formatAsText(exportData);
        return new NextResponse(text, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="conversation-${characterKey}-${Date.now()}.txt"`,
          },
        });
      }

      // Default: JSON
      return NextResponse.json(exportData);
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for export formatting
function formatAsMarkdown(data: ConversationExportData): string {
  const header = [
    `# Conversation with ${data.characterName}`,
    "",
    `**Exported:** ${new Date(data.exportedAt).toLocaleString()}`,
    `**Total Messages:** ${data.metadata.totalMessages}`,
    `**Date Range:** ${new Date(data.metadata.dateRange.start).toLocaleDateString()} - ${new Date(data.metadata.dateRange.end).toLocaleDateString()}`,
    "",
    "---",
    "",
  ];

  const messageLines = data.messages.flatMap((msg) => {
    const time = new Date(msg.timestamp).toLocaleString();
    const speaker = msg.role === "user" ? "You" : data.characterName;
    return [`### ${speaker} (${time})`, "", msg.content, ""];
  });

  return [...header, ...messageLines].join("\n");
}

function formatAsText(data: ConversationExportData): string {
  const header = [
    `Conversation with ${data.characterName}`,
    `Exported: ${new Date(data.exportedAt).toLocaleString()}`,
    `Total Messages: ${data.metadata.totalMessages}`,
    "=".repeat(50),
    "",
  ];

  const messageLines = data.messages.flatMap((msg) => {
    const time = new Date(msg.timestamp).toLocaleString();
    const speaker = msg.role === "user" ? "You" : data.characterName;
    return [`[${time}] ${speaker}:`, msg.content, ""];
  });

  return [...header, ...messageLines].join("\n");
}
