"force-dynamic";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@lib/supabase-server";
import { visionRequestTypes, UserVision, visionTypes } from "@resources/types/vision";
import camelcaseKeys from "camelcase-keys";

import { ImageRawData } from "@resources/types/ocr";
import { serverErrorTypes } from "@resources/types/error";
import { v4 as uuidv4 } from "uuid";
import { uploadFileToStorage } from "app/api/upload/controller";
import { validateVisionSchema } from "./validation";
import { z } from "zod";
import { pick } from "lodash";

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

  let fetcherHandler: ((args: Partial<UserVisionRequestDataTypes>) => Promise<any>) | null = null;
  let args: Partial<UserVisionRequestDataTypes> | {} = {};
  let responseName;

  if (requestType === visionRequestTypes.userVisions) {
    if (!sessionId) {
      return NextResponse.json({ error: "Session id is requried" }, { status: 400 });
    }
    fetcherHandler = getUserVisions;
    args = {
      userId: user.id,
      sessionId,
    };
    responseName = "visions";
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

  let fetcherHandler: ((args: any) => Promise<any>) | null = null;
  let args: any | {} = {};
  let responseName = "vision";
  if (
    [
      visionRequestTypes.updateVisionHighestSelf,
      visionRequestTypes.updateVisionMantra,
      visionRequestTypes.updateVisionCreed,
      visionRequestTypes.updateVisionDiscovery,
    ].includes(requestType)
  ) {
    fetcherHandler = upsertVision;
    args = { requestType, sessionId, userId: user.id, vision, images };
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
}>) => {
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

    let uploadedImages = [];
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
    let data: any = {
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
      let symbolsPath = null;
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
  } catch (error: any) {
    console.log("upsert vision error", error.errors);
    if (error instanceof z.ZodError) {
      return {
        error: serverErrorTypes.invalidRequest,
        details: error.errors,
      };
    }

    return { error: error.message };
  }
};

const getUserVisions = async ({ userId, sessionId }: Partial<UserVisionRequestDataTypes>) => {
  const supabase = createClient();
  console.log({ userId, sessionId });

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
  } catch (err: any) {
    return { error: err.message };
  }
};
