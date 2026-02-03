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
import {
  JournalData,
  journalEntryTypes,
  journalRequestTypes,
  journalTypes,
} from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { uploadFileToStorage } from "app/api/upload/controller";

import { validateJournalSchema } from "./validation";

dayjs.extend(utc);
dayjs.extend(timezone);

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  journal: JournalData;
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
  const timezone = request.headers.get("x-user-timezone");

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any | {} = {};
  let responseName;

  if (requestType === journalRequestTypes.userDailyJournals) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    if (!timezone) {
      return NextResponse.json({ error: "User Time zone is required." }, { status: 400 });
    }
    fetcherHandler = getUserDailyJournals;
    args = {
      userId: user.id,
      sessionId,
      userTimezone: timezone,
    };
    responseName = "journals";
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

  const { sessionId, journal, images }: PostRequestJson = await request.json();

  if (!sessionId || !journal) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any | {} = {};
  const responseName = "journal";

  if (
    [
      journalRequestTypes.createMorningJournal,
      journalRequestTypes.createEveningJournal,
      journalRequestTypes.createWeeklyJournal,
    ].includes(requestType)
  ) {
    fetcherHandler = createJournal;
    args = { requestType, sessionId, userId: user.id, journal: journal, images };
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

const getUserDailyJournals = async ({
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
      .from("journals")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .in("journal_type", [journalTypes.morningJournal, journalTypes.eveningJournal])
      .gte("entry_date", startOfDay)
      .lte("entry_date", endOfDay);

    if (error) return { error: error.message };

    return camelcaseKeys(data);
  } catch (err: any) {
    return { error: err.message };
  }
};

const createJournal = async ({
  requestType,
  sessionId,
  userId,
  journal,
  images,
}: Partial<{
  requestType: string;
  sessionId: string;
  userId: string;
  journal: JournalData & { id: string };
  images: ImageRawData[];
}>) => {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceClient();
    if (!sessionId || !userId || !journal) {
      return { error: "invalid-body" };
    }
    const { journal: parsedJournal } = validateJournalSchema.parse({ requestType, journal });

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const journalId = journal?.id ?? uuidv4();

    const uploadedImages = [];
    if (images?.length) {
      for (let index = 0; index < images.length; index++) {
        const path = await uploadFileToStorage({
          file: images[index].file,
          path: `journals/${userId}/${journalId}`,
          name: images[index]?.name,
          contentType: images[index]?.contentType,
        });

        uploadedImages.push(path);
      }
    }
    let data: any = {
      id: journalId,
      session_id: sessionData.id,
      book_id: sessionData.book_id,
      user_id: userId,
    };
    if (uploadedImages.length) {
      data = {
        ...data,
        images: uploadedImages,
      };
    }
    if (requestType === journalRequestTypes.createMorningJournal) {
      data = {
        ...data,
        mood_score: parsedJournal?.moodScore,
        captured_essence: parsedJournal?.capturedEssence,
        mood_contribution: parsedJournal?.moodContribution,
        mantra: parsedJournal?.mantra,
        journal_type: journalTypes.morningJournal,
        is_completed: true,
      };
    } else if (requestType === journalRequestTypes.createEveningJournal) {
      let freeflow = null;
      if (parsedJournal?.freeflow?.file) {
        freeflow = await uploadFileToStorage({
          file: parsedJournal?.freeflow?.file,
          path: `drawings/${userId}/${journalId}`,
          name: parsedJournal?.freeflow?.name,
          contentType: parsedJournal?.freeflow?.contentType,
        });
        if ((freeflow as { error: string })?.error) {
          return { error: (freeflow as { error: string }).error };
        }
      } else if (typeof parsedJournal?.freeflow === "string") {
        freeflow = parsedJournal?.freeflow;
      }
      data = {
        ...data,
        mood_score: parsedJournal?.moodScore,
        insight_impact: parsedJournal?.insightImpact,
        ...pick(parsedJournal, ["insight", "success", "changes"]),
        journal_type: journalTypes.eveningJournal,
        freeflow,
        is_completed: true,
      };
    } else if (requestType === journalRequestTypes.createWeeklyJournal) {
      data = {
        ...data,
        ...pick(parsedJournal, ["wins", "challenges", "lessons"]),
        journal_type: journalTypes.weeklyReflection,
        is_completed: true,
      };
    }

    const { data: journalData, error: journalError } = await supabaseAdmin
      .from("journals")
      .insert(data)
      .select()
      .single();

    console.log({ journalError });

    if (journalError || !journalData) return { error: serverErrorTypes.serverError };

    if (requestType === journalRequestTypes.createMorningJournal) {
      const journalEntries = Object.entries({
        [journalEntryTypes.affirmation]: parsedJournal.affirmations,
        [journalEntryTypes.excitement]: parsedJournal.excitements,
        [journalEntryTypes.gratitude]: parsedJournal.gratitudes,
      }).map(([key, value]) => ({
        journal_id: journalId,
        content: value,
        entry_type: key,
      }));

      const { data: _journalEntryData, error: journalEntryError } = await supabase
        .from("journal_entries")
        .insert(journalEntries);

      if (journalEntryError) return { error: serverErrorTypes.serverError };

      return camelcaseKeys({
        ...journalData,
        ...{
          affirmations: parsedJournal.affirmations,
          excitements: parsedJournal.excitements,
          gratitudes: parsedJournal.gratitudes,
        },
      });
    } else if (requestType === journalRequestTypes.createEveningJournal) {
      const journalEntries = Object.entries({
        [journalEntryTypes.dreammagic]: parsedJournal.dreammagic,
      }).map(([key, value]) => ({
        journal_id: journalId,
        content: value,
        entry_type: key,
      }));

      const { data: _journalEntryData, error: journalEntryError } = await supabase
        .from("journal_entries")
        .insert(journalEntries);

      if (journalEntryError) return { error: serverErrorTypes.serverError };

      return camelcaseKeys({
        ...journalData,
        ...{
          dreammagic: parsedJournal.dreammagic,
        },
      });
    }
    return camelcaseKeys(journalData);
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
