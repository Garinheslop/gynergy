export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createClient } from "@lib/supabase-server";
import { quotesRequestTypes } from "@resources/types/quote";

dayjs.extend(utc);
dayjs.extend(timezone);

type GetDailyQuoteRequestDataTypes = {
  userId: string;
  enrollmentId: string;
  userTimezone: string;
};

// Type definitions for type safety
interface FetcherErrorResponse {
  error: string;
}

interface EnrollmentDataRow {
  enrollment_date: string;
  session: Array<{
    id: string;
    book: Array<{
      id: string;
    }>;
  }>;
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

  const enrollmentId = new URL(request.url).searchParams.get("enrollmentId");
  const timezone = request.headers.get("x-user-timezone");

  if (requestType === quotesRequestTypes.dailyQuote) {
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is requried" }, { status: 400 });
    }

    const data = await getUserDailtyQuote({
      userId: user.id,
      enrollmentId: enrollmentId ?? undefined,
      userTimezone: timezone,
    });

    if (data && "error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }

    return NextResponse.json({ quote: data });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
}

const getUserDailtyQuote = async ({
  userId,
  enrollmentId,
  userTimezone,
}: Partial<GetDailyQuoteRequestDataTypes>): Promise<
  FetcherErrorResponse | Record<string, unknown>
> => {
  const supabase = createClient();
  if (!enrollmentId || !userId) {
    return { error: "bad-request" };
  }
  try {
    const { data: enrollmentData, error: enrollmentDataError } = await supabase
      .from("session_enrollments")
      .select("enrollment_date, session: book_sessions(id, book: books(id)) ")
      .eq("user_id", userId)
      .eq("id", enrollmentId)
      .limit(1);

    if (enrollmentDataError || !enrollmentData || !enrollmentData[0]) {
      return { error: "no-user-book-session" };
    }

    const enrollment = enrollmentData[0] as unknown as EnrollmentDataRow;
    const session = enrollment.session?.[0];
    const book = session?.book?.[0];
    if (!book?.id) {
      return { error: "no-user-book-session" };
    }

    const currentSessionDay =
      dayjs()
        .tz(userTimezone)
        .startOf("d")
        .diff(dayjs(enrollment.enrollment_date).tz(userTimezone).startOf("d"), "d") + 1;

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("day", currentSessionDay)
      .eq("book_id", book.id)
      .limit(1);

    if (error || !data) return { error: "no-quotes" };

    return data[0];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return { error: message };
  }
};
