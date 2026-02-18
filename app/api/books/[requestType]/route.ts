export const dynamic = "force-dynamic";

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

// ============================================================================
// Type Definitions for Type Safety
// ============================================================================

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

  const bookId = new URL(request.url).searchParams.get("bookId");
  const slug = new URL(request.url).searchParams.get("slug");

  let data: FetcherErrorResponse | Record<string, unknown>;
  let responseName: string;

  if (requestType === booksRequestTypes.userCurrentBookSession) {
    if (!bookId) {
      return NextResponse.json({ error: "Book id is requried" }, { status: 400 });
    }
    data = await getUserEnrolledBookSession({
      userId: user.id,
      bookId,
    });
    responseName = "enrollment";
  } else if (requestType === booksRequestTypes.latestBookSessions) {
    if (!slug) {
      return NextResponse.json({ error: "Book slug is requried" }, { status: 400 });
    }
    data = await getBookData({
      slug,
      date: new Date().toISOString().split("T")[0],
    });
    responseName = "book";
  } else {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }

  if ("error" in data) {
    const notFoundErrors = ["bad-request", "no-book", "no-book-session", "no-session-enrollment"];
    const errorMsg = String(data.error);
    const status = notFoundErrors.includes(errorMsg) ? 404 : 500;
    return NextResponse.json({ error: { message: data.error } }, { status });
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

  const { bookId } = await request.json();
  const timezone = request.headers.get("x-user-timezone");

  let data: FetcherErrorResponse | Record<string, unknown>;

  if (requestType === booksRequestTypes.bookEnrollment) {
    if (!bookId) {
      return NextResponse.json({ error: "Book id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    data = await createUserBookEnrollment({
      userId: user.id,
      bookId,
      userTimezone: timezone,
    });
  } else {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }

  if ("error" in data) {
    const notFoundErrors = ["bad-request", "invalid-book", "no-book-session"];
    const errorMsg = String(data.error);
    const status = notFoundErrors.includes(errorMsg) ? 404 : 500;
    return NextResponse.json({ error: { message: data.error } }, { status });
  } else {
    return NextResponse.json({
      enrollment: data,
    });
  }
}
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

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const timezone = request.headers.get("x-user-timezone");
  const { sessionId } = await request.json();

  let data: FetcherErrorResponse | Record<string, unknown> | boolean;

  if (requestType === booksRequestTypes.resetUserBookSession) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "user timezone is requried" }, { status: 400 });
    }
    data = await resetBookSession({
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    });
  } else {
    return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
  }

  if (typeof data === "object" && "error" in data) {
    return NextResponse.json({ error: { message: data.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      enrollment: data,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
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

    const { data: sessionData } = await supabase
      .from("book_sessions")
      .select("*")
      .eq("book_id", bookData.id)
      .lte("start_date", date)
      .gte("end_date", date)
      .order("start_date", { ascending: false })
      .limit(1)
      .single();

    // If no session covers today, fall back to the most recent session
    let latestSession = sessionData;
    if (!latestSession) {
      const { data: fallbackSession } = await supabase
        .from("book_sessions")
        .select("*")
        .eq("book_id", bookData.id)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();
      latestSession = fallbackSession;
    }

    if (!latestSession) {
      return { error: errorTypes.noBookSession };
    }

    const bookWithLatestSession = {
      ...bookData,
      latestSession,
    };

    return camelcaseKeys(bookWithLatestSession, { deep: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const createUserBookEnrollment = async ({
  userId,
  bookId,
  userTimezone,
}: {
  userId: string;
  bookId: string;
  userTimezone: string;
}) => {
  const supabase = createClient();
  const date = dayjs().tz(userTimezone).startOf("day").utc().toISOString();
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};

const resetBookSession = async ({
  userId,
  sessionId,
  userTimezone: _userTimezone,
}: {
  userId: string;
  sessionId: string;
  userTimezone: string;
}) => {
  const supabaseAdmin = createServiceClient();
  if (!userId || !sessionId) {
    return { error: "bad-request" };
  }
  try {
    const { error: sessionError } = await supabaseAdmin
      .from("session_enrollments")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (sessionError) {
      return { error: serverErrorTypes.serverError };
    }
    const { error: actionLogDataError } = await supabaseAdmin
      .from("action_logs")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (actionLogDataError) {
      return { error: serverErrorTypes.serverError };
    }
    const { error: journalLogDataError } = await supabaseAdmin
      .from("journals")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (journalLogDataError) {
      return { error: serverErrorTypes.serverError };
    }
    const { error: visionDataError } = await supabaseAdmin
      .from("user_visions")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (visionDataError) {
      return { error: serverErrorTypes.serverError };
    }

    const { error: meditationDataError } = await supabaseAdmin
      .from("meditations")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (meditationDataError) {
      return { error: serverErrorTypes.serverError };
    }

    const { error: journeyDataError } = await supabaseAdmin
      .from("journey")
      .delete()
      .eq("user_id", userId)
      .eq("session_id", sessionId);

    if (journeyDataError) {
      return { error: serverErrorTypes.serverError };
    }

    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
