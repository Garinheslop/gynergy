// Content Library API Routes
// Handles content upload, management, progress tracking, and courses

import { NextRequest } from "next/server";

import { errorResponse, successResponse, validateRequiredFields } from "@lib/api-utils";
import { createLogger } from "@lib/logger";
import {
  createVideo,
  uploadVideo,
  getStreamUrl,
  getThumbnailUrl,
  getVideoStatus as getBunnyVideoStatus,
  deleteVideo,
  isBunnyConfigured,
} from "@lib/services/bunny-stream";
import { createClient } from "@lib/supabase-server";
import {
  contentRequestTypes,
  ContentType,
  ContentVisibility,
  ContentItem,
  LibraryFilterOptions,
} from "@resources/types/content";

const log = createLogger("api:content");

// =============================================================================
// GET HANDLERS
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string }> }
) {
  try {
    const { requestType } = await params;
    const searchParams = request.nextUrl.searchParams;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (requestType) {
      // -----------------------------------------------------------------------
      // GET CONTENT ITEM
      // -----------------------------------------------------------------------
      case contentRequestTypes.getContent: {
        const contentId = searchParams.get("contentId");
        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const { data: content, error } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", contentId)
          .is("deleted_at", null)
          .single();

        if (error || !content) {
          return errorResponse("Content not found", 404);
        }

        // Get user's progress
        const { data: progress } = await supabase
          .from("user_content_progress")
          .select("*")
          .eq("content_id", contentId)
          .eq("user_id", user.id)
          .single();

        // Check if bookmarked
        const { data: bookmark } = await supabase
          .from("content_bookmarks")
          .select("id")
          .eq("content_id", contentId)
          .eq("user_id", user.id)
          .single();

        return successResponse({
          content: {
            ...mapContentItem(content),
            progressPercent: progress?.progress_percent || 0,
            lastPositionSeconds: progress?.last_position_seconds || 0,
            isCompleted: progress?.is_completed || false,
            isBookmarked: !!bookmark,
          },
        });
      }

      // -----------------------------------------------------------------------
      // LIST CONTENT
      // -----------------------------------------------------------------------
      case contentRequestTypes.listContent: {
        const filters: LibraryFilterOptions = {
          contentType: searchParams.get("contentType") as ContentType | undefined,
          visibility: searchParams.get("visibility") as ContentVisibility | undefined,
          search: searchParams.get("search") || undefined,
          sortBy:
            (searchParams.get("sortBy") as "created_at" | "title" | "duration") || "created_at",
          sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
          limit: parseInt(searchParams.get("limit") || "20"),
          offset: parseInt(searchParams.get("offset") || "0"),
        };

        let query = supabase
          .from("content_items")
          .select(
            "*, user_content_progress!left(progress_percent, last_position_seconds, is_completed)",
            {
              count: "exact",
            }
          )
          .is("deleted_at", null)
          .eq("status", "ready");

        // Apply filters
        if (filters.contentType) {
          query = query.eq("content_type", filters.contentType);
        }

        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Only show content user has access to
        query = query.or(`visibility.eq.public,created_by.eq.${user.id}`);

        // Sort
        if (filters.sortBy === "title") {
          query = query.order("title", { ascending: filters.sortOrder === "asc" });
        } else if (filters.sortBy === "duration") {
          query = query.order("duration_seconds", {
            ascending: filters.sortOrder === "asc",
            nullsFirst: false,
          });
        } else {
          query = query.order("created_at", { ascending: filters.sortOrder === "asc" });
        }

        // Pagination
        query = query.range(filters.offset!, filters.offset! + filters.limit! - 1);

        const { data: items, error, count } = await query;

        if (error) {
          log.error("Failed to list content", { error });
          return errorResponse("Failed to list content", 500);
        }

        return successResponse({
          items: (items || []).map((item: any) => ({
            ...mapContentItem(item),
            progressPercent: item.user_content_progress?.[0]?.progress_percent || 0,
            lastPositionSeconds: item.user_content_progress?.[0]?.last_position_seconds || 0,
            isCompleted: item.user_content_progress?.[0]?.is_completed || false,
          })),
          total: count || 0,
          page: Math.floor(filters.offset! / filters.limit!) + 1,
          limit: filters.limit,
          hasMore: (count || 0) > filters.offset! + filters.limit!,
        });
      }

      // -----------------------------------------------------------------------
      // GET PROGRESS
      // -----------------------------------------------------------------------
      case contentRequestTypes.getProgress: {
        const contentId = searchParams.get("contentId");
        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const { data: progress, error } = await supabase
          .from("user_content_progress")
          .select("*")
          .eq("content_id", contentId)
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          log.error("Failed to get progress", { error });
          return errorResponse("Failed to get progress", 500);
        }

        return successResponse({
          progress: progress
            ? {
                progressPercent: progress.progress_percent,
                lastPositionSeconds: progress.last_position_seconds,
                isCompleted: progress.is_completed,
                completedAt: progress.completed_at,
                viewCount: progress.view_count,
                totalWatchTimeSeconds: progress.total_watch_time_seconds,
              }
            : null,
        });
      }

      // -----------------------------------------------------------------------
      // GET VIDEO STATUS
      // -----------------------------------------------------------------------
      case contentRequestTypes.getVideoStatus: {
        const contentId = searchParams.get("contentId");
        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const { data: content, error } = await supabase
          .from("content_items")
          .select("video_id, status, stream_url, thumbnail_url")
          .eq("id", contentId)
          .single();

        if (error || !content) {
          return errorResponse("Content not found", 404);
        }

        if (!content.video_id) {
          return errorResponse("Not a video content", 400);
        }

        // Get status from Bunny
        if (isBunnyConfigured()) {
          try {
            const bunnyStatus = await getBunnyVideoStatus(content.video_id);

            // Update our DB if status changed
            if (bunnyStatus.status === "ready" && content.status !== "ready") {
              await supabase
                .from("content_items")
                .update({
                  status: "ready",
                  stream_url: getStreamUrl(content.video_id),
                  thumbnail_url: getThumbnailUrl(content.video_id),
                })
                .eq("id", contentId);
            }

            return successResponse({
              status: bunnyStatus.status,
              progress: bunnyStatus.progress,
              message: bunnyStatus.message,
              streamUrl: content.stream_url,
              thumbnailUrl: content.thumbnail_url,
            });
          } catch (error) {
            log.error("Failed to get Bunny status", { error });
          }
        }

        return successResponse({
          status: content.status,
          progress: content.status === "ready" ? 100 : 0,
          message: content.status === "ready" ? "Ready" : "Processing",
          streamUrl: content.stream_url,
          thumbnailUrl: content.thumbnail_url,
        });
      }

      // -----------------------------------------------------------------------
      // GET COURSES
      // -----------------------------------------------------------------------
      case contentRequestTypes.listCourses: {
        const {
          data: courses,
          error,
          count,
        } = await supabase
          .from("courses")
          .select(
            `
            *,
            course_enrollments!left(id, progress_percent, completed_lessons_count, status)
          `,
            { count: "exact" }
          )
          .is("deleted_at", null)
          .or(`is_published.eq.true,created_by.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .range(0, 19);

        if (error) {
          log.error("Failed to list courses", { error });
          return errorResponse("Failed to list courses", 500);
        }

        return successResponse({
          items: (courses || []).map((course: any) => ({
            ...mapCourse(course),
            enrollment: course.course_enrollments?.[0]
              ? {
                  progressPercent: course.course_enrollments[0].progress_percent,
                  completedLessonsCount: course.course_enrollments[0].completed_lessons_count,
                  status: course.course_enrollments[0].status,
                }
              : null,
          })),
          total: count || 0,
        });
      }

      // -----------------------------------------------------------------------
      // GET SINGLE COURSE
      // -----------------------------------------------------------------------
      case contentRequestTypes.getCourse: {
        const courseId = searchParams.get("courseId");
        if (!courseId) {
          return errorResponse("Course ID is required", 400);
        }

        // Get course with modules and lessons
        const { data: course, error } = await supabase
          .from("courses")
          .select(
            `
            *,
            course_modules (
              *,
              course_lessons (
                *,
                content_items (*)
              )
            ),
            course_enrollments!left(*)
          `
          )
          .eq("id", courseId)
          .is("deleted_at", null)
          .single();

        if (error || !course) {
          return errorResponse("Course not found", 404);
        }

        // Get user's progress on lessons
        const lessonContentIds = course.course_modules
          .flatMap((m: any) => m.course_lessons)
          .filter((l: any) => l.content_id)
          .map((l: any) => l.content_id);

        const { data: progressData } = await supabase
          .from("user_content_progress")
          .select("content_id, progress_percent, is_completed")
          .eq("user_id", user.id)
          .in("content_id", lessonContentIds);

        const progressMap = new Map(progressData?.map((p) => [p.content_id, p]) || []);

        // Map course data
        const mappedCourse = {
          ...mapCourse(course),
          modules: course.course_modules
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((module: any) => ({
              id: module.id,
              courseId: module.course_id,
              title: module.title,
              description: module.description,
              sortOrder: module.sort_order,
              lessons: module.course_lessons
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((lesson: any) => {
                  const progress = progressMap.get(lesson.content_id);
                  return {
                    id: lesson.id,
                    moduleId: lesson.module_id,
                    contentId: lesson.content_id,
                    title: lesson.title,
                    description: lesson.description,
                    sortOrder: lesson.sort_order,
                    isPreview: lesson.is_preview,
                    isRequired: lesson.is_required,
                    content: lesson.content_items ? mapContentItem(lesson.content_items) : null,
                    progressPercent: progress?.progress_percent || 0,
                    isCompleted: progress?.is_completed || false,
                  };
                }),
            })),
          enrollment: course.course_enrollments?.[0] || null,
        };

        return successResponse({ course: mappedCourse });
      }

      // -----------------------------------------------------------------------
      // GET BOOKMARKS
      // -----------------------------------------------------------------------
      case contentRequestTypes.getBookmarks: {
        const { data: bookmarks, error } = await supabase
          .from("content_bookmarks")
          .select(
            `
            *,
            content_items (*)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          log.error("Failed to get bookmarks", { error });
          return errorResponse("Failed to get bookmarks", 500);
        }

        return successResponse({
          bookmarks: (bookmarks || []).map((b: any) => ({
            id: b.id,
            note: b.note,
            createdAt: b.created_at,
            content: mapContentItem(b.content_items),
          })),
        });
      }

      // -----------------------------------------------------------------------
      // GET NOTES
      // -----------------------------------------------------------------------
      case contentRequestTypes.getNotes: {
        const contentId = searchParams.get("contentId");

        let query = supabase
          .from("content_notes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (contentId) {
          query = query.eq("content_id", contentId);
        }

        const { data: notes, error } = await query;

        if (error) {
          log.error("Failed to get notes", { error });
          return errorResponse("Failed to get notes", 500);
        }

        return successResponse({
          notes: (notes || []).map((n: any) => ({
            id: n.id,
            contentId: n.content_id,
            content: n.content,
            timestampSeconds: n.timestamp_seconds,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
          })),
        });
      }

      // -----------------------------------------------------------------------
      // GET COHORT RESOURCES
      // -----------------------------------------------------------------------
      case contentRequestTypes.getCohortResources: {
        const cohortId = searchParams.get("cohortId");
        if (!cohortId) {
          return errorResponse("Cohort ID is required", 400);
        }

        // Verify user is in cohort
        const { data: membership } = await supabase
          .from("cohort_memberships")
          .select("id")
          .eq("cohort_id", cohortId)
          .eq("user_id", user.id)
          .single();

        if (!membership) {
          return errorResponse("Not a member of this cohort", 403);
        }

        const { data: resources, error } = await supabase
          .from("cohort_resources")
          .select(
            `
            *,
            content_items (*)
          `
          )
          .eq("cohort_id", cohortId)
          .or(`available_from.is.null,available_from.lte.${new Date().toISOString()}`)
          .order("sort_order", { ascending: true });

        if (error) {
          log.error("Failed to get cohort resources", { error });
          return errorResponse("Failed to get cohort resources", 500);
        }

        return successResponse({
          resources: (resources || []).map((r: any) => ({
            id: r.id,
            cohortId: r.cohort_id,
            availableFrom: r.available_from,
            availableUntil: r.available_until,
            sortOrder: r.sort_order,
            isRequired: r.is_required,
            isPinned: r.is_pinned,
            content: mapContentItem(r.content_items),
          })),
        });
      }

      // -------------------------------------------------------------------
      // GET PLAYLIST
      // -------------------------------------------------------------------
      case "get-playlist": {
        const playlistId = searchParams.get("playlistId");
        if (!playlistId) return errorResponse("Playlist ID is required", 400);

        const { data: playlist, error } = await supabase
          .from("content_playlists")
          .select(`
            *,
            playlist_items (
              *,
              content_items (*)
            )
          `)
          .eq("id", playlistId)
          .single();

        if (error || !playlist) return errorResponse("Playlist not found", 404);

        // Check access - must be owner or public
        if (playlist.user_id !== user.id && !playlist.is_public) {
          return errorResponse("Playlist not found", 404);
        }

        const items = (playlist.playlist_items || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((item: any) => ({
            id: item.id,
            playlistId: item.playlist_id,
            contentId: item.content_id,
            sortOrder: item.sort_order,
            addedAt: item.added_at,
            content: item.content_items ? mapContentItem(item.content_items) : undefined,
          }));

        const totalDuration = items.reduce(
          (sum: number, item: any) => sum + (item.content?.durationSeconds || 0),
          0
        );

        return successResponse({
          playlist: {
            id: playlist.id,
            userId: playlist.user_id,
            title: playlist.title,
            description: playlist.description,
            isPublic: playlist.is_public,
            thumbnailUrl: playlist.thumbnail_url,
            createdAt: playlist.created_at,
            updatedAt: playlist.updated_at,
            items,
            itemCount: items.length,
            totalDurationMinutes: Math.round(totalDuration / 60),
          },
        });
      }

      // -------------------------------------------------------------------
      // LIST PLAYLISTS
      // -------------------------------------------------------------------
      case "list-playlists": {
        const ownerOnly = searchParams.get("mine") === "true";
        const includePublic = searchParams.get("public") === "true";

        let query = supabase
          .from("content_playlists")
          .select("*, playlist_items(id)")
          .order("updated_at", { ascending: false });

        if (ownerOnly) {
          query = query.eq("user_id", user.id);
        } else if (includePublic) {
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
        } else {
          query = query.eq("user_id", user.id);
        }

        const { data: playlists, error } = await query;

        if (error) {
          log.error("Failed to list playlists", { error });
          return errorResponse("Failed to list playlists", 500);
        }

        return successResponse({
          playlists: (playlists || []).map((p: any) => ({
            id: p.id,
            userId: p.user_id,
            title: p.title,
            description: p.description,
            isPublic: p.is_public,
            thumbnailUrl: p.thumbnail_url,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            itemCount: p.playlist_items?.length || 0,
          })),
        });
      }

      // -------------------------------------------------------------------
      // GET RATINGS FOR CONTENT
      // -------------------------------------------------------------------
      case "get-ratings": {
        const contentId = searchParams.get("contentId");
        if (!contentId) return errorResponse("Content ID is required", 400);

        const { data: ratings, error } = await supabase
          .from("content_ratings")
          .select("*")
          .eq("content_id", contentId)
          .order("created_at", { ascending: false });

        if (error) {
          log.error("Failed to get ratings", { error });
          return errorResponse("Failed to get ratings", 500);
        }

        // Calculate summary
        const ratingValues = (ratings || []).map((r: any) => r.rating);
        const avg = ratingValues.length > 0
          ? ratingValues.reduce((sum: number, r: number) => sum + r, 0) / ratingValues.length
          : 0;

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingValues.forEach((r: number) => { distribution[r] = (distribution[r] || 0) + 1; });

        return successResponse({
          summary: {
            avgRating: Math.round(avg * 10) / 10,
            ratingCount: ratingValues.length,
            distribution,
          },
          ratings: (ratings || []).map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            contentId: r.content_id,
            rating: r.rating,
            review: r.review,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          })),
        });
      }

      // -------------------------------------------------------------------
      // GET MY RATING FOR CONTENT
      // -------------------------------------------------------------------
      case "get-my-rating": {
        const contentId = searchParams.get("contentId");
        if (!contentId) return errorResponse("Content ID is required", 400);

        const { data: rating } = await supabase
          .from("content_ratings")
          .select("*")
          .eq("content_id", contentId)
          .eq("user_id", user.id)
          .single();

        return successResponse({
          rating: rating ? {
            id: rating.id,
            userId: rating.user_id,
            contentId: rating.content_id,
            rating: rating.rating,
            review: rating.review,
            createdAt: rating.created_at,
            updatedAt: rating.updated_at,
          } : null,
        });
      }

      default:
        return errorResponse(`Unknown request type: ${requestType}`, 400);
    }
  } catch (error) {
    log.error("Content API GET error", { error });
    return errorResponse("Internal server error", 500);
  }
}

