import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(_request: NextRequest) {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  try {
    // Fetch all non-personal book sessions with enrollment counts
    const { data: sessions, error: sessionsError } = await serviceClient
      .from("book_sessions")
      .select(
        `
        *,
        book: books (id, name, short_name, slug, duration_days),
        cohort: cohorts (id, name, slug)
      `
      )
      .eq("is_personal", false)
      .order("start_date", { ascending: false });

    if (sessionsError) throw sessionsError;

    // Get enrollment counts for each session
    const sessionIds = (sessions || []).map((s) => s.id);
    const enrollmentCounts = new Map<string, number>();

    if (sessionIds.length > 0) {
      const { data: enrollments } = await serviceClient
        .from("session_enrollments")
        .select("session_id")
        .in("session_id", sessionIds);

      if (enrollments) {
        for (const e of enrollments) {
          const count = enrollmentCounts.get(e.session_id) || 0;
          enrollmentCounts.set(e.session_id, count + 1);
        }
      }
    }

    // Format sessions
    const formattedSessions = (sessions || []).map((session) => ({
      id: session.id,
      bookId: session.book_id,
      bookName: session.book?.name || "Unknown",
      bookSlug: session.book?.slug || "",
      cohortLabel:
        session.cohort_label ||
        `Cohort ${new Date(session.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
      status: session.status || "active",
      startDate: session.start_date,
      endDate: session.end_date,
      gracePeriodEnd: session.grace_period_end,
      maxEnrollments: session.max_enrollments || 15,
      enrollmentCount: enrollmentCounts.get(session.id) || 0,
      durationDays: session.duration_days,
      cohortId: session.cohort?.[0]?.id || null,
      cohortSlug: session.cohort?.[0]?.slug || null,
      createdAt: session.created_at,
    }));

    // Calculate stats
    const now = new Date();
    const stats = {
      totalCohorts: formattedSessions.length,
      activeCohorts: formattedSessions.filter((s) => s.status === "active").length,
      upcomingCohorts: formattedSessions.filter((s) => s.status === "upcoming").length,
      totalEnrolled: formattedSessions.reduce((sum, s) => sum + s.enrollmentCount, 0),
      gracePeriodCohorts: formattedSessions.filter((s) => s.status === "grace_period").length,
      completedCohorts: formattedSessions.filter((s) => s.status === "completed").length,
      nextLaunch:
        formattedSessions
          .filter((s) => new Date(s.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]
          ?.startDate || null,
    };

    // Fetch available books for the create modal
    const { data: books } = await serviceClient
      .from("books")
      .select("id, name, short_name, slug, duration_days")
      .order("name");

    return NextResponse.json({
      success: true,
      data: {
        stats,
        sessions: formattedSessions,
        books: books || [],
      },
    });
  } catch (error) {
    console.error("Error fetching cohort data:", error);
    return NextResponse.json({ error: "Failed to fetch cohort data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();

  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === "create") {
      const { bookId, label, startDate, maxEnrollments } = data;

      if (!bookId || !startDate) {
        return NextResponse.json({ error: "Book ID and start date are required" }, { status: 400 });
      }

      // Get the book's duration
      const { data: book } = await serviceClient
        .from("books")
        .select("duration_days")
        .eq("id", bookId)
        .single();

      if (!book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      const start = new Date(startDate + "T00:00:00Z");
      const endDate = new Date(start.getTime() + book.duration_days * 24 * 60 * 60 * 1000);
      const gracePeriodEnd = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Determine status based on dates
      const now = new Date();
      let status = "upcoming";
      if (start <= now && endDate >= now) status = "active";
      else if (endDate < now && gracePeriodEnd >= now) status = "grace_period";
      else if (gracePeriodEnd < now) status = "completed";

      // Create the book session (trigger auto-creates cohort)
      const { data: session, error: sessionError } = await serviceClient
        .from("book_sessions")
        .insert({
          book_id: bookId,
          duration_days: book.duration_days,
          start_date: start.toISOString(),
          end_date: endDate.toISOString(),
          cohort_label:
            label ||
            `Cohort ${start.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          status,
          grace_period_end: gracePeriodEnd.toISOString(),
          max_enrollments: maxEnrollments || 15,
          is_personal: false,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Log the action
      await serviceClient.from("admin_audit_logs").insert({
        admin_id: user.id,
        action_type: "create",
        action_category: "cohort",
        resource_type: "book_session",
        resource_id: session.id,
        metadata: { label, startDate, maxEnrollments },
        status: "success",
      });

      return NextResponse.json({
        success: true,
        data: session,
        message: "Cohort session created successfully",
      });
    } else if (action === "update") {
      const { sessionId, label, maxEnrollments, status: newStatus } = data;

      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (label !== undefined) updateData.cohort_label = label;
      if (maxEnrollments !== undefined) updateData.max_enrollments = maxEnrollments;
      if (newStatus !== undefined) updateData.status = newStatus;

      const { error: updateError } = await serviceClient
        .from("book_sessions")
        .update(updateData)
        .eq("id", sessionId);

      if (updateError) throw updateError;

      // Also update linked cohort name if label changed
      if (label !== undefined) {
        await serviceClient
          .from("cohorts")
          .update({ name: label, updated_at: new Date().toISOString() })
          .eq("session_id", sessionId);
      }

      // Log the action
      await serviceClient.from("admin_audit_logs").insert({
        admin_id: user.id,
        action_type: "update",
        action_category: "cohort",
        resource_type: "book_session",
        resource_id: sessionId,
        metadata: data,
        status: "success",
      });

      return NextResponse.json({
        success: true,
        message: "Cohort session updated successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing cohorts:", error);
    return NextResponse.json({ error: "Failed to manage cohort" }, { status: 500 });
  }
}
