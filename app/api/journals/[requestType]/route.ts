export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { pick } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import {
  processGamification,
  journalToActivityType,
  type GamificationResult,
} from "@lib/services/gamificationHook";
import { createClient, createServiceClient } from "@lib/supabase-server";
import { serverErrorTypes } from "@resources/types/error";
import {
  JournalData,
  journalEntryTypes,
  journalRequestTypes,
  journalTypes,
} from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { uploadFileToStorage } from "app/api/upload/controller";

import { validateJournalSchema } from "./validation";

dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================================================
// Type Definitions for Type Safety
// ============================================================================

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  journal: JournalData;
  images: ImageRawData[];
};

// GET handler types
interface GetFetcherArgs {
  userId: string;
  sessionId: string;
  userTimezone: string;
}

interface FetcherErrorResponse {
  error: string;
}

type GetFetcherHandler = (
  args: GetFetcherArgs
) => Promise<FetcherErrorResponse | Record<string, unknown>[]>;

// POST handler types
interface CreateJournalArgs {
  requestType: string;
  sessionId: string;
  userId: string;
  journal: JournalData & { id?: string };
  images: ImageRawData[];
}

interface CreateJournalErrorResponse {
  error: string;
  details?: Array<{ message: string; path: (string | number)[] }>;
}

type CreateJournalHandler = (
  args: Partial<CreateJournalArgs>
) => Promise<CreateJournalErrorResponse | Record<string, unknown>>;

// Journal database record type - allows null for optional fields from parsed journal
interface JournalDbRecord {
  id: string;
  session_id: string;
  book_id: string;
  user_id: string;
  images?: string[];
  mood_score?: number | null;
  captured_essence?: string | null;
  mood_contribution?: string | null;
  mantra?: string | null;
  journal_type?: string;
  is_completed?: boolean;
  insight_impact?: string | null;
  insight?: string | null;
  success?: string | null;
  changes?: string | null;
  freeflow?: string | null;
  wins?: string | null;
  challenges?: string | null;
  lessons?: string | null;
}

