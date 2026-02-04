export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";
import { uploadTypes } from "@resources/types/uploads";

import { uploadToStorage } from "./controller";

export async function POST(request: Request) {
  const body = await request.json();
  const { fileStr, name, contentType, mimeType } = body as {
    name: string;
    fileStr: string;
    contentType: keyof typeof uploadTypes;
    mimeType: string;
  };
  try {
    if (!fileStr || !name || !contentType) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    const response = await uploadToStorage({
      user,
      fileStr,
      name,
      contentType,
      mimeType,
    });

    if (response?.error) {
      console.error("Supabase upload error:", response?.error);
      return NextResponse.json({ error: { message: response?.error } }, { status: 500 });
    }
    return new Response(JSON.stringify({ path: response.path }), { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
