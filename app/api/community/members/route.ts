export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@lib/supabase-server";

// GET: Fetch cohort members
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cohortId = searchParams.get("cohortId");

    // Get user's cohort if not specified
    let targetCohortId = cohortId;
    if (!targetCohortId) {
      const { data: membership } = await supabase
        .from("cohort_memberships")
        .select("cohort_id")
        .eq("user_id", user.id)
        .single();

      targetCohortId = membership?.cohort_id;
    }

    if (!targetCohortId) {
      return NextResponse.json({ error: "No cohort found" }, { status: 404 });
    }

    // Verify user is member of this cohort
    const { data: isMember } = await supabase
      .from("cohort_memberships")
      .select("id")
      .eq("cohort_id", targetCohortId)
      .eq("user_id", user.id)
      .single();

    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this cohort" }, { status: 403 });
    }

    // Fetch members with their stats
    const { data: members, error } = await supabase
      .from("cohort_memberships")
      .select(
        `
        role,
        joined_at,
        user:users!cohort_memberships_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image
        )
      `
      )
      .eq("cohort_id", targetCohortId)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    // Get enrollment stats for each user
    const userIds = members?.map((m: any) => m.user?.id).filter(Boolean) || [];

    const { data: enrollments } = await supabase
      .from("session_enrollments")
      .select("user_id, total_points, morning_streak, evening_streak, gratitude_streak")
      .in("user_id", userIds);

    const enrollmentMap = new Map(enrollments?.map((e: any) => [e.user_id, e]) || []);

    // Format response
    const formattedMembers = (members || [])
      .filter((m: any) => m.user)
      .map((m: any) => {
        const enrollment = enrollmentMap.get(m.user.id);
        const maxStreak = Math.max(
          enrollment?.morning_streak || 0,
          enrollment?.evening_streak || 0,
          enrollment?.gratitude_streak || 0
        );

        return {
          id: m.user.id,
          firstName: m.user.first_name,
          lastName: m.user.last_name,
          profileImage: m.user.profile_image,
          role: m.role,
          joinedAt: m.joined_at,
          streak: maxStreak,
          points: enrollment?.total_points || 0,
        };
      });

    // Get cohort info
    const { data: cohort } = await supabase
      .from("cohorts")
      .select("id, name, slug, description, start_date, end_date")
      .eq("id", targetCohortId)
      .single();

    return NextResponse.json({
      cohort: cohort
        ? {
            id: cohort.id,
            name: cohort.name,
            slug: cohort.slug,
            description: cohort.description,
            startDate: cohort.start_date,
            endDate: cohort.end_date,
          }
        : null,
      members: formattedMembers,
      totalMembers: formattedMembers.length,
    });
  } catch (error) {
    console.error("Members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
