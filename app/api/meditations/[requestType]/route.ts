export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { serverErrorTypes } from "@resources/types/error";
import { meditationRequestTypes } from "@resources/types/meditation";

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

// Type definitions for type safety
interface FetcherErrorResponse {
  error: string;
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

  if (requestType === meditationRequestTypes.userMeditations) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }

    const data = await getUserMeditations({
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    });

    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }

    const total = await getUserTotalMeditations({ userId: user.id, sessionId });

    return NextResponse.json({
      meditations: data,
      total,
    });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
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

  if (requestType === meditationRequestTypes.createUserMeditations) {
    const data = await createMeditation({ sessionId, userId: user.id, reflection });
    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }
    return NextResponse.json({ meditation: data });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
}

const createMeditation = async ({
  sessionId,
  userId,
  reflection,
}: Partial<{
  sessionId: string;
  userId: string;
  reflection: string;
}>): Promise<FetcherErrorResponse | Record<string, unknown>> => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { error: message };
  }
};

const getUserMeditations = async ({
  userId,
  sessionId,
  userTimezone,
}: Partial<UserMeditationRequestDataTypes>): Promise<FetcherErrorResponse | Record<string, unknown>[]> => {
  const supabase = createClient();

  const _startOfDay = dayjs().tz(userTimezone).startOf("day").utc().toISOString();
  const _endOfDay = dayjs().tz(userTimezone).endOf("day").utc().toISOString();

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const getUserTotalMeditations = async ({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<FetcherErrorResponse | number | null> => {
  const supabase = createClient();

  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }
    const {
      data: _data,
      count,
      error,
    } = await supabase
      .from("meditations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (error) return { error: error.message };

    return count;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
