export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.headers.get("origin")}/auth/callback`,
      },
    });

    if (error) throw error;

    return NextResponse.json({
      message: "Check your email to continue your journey.",
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Error processing authentication request" }, { status: 500 });
  }
}
