export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: Fetch user's referral credits (issued by gynergy.com)
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: credits, error } = await supabase
      .from("referral_credits")
      .select("id, slug, share_url, options, redeemed_at, redeemer_email, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referral credits:", error);
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
    }

    return NextResponse.json({
      credits: (credits || []).map((c) => ({
        id: c.id,
        slug: c.slug,
        shareUrl: c.share_url,
        options: c.options,
        isRedeemed: !!c.redeemed_at,
        redeemedAt: c.redeemed_at,
        redeemerEmail: c.redeemer_email,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error("Get referral credits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
