export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// PUT to update profile
export async function PUT(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, email, profileImage } = await req.json();

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        profile_image: profileImage,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        firstName,
        lastName,
        email,
        profileImage,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
