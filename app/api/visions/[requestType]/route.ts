export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import camelcaseKeys from "camelcase-keys";
import { pick } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { serverErrorTypes } from "@resources/types/error";
import { ImageRawData } from "@resources/types/ocr";
import { visionRequestTypes, UserVision, visionTypes } from "@resources/types/vision";
import { uploadFileToStorage } from "app/api/upload/controller";

import { validateVisionSchema } from "./validation";

type UserVisionRequestDataTypes = {
  userId: string;
  sessionId: string;
};

type PostRequestJson = {
  actionId: string;
  sessionId: string;
  vision: UserVision;
  images: ImageRawData[];
};

// Type definitions for type safety
interface FetcherErrorResponse {
  error: string;
  details?: z.ZodIssue[];
}

interface VisionDbRecord {
  id: string;
  session_id: string;
  user_id: string;
  images?: (string | { error: string })[];
  name?: string | null;
  abilities?: string | null;
  purpose?: string | null;
  traits?: string | null;
  symbols?: string | { error: string } | null;
  is_completed?: boolean;
  vision_type?: string;
  creed?: string | null;
  mantra?: string | null;
  self_values?: string | null;
  self_evaluation?: string | null;
  qualities?: string | null;
  achievements?: string | null;
  importance?: string | null;
  lifestyle?: string | null;
  foreseen?: string | null;
  relationships?: string | null;
  legacy?: string | null;
  improvement?: string | null;
  interests?: string | null;
  triggers?: string | null;
  envision?: string | null;
  milestones?: string | null;
  contributions?: string | null;
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

  if (requestType === visionRequestTypes.userVisions) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }

    const data = await getUserVisions({
      userId: user.id,
      sessionId,
    });

    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }

    return NextResponse.json({ visions: data });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
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
  const { sessionId, vision, images }: PostRequestJson = await request.json();

  if (!sessionId || !vision) {
    return NextResponse.json({ error: serverErrorTypes.invalidRequest }, { status: 400 });
  }

  if (
    [
      visionRequestTypes.updateVisionHighestSelf,
      visionRequestTypes.updateVisionMantra,
      visionRequestTypes.updateVisionCreed,
      visionRequestTypes.updateVisionDiscovery,
    ].includes(requestType)
  ) {
    const data = await upsertVision({ requestType, sessionId, userId: user.id, vision, images });
    if ("error" in data) {
      return NextResponse.json({ error: { message: data.error } }, { status: 500 });
    }
    return NextResponse.json({ vision: data });
  }

  return NextResponse.json({ error: "Invalid Request type." }, { status: 500 });
}

const upsertVision = async ({
  requestType,
  sessionId,
  userId,
  vision,
  images,
}: Partial<{
  requestType: string;
  sessionId: string;
  userId: string;
  vision: UserVision;
  images: ImageRawData[];
}>): Promise<FetcherErrorResponse | Record<string, unknown>> => {
  try {
    const supabaseAdmin = createServiceClient();
    if (!sessionId || !userId || !vision) {
      return { error: "invalid-body" };
    }

    const { vision: parsedVision } = validateVisionSchema.parse({ requestType, vision });

    const { data: sessionData, error: sessionDataError } = await supabaseAdmin
      .from("book_sessions")
      .select(`*,  enrollment: session_enrollments (*)`)
      .eq("id", sessionId)
      .eq("session_enrollments.user_id", userId)
      .single();

    if (sessionDataError || !sessionData) return { error: "no-user-book-session" };

    const visionId = vision?.id ?? uuidv4();

    const uploadedImages: (string | { error: string })[] = [];
    if (images?.length) {
      for (let index = 0; index < images.length; index++) {
        const path = await uploadFileToStorage({
          file: images[index].file,
          path: `visions/${userId}/${visionId}`,
          name: images[index]?.name,
          contentType: images[index]?.contentType,
        });

        uploadedImages.push(path);
      }
    }
    let data: VisionDbRecord = {
      id: visionId,
      session_id: sessionData.id,
      user_id: userId,
    };
    if (uploadedImages.length) {
      data = {
        ...data,
        images: uploadedImages,
      };
    }
    if (requestType === visionRequestTypes.updateVisionHighestSelf) {
      let symbolsPath: string | { error: string } | null = null;
      if (parsedVision?.symbols?.file) {
        symbolsPath = await uploadFileToStorage({
          file: parsedVision?.symbols?.file,
          path: `visions/${userId}/${visionId}`,
          name: `${parsedVision?.symbols?.name}-${new Date().getTime()}`,
          contentType: parsedVision?.symbols?.contentType,
        });
      } else if (typeof parsedVision?.symbols === "string") {
        symbolsPath = parsedVision?.symbols;
      }
      const pickedProperties = pick(parsedVision, ["name", "abilities", "purpose", "traits"]);
      data = {
        ...data,
        ...pick(parsedVision, ["name", "abilities", "purpose", "traits"]),
        symbols: symbolsPath,
        is_completed:
          !Object.values(pickedProperties).includes(null) &&
          !Object.values(pickedProperties).includes("")
            ? true
            : false,
        vision_type: visionTypes.highestSelf,
      };
    } else if (requestType === visionRequestTypes.updateVisionCreed) {
      data = {
        ...data,
        creed: parsedVision?.creed,
        is_completed: true,
        vision_type: visionTypes.creed,
      };
    } else if (requestType === visionRequestTypes.updateVisionMantra) {
      data = {
        ...data,
        mantra: parsedVision?.mantra,
        is_completed: true,
        vision_type: visionTypes.mantra,
      };
    } else if (requestType === visionRequestTypes.updateVisionDiscovery) {
      const pickedProperties = pick(parsedVision, [
        "qualities",
        "achievements",
        "importance",
        "lifestyle",
        "foreseen",
        "relationships",
        "legacy",
        "improvement",
        "interests",
        "triggers",
        "envision",
        "milestones",
        "contributions",
      ]);

      data = {
        ...data,
        self_values: parsedVision?.selfValues,
        self_evaluation: parsedVision?.selfEvaluation,
        ...pickedProperties,
        is_completed:
          !Object.values(pickedProperties).includes(null) &&
          !Object.values(pickedProperties).includes("") &&
          (parsedVision?.selfValues?.trim() ? true : false) &&
          (parsedVision?.selfEvaluation?.trim() ? true : false)
            ? true
            : false,
        vision_type: visionTypes.discovery,
      };
    }

    const { data: visionData, error: visionError } = await supabaseAdmin
      .from("user_visions")
      .upsert(data, { onConflict: "session_id, user_id, vision_type" })
      .select()
      .single();

    if (visionError || !visionData) return { error: serverErrorTypes.serverError };

    return camelcaseKeys(visionData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        error: serverErrorTypes.invalidRequest,
        details: error.errors,
      };
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return { error: message };
  }
};

const getUserVisions = async ({
  userId,
  sessionId,
}: Partial<UserVisionRequestDataTypes>): Promise<FetcherErrorResponse | Record<string, unknown>[]> => {
  const supabase = createClient();

  try {
    if (!userId || !sessionId) {
      return { error: "bad-request" };
    }
    const { data, error } = await supabase
      .from("user_visions")
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
