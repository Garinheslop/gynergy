import { NextRequest, NextResponse } from "next/server";

import { getAriaSystemPrompt, buildAriaContext } from "@lib/ai/aria-config";
import { openaiProvider } from "@lib/ai/providers/openai";
import { createClient } from "@lib/supabase-server";

interface AriaRequest {
  message: string;
  context?: {
    currentPage?: string;
    selectedItems?: string[];
    recentMessages?: Array<{ role: string; content: string }>;
  };
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body: AriaRequest = await request.json();
    const { message, context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch current platform metrics for context
    const [usersResult, paymentsResult, moderationResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "succeeded"),
      supabase
        .from("moderation_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const totalRevenue = paymentsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const dashboardMetrics = {
      totalUsers: usersResult.count || 0,
      totalRevenue: totalRevenue / 100,
      pendingModeration: moderationResult.count || 0,
      timestamp: new Date().toISOString(),
    };

    // Build Aria context
    const ariaContext = buildAriaContext({
      currentPage: context?.currentPage || "/admin",
      selectedItems: context?.selectedItems,
      dashboardMetrics,
    });

    const systemPrompt = getAriaSystemPrompt(ariaContext);

    // Build conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent messages if provided
    if (context?.recentMessages) {
      for (const msg of context.recentMessages.slice(-5)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Check if OpenAI is configured
    if (!openaiProvider.isConfigured()) {
      // Return a mock response for development
      return NextResponse.json({
        message: `I understand you're asking about: "${message}".

Based on the current platform data:
- Total Users: ${dashboardMetrics.totalUsers.toLocaleString()}
- Total Revenue: $${dashboardMetrics.totalRevenue.toLocaleString()}
- Pending Moderation: ${dashboardMetrics.pendingModeration}

*Note: AI responses are in development mode. Configure OPENAI_API_KEY for full functionality.*`,
        actionItems: [],
      });
    }

    // Get AI response
    const result = await openaiProvider.complete({
      messages,
      model: "gpt-4-turbo-preview",
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Parse action items from response (simple extraction)
    const actionItems = extractActionItems(result.content);

    return NextResponse.json({
      message: result.content,
      actionItems,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("Aria API error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// Simple action item extraction from response
function extractActionItems(content: string): Array<{
  id: string;
  label: string;
  type: "navigate" | "action" | "insight";
}> {
  const items: Array<{
    id: string;
    label: string;
    type: "navigate" | "action" | "insight";
  }> = [];

  // Look for common action patterns
  const patterns = [
    { regex: /view\s+(\w+)/gi, type: "navigate" as const },
    { regex: /check\s+(\w+)/gi, type: "action" as const },
    { regex: /review\s+(\w+)/gi, type: "action" as const },
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(content)) !== null) {
      items.push({
        id: `action-${items.length}`,
        label: match[0],
        type: pattern.type,
      });
    }
  }

  return items.slice(0, 3); // Limit to 3 action items
}
