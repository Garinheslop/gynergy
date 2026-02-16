import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

/**
 * One-time admin setup endpoint
 *
 * Adds admin roles for specified users.
 * Protected by a setup key to prevent unauthorized access.
 */

const ADMIN_EMAILS = ["garin@gynergy.com", "yesi@gynergy.com", "bridget@gynergy.com"];

// Simple setup key - should match env var or be removed after use
const SETUP_KEY = process.env.ADMIN_SETUP_KEY || "gynergy-admin-setup-2024";

export async function POST(request: NextRequest) {
  try {
    // Verify setup key
    const body = await request.json();
    if (body.key !== SETUP_KEY) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 401 });
    }

    const supabase = await createClient();
    const results: { email: string; status: string; error?: string }[] = [];

    // First, ensure the user_roles table exists
    const { error: tableError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, role)
        );

        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Service role full access" ON user_roles;
        CREATE POLICY "Service role full access" ON user_roles
          FOR ALL USING (auth.role() = 'service_role');

        DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
        CREATE POLICY "Users can read own roles" ON user_roles
          FOR SELECT USING (auth.uid() = user_id);
      `,
    });

    if (tableError) {
      // Table might already exist or RPC not available - try direct insert anyway
      // eslint-disable-next-line no-console
      console.log("Table setup note:", tableError.message);
    }

    // Add admin role for each email
    for (const email of ADMIN_EMAILS) {
      // Find user by email
      const { data: users, error: userError } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", email)
        .single();

      if (userError || !users) {
        // Try alternative approach - query auth.users directly via RPC or raw query
        const { data: authUser } = await supabase.rpc("get_user_by_email", {
          user_email: email,
        });

        if (!authUser) {
          results.push({
            email,
            status: "skipped",
            error: "User not found - they need to sign up first",
          });
          continue;
        }

        // Insert admin role
        const { error: insertError } = await supabase.from("user_roles").upsert(
          {
            user_id: authUser.id,
            role: "admin",
          },
          { onConflict: "user_id,role" }
        );

        if (insertError) {
          results.push({ email, status: "error", error: insertError.message });
        } else {
          results.push({ email, status: "added" });
        }
      } else {
        // Insert admin role
        const { error: insertError } = await supabase.from("user_roles").upsert(
          {
            user_id: users.id,
            role: "admin",
          },
          { onConflict: "user_id,role" }
        );

        if (insertError) {
          results.push({ email, status: "error", error: insertError.message });
        } else {
          results.push({ email, status: "added" });
        }
      }
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

// Also allow GET with query param for easy testing
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 401 });
  }

  // Convert to POST request
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ key }),
    })
  );
}
