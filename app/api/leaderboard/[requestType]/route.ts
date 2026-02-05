export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { leaderboardFilterTypes, leaderboardRequestTypes } from "@resources/types/leaderboard";
dayjs.extend(utc);
dayjs.extend(timezone);

// Type definitions for type safety
interface FetcherErrorResponse {
  error: string;
}

interface LeaderboardArgs {
  userId: string;
  sessionId: string;
  filter: string;
  userTimezone: string;
  skip: number;
  limit: number;
}

interface UserRankArgs {
  userId: string;
  sessionId: string;
  filter: string;
  userTimezone: string;
}

interface CountResult {
  count: number;
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

  const timezone = request.headers.get("x-user-timezone");
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  const filter = new URL(request.url).searchParams.get("filter");
  const skip = new URL(request.url).searchParams.get("skip");
  const limit = new URL(request.url).searchParams.get("limit");
  const initial = new URL(request.url).searchParams.get("initial") ? true : false;

  if (requestType === leaderboardRequestTypes.leaderboardData) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "user timezone is requried" }, { status: 400 });
    }
    if (!filter) {
      return NextResponse.json({ error: "user filter is requried" }, { status: 400 });
    }

    const leaderboardArgs: LeaderboardArgs = {
      userId: user.id,
      sessionId,
      filter,
      userTimezone: timezone,
      skip: skip ? Number.parseInt(skip) : 0,
      limit: limit ? Number.parseInt(limit) : 0,
    };

    const data = await getLeaderboardData(leaderboardArgs);
    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }

    let total = 0;
    if (initial) {
      const countResult = await getTotalSessionUsers({
        userId: user.id,
        sessionId,
        filter,
        userTimezone: timezone,
      });
      if ("error" in countResult) {
        return NextResponse.json({ error: { message: countResult.error } }, { status: 500 });
      }
      total = countResult.count;
    }

    if (skip && limit) {
      return NextResponse.json({
        leaderboard: data,
        total,
        filter,
        skip: Number.parseInt(skip) + Number.parseInt(limit),
      });
    }
    return NextResponse.json({ leaderboard: data, filter, total });
  }

  if (requestType === leaderboardRequestTypes.userRank) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!filter) {
      return NextResponse.json({ error: "user filter is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "user timezone is requried" }, { status: 400 });
    }

    const rankArgs: UserRankArgs = {
      sessionId,
      userTimezone: timezone,
      userId: user.id,
      filter,
    };

    const data = await getUserRank(rankArgs);
    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }

    return NextResponse.json({ rank: data, filter, total: 0 });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
}

const getLeaderboardData = async ({
  userId,
  sessionId,
  filter,
  userTimezone,
  skip,
  limit,
}: LeaderboardArgs): Promise<FetcherErrorResponse | Record<string, unknown>[]> => {
  try {
    const _supabase = createClient();
    const supabaseAdmin = createServiceClient();

    if (
      !userId ||
      !sessionId ||
      !userTimezone ||
      !filter ||
      !Object.values(leaderboardFilterTypes).includes(filter)
    ) {
      return { error: "bad-request" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*, book: books(*), enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const startDate = dayjs(sessionData.start_date)
      .tz(userTimezone)
      .startOf("day")
      .utc()
      .toISOString();
    const endDate = dayjs(dayjs(sessionData.start_date).add(sessionData.book.duration_days, "day"))
      .tz(userTimezone)
      .endOf("day")
      .utc()
      .toISOString();

    const { data: leaderboardData, error: leaderboardDataError } = await supabaseAdmin.rpc(
      "fetch_leaderboard_data",
      {
        p_session_id: sessionId,
        p_filter: filter,
        p_start_date: startDate,
        p_end_date: endDate,
        p_daily_journal_points: sessionData.book.daily_journal_points,
        p_daily_action_points: sessionData.book.daily_action_points,
        p_weekly_journal_points: sessionData.book.weekly_journal_points,
        p_weekly_action_points: sessionData.book.weekly_action_points,
        p_limit: limit,
        p_offset: skip,
      }
    );

    if (leaderboardDataError) return { error: leaderboardDataError.message };

    return camelcaseKeys(leaderboardData, { deep: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const getUserRank = async ({
  userId,
  sessionId,
  filter,
  userTimezone,
}: UserRankArgs): Promise<FetcherErrorResponse | Record<string, unknown>> => {
  try {
    const supabaseAdmin = createServiceClient();

    if (!userId || !sessionId || !filter || !userTimezone) {
      return { error: "bad-request" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*, book: books(*), enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const startDate = dayjs(sessionData.start_date)
      .tz(userTimezone)
      .startOf("day")
      .utc()
      .toISOString();
    const endDate = dayjs(dayjs(sessionData.start_date).add(sessionData.book.duration_days, "day"))
      .tz(userTimezone)
      .endOf("day")
      .utc()
      .toISOString();
    const { data: userPositionData, error: userPositionDataError } = await supabaseAdmin.rpc(
      "get_user_position",
      {
        p_user_id: userId,
        p_filter: filter,
        p_daily_journal_points: sessionData.book.daily_journal_points,
        p_daily_action_points: sessionData.book.daily_action_points,
        p_weekly_journal_points: sessionData.book.weekly_journal_points,
        p_weekly_action_points: sessionData.book.weekly_action_points,
        p_session_id: sessionId,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );
    if (userPositionDataError) return { error: userPositionDataError.message };

    return camelcaseKeys(userPositionData[0], { deep: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const getTotalSessionUsers = async ({
  userId,
  sessionId,
  filter,
  userTimezone,
}: UserRankArgs): Promise<FetcherErrorResponse | CountResult> => {
  try {
    const supabaseAdmin = createServiceClient();

    if (
      !userId ||
      !sessionId ||
      !userTimezone ||
      !filter ||
      !Object.values(leaderboardFilterTypes).includes(filter)
    ) {
      return { error: "bad-request" };
    }

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*, book: books(*), enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    let startDate = dayjs(sessionData.start_date)
      .tz(userTimezone)
      .startOf("day")
      .utc()
      .toISOString();
    let endDate = dayjs(dayjs(sessionData.start_date).add(sessionData.book.duration_days, "day"))
      .tz(userTimezone)
      .endOf("day")
      .utc()
      .toISOString();

    if (filter === leaderboardFilterTypes.weekly) {
      startDate = dayjs(
        dayjs().diff(sessionData.start_date, "d") > 7
          ? dayjs().tz(userTimezone).subtract(7, "d")
          : dayjs().diff(sessionData.start_date, "d")
      )
        .tz(userTimezone)
        .startOf("day")
        .utc()
        .toISOString();
      endDate = dayjs().tz(userTimezone).endOf("day").utc().toISOString();
    } else if (filter === leaderboardFilterTypes.monthly) {
      startDate = dayjs(
        dayjs().diff(sessionData.start_date, "d") > 30
          ? dayjs().tz(userTimezone).subtract(30, "d")
          : dayjs().diff(sessionData.start_date, "d")
      )
        .tz(userTimezone)
        .startOf("day")
        .utc()
        .toISOString();
      endDate = dayjs().tz(userTimezone).endOf("day").utc().toISOString();
    }

    const {
      data: _data,
      count,
      error,
    } = await supabaseAdmin
      .from("session_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .gte("updated_at", startDate)
      .lte("updated_at", endDate);

    if (error) return { error: error.message };

    return { count: count ?? 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
