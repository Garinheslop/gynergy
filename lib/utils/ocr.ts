"use server";
import OpenAI from "openai";
import type { ChatCompletionContentPartImage } from "openai/resources/chat/completions";

import journalSchemas from "@resources/ocr/journalSchemas";
import { journalTypes } from "@resources/types/journal";
import { visionTypes } from "@resources/types/vision";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const contentTypes = {
  ...journalTypes,
  ...visionTypes,
};
export async function OcrWithVision({
  images,
  contentType,
}: {
  contentType: (typeof contentTypes)[keyof typeof contentTypes];
  images: string[];
}) {
  try {
    if (!images || !images?.length || images?.length > 7 || !contentType) {
      return { error: "Invalid Request Body." };
    }

    let ocrSchemaStr = "";
    if (contentType === contentTypes.morningJournal) {
      ocrSchemaStr = JSON.stringify(journalSchemas.morning);
    } else if (contentType === contentTypes.eveningJournal) {
      ocrSchemaStr = JSON.stringify(journalSchemas.evening);
    } else if (contentType === contentTypes.gratitudeAction) {
      ocrSchemaStr = JSON.stringify(journalSchemas.gratitudeAction);
    } else if (contentType === contentTypes.weeklyReflection) {
      ocrSchemaStr = JSON.stringify(journalSchemas.weeklyReflection);
    } else if (contentType === contentTypes.weeklyChallenge) {
      ocrSchemaStr = JSON.stringify(journalSchemas.weeklyChallenge);
    } else if (contentType === contentTypes.highestSelf) {
      ocrSchemaStr = JSON.stringify(journalSchemas.visionsHighestSelf);
    } else if (contentType === contentTypes.mantra) {
      ocrSchemaStr = JSON.stringify(journalSchemas.visionsMantra);
    } else if (contentType === contentTypes.creed) {
      ocrSchemaStr = JSON.stringify(journalSchemas.visionsCreed);
    } else if (contentType === contentTypes.discovery) {
      ocrSchemaStr = JSON.stringify(journalSchemas.visionsDiscovery);
    }

    const imgArr: ChatCompletionContentPartImage[] = images.map((img) => ({
      type: "image_url",
      image_url: { url: img },
    }));

    const { choices } = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Provide an object that represents this journal page using this JSON Schema: ${ocrSchemaStr}`,
            },
            ...imgArr,
          ],
        },
      ],
      store: true,
    });
    const content = choices?.[0]?.message?.content;

    if (!content) throw new Error("Missing content in response");

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON format");

    return { journal: JSON.parse(content.slice(start, end + 1)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown OCR error";
    return { error: message };
  }
}