export async function GET(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is requried" }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const timezone = request.headers.get("x-user-timezone");

  let fetcherHandler: GetFetcherHandler | null = null;
  let args: GetFetcherArgs | null = null;
  let responseName: string | undefined;

  if (requestType === journalRequestTypes.userDailyJournals) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    fetcherHandler = getUserDailyJournals;
    args = {
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    };
    responseName = "journals";
  }

  // GET: Journal history with pagination and filtering
  if (requestType === journalRequestTypes.getUserJournalHistory) {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
    const journalType = url.searchParams.get("journalType");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const result = await getUserJournalHistory({
      userId: user.id,
      sessionId: sessionId || undefined,
      limit,
      offset,
      journalType: journalType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if ("error" in result) {
      return NextResponse.json({ error: { message: result.error } }, { status: 500 });
    }
    return NextResponse.json(result);
  }

  if (!fetcherHandler || !responseName || !args) {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }
  const data = await fetcherHandler(args);
  if ("error" in data) {
    return NextResponse.json({ error: { message: data.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      [responseName]: data,
    });
  }
}

export async function POST(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is requried" }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, journal, images }: PostRequestJson = await request.json();

  if (!sessionId || !journal) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  let fetcherHandler: CreateJournalHandler | null = null;
  let args: Partial<CreateJournalArgs> | null = null;
  const responseName = "journal";

  if (
    [
      journalRequestTypes.createMorningJournal,
      journalRequestTypes.createEveningJournal,
      journalRequestTypes.createWeeklyJournal,
    ].includes(requestType)
  ) {
    fetcherHandler = createJournal;
    args = { requestType, sessionId, userId: user.id, journal: journal, images };
  }
  if (!fetcherHandler || !responseName || !args) {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }
  const data = await fetcherHandler(args);
  if ("error" in data) {
    return NextResponse.json({ error: { message: data.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      [responseName]: data,
    });
  }
}

// PATCH: Update an existing journal
export async function PATCH(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (requestType !== journalRequestTypes.updateJournal) {
    return NextResponse.json({ error: "Invalid request type for PATCH" }, { status: 400 });
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
    const { journalId, updates } = await request.json();

    if (!journalId || !updates) {
      return NextResponse.json({ error: "Journal ID and updates are required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existingJournal, error: fetchError } = await supabase
      .from("journals")
      .select("id, user_id")
      .eq("id", journalId)
      .single();

    if (fetchError || !existingJournal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    if (existingJournal.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this journal" }, { status: 403 });
    }

    // Only allow updating certain fields
    const allowedFields = new Set([
      "mood_score",
      "captured_essence",
      "mood_contribution",
      "mantra",
      "insight",
      "insight_impact",
      "success",
      "changes",
      "freeflow",
      "wins",
      "challenges",
      "lessons",
    ]);

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.has(key)) {
        sanitizedUpdates[key] = value;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at timestamp
    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data: updatedJournal, error: updateError } = await supabase
      .from("journals")
      .update(sanitizedUpdates)
      .eq("id", journalId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ journal: camelcaseKeys(updatedJournal) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Soft delete a journal
export async function DELETE(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (requestType !== journalRequestTypes.deleteJournal) {
    return NextResponse.json({ error: "Invalid request type for DELETE" }, { status: 400 });
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
    const url = new URL(request.url);
    const journalId = url.searchParams.get("journalId");

    if (!journalId) {
      return NextResponse.json({ error: "Journal ID is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existingJournal, error: fetchError } = await supabase
      .from("journals")
      .select("id, user_id")
      .eq("id", journalId)
      .single();

    if (fetchError || !existingJournal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    if (existingJournal.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this journal" }, { status: 403 });
    }

    // Soft delete by setting deleted_at
    const { error: deleteError } = await supabase
      .from("journals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", journalId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Journal deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const getUserDailyJournals = async ({
  userId,
  sessionId,
  userTimezone,
}: {
  userId: string;
  sessionId: string;
  userTimezone: string;
}) => {
  const supabase = createClient();
  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }

    const startOfDay = dayjs().tz(userTimezone).startOf("day").utc().toISOString();
    const endOfDay = dayjs().tz(userTimezone).endOf("day").utc().toISOString();

    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .in("journal_type", [journalTypes.morningJournal, journalTypes.eveningJournal])
      .gte("entry_date", startOfDay)
      .lte("entry_date", endOfDay);

    if (error) return { error: error.message };

    return camelcaseKeys(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const getUserJournalHistory = async ({
  userId,
  sessionId,
  limit = 20,
  offset = 0,
  journalType,
  startDate,
  endDate,
}: {
  userId: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
  journalType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  { error: string } | { journals: Record<string, unknown>[]; total: number; hasMore: boolean }
> => {
  const supabase = createClient();
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    // Build query
    let query = supabase
      .from("journals")
      .select("*, journal_entries(*)", { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("entry_date", { ascending: false });

    // Apply filters
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (journalType) {
      query = query.eq("journal_type", journalType);
    }

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }

    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { error: error.message };
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      journals: camelcaseKeys(data || []),
      total,
      hasMore,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const createJournal: CreateJournalHandler = async ({
  requestType,
  sessionId,
  userId,
  journal,
  images,
}) => {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceClient();
    if (!sessionId || !userId || !journal) {
      return { error: "invalid-body" };
    }
    const { journal: parsedJournal } = validateJournalSchema.parse({ requestType, journal });

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const journalId = journal?.id ?? uuidv4();

    const uploadedImages: string[] = [];
    if (images?.length) {
      for (const image of images) {
        const path = await uploadFileToStorage({
          file: image.file,
          path: `journals/${userId}/${journalId}`,
          name: image?.name,
          contentType: image?.contentType,
        });

        // Only add successful uploads (string paths, not error objects)
        if (typeof path === "string") {
          uploadedImages.push(path);
        }
      }
    }
    let data: JournalDbRecord = {
      id: journalId,
      session_id: sessionData.id,
      book_id: sessionData.book_id,
      user_id: userId,
    };
    if (uploadedImages.length) {
      data = {
        ...data,
        images: uploadedImages,
      };
    }
    if (requestType === journalRequestTypes.createMorningJournal) {
      data = {
        ...data,
        mood_score: parsedJournal?.moodScore,
        captured_essence: parsedJournal?.capturedEssence,
        mood_contribution: parsedJournal?.moodContribution,
        mantra: parsedJournal?.mantra,
        journal_type: journalTypes.morningJournal,
        is_completed: true,
      };
    } else if (requestType === journalRequestTypes.createEveningJournal) {
      let freeflow: string | null = null;
      if (parsedJournal?.freeflow?.file) {
        const freeflowResult = await uploadFileToStorage({
          file: parsedJournal?.freeflow?.file,
          path: `drawings/${userId}/${journalId}`,
          name: parsedJournal?.freeflow?.name,
          contentType: parsedJournal?.freeflow?.contentType,
        });
        if (typeof freeflowResult === "string") {
          freeflow = freeflowResult;
        } else if (freeflowResult?.error) {
          return { error: freeflowResult.error };
        }
      } else if (typeof parsedJournal?.freeflow === "string") {
        freeflow = parsedJournal?.freeflow;
      }
      data = {
        ...data,
        mood_score: parsedJournal?.moodScore,
        insight_impact: parsedJournal?.insightImpact,
        ...pick(parsedJournal, ["insight", "success", "changes"]),
        journal_type: journalTypes.eveningJournal,
        freeflow,
        is_completed: true,
      };
    } else if (requestType === journalRequestTypes.createWeeklyJournal) {
      data = {
        ...data,
        ...pick(parsedJournal, ["wins", "challenges", "lessons"]),
        journal_type: journalTypes.weeklyReflection,
        is_completed: true,
      };
    }

    const { data: journalData, error: journalError } = await supabaseAdmin
      .from("journals")
      .insert(data)
      .select()
      .single();

    if (journalError || !journalData) return { error: serverErrorTypes.serverError };

    // Process gamification (non-blocking — errors won't fail the request)
    const gamActivityType = journalToActivityType(requestType!);
    let gamification: GamificationResult = { points: 0, celebrations: [] };
    if (gamActivityType && userId && sessionId) {
      gamification = await processGamification({
        supabase: supabaseAdmin,
        userId,
        sessionId,
        activityType: gamActivityType,
        sourceId: journalId,
        sourceType: "journal",
      });
    }

    if (requestType === journalRequestTypes.createMorningJournal) {
      const journalEntries = Object.entries({
        [journalEntryTypes.affirmation]: parsedJournal.affirmations,
        [journalEntryTypes.excitement]: parsedJournal.excitements,
        [journalEntryTypes.gratitude]: parsedJournal.gratitudes,
      }).map(([key, value]) => ({
        journal_id: journalId,
        content: value,
        entry_type: key,
      }));

      const { data: _journalEntryData, error: journalEntryError } = await supabase
        .from("journal_entries")
        .insert(journalEntries);

      if (journalEntryError) return { error: serverErrorTypes.serverError };

      return {
        ...camelcaseKeys({
          ...journalData,
          ...{
            affirmations: parsedJournal.affirmations,
            excitements: parsedJournal.excitements,
            gratitudes: parsedJournal.gratitudes,
          },
        }),
        gamification,
      };
    } else if (requestType === journalRequestTypes.createEveningJournal) {
      const journalEntries = Object.entries({
        [journalEntryTypes.dreammagic]: parsedJournal.dreammagic,
      }).map(([key, value]) => ({
        journal_id: journalId,
        content: value,
        entry_type: key,
      }));

      const { data: _journalEntryData, error: journalEntryError } = await supabase
        .from("journal_entries")
        .insert(journalEntries);

      if (journalEntryError) return { error: serverErrorTypes.serverError };

      return {
        ...camelcaseKeys({
          ...journalData,
          ...{
            dreammagic: parsedJournal.dreammagic,
          },
        }),
        gamification,
      };
    }
    return { ...camelcaseKeys(journalData), gamification };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        error: serverErrorTypes.invalidRequest,
        details: error.errors,
      };
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { error: message };
  }
};
