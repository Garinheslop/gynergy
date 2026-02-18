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
  actionToActivityType,
  type GamificationResult,
} from "@lib/services/gamificationHook";
import { createClient, createServiceClient } from "@lib/supabase-server";
import { actionRequestTypes, ActionLogData, actionLogTypes } from "@resources/types/action";
import { serverErrorTypes } from "@resources/types/error";
import { ImageRawData } from "@resources/types/ocr";
import { uploadFileToStorage } from "app/api/upload/controller";

import { validateActionSchema } from "./validation";

dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================================================
// Type Definitions for Type Safety
// ============================================================================

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  actionLog: ActionLogData;
  images: ImageRawData[];
};

interface FetcherErrorResponse {
  error: string;
  details?: Array<{ message: string; path: (string | number)[] }>;
}

// POST handler types
interface CreateActionLogArgs {
  requestType: string;
  sessionId: string;
  actionId: string;
  userId: string;
  actionLog: ActionLogData & { id?: string };
  images: ImageRawData[];
}

type _CreateActionLogHandler = (
  args: Partial<CreateActionLogArgs>
) => Promise<FetcherErrorResponse | Record<string, unknown>>;

// Enrollment data type for proper typing (arrays due to Supabase join)
interface EnrollmentDataRow {
  enrollment_date: string;
  session: Array<{
    id: string;
    book: Array<{
      id: string;
    }>;
  }>;
}

// Action log database record type - allows null for optional fields
interface ActionLogDbRecord {
  id: string;
  session_id: string;
  action_id: string;
  user_id: string;
  images?: string[];
  is_completed?: boolean | null;
  note?: string | null;
  reflection?: string | null;
  obstacles?: string | null;
  draw?: string | null;
  list?: string | null;
  action_type?: string;
  eulogy?: string | null;
  reward?: string | null;
  motivation?: string | null;
  purpose?: string | null;
  success?: string | null;
  focus?: string | null;
  freeflow?: string | null;
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
  const enrollmentId = new URL(request.url).searchParams.get("enrollmentId");
  const timezone = request.headers.get("x-user-timezone");

  let data: FetcherErrorResponse | Record<string, unknown>[];

