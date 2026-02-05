export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

import { journalOcrFileLimit } from "@configs/app";
import { createClient } from "@lib/supabase-server";
import journalSchemas from "@resources/ocr/journalSchemas";
import { journalTypes } from "@resources/types/journal";
import { visionTypes } from "@resources/types/vision";

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  openaiClient ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openaiClient;
}

const contentTypes = {
  ...journalTypes,
  ...visionTypes,
};

export async function POST(request: Request) {
  const body = await request.json();
  const { images, contentType } = body as {
    contentType: (typeof contentTypes)[keyof typeof contentTypes];
    images: string[];
  };
  try {
    if (!images || !images?.length || images?.length > 7 || !contentType) {
      return NextResponse.json({ error: "Invalid Request Body." }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ocrSchemaStr: _ocrSchemaStr, messages } = buildOcrMessages(
      contentType,
      images,
      journalSchemas
    );

    const { choices } = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      store: true,
    });
    const content = choices?.[0]?.message?.content;

    if (!content) throw new Error("Missing content in response");

    // Extract JSON: find first '{' and last '}'
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON format");

    return NextResponse.json({ journal: JSON.parse(content.slice(start, end + 1)) });
    // return NextResponse.json({ journal: mockData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type JournalSchemas = Record<
  | "morning"
  | "evening"
  | "gratitudeAction"
  | "weeklyReflection"
  | "weeklyChallenge"
  | "visionsHighestSelf"
  | "visionsMantra"
  | "visionsCreed"
  | "visionsDiscovery",
  object
>;

interface BuildOcrResult {
  ocrSchemaStr: string;
  messages: ChatCompletionMessageParam[];
}

function buildOcrMessages(
  contentType: (typeof contentTypes)[keyof typeof contentTypes],
  imageUrls: string[],
  journalSchemas: JournalSchemas
): BuildOcrResult {
  // Map incoming contentType values to schemaKey & maxImages
  const typeConfig: Record<
    (typeof contentTypes)[keyof typeof contentTypes],
    { schemaKey: keyof JournalSchemas; maxImages: number }
  > = {
    [contentTypes.morningJournal]: { schemaKey: "morning", maxImages: journalOcrFileLimit.default },
    [contentTypes.eveningJournal]: { schemaKey: "evening", maxImages: journalOcrFileLimit.default },
    [contentTypes.gratitudeAction]: {
      schemaKey: "gratitudeAction",
      maxImages: journalOcrFileLimit.journal.dga,
    },
    [contentTypes.weeklyReflection]: {
      schemaKey: "weeklyReflection",
      maxImages: journalOcrFileLimit.default,
    },
    [contentTypes.weeklyChallenge]: {
      schemaKey: "weeklyChallenge",
      maxImages: journalOcrFileLimit.journal.weeklyChallenge,
    },
    [contentTypes.highestSelf]: {
      schemaKey: "visionsHighestSelf",
      maxImages: journalOcrFileLimit.default,
    },
    [contentTypes.mantra]: { schemaKey: "visionsMantra", maxImages: journalOcrFileLimit.default },
    [contentTypes.creed]: { schemaKey: "visionsCreed", maxImages: journalOcrFileLimit.default },
    [contentTypes.discovery]: {
      schemaKey: "visionsDiscovery",
      maxImages: journalOcrFileLimit.visions.discovery,
    },
  };

  const config = typeConfig[contentType];
  if (!config) {
    throw new Error(`Unsupported contentType: ${contentType}`);
  }

  const schemaObj = journalSchemas[config.schemaKey];
  if (!schemaObj) {
    throw new Error(`Missing schema for key: ${config.schemaKey}`);
  }

  const ocrSchemaStr = JSON.stringify(schemaObj);

  const messages: ChatCompletionMessageParam[] = [];

  // System prompt enforces exact extraction
  messages.push({
    role: "system",
    content: [
      {
        type: "text",
        text: [
          "You are parsing a journal page.",
          `I will send you up to ${config.maxImages} images.`,
          "Extract all text in order, do not summarize, invent, or truncate or rearrange.",
        ].join(" "),
      },
    ],
  });

  // User prompt including the JSON schema
  messages.push({
    role: "user",
    content: [
      {
        type: "text",
        text: `Please output a single JSON object conforming exactly to this schema:\n${ocrSchemaStr}`,
      },
    ],
  });

  imageUrls.forEach((url) => {
    messages.push({
      role: "user",
      content: [{ type: "image_url", image_url: { url } }],
    });
  });

  return { ocrSchemaStr, messages };
}
