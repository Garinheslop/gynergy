export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// POST: Record user consent for AI chat processing
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type } = body;

    if (type !== "ai_chat") {
      return NextResponse.json({ error: "Invalid consent type" }, { status: 400 });
    }

    // Idempotent — only set consent once (preserve original timestamp)
    if (user.user_metadata?.ai_consent_granted_at) {
      return NextResponse.json({ success: true });
    }

    // Store consent timestamp in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        ai_consent_granted_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      console.error("Failed to record consent:", updateError);
      return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Check if user has granted AI consent
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const consentGrantedAt = user.user_metadata?.ai_consent_granted_at || null;

  return NextResponse.json({
    hasConsent: !!consentGrantedAt,
    consentGrantedAt,
  });
}
