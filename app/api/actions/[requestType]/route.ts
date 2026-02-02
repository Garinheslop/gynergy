import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { pick } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { actionRequestTypes, ActionLogData, actionLogTypes } from "@resources/types/action";
import { serverErrorTypes } from "@resources/types/error";
import { ImageRawData } from "@resources/types/ocr";
import { uploadFileToStorage } from "app/api/upload/controller";

import { validateActionSchema } from "./validation";



dayjs.extend(utc);
dayjs.extend(timezone);

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  actionLog: ActionLogData;
  images: ImageRawData[];
};

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

  console.log({ authError });
  console.log({ user });

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const enrollmentId = new URL(request.url).searchParams.get("enrollmentId");
  const timezone = request.headers.get("x-user-timezone");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let args: any = {};
  let responseName;

  if (requestType === actionRequestTypes.userActions) {
    if (!enrollmentId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is requried" }, { status: 400 });
    }

    fetcherHandler = getUserActions;
    args = {
      userId: user.id,
      enrollmentId,
      timezone,
    };
    responseName = "actions";
  } else if (requestType === actionRequestTypes.userDailyActionLogs) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    fetcherHandler = getUserActionLogs;
    args = {
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    };
    responseName = "actions";
  }
  if (!fetcherHandler || !responseName) {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }
  const data = await fetcherHandler(args);
  if (data?.error) {
    return NextResponse.json({ error: { message: data?.error } }, { status: 500 });
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

  const { actionId, sessionId, actionLog, images }: PostRequestJson = await request.json();

  if (!sessionId || !actionLog) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let args: any = {};
  const responseName = "action";

  if (
    [actionRequestTypes.completeDailyAction, actionRequestTypes.completeWeeklyChallenge].includes(
      requestType
    )
  ) {
    fetcherHandler = createUserActionLog;
    args = {
      requestType,
      sessionId,
      actionId: actionId,
      userId: user.id,
      actionLog: actionLog,
      images,
    };
  }
  if (!fetcherHandler || !responseName) {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }
  const data = await fetcherHandler(args);
  if (data?.error) {
    return NextResponse.json({ error: { message: data?.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      [responseName]: data,
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

    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("book_id", (enrollmentData[0] as any).session.book.id)
      .or(
        `and(period.eq.${currentSessionDay},action_type.eq.daily),and(period.eq.${currentSessionWeek},action_type.eq.weekly)`
      );

    if (error || !data) return { error: "no-action" };
    else return camelcaseKeys(data);
  } catch (err: any) {
    return { error: err.message };
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
  } catch (err: any) {
    return { error: err.message };
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

    const uploadedImages = [];
    if (images?.length) {
      for (let index = 0; index < images.length; index++) {
        const path = await uploadFileToStorage({
          file: images[index].file,
          path: `action-logs/${userId}/${actionLogId}`,
          name: images[index]?.name,
          contentType: images[index]?.contentType,
        });

        uploadedImages.push(path);
      }
    }
    let data: any = {
      id: actionLogId,
      session_id: sessionData.id,
      action_id: actionId,
      user_id: userId,
      images: uploadedImages,
    };
    if (requestType === actionRequestTypes.completeDailyAction) {
      let draw;
      if (parsedActionLog?.draw?.file) {
        draw = await uploadFileToStorage({
          file: parsedActionLog?.draw?.file,
          path: `drawings/${userId}/${actionLogId}`,
          name: parsedActionLog?.draw?.name,
          contentType: parsedActionLog?.draw?.contentType,
        });
      } else {
        draw = null;
      }
      data = {
        ...data,
        is_completed: parsedActionLog.isCompleted,
        note: parsedActionLog?.note ?? null,
        reflection: parsedActionLog?.reflection ?? null,
        obstacles: parsedActionLog?.obstacles ?? null,
        draw: draw,
        list: parsedActionLog?.list ?? null,
        action_type: actionLogTypes.gratitude,
      };
    } else if (requestType === actionRequestTypes.completeWeeklyChallenge) {
      let freeflow = null;
      if (parsedActionLog?.freeflow?.file) {
        freeflow = await uploadFileToStorage({
          file: parsedActionLog?.freeflow?.file,
          path: `drawings/${userId}/${actionLogId}`,
          name: parsedActionLog?.freeflow?.name,
          contentType: parsedActionLog?.freeflow?.contentType,
        });
        if ((freeflow as { error: string })?.error) {
          return { error: (freeflow as { error: string }).error };
        }
      } else if (typeof parsedActionLog?.freeflow === "string") {
        freeflow = parsedActionLog?.freeflow;
      }
      data = {
        ...data,
        ...pick(parsedActionLog, ["eulogy", "reward", "motivation", "purpose", "success", "focus"]),
        freeflow,
        action_type: actionLogTypes.weeklyChallenge,
        is_completed: parsedActionLog.isCompleted,
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

    return camelcaseKeys(actionLogData);
  } catch (error: any) {
    console.log(error.errors);
    if (error instanceof z.ZodError) {
      return {
        error: serverErrorTypes.invalidRequest,
        details: error.errors,
      };
    }

    return { error: error.message };
  }
};
