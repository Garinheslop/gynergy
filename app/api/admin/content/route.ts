import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(request: NextRequest) {
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

  const serviceClient = createServiceClient();
  const searchParams = request.nextUrl.searchParams;
  const contentType = searchParams.get("type") || "all";

  try {
    // Fetch all content types in parallel
    const [challengeDaysResult, videosResult, quotesResult, meditationsResult, promptsResult] =
      await Promise.all([
        // Challenge day content
        serviceClient.from("challenge_days").select("*").order("day_number", { ascending: true }),

        // Videos from library
        serviceClient.from("videos").select("*").order("created_at", { ascending: false }),

        // Daily quotes
        serviceClient.from("quotes").select("*").order("id", { ascending: true }),

        // Meditations
        serviceClient.from("meditations").select("*").order("created_at", { ascending: false }),

        // Journal prompts
        serviceClient.from("journal_prompts").select("*").order("day_number", { ascending: true }),
      ]);

    // Calculate content stats
    const stats = {
      totalChallengeDays: challengeDaysResult.data?.length || 0,
      totalVideos: videosResult.data?.length || 0,
      totalQuotes: quotesResult.data?.length || 0,
      totalMeditations: meditationsResult.data?.length || 0,
      totalPrompts: promptsResult.data?.length || 0,
      publishedChallengeDays: challengeDaysResult.data?.filter((d) => d.is_published).length || 0,
      draftChallengeDays: challengeDaysResult.data?.filter((d) => !d.is_published).length || 0,
    };

    // Filter by content type if specified
    const content: Record<string, unknown[]> = {};

    if (contentType === "all" || contentType === "challenge") {
      content.challengeDays = (challengeDaysResult.data || []).map((day) => ({
        id: day.id,
        dayNumber: day.day_number,
        title: day.title,
        description: day.description,
        videoId: day.video_id,
        reflectionPrompt: day.reflection_prompt,
        journalPrompt: day.journal_prompt,
        isPublished: day.is_published,
        createdAt: day.created_at,
        updatedAt: day.updated_at,
      }));
    }

    if (contentType === "all" || contentType === "videos") {
      content.videos = (videosResult.data || []).map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        bunnyVideoId: video.bunny_video_id,
        thumbnailUrl: video.thumbnail_url,
        duration: video.duration_seconds,
        category: video.category,
        isPublished: video.is_published,
        viewCount: video.view_count || 0,
        createdAt: video.created_at,
      }));
    }

    if (contentType === "all" || contentType === "quotes") {
      content.quotes = (quotesResult.data || []).map((quote) => ({
        id: quote.id,
        text: quote.text,
        author: quote.author,
        category: quote.category,
        dayNumber: quote.day_number,
      }));
    }

    if (contentType === "all" || contentType === "meditations") {
      content.meditations = (meditationsResult.data || []).map((med) => ({
        id: med.id,
        title: med.title,
        description: med.description,
        audioUrl: med.audio_url,
        duration: med.duration_seconds,
        category: med.category,
        isPublished: med.is_published,
      }));
    }

    if (contentType === "all" || contentType === "prompts") {
      content.prompts = (promptsResult.data || []).map((prompt) => ({
        id: prompt.id,
        dayNumber: prompt.day_number,
        prompt: prompt.prompt_text,
        category: prompt.category,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        content,
      },
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

// Create or update content
export async function POST(request: NextRequest) {
  const supabase = createClient();

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

  const serviceClient = createServiceClient();

  try {
    const body = await request.json();
    const { action, contentType, data } = body;

    let result;

    switch (contentType) {
      case "challenge_day":
        if (action === "create") {
          result = await serviceClient.from("challenge_days").insert({
            day_number: data.dayNumber,
            title: data.title,
            description: data.description,
            video_id: data.videoId,
            reflection_prompt: data.reflectionPrompt,
            journal_prompt: data.journalPrompt,
            is_published: data.isPublished || false,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("challenge_days")
            .update({
              title: data.title,
              description: data.description,
              video_id: data.videoId,
              reflection_prompt: data.reflectionPrompt,
              journal_prompt: data.journalPrompt,
              is_published: data.isPublished,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.id);
        } else if (action === "delete") {
          result = await serviceClient.from("challenge_days").delete().eq("id", data.id);
        }
        break;

      case "video":
        if (action === "create") {
          result = await serviceClient.from("videos").insert({
            title: data.title,
            description: data.description,
            bunny_video_id: data.bunnyVideoId,
            thumbnail_url: data.thumbnailUrl,
            duration_seconds: data.duration,
            category: data.category,
            is_published: data.isPublished || false,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("videos")
            .update({
              title: data.title,
              description: data.description,
              category: data.category,
              is_published: data.isPublished,
            })
            .eq("id", data.id);
        } else if (action === "delete") {
          result = await serviceClient.from("videos").delete().eq("id", data.id);
        }
        break;

      case "quote":
        if (action === "create") {
          result = await serviceClient.from("quotes").insert({
            text: data.text,
            author: data.author,
            category: data.category,
            day_number: data.dayNumber,
          });
        } else if (action === "update") {
          result = await serviceClient
            .from("quotes")
            .update({
              text: data.text,
              author: data.author,
              category: data.category,
              day_number: data.dayNumber,
            })
            .eq("id", data.id);
        } else if (action === "delete") {
          result = await serviceClient.from("quotes").delete().eq("id", data.id);
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    if (result?.error) throw result.error;

    // Log the action
    await serviceClient.from("admin_audit_logs").insert({
      admin_id: user.id,
      action_type: action,
      action_category: "content_management",
      resource_type: contentType,
      resource_id: data.id,
      metadata: { title: data.title },
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Content ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error managing content:", error);
    return NextResponse.json({ error: "Failed to manage content" }, { status: 500 });
  }
}