// =============================================================================
// POST HANDLERS
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string }> }
) {
  try {
    const { requestType } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (requestType) {
      // -----------------------------------------------------------------------
      // UPLOAD CONTENT
      // -----------------------------------------------------------------------
      case contentRequestTypes.upload: {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string | null;
        const contentType = formData.get("contentType") as ContentType;
        const visibility = (formData.get("visibility") as ContentVisibility) || "private";

        const validation = validateRequiredFields({ file, title, contentType }, [
          "file",
          "title",
          "contentType",
        ]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        const contentData: any = {
          title,
          description,
          content_type: contentType,
          visibility,
          created_by: user.id,
          file_size_bytes: file.size,
          mime_type: file.type,
          original_filename: file.name,
          status: "processing",
        };

        if (contentType === "video") {
          // Upload to Bunny Stream
          if (!isBunnyConfigured()) {
            return errorResponse("Video hosting not configured", 503);
          }

          const { videoId } = await createVideo(title);
          const buffer = Buffer.from(await file.arrayBuffer());
          await uploadVideo(videoId, buffer);

          contentData.video_id = videoId;
          contentData.stream_url = getStreamUrl(videoId);
          contentData.thumbnail_url = getThumbnailUrl(videoId);
        } else {
          // Upload to Supabase Storage
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const storagePath = `content/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("content")
            .upload(storagePath, file);

          if (uploadError) {
            log.error("Storage upload failed", { error: uploadError });
            return errorResponse("Failed to upload file", 500);
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("content").getPublicUrl(storagePath);

          contentData.storage_path = storagePath;
          contentData.storage_url = publicUrl;
          contentData.status = "ready";
        }

        // Save to database
        const { data: content, error: dbError } = await supabase
          .from("content_items")
          .insert(contentData)
          .select()
          .single();

        if (dbError) {
          log.error("Failed to save content", { error: dbError });
          return errorResponse("Failed to save content", 500);
        }

        // Handle tags if provided
        const tagsStr = formData.get("tags") as string | null;
        if (tagsStr) {
          const tags = tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          if (tags.length > 0) {
            await supabase.from("content_tags").insert(
              tags.map((tag) => ({
                content_id: content.id,
                tag,
              }))
            );
          }
        }

        log.info("Content uploaded", { contentId: content.id, type: contentType });

        return successResponse({
          success: true,
          content: mapContentItem(content),
        });
      }

      // -----------------------------------------------------------------------
      // UPDATE PROGRESS
      // -----------------------------------------------------------------------
      case contentRequestTypes.updateProgress: {
        const body = await request.json();
        const { contentId, progressPercent, lastPositionSeconds, watchTimeIncrement } = body;

        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const isCompleted = progressPercent >= 95;

        const { data: existing } = await supabase
          .from("user_content_progress")
          .select("*")
          .eq("content_id", contentId)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          // Update existing progress
          const { error } = await supabase
            .from("user_content_progress")
            .update({
              progress_percent: Math.max(existing.progress_percent, progressPercent || 0),
              last_position_seconds: lastPositionSeconds ?? existing.last_position_seconds,
              is_completed: existing.is_completed || isCompleted,
              completed_at:
                isCompleted && !existing.is_completed
                  ? new Date().toISOString()
                  : existing.completed_at,
              view_count: existing.view_count + (watchTimeIncrement ? 0 : 1),
              total_watch_time_seconds:
                existing.total_watch_time_seconds + (watchTimeIncrement || 0),
              last_viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) {
            log.error("Failed to update progress", { error });
            return errorResponse("Failed to update progress", 500);
          }
        } else {
          // Create new progress record
          const { error } = await supabase.from("user_content_progress").insert({
            user_id: user.id,
            content_id: contentId,
            progress_percent: progressPercent || 0,
            last_position_seconds: lastPositionSeconds || 0,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            view_count: 1,
            total_watch_time_seconds: watchTimeIncrement || 0,
          });

          if (error) {
            log.error("Failed to create progress", { error });
            return errorResponse("Failed to create progress", 500);
          }
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // CREATE COURSE
      // -----------------------------------------------------------------------
      case contentRequestTypes.createCourse: {
        const body = await request.json();
        const validation = validateRequiredFields(body, ["title"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        const { data: course, error } = await supabase
          .from("courses")
          .insert({
            title: body.title,
            description: body.description,
            short_description: body.shortDescription,
            thumbnail_url: body.thumbnailUrl,
            visibility: body.visibility || "private",
            difficulty_level: body.difficultyLevel,
            estimated_duration_minutes: body.estimatedDurationMinutes,
            is_free: body.isFree || false,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          log.error("Failed to create course", { error });
          return errorResponse("Failed to create course", 500);
        }

        return successResponse({ course: mapCourse(course) });
      }

      // -----------------------------------------------------------------------
      // ENROLL IN COURSE
      // -----------------------------------------------------------------------
      case contentRequestTypes.enroll: {
        const body = await request.json();
        const { courseId } = body;

        if (!courseId) {
          return errorResponse("Course ID is required", 400);
        }

        // Check course exists and user can enroll
        const { data: course } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .is("deleted_at", null)
          .single();

        if (!course) {
          return errorResponse("Course not found", 404);
        }

        // Create enrollment
        const { data: enrollment, error } = await supabase
          .from("course_enrollments")
          .upsert(
            {
              course_id: courseId,
              user_id: user.id,
              status: "active",
              enrolled_at: new Date().toISOString(),
            },
            {
              onConflict: "course_id,user_id",
            }
          )
          .select()
          .single();

        if (error) {
          log.error("Failed to enroll", { error });
          return errorResponse("Failed to enroll", 500);
        }

        return successResponse({ enrollment });
      }

      // -----------------------------------------------------------------------
      // ADD BOOKMARK
      // -----------------------------------------------------------------------
      case contentRequestTypes.addBookmark: {
        const body = await request.json();
        const { contentId, note } = body;

        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const { data: bookmark, error } = await supabase
          .from("content_bookmarks")
          .upsert(
            {
              user_id: user.id,
              content_id: contentId,
              note,
            },
            {
              onConflict: "user_id,content_id",
            }
          )
          .select()
          .single();

        if (error) {
          log.error("Failed to add bookmark", { error });
          return errorResponse("Failed to add bookmark", 500);
        }

        return successResponse({ bookmark });
      }

      // -----------------------------------------------------------------------
      // ADD NOTE
      // -----------------------------------------------------------------------
      case contentRequestTypes.addNote: {
        const body = await request.json();
        const { contentId, content: noteContent, timestampSeconds } = body;

        const validation = validateRequiredFields(body, ["contentId", "content"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        const { data: note, error } = await supabase
          .from("content_notes")
          .insert({
            user_id: user.id,
            content_id: contentId,
            content: noteContent,
            timestamp_seconds: timestampSeconds,
          })
          .select()
          .single();

        if (error) {
          log.error("Failed to add note", { error });
          return errorResponse("Failed to add note", 500);
        }

        return successResponse({ note });
      }

      // -----------------------------------------------------------------------
      // ADD MODULE
      // -----------------------------------------------------------------------
      case contentRequestTypes.addModule: {
        const body = await request.json();
        const { courseId, title, description, sortOrder } = body;

        const validation = validateRequiredFields(body, ["courseId", "title"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        // Verify ownership
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("id", courseId)
          .eq("created_by", user.id)
          .single();

        if (!course) {
          return errorResponse("Course not found or not owned", 404);
        }

        const { data: module, error } = await supabase
          .from("course_modules")
          .insert({
            course_id: courseId,
            title,
            description,
            sort_order: sortOrder || 0,
          })
          .select()
          .single();

        if (error) {
          log.error("Failed to add module", { error });
          return errorResponse("Failed to add module", 500);
        }

        return successResponse({ module });
      }

      // -----------------------------------------------------------------------
      // UPDATE MODULE
      // -----------------------------------------------------------------------
      case contentRequestTypes.updateModule: {
        const body = await request.json();
        const { moduleId, title, description } = body;

        if (!moduleId) {
          return errorResponse("Module ID is required", 400);
        }

        // Verify ownership via course
        const { data: existing } = await supabase
          .from("course_modules")
          .select("id, courses!inner(created_by)")
          .eq("id", moduleId)
          .single();

        if (!existing || (existing as any).courses?.created_by !== user.id) {
          return errorResponse("Module not found or not owned", 404);
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;

        const { error } = await supabase.from("course_modules").update(updates).eq("id", moduleId);

        if (error) {
          log.error("Failed to update module", { error });
          return errorResponse("Failed to update module", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // ADD LESSON
      // -----------------------------------------------------------------------
      case contentRequestTypes.addLesson: {
        const body = await request.json();
        const { moduleId, title, description, contentId, sortOrder } = body;

        const validation = validateRequiredFields(body, ["moduleId", "title"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        // Verify ownership via module -> course
        const { data: module } = await supabase
          .from("course_modules")
          .select("id, courses!inner(created_by)")
          .eq("id", moduleId)
          .single();

        if (!module || (module as any).courses?.created_by !== user.id) {
          return errorResponse("Module not found or not owned", 404);
        }

        const { data: lesson, error } = await supabase
          .from("course_lessons")
          .insert({
            module_id: moduleId,
            title,
            description,
            content_id: contentId,
            sort_order: sortOrder || 0,
          })
          .select()
          .single();

        if (error) {
          log.error("Failed to add lesson", { error });
          return errorResponse("Failed to add lesson", 500);
        }

        return successResponse({ lesson });
      }

      // -----------------------------------------------------------------------
      // UPDATE LESSON
      // -----------------------------------------------------------------------
      case contentRequestTypes.updateLesson: {
        const body = await request.json();
        const { lessonId, title, description, contentId } = body;

        if (!lessonId) {
          return errorResponse("Lesson ID is required", 400);
        }

        // Verify ownership via lesson -> module -> course
        const { data: existing } = await supabase
          .from("course_lessons")
          .select("id, course_modules!inner(courses!inner(created_by))")
          .eq("id", lessonId)
          .single();

        if (!existing || (existing as any).course_modules?.courses?.created_by !== user.id) {
          return errorResponse("Lesson not found or not owned", 404);
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (contentId !== undefined) updates.content_id = contentId;

        const { error } = await supabase.from("course_lessons").update(updates).eq("id", lessonId);

        if (error) {
          log.error("Failed to update lesson", { error });
          return errorResponse("Failed to update lesson", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // UPDATE COURSE
      // -----------------------------------------------------------------------
      case contentRequestTypes.updateCourse: {
        const body = await request.json();
        const { courseId, ...updates } = body;

        if (!courseId) {
          return errorResponse("Course ID is required", 400);
        }

        // Verify ownership
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("id", courseId)
          .eq("created_by", user.id)
          .single();

        if (!course) {
          return errorResponse("Course not found or not owned", 404);
        }

        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.shortDescription !== undefined)
          dbUpdates.short_description = updates.shortDescription;
        if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
        if (updates.isPublished !== undefined) {
          dbUpdates.is_published = updates.isPublished;
          if (updates.isPublished) {
            dbUpdates.published_at = new Date().toISOString();
          }
        }
        if (updates.isFree !== undefined) dbUpdates.is_free = updates.isFree;
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        if (updates.difficultyLevel !== undefined)
          dbUpdates.difficulty_level = updates.difficultyLevel;

        const { error } = await supabase.from("courses").update(dbUpdates).eq("id", courseId);

        if (error) {
          log.error("Failed to update course", { error });
          return errorResponse("Failed to update course", 500);
        }

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // CREATE PLAYLIST
      // -------------------------------------------------------------------
      case "create-playlist": {
        const body = await request.json();
        const validation = validateRequiredFields(body, ["title"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        const { data: playlist, error } = await supabase
          .from("content_playlists")
          .insert({
            user_id: user.id,
            title: body.title,
            description: body.description || null,
            is_public: body.isPublic ?? false,
            thumbnail_url: body.thumbnailUrl || null,
          })
          .select()
          .single();

        if (error) {
          log.error("Failed to create playlist", { error });
          return errorResponse("Failed to create playlist", 500);
        }

        return successResponse({
          playlist: {
            id: playlist.id,
            userId: playlist.user_id,
            title: playlist.title,
            description: playlist.description,
            isPublic: playlist.is_public,
            thumbnailUrl: playlist.thumbnail_url,
            createdAt: playlist.created_at,
            updatedAt: playlist.updated_at,
          },
        });
      }

      // -------------------------------------------------------------------
      // UPDATE PLAYLIST
      // -------------------------------------------------------------------
      case "update-playlist": {
        const body = await request.json();
        const { playlistId, ...updates } = body;
        if (!playlistId) return errorResponse("Playlist ID is required", 400);

        // Verify ownership
        const { data: existing } = await supabase
          .from("content_playlists")
          .select("id")
          .eq("id", playlistId)
          .eq("user_id", user.id)
          .single();

        if (!existing) return errorResponse("Playlist not found", 404);

        const dbUpdates: Record<string, unknown> = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
        if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;

        const { error } = await supabase
          .from("content_playlists")
          .update(dbUpdates)
          .eq("id", playlistId);

        if (error) {
          log.error("Failed to update playlist", { error });
          return errorResponse("Failed to update playlist", 500);
        }

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // ADD PLAYLIST ITEM
      // -------------------------------------------------------------------
      case "add-playlist-item": {
        const body = await request.json();
        const validation = validateRequiredFields(body, ["playlistId", "contentId"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        // Verify playlist ownership
        const { data: playlist } = await supabase
          .from("content_playlists")
          .select("id")
          .eq("id", body.playlistId)
          .eq("user_id", user.id)
          .single();

        if (!playlist) return errorResponse("Playlist not found", 404);

        // Get max sort order
        const { data: maxItem } = await supabase
          .from("playlist_items")
          .select("sort_order")
          .eq("playlist_id", body.playlistId)
          .order("sort_order", { ascending: false })
          .limit(1)
          .single();

        const nextOrder = (maxItem?.sort_order ?? -1) + 1;

        const { data: item, error } = await supabase
          .from("playlist_items")
          .upsert(
            {
              playlist_id: body.playlistId,
              content_id: body.contentId,
              sort_order: body.sortOrder ?? nextOrder,
            },
            { onConflict: "playlist_id,content_id" }
          )
          .select()
          .single();

        if (error) {
          log.error("Failed to add playlist item", { error });
          return errorResponse("Failed to add item to playlist", 500);
        }

        return successResponse({
          item: {
            id: item.id,
            playlistId: item.playlist_id,
            contentId: item.content_id,
            sortOrder: item.sort_order,
            addedAt: item.added_at,
          },
        });
      }

      // -------------------------------------------------------------------
      // REORDER PLAYLIST ITEMS
      // -------------------------------------------------------------------
      case "reorder-playlist-items": {
        const body = await request.json();
        const { playlistId, itemIds } = body;
        if (!playlistId || !Array.isArray(itemIds)) {
          return errorResponse("playlistId and itemIds array are required", 400);
        }

        // Verify ownership
        const { data: playlist } = await supabase
          .from("content_playlists")
          .select("id")
          .eq("id", playlistId)
          .eq("user_id", user.id)
          .single();

        if (!playlist) return errorResponse("Playlist not found", 404);

        // Update sort orders
        const reorderUpdates = itemIds.map((id: string, index: number) =>
          supabase
            .from("playlist_items")
            .update({ sort_order: index })
            .eq("id", id)
            .eq("playlist_id", playlistId)
        );

        await Promise.all(reorderUpdates);

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // RATE CONTENT
      // -------------------------------------------------------------------
      case "rate-content": {
        const body = await request.json();
        const validation = validateRequiredFields(body, ["contentId", "rating"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        if (body.rating < 1 || body.rating > 5) {
          return errorResponse("Rating must be between 1 and 5", 400);
        }

        const { data: rating, error } = await supabase
          .from("content_ratings")
          .upsert(
            {
              user_id: user.id,
              content_id: body.contentId,
              rating: body.rating,
              review: body.review || null,
            },
            { onConflict: "user_id,content_id" }
          )
          .select()
          .single();

        if (error) {
          log.error("Failed to save rating", { error });
          return errorResponse("Failed to save rating", 500);
        }

        return successResponse({
          rating: {
            id: rating.id,
            userId: rating.user_id,
            contentId: rating.content_id,
            rating: rating.rating,
            review: rating.review,
            createdAt: rating.created_at,
            updatedAt: rating.updated_at,
          },
        });
      }

      default:
        return errorResponse(`Unknown request type: ${requestType}`, 400);
    }
  } catch (error) {
    log.error("Content API POST error", { error });
    return errorResponse("Internal server error", 500);
  }
}

// =============================================================================
// DELETE HANDLERS
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string }> }
) {
  try {
    const { requestType } = await params;
    const searchParams = request.nextUrl.searchParams;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (requestType) {
      // -----------------------------------------------------------------------
      // DELETE CONTENT
      // -----------------------------------------------------------------------
      case contentRequestTypes.deleteContent: {
        const contentId = searchParams.get("contentId");
        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        // Verify ownership
        const { data: content } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", contentId)
          .eq("created_by", user.id)
          .single();

        if (!content) {
          return errorResponse("Content not found or not owned", 404);
        }

        // Delete from Bunny if video
        if (content.video_id && isBunnyConfigured()) {
          try {
            await deleteVideo(content.video_id);
          } catch (error) {
            log.warn("Failed to delete from Bunny", { error });
          }
        }

        // Delete from storage if document/audio
        if (content.storage_path) {
          await supabase.storage.from("content").remove([content.storage_path]);
        }

        // Soft delete
        const { error } = await supabase
          .from("content_items")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", contentId);

        if (error) {
          log.error("Failed to delete content", { error });
          return errorResponse("Failed to delete content", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // REMOVE BOOKMARK
      // -----------------------------------------------------------------------
      case contentRequestTypes.removeBookmark: {
        const contentId = searchParams.get("contentId");
        if (!contentId) {
          return errorResponse("Content ID is required", 400);
        }

        const { error } = await supabase
          .from("content_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId);

        if (error) {
          log.error("Failed to remove bookmark", { error });
          return errorResponse("Failed to remove bookmark", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // DELETE NOTE
      // -----------------------------------------------------------------------
      case contentRequestTypes.deleteNote: {
        const noteId = searchParams.get("noteId");
        if (!noteId) {
          return errorResponse("Note ID is required", 400);
        }

        const { error } = await supabase
          .from("content_notes")
          .delete()
          .eq("id", noteId)
          .eq("user_id", user.id);

        if (error) {
          log.error("Failed to delete note", { error });
          return errorResponse("Failed to delete note", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // DELETE MODULE
      // -----------------------------------------------------------------------
      case contentRequestTypes.deleteModule: {
        const moduleId = searchParams.get("moduleId");
        if (!moduleId) {
          return errorResponse("Module ID is required", 400);
        }

        // Verify ownership via course
        const { data: module } = await supabase
          .from("course_modules")
          .select("id, courses!inner(created_by)")
          .eq("id", moduleId)
          .single();

        if (!module || (module as any).courses?.created_by !== user.id) {
          return errorResponse("Module not found or not owned", 404);
        }

        const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);

        if (error) {
          log.error("Failed to delete module", { error });
          return errorResponse("Failed to delete module", 500);
        }

        return successResponse({ success: true });
      }

      // -----------------------------------------------------------------------
      // DELETE LESSON
      // -----------------------------------------------------------------------
      case contentRequestTypes.deleteLesson: {
        const lessonId = searchParams.get("lessonId");
        if (!lessonId) {
          return errorResponse("Lesson ID is required", 400);
        }

        // Verify ownership via lesson -> module -> course
        const { data: lesson } = await supabase
          .from("course_lessons")
          .select("id, course_modules!inner(courses!inner(created_by))")
          .eq("id", lessonId)
          .single();

        if (!lesson || (lesson as any).course_modules?.courses?.created_by !== user.id) {
          return errorResponse("Lesson not found or not owned", 404);
        }

        const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);

        if (error) {
          log.error("Failed to delete lesson", { error });
          return errorResponse("Failed to delete lesson", 500);
        }

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // DELETE PLAYLIST
      // -------------------------------------------------------------------
      case "delete-playlist": {
        const playlistId = searchParams.get("playlistId");
        if (!playlistId) return errorResponse("Playlist ID is required", 400);

        // Verify ownership
        const { data: playlist } = await supabase
          .from("content_playlists")
          .select("id")
          .eq("id", playlistId)
          .eq("user_id", user.id)
          .single();

        if (!playlist) return errorResponse("Playlist not found", 404);

        const { error } = await supabase
          .from("content_playlists")
          .delete()
          .eq("id", playlistId);

        if (error) {
          log.error("Failed to delete playlist", { error });
          return errorResponse("Failed to delete playlist", 500);
        }

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // REMOVE PLAYLIST ITEM
      // -------------------------------------------------------------------
      case "remove-playlist-item": {
        const playlistId = searchParams.get("playlistId");
        const contentId = searchParams.get("contentId");
        if (!playlistId || !contentId) {
          return errorResponse("Playlist ID and Content ID are required", 400);
        }

        // Verify ownership
        const { data: playlist } = await supabase
          .from("content_playlists")
          .select("id")
          .eq("id", playlistId)
          .eq("user_id", user.id)
          .single();

        if (!playlist) return errorResponse("Playlist not found", 404);

        const { error } = await supabase
          .from("playlist_items")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("content_id", contentId);

        if (error) {
          log.error("Failed to remove playlist item", { error });
          return errorResponse("Failed to remove playlist item", 500);
        }

        return successResponse({ success: true });
      }

      // -------------------------------------------------------------------
      // DELETE RATING
      // -------------------------------------------------------------------
      case "delete-rating": {
        const contentId = searchParams.get("contentId");
        if (!contentId) return errorResponse("Content ID is required", 400);

        const { error } = await supabase
          .from("content_ratings")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", contentId);

        if (error) {
          log.error("Failed to delete rating", { error });
          return errorResponse("Failed to delete rating", 500);
        }

        return successResponse({ success: true });
      }

      default:
        return errorResponse(`Unknown request type: ${requestType}`, 400);
    }
  } catch (error) {
    log.error("Content API DELETE error", { error });
    return errorResponse("Internal server error", 500);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapContentItem(item: any): ContentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.content_type,
    status: item.status,
    visibility: item.visibility,
    videoId: item.video_id,
    streamUrl: item.stream_url,
    thumbnailUrl: item.thumbnail_url,
    storagePath: item.storage_path,
    storageUrl: item.storage_url,
    durationSeconds: item.duration_seconds,
    fileSizeBytes: item.file_size_bytes,
    mimeType: item.mime_type,
    originalFilename: item.original_filename,
    transcript: item.transcript,
    captionsUrl: item.captions_url,
    createdBy: item.created_by,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    publishedAt: item.published_at,
    deletedAt: item.deleted_at,
  };
}

function mapCourse(course: any) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    shortDescription: course.short_description,
    thumbnailUrl: course.thumbnail_url,
    isPublished: course.is_published,
    isFree: course.is_free,
    requiresEnrollment: course.requires_enrollment,
    visibility: course.visibility,
    allowedCohortIds: course.allowed_cohort_ids,
    estimatedDurationMinutes: course.estimated_duration_minutes,
    difficultyLevel: course.difficulty_level,
    createdBy: course.created_by,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
    publishedAt: course.published_at,
    deletedAt: course.deleted_at,
  };
}
