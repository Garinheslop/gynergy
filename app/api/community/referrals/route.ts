export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

// Type definitions for type safety
interface ReferredUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface Referral {
  id: string;
  status: string;
  points_awarded: number;
  converted_at: string | null;
  created_at: string;
  referred: ReferredUser | null;
}

interface ReferralMilestone {
  id: string;
  name: string;
  description: string;
  referrals_required: number;
  points_bonus: number;
  reward_description: string | null;
}

interface UserMilestone {
  milestone_id: string;
}

interface ReferralCode {
  id: string;
  code: string;
  uses_count: number;
  total_points_earned: number;
  is_active: boolean;
}

// GET: Get user's referral code and stats
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user's referral code
    const { data: referralCode, error: codeError } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (codeError && codeError.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch referral code" }, { status: 500 });
    }

    // If no code exists, create one
    let code = referralCode as ReferralCode | null;
    if (!code) {
      const serviceSupabase = createServiceClient();
      const { data: newCode, error: createError } = await serviceSupabase.rpc(
        "generate_referral_code",
        { p_user_id: user.id }
      );

      if (!createError) {
        // Insert the new code
        const { data: insertedCode } = await serviceSupabase
          .from("referral_codes")
          .insert({
            user_id: user.id,
            code: newCode,
          })
          .select()
          .single();

        code = insertedCode as ReferralCode | null;
      }
    }

    // Get user's referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select(
        `
        *,
        referred:users!referrals_referred_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        )
      `
      )
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    // Get milestones
    const { data: milestones } = await supabase
      .from("referral_milestones")
      .select("*")
      .eq("is_active", true)
      .order("referrals_required", { ascending: true });

    // Get user's achieved milestones
    const { data: achievedMilestones } = await supabase
      .from("user_referral_milestones")
      .select("milestone_id")
      .eq("user_id", user.id);

    const typedAchievedMilestones = achievedMilestones as UserMilestone[] | null;
    const achievedIds = new Set(typedAchievedMilestones?.map((m) => m.milestone_id) || []);

    // Format response
    const typedReferrals = referrals as Referral[] | null;
    const formattedReferrals = (typedReferrals || []).map((r) => ({
      id: r.id,
      status: r.status,
      pointsAwarded: r.points_awarded,
      convertedAt: r.converted_at,
      createdAt: r.created_at,
      referred: r.referred
        ? {
            id: r.referred.id,
            firstName: r.referred.first_name,
            lastName: r.referred.last_name,
            profileImage: r.referred.profile_image,
          }
        : null,
    }));

    const typedMilestones = milestones as ReferralMilestone[] | null;
    const formattedMilestones = (typedMilestones || []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      referralsRequired: m.referrals_required,
      pointsBonus: m.points_bonus,
      rewardDescription: m.reward_description,
      isAchieved: achievedIds.has(m.id),
    }));

    return NextResponse.json({
      referralCode: code
        ? {
            id: code.id,
            code: code.code,
            usesCount: code.uses_count,
            totalPointsEarned: code.total_points_earned,
            isActive: code.is_active,
          }
        : null,
      referrals: formattedReferrals,
      milestones: formattedMilestones,
      stats: {
        totalReferrals: typedReferrals?.length || 0,
        convertedReferrals: typedReferrals?.filter((r) => r.status === "converted").length || 0,
        totalPointsEarned: code?.total_points_earned || 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
