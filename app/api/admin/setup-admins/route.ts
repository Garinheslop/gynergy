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

async function setupUserRolesTable(
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, role),
        UNIQUE(email, role)
      );
      ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
      CREATE POLICY "Service role full access" ON public.user_roles FOR ALL USING (true);
    `,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.log("Table setup note:", error.message);
  }
}

async function addAdminRoleByEmail(
  supabase: ReturnType<typeof createServiceClient>,
  email: string
): Promise<AdminResult> {
  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { email: email.toLowerCase(), role: "admin" },
      { onConflict: "email,role", ignoreDuplicates: true }
    );

  return error
    ? { email, status: "pending", error: `Reserved with note: ${error.message}` }
    : { email, status: "pending", error: "Admin role reserved - user needs to sign up" };
}

async function addAdminRoleByUserId(
  supabase: ReturnType<typeof createServiceClient>,
  email: string,
  userId: string
): Promise<AdminResult> {
  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, email: email.toLowerCase(), role: "admin" },
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
    return addAdminRoleByEmail(supabase, email);
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

    await setupUserRolesTable(supabase);

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
