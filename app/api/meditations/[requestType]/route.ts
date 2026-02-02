"force-dynamic";
import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { pick } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { serverErrorTypes } from "@resources/types/error";
import { meditationRequestTypes } from "@resources/types/meditation";
import { ImageRawData } from "@resources/types/ocr";
import { uploadFileToStorage } from "app/api/upload/controller";



dayjs.extend(utc);
dayjs.extend(timezone);

type UserMeditationRequestDataTypes = {
  userId: string;
  sessionId: string;
  userTimezone: string;
};

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  reflection: string;
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
  const timezone = request.headers.get("x-user-timezone");

  let fetcherHandler: ((args: Partial<UserMeditationRequestDataTypes>) => Promise<any>) | null =
    null;
  let args: Partial<UserMeditationRequestDataTypes> | {} = {};
  let responseName;
  let total;

  if (requestType === meditationRequestTypes.userMeditations) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    fetcherHandler = getUserMeditations;
    args = {
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    };
    responseName = "meditations";
    total = await getUserTotalMeditations({ userId: user.id, sessionId });
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
      total,
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
  const { sessionId, reflection }: PostRequestJson = await request.json();

  if (!sessionId || !reflection) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any | {} = {};
  const responseName = "meditation";
  if (requestType === meditationRequestTypes.createUserMeditations) {
    fetcherHandler = createMeditation;
    args = { sessionId, userId: user.id, reflection };
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
const createMeditation = async ({
  sessionId,
  userId,
  reflection,
}: Partial<{
  sessionId: string;
  userId: string;
  reflection: string;
}>) => {
  try {
    const supabaseAdmin = createServiceClient();
    if (!sessionId || !userId || !reflection) {
      return { error: "invalid-body" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const { data: meditationData, error: meditationError } = await supabaseAdmin
      .from("meditations")
      .insert({
        session_id: sessionData.id,
        user_id: userId,
        reflection,
      })
      .select()
      .single();

    if (meditationError || !meditationData) return { error: serverErrorTypes.serverError };

    return camelcaseKeys(meditationData);
  } catch (error: any) {
    console.log("create meditation error", error.errors);
    return { error: error.message };
  }
};

const getUserMeditations = async ({
  userId,
  sessionId,
  userTimezone,
}: Partial<UserMeditationRequestDataTypes>) => {
  const supabase = createClient();

  const startOfDay = dayjs().tz(userTimezone).startOf("day").utc().toISOString();
  const endOfDay = dayjs().tz(userTimezone).endOf("day").utc().toISOString();

  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }
    const { data, error } = await supabase
      .from("meditations")
      .select(`*`)
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) return { error: error.message };

    return camelcaseKeys(data);
  } catch (err: any) {
    return { error: err.message };
  }
};
const getUserTotalMeditations = async ({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}) => {
  const supabase = createClient();

  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }
    const { data, count, error } = await supabase
      .from("meditations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) return { error: error.message };

    return count;
  } catch (err: any) {
    return { error: err.message };
  }
};
