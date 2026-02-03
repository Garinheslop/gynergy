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

  const enrollmentId = new URL(request.url).searchParams.get("enrollmentId");
  const timezone = request.headers.get("x-user-timezone");

  let fetcherHandler: ((args: Partial<GetDailyQuoteRequestDataTypes>) => Promise<any>) | null =
    null;
  let args: Partial<GetDailyQuoteRequestDataTypes> | {} = {};
  let responseName;

  if (requestType === quotesRequestTypes.dailyQuote) {
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is requried" }, { status: 400 });
    }
    fetcherHandler = getUserDailtyQuote;
    args = {
      userId: user.id,
      enrollmentId,
      userTimezone: timezone,
    };
    responseName = "quote";
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

const getUserDailtyQuote = async ({
  userId,
  enrollmentId,
  userTimezone,
}: Partial<GetDailyQuoteRequestDataTypes>) => {
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

    if (enrollmentDataError || !enrollmentData) return { error: "no-user-book-session" };

    const currentSessionDay =
      dayjs()
        .tz(userTimezone)
        .startOf("d")
        .diff(dayjs(enrollmentData[0].enrollment_date).tz(userTimezone).startOf("d"), "d") + 1;

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("day", currentSessionDay)
      .eq("book_id", (enrollmentData[0] as any).session.book.id)
      .limit(1);

    if (error || !data) return { error: "no-quotes" };

    return data[0];
  } catch (err: any) {
    console.log({ err });

    return { error: err.message };
  }
};
