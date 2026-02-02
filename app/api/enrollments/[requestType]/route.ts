import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { booksRequestTypes } from "@resources/types/book";
import { errorTypes, serverErrorTypes } from "@resources/types/error";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function PUT(request: Request, { params }: { params: { requestType: string } }) {
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
  const { sessionId } = await request.json();

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any | {} = {};
  let responseName;

  if (requestType === booksRequestTypes.recalculateUserStreak) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    fetcherHandler = recalculateStreak;
    args = {
      userId: user.id,
      sessionId,
    };
    responseName = "enrollment";
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
const getUserEnrolledBookSession = async ({
  userId,
  bookId,
}: {
  userId: string;
  bookId: string;
}) => {
  const supabase = createClient();
  try {
    if (!userId || !bookId) {
      return { error: "bad-request" };
    }

    const { data: sessionEnrollmentData, error: sessionEnrollmentDataError } = await supabase
      .from("session_enrollments")
      .select(`*,  book_session: book_sessions (*), book: books (*)`)
      .eq("book_id", bookId)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (!sessionEnrollmentData || sessionEnrollmentDataError) {
      return { error: errorTypes.noSessionEnrollment };
    }

    const dailyJournalPoints = sessionEnrollmentData.book.daily_journal_points;
    const dailyActionPoints = sessionEnrollmentData.book.daily_action_points;
    const weeklyJournalPoints = sessionEnrollmentData.book.weekly_journal_points;
    const weeklyActionPoints = sessionEnrollmentData.book.weekly_action_points;

    return {
      id: sessionEnrollmentData.id,
      userId: sessionEnrollmentData.user_id,
      session: {
        id: sessionEnrollmentData.book_session.id,
        bookId: sessionEnrollmentData.book_session.book_id,
        sessionId: sessionEnrollmentData.book_session.sessionId,
        startDate: sessionEnrollmentData.book_session.start_date,
        endDate: sessionEnrollmentData.book_session.end_date,
        createdAt: sessionEnrollmentData.book_session.created_at,
      },

      enrollmentDate: sessionEnrollmentData.enrollment_date,

      totalPoints:
        (sessionEnrollmentData.morning_completion + sessionEnrollmentData.evening_completion) *
          dailyJournalPoints +
        sessionEnrollmentData.gratitude_completion * dailyActionPoints +
        sessionEnrollmentData.weekly_reflection_completion * weeklyJournalPoints +
        sessionEnrollmentData.weekly_challenge_completion * weeklyActionPoints,

      morningStreak: sessionEnrollmentData.morning_streak,
      eveningStreak: sessionEnrollmentData.evening_streak,
      gratitudeStreak: sessionEnrollmentData.gratitude_streak,

      createdAt: sessionEnrollmentData.created_at,
    };
  } catch (err: any) {
    return { error: err.message };
  }
};
const getBookData = async ({ slug, date }: { slug: string; date: string }) => {
  const supabase = createClient();
  if (!slug) {
    return { error: "bad-request" };
  }
  try {
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select(`*, milestones: book_milestones(*)`)
      .eq("slug", slug)
      .order("order", { referencedTable: "book_milestones" })
      .single();

    if (bookError || !bookData) {
      return { error: errorTypes.noBook };
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("book_sessions")
      .select("*")
      .eq("book_id", bookData.id)
      .lte("start_date", date)
      .gte("end_date", date)
      .order("start_date", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData) {
      return { error: errorTypes.noBookSession };
    }

    const bookWithLatestSession = {
      ...bookData,
      latestSession: sessionData,
    };

    return camelcaseKeys(bookWithLatestSession, { deep: true });
  } catch (err: any) {
    return { error: err.message };
  }
};

const createUserBookEnrollment = async ({ userId, bookId }: { userId: string; bookId: string }) => {
  const supabase = createClient();
  const date = new Date().toISOString().split("T")[0];
  try {
    if (!userId || !bookId || !date) {
      return { error: "bad-request" };
    }
    const { data: bookSession, error: bookSessionError } = await supabase
      .from("book_sessions")
      .select(`*`)
      .eq("book_id", bookId)
      .lte("start_date", date)
      .gte("end_date", date)
      .single();

    if (bookSessionError || !bookSession) return { error: "invalid-book" };

    const supabaseAdmin = createServiceClient();
    const { data: sessionEnrollment, error } = await supabaseAdmin
      .from("session_enrollments")
      .insert({
        user_id: userId,
        book_id: bookId,
        session_id: bookSession.id,
        enrollment_date: date,
      })
      .select()
      .single();

    if (error || !sessionEnrollment) return { error: "no-book-session" };

    return {
      id: sessionEnrollment.id,
      userId: sessionEnrollment.user_id,
      session: {
        id: bookSession.id,
        bookId: bookSession.book_id,
        sessionId: bookSession.sessionId,
        startDate: bookSession.start_date,
        endDate: bookSession.end_date,
        createdAt: bookSession.created_at,
      },

      enrollmentDate: sessionEnrollment.enrollment_date,
      totalPoints: 0,
      morningStreak: 0,
      eveningStreak: 0,
      gratitudeStreak: 0,

      createdAt: sessionEnrollment.created_at,
    };
  } catch (err: any) {
    return { error: err.message };
  }
};

const resetBookSession = async ({
  userId,
  sessionId,
  userTimezone,
}: {
  userId: string;
  sessionId: string;
  userTimezone: string;
}) => {
  const supabase = createClient();
  const supabaseAdmin = createServiceClient();
  if (!userId || !sessionId) {
    return { error: "bad-request" };
  }
  try {
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("session_enrollments")
      .update({
        enrollment_date: dayjs().tz(userTimezone).utc().toISOString(),
        morning_completion: 0,
        morning_streak: 0,
        evening_completion: 0,
        evening_streak: 0,
        gratitude_completion: 0,
        gratitude_streak: 0,
        weekly_reflection_completion: 0,
        weekly_reflection_streak: 0,
        weekly_challenge_completion: 0,
        weekly_challenge_streak: 0,
      })
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (sessionError) {
      return { error: serverErrorTypes.serverError };
    }
    const { data: actionLogData, error: actionLogDataError } = await supabaseAdmin
      .from("action_logs")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (actionLogDataError) {
      return { error: serverErrorTypes.serverError };
    }
    const { data: journalLogData, error: journalLogDataError } = await supabaseAdmin
      .from("journals")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (journalLogDataError) {
      return { error: serverErrorTypes.serverError };
    }

    return true;
  } catch (err: any) {
    return { error: err.message };
  }
};

const recalculateStreak = async ({ userId, sessionId }: { userId: string; sessionId: string }) => {
  const supabaseAdmin = createServiceClient();
  if (!userId || !sessionId) {
    return { error: "bad-request" };
  }
  try {
    const { data, error } = await supabaseAdmin.rpc("check_user_streak", {
      p_user_id: userId,
      p_session_id: sessionId,
    });

    console.log({ error });

    if (error) return { error: error.message };

    return true;
  } catch (err: any) {
    return { error: err.message };
  }
};