  if (requestType === actionRequestTypes.userActions) {
    if (!enrollmentId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is requried" }, { status: 400 });
    }

    data = await getUserActions({
      userId: user.id,
      enrollmentId,
      timezone,
    });
  } else if (requestType === actionRequestTypes.userDailyActionLogs) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    data = await getUserActionLogs({
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    });
  } else {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }

  if ("error" in data) {
    // "no-user-book-session", "no-book-found", "no-action", "bad-request" are data-not-found
    const notFoundErrors = ["no-user-book-session", "no-book-found", "no-action", "bad-request"];
    const errorMsg = String(data.error);
    const status = notFoundErrors.includes(errorMsg) ? 404 : 500;
    return NextResponse.json({ error: { message: data.error } }, { status });
  } else {
    return NextResponse.json({
      actions: data,
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

  const { actionId, sessionId, actionLog, images }: PostRequestJson = await request.json();

  if (!sessionId || !actionLog) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  let data: FetcherErrorResponse | Record<string, unknown>;

  if (
    [actionRequestTypes.completeDailyAction, actionRequestTypes.completeWeeklyChallenge].includes(
      requestType
    )
  ) {
    data = await createUserActionLog({
      requestType,
      sessionId,
      actionId: actionId,
      userId: user.id,
      actionLog: actionLog,
      images,
    });
  } else {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }

  if ("error" in data) {
    return NextResponse.json({ error: { message: data.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      action: data,
    });
  }
}

const getUserActions = async ({
  userId,
  enrollmentId,
  timezone,
}: {
  userId: string;
  enrollmentId: string;
  timezone: string;
}) => {
  const supabase = createClient();
  try {
    if (!userId || !enrollmentId) {
      return { error: "bad-request" };
    }
    const { data: enrollmentData, error: enrollmentDataError } = await supabase
      .from("session_enrollments")
      .select("enrollment_date, session: book_sessions(id, book: books(id)) ")
      .eq("user_id", userId)
      .eq("id", enrollmentId)
      .limit(1);

    if (enrollmentDataError || !enrollmentData) return { error: "no-user-book-session" };

    const currentSessionDay =
      dayjs()
        .tz(timezone)
        .startOf("d")
        .diff(dayjs(enrollmentData[0].enrollment_date).tz(timezone).startOf("d"), "d") + 1;
    const currentSessionWeek =
      dayjs()
        .tz(timezone)
        .startOf("d")
        .diff(dayjs(enrollmentData[0].enrollment_date).tz(timezone).startOf("d").add(7, "d"), "w") +
      1;

    const enrollmentRow = enrollmentData[0] as EnrollmentDataRow;
    const bookId = enrollmentRow.session[0]?.book[0]?.id;
    if (!bookId) return { error: "no-book-found" };

    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("book_id", bookId)
      .or(
        `and(period.eq.${currentSessionDay},action_type.eq.daily),and(period.eq.${currentSessionWeek},action_type.eq.weekly)`
      );

    if (error || !data) return { error: "no-action" };
    else return camelcaseKeys(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
const getUserActionLogs = async ({
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
      .from("action_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .in("action_type", [actionLogTypes.gratitude, actionLogTypes.weeklyChallenge])
      .gte("entry_date", startOfDay)
      .lte("entry_date", endOfDay);

    if (error) return { error: error.message };

    return camelcaseKeys(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
const createUserActionLog = async ({
  requestType,
  sessionId,
  actionId,
  userId,
  actionLog,
  images,
}: Partial<{
  requestType: string;
  sessionId: string;
  actionId: string;
  userId: string;
  actionLog: ActionLogData;
  images: ImageRawData[];
}>) => {
  try {
    const supabaseAdmin = createServiceClient();
    if (!actionId || !sessionId || !userId || !actionLog) {
      return { error: "invalid-body" };
    }
    const { actionLog: parsedActionLog } = validateActionSchema.parse({ requestType, actionLog });

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const actionLogId = actionLog?.id ?? uuidv4();

    const uploadedImages: string[] = [];
    if (images?.length) {
      for (const image of images) {
        const path = await uploadFileToStorage({
          file: image.file,
          path: `action-logs/${userId}/${actionLogId}`,
          name: image?.name,
          contentType: image?.contentType,
        });

        // Only add successful uploads (string paths, not error objects)
        if (typeof path === "string") {
          uploadedImages.push(path);
        }
      }
    }
    let data: ActionLogDbRecord = {
      id: actionLogId,
      session_id: sessionData.id,
      action_id: actionId,
      user_id: userId,
      images: uploadedImages,
    };
    if (requestType === actionRequestTypes.completeDailyAction) {
      let draw: string | null = null;
      if (parsedActionLog?.draw?.file) {
        const drawResult = await uploadFileToStorage({
          file: parsedActionLog?.draw?.file,
          path: `drawings/${userId}/${actionLogId}`,
          name: parsedActionLog?.draw?.name,
          contentType: parsedActionLog?.draw?.contentType,
        });
        if (typeof drawResult === "string") {
          draw = drawResult;
        } else if (drawResult?.error) {
          return { error: drawResult.error };
        }
      }
      data = {
        ...data,
        is_completed: parsedActionLog.isCompleted ?? false,
        note: parsedActionLog?.note ?? null,
        reflection: parsedActionLog?.reflection ?? null,
        obstacles: parsedActionLog?.obstacles ?? null,
        draw: draw,
        list: parsedActionLog?.list ? JSON.stringify(parsedActionLog.list) : null,
        action_type: actionLogTypes.gratitude,
      };
    } else if (requestType === actionRequestTypes.completeWeeklyChallenge) {
      let freeflow: string | null = null;
      if (parsedActionLog?.freeflow?.file) {
        const freeflowResult = await uploadFileToStorage({
          file: parsedActionLog?.freeflow?.file,
          path: `drawings/${userId}/${actionLogId}`,
          name: parsedActionLog?.freeflow?.name,
          contentType: parsedActionLog?.freeflow?.contentType,
        });
        if (typeof freeflowResult === "string") {
          freeflow = freeflowResult;
        } else if (freeflowResult?.error) {
          return { error: freeflowResult.error };
        }
      } else if (typeof parsedActionLog?.freeflow === "string") {
        freeflow = parsedActionLog?.freeflow;
      }
      data = {
        ...data,
        ...pick(parsedActionLog, ["eulogy", "reward", "motivation", "purpose", "success", "focus"]),
        freeflow,
        action_type: actionLogTypes.weeklyChallenge,
        is_completed: parsedActionLog.isCompleted ?? false,
      };
    }

    if (parsedActionLog?.journey) {
      const { error: journeyError } = await supabaseAdmin
        .from("journey")
        .insert({
          session_id: sessionData.id,
          user_id: userId,
          romantic_relationship_situation:
            parsedActionLog?.journey?.romanticRelationshipSituation ?? null,
          romantic_relationship_vision:
            parsedActionLog?.journey?.romanticRelationshipVision ?? null,
          family_friend_situation: parsedActionLog?.journey?.familyFriendSituation ?? null,
          family_friend_vision: parsedActionLog?.journey?.familyFriendVision ?? null,
          quality_of_life_situation: parsedActionLog?.journey?.qualityOfLifeSituation ?? null,
          quality_of_life_vision: parsedActionLog?.journey?.qualityOfLifeVision ?? null,
          spiritual_situation: parsedActionLog?.journey?.spiritualSituation ?? null,
          spiritual_vision: parsedActionLog?.journey?.spiritualVision ?? null,

          romantic_relationship_why: parsedActionLog?.journey?.romanticRelationshipWhy ?? null,
          romantic_relationship_strategy:
            parsedActionLog?.journey?.romanticRelationshipStrategy ?? null,
          family_friend_why: parsedActionLog?.journey?.familyFriendWhy ?? null,
          family_friend_strategy: parsedActionLog?.journey?.familyFriendStrategy ?? null,
          quality_of_life_why: parsedActionLog?.journey?.qualityOfLifeWhy ?? null,
          quality_of_life_strategy: parsedActionLog?.journey?.qualityOfLifeStrategy ?? null,
          spiritual_why: parsedActionLog?.journey?.spiritualWhy ?? null,
          spiritual_strategy: parsedActionLog?.journey?.spiritualStrategy ?? null,

          health_fitness_situation: parsedActionLog?.journey?.healthFitnessSituation ?? null,
          health_fitness_vision: parsedActionLog?.journey?.healthFitnessVision ?? null,
          personal_dev_situation: parsedActionLog?.journey?.personalDevSituation ?? null,
          personal_dev_vision: parsedActionLog?.journey?.personalDevVision ?? null,
          career_business_situation: parsedActionLog?.journey?.careerBusinessSituation ?? null,
          career_business_vision: parsedActionLog?.journey?.careerBusinessVision ?? null,
          financial_situation: parsedActionLog?.journey?.financialSituation ?? null,
          financial_vision: parsedActionLog?.journey?.financialVision ?? null,

          health_fitness_why: parsedActionLog?.journey?.healthFitnessWhy ?? null,
          health_fitness_strategy: parsedActionLog?.journey?.healthFitnessStrategy ?? null,
          personal_dev_why: parsedActionLog?.journey?.personalDevWhy ?? null,
          personal_dev_strategy: parsedActionLog?.journey?.personalDevStrategy ?? null,
          career_business_why: parsedActionLog?.journey?.careerBusinessWhy ?? null,
          career_business_strategy: parsedActionLog?.journey?.careerBusinessStrategy ?? null,
          financial_why: parsedActionLog?.journey?.financialWhy ?? null,
          financial_strategy: parsedActionLog?.journey?.financialStrategy ?? null,
        })
        .select()
        .single();

      if (journeyError) return { error: serverErrorTypes.serverError };
    }

    const { data: actionLogData, error: actionLogError } = await supabaseAdmin
      .from("action_logs")
      .insert(data)
      .select()
      .single();

    if (actionLogError || !actionLogData) return { error: serverErrorTypes.serverError };

    // Process gamification (non-blocking — errors won't fail the request)
    const gamActivityType = actionToActivityType(requestType!);
    let gamification: GamificationResult = { points: 0, celebrations: [] };
    if (gamActivityType && userId && sessionId) {
      gamification = await processGamification({
        supabase: supabaseAdmin,
        userId,
        sessionId,
        activityType: gamActivityType,
        sourceId: actionLogData.id,
        sourceType: "action_log",
      });
    }

    return { ...camelcaseKeys(actionLogData), gamification };
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
