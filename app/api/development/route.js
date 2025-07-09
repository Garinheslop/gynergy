import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@lib/supabase-server";
import { booksRequestTypes } from "@resources/types/book";
import camelcaseKeys from "camelcase-keys";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { journalTypes } from "@resources/types/journal";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(request) {
  const supabase = createServiceClient();
  const sessionId = "3ae42bc9-1f98-4aa3-8304-6bb75844bfd0";
  const userId = "59b3fc84-8ce8-4cb7-80e0-47f8bd4dffe8";
  const bookId = "7215727d-cefa-460e-a5a0-478ec1002d08";
  const userTimeZone = "Asia/Dhaka";
  const entryDate = "2025-03-15T08:01:09.575Z";
  const startDate = "2025-03-01T08:01:09.575028+00:00";
  const slug = "date-zero-gratitude";

  // const { data, error } = await supabase.rpc("check_user_streak", {
  //   p_user_id: userId,
  //   p_session_id: sessionId,
  // });
  const { data, error } = await supabase.auth.admin.deleteUser(
    "a6d0f1f0-1234-4c56-babc-1234567890ba"
  );
  // await supabase.from("auth.users").insert({
  //   uid: "a6d0f1f0-1234-4c56-babc-1234567890ba",
  //   email: "olivia.thompson@example.com",
  // });
  console.log({ error });

  return NextResponse.json(camelcaseKeys(data, { deep: true }));
}
