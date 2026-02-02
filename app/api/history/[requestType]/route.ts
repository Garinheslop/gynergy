import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { historyRequestTypes, historyTypes } from "@resources/types/history";
import { journalTypes } from "@resources/types/journal";
dayjs.extend(utc);
dayjs.extend(timezone);

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

  const timezone = request.headers.get("x-user-timezone");
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const historyType = new URL(request.url).searchParams.get("historyType");
  const entryDate = new URL(request.url).searchParams.get("entryDate");

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any = {};
  let responseName;

  if (requestType === historyRequestTypes.userJournalHistory) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "user timezone is requried" }, { status: 400 });
    }
    fetcherHandler = getUserHistory;
    args = {
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    };
    responseName = "histories";
  }
  if (requestType === historyRequestTypes.userDailyHistory) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    if (!historyType) {
      return NextResponse.json({ error: "History type is required." }, { status: 400 });
    }
    if (!entryDate) {
      return NextResponse.json({ error: "Entry date type is required." }, { status: 400 });
    }
    fetcherHandler = getUserDailyHistory;
    args = {
      userId: user.id,
      sessionId,
      historyType,
      entryDate,
      userTimezone: timezone,
    };
    responseName = "histories";
  } else if (requestType === historyRequestTypes.userWeeklyHistory) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    if (!historyType) {
      return NextResponse.json({ error: "History type is required." }, { status: 400 });
    }
    if (!entryDate) {
      return NextResponse.json({ error: "Entry date type is required." }, { status: 400 });
    }
    fetcherHandler = getUserWeeklyHistory;
    args = {
      userId: user.id,
      sessionId,
      historyType,
      entryDate,
      userTimezone: timezone,
    };
    responseName = "histories";
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

const getUserHistory = async ({
  userId,
  sessionId,
  userTimezone,
}: {
  userId: string;
  sessionId: string;
  userTimezone: string;
}) => {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceClient();
    if (!userId || !sessionId || !userTimezone) {
      return { error: "bad-request" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*, book: books(*), enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };
    if (!sessionData?.enrollment[0]) return { error: "no-user-book-session" };

    const startDate = dayjs(sessionData?.enrollment[0]?.enrollment_date)
      .tz(userTimezone)
      .startOf("day")
      .utc()
      .toISOString();
    const endDate = dayjs(
      dayjs(sessionData?.enrollment[0]?.enrollment_date).add(sessionData.book.duration_days, "day")
    )
      .tz(userTimezone)
      .endOf("day")
      .utc()
      .toISOString();

    console.log({ startDate });
    console.log({ endDate });

    const { data, error } = await supabase.rpc("get_journal_history", {
      p_user_id: userId,
      p_session_id: sessionId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) return { error: error.message };

    return camelcaseKeys(data, { deep: true });
  } catch (err: any) {
    return { error: err.message };
  }
};
const getUserDailyHistory = async ({
  userId,
  sessionId,
  historyType,
  entryDate,
  userTimezone,
}: {
  userId: string;
  sessionId: string;
  historyType: string;
  userTimezone: string;
  entryDate: string;
}) => {
  const supabase = createClient();
  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }

    if (historyType === historyTypes.daily) {
      const startOfDay = dayjs(entryDate).tz(userTimezone).startOf("day").utc().toISOString();
      const endOfDay = dayjs(entryDate).tz(userTimezone).endOf("day").utc().toISOString();

      const { data: journalData, error: journalDataError } = await supabase
        .from("journals")
        .select("*, entries: journal_entries(content, entry_type)")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .in("journal_type", [journalTypes.morningJournal, journalTypes.eveningJournal])
        .gte("entry_date", startOfDay)
        .lte("entry_date", endOfDay);

      if (journalDataError) return { error: journalDataError.message };

      const { data: actionData, error: actionDataError } = await supabase
        .from("action_logs")
        .select("*, action: actions(*)")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("action_type", journalTypes.gratitudeAction)
        .gte("entry_date", startOfDay)
        .lte("entry_date", endOfDay);

      if (actionDataError) return { error: actionDataError.message };

      return camelcaseKeys(journalData.concat(actionData), { deep: true });
    }
  } catch (err: any) {
    return { error: err.message };
  }
};
const getUserWeeklyHistory = async ({
  userId,
  sessionId,
  historyType,
  entryDate,
  userTimezone,
}: {
  userId: string;
  sessionId: string;
  historyType: string;
  userTimezone: string;
  entryDate: string;
}) => {
  const supabase = createClient();
  const supabaseAdmin = createServiceClient();
  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const startDate = dayjs(sessionData.enrollment[0].enrollment_date)
      .add(7, "d")
      .tz(userTimezone)
      .startOf("day")
      .utc()
      .toISOString();

    const weekNumber = Math.floor(dayjs(entryDate).diff(startDate, "day") / 7);

    const startOfWeek = dayjs(startDate)
      .add(weekNumber, "week")
      .tz(userTimezone)
      .startOf("day")
      .utc();
    const endOfWeek = startOfWeek
      .add(7, "day")
      .subtract(1, "millisecond")
      .tz(userTimezone)
      .endOf("day")
      .utc();

    if (historyType === historyTypes.weeklyReflection) {
      const { data: journalData, error: journalDataError } = await supabase
        .from("journals")
        .select("*, entries: journal_entries(content, entry_type)")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("journal_type", journalTypes.weeklyReflection)
        .gte("entry_date", startOfWeek)
        .lte("entry_date", endOfWeek);

      if (journalDataError) return { error: journalDataError.message };

      return camelcaseKeys(journalData, { deep: true });
    } else if (historyType === historyTypes.weeklyChallenge) {
      const { data: actionData, error: actionDataError } = await supabase
        .from("action_logs")
        .select("*, action: actions(*)")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("action_type", journalTypes.weeklyChallenge)
        .gte("entry_date", startOfWeek)
        .lte("entry_date", endOfWeek);

      if (actionDataError) return { error: actionDataError.message };

      if (actionData[0]?.action?.isJourneyTable) {
        const { data: journeyData, error: journeyError } = await supabaseAdmin
          .from("journey")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (journeyError) return { error: journeyError.message };

        return camelcaseKeys([{ ...actionData[0], journey: journeyData }], { deep: true });
      }

      return camelcaseKeys(actionData, { deep: true });
    }
  } catch (err: any) {
    return { error: err.message };
  }
};
