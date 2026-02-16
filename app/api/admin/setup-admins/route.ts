import { NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@lib/supabase-server";

/**
 * One-time admin setup endpoint
 *
 * Adds admin roles for specified users using the Supabase Admin API.
 * Protected by a setup key to prevent unauthorized access.
 */

const ADMIN_EMAILS = ["garin@gynergy.com", "yesi@gynergy.com", "bridget@gynergy.com"];
const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "gynergy-admin-setup-2024";

type AdminResult = { email: string; status: string; error?: string };

async function addAdminRoleByUserId(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  userId: string
): Promise<AdminResult> {
  // Only use user_id and role to match existing table schema
  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role", ignoreDuplicates: true }
    );

  return error ? { email, status: "error", error: error.message } : { email, status: "added" };
}

async function processAdminEmail(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  allUsers: { id: string; email?: string }[]
): Promise<AdminResult> {
  const user = allUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    return {
      email,
      status: "skipped",
      error: "User not signed up yet - they must sign up first, then run this again",
    };
  }

  return addAdminRoleByUserId(supabase, email, user.id);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.key !== SETUP_KEY) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Fetch all users once
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      return NextResponse.json(
        { success: false, error: `Auth API error: ${userError.message}` },
        { status: 500 }
      );
    }

    const results: AdminResult[] = [];

    for (const email of ADMIN_EMAILS) {
      const result = await processAdminEmail(supabase, email, userData.users);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: "Admin setup complete",
      results,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Admin setup error:", error);
    return NextResponse.json({ success: false, error: "Setup failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 401 });
  }

  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ key }),
    })
  );
}
