import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

export async function GET() {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const { count } = await supabase
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
