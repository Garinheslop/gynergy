export const dynamic = "force-dynamic";

import { chatStream } from "@lib/ai";
import { createClient } from "@lib/supabase-server";
import { CharacterKey } from "@resources/types/ai";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ type: "error", error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { message, characterKey, sessionId } = body as {
      message: string;
      characterKey: CharacterKey;
      sessionId?: string;
    };

    if (!message || !characterKey) {
      return new Response(
        JSON.stringify({ type: "error", error: "Message and character key are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get character ID from database
    const { data: character } = await supabase
      .from("ai_characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream({
            userId: user.id,
            characterKey,
            message,
            sessionId,
            characterId: character?.id,
          })) {
            // Send each chunk as a Server-Sent Event format
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // If error or done, close the stream
            if (chunk.type === "error" || chunk.type === "done") {
              controller.close();
              return;
            }
          }
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          const errorData = JSON.stringify({ type: "error", error: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Stream error:", error);
    return new Response(
      JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
