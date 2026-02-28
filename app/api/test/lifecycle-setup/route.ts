export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@lib/supabase-server";

// Test-only endpoint for E2E cohort lifecycle testing.
// Gated behind E2E_TEST_SECRET — returns 403 when not set (production).

const E2E_TEST_SECRET = process.env.E2E_TEST_SECRET;

function unauthorized() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  // Gate: must have matching secret
  if (!E2E_TEST_SECRET) return unauthorized();
  const authHeader = request.headers.get("x-test-secret");
  if (authHeader !== E2E_TEST_SECRET) return unauthorized();

  const supabase = createServiceClient();
  const body = await request.json();
  const { operation } = body;

  try {
    switch (operation) {
      case "set-enrollment-date": {
        const { enrollmentId, date } = body;
        if (!enrollmentId || !date) {
          return NextResponse.json({ error: "enrollmentId and date required" }, { status: 400 });
        }
        const { error } = await supabase
          .from("session_enrollments")
          .update({ enrollment_date: date })
          .eq("id", enrollmentId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, operation, enrollmentId, date });
      }

      case "set-session-dates": {
        const { sessionId, startDate, endDate, gracePeriodEnd, status } = body;
        if (!sessionId) {
          return NextResponse.json({ error: "sessionId required" }, { status: 400 });
        }
        const updates: Record<string, unknown> = {};
        if (startDate) updates.start_date = startDate;
        if (endDate) updates.end_date = endDate;
        if (gracePeriodEnd) updates.grace_period_end = gracePeriodEnd;
        if (status) updates.status = status;

        const { error } = await supabase.from("book_sessions").update(updates).eq("id", sessionId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, operation, sessionId });
      }

      case "debug-enrollment": {
        // Debug: query enrollment with the same join pattern as the actions API
        const { enrollmentId, userId } = body;
        const { data: enrollmentData, error: enrollError } = await supabase
          .from("session_enrollments")
          .select("enrollment_date, session: book_sessions(id, book: books(id, duration_days))")
          .eq("user_id", userId)
          .eq("id", enrollmentId)
          .limit(1);
        return NextResponse.json({
          success: true,
          operation,
          enrollmentData,
          enrollError: enrollError?.message || null,
        });
      }

      case "cleanup": {
        const { userId, sessionId, email } = body;
        if (!userId || !sessionId) {
          return NextResponse.json({ error: "userId and sessionId required" }, { status: 400 });
        }

        const deleted: Record<string, number> = {};

        // 1. journal_entries (FK → journals)
        const { data: journals } = await supabase
          .from("journals")
          .select("id")
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        if (journals?.length) {
          const journalIds = journals.map((j: { id: string }) => j.id);
          const { count } = await supabase
            .from("journal_entries")
            .delete({ count: "exact" })
            .in("journal_id", journalIds);
          deleted.journal_entries = count ?? 0;
        }

        // 2. journals
        const { count: journalCount } = await supabase
          .from("journals")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.journals = journalCount ?? 0;

        // 3. action_logs
        const { count: actionLogCount } = await supabase
          .from("action_logs")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.action_logs = actionLogCount ?? 0;

        // 4. generated_actions
        const { count: genCount } = await supabase
          .from("generated_actions")
          .delete({ count: "exact" })
          .eq("user_id", userId);
        deleted.generated_actions = genCount ?? 0;

        // 5. points_transactions
        const { count: pointsCount } = await supabase
          .from("points_transactions")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.points_transactions = pointsCount ?? 0;

        // 6. user_badges
        const { count: badgeCount } = await supabase
          .from("user_badges")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.user_badges = badgeCount ?? 0;

        // 7. cohort_transitions
        const { count: transCount } = await supabase
          .from("cohort_transitions")
          .delete({ count: "exact" })
          .eq("user_id", userId);
        deleted.cohort_transitions = transCount ?? 0;

        // 8. cohort_memberships (for cohorts linked to this session)
        const { data: cohort } = await supabase
          .from("cohorts")
          .select("id")
          .eq("session_id", sessionId)
          .single();
        if (cohort) {
          const { count: memberCount } = await supabase
            .from("cohort_memberships")
            .delete({ count: "exact" })
            .eq("user_id", userId)
            .eq("cohort_id", cohort.id);
          deleted.cohort_memberships = memberCount ?? 0;
        }

        // 9. journey
        const { count: journeyCount } = await supabase
          .from("journey")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.journey = journeyCount ?? 0;

        // 10. session_enrollments
        const { count: enrollCount } = await supabase
          .from("session_enrollments")
          .delete({ count: "exact" })
          .eq("user_id", userId)
          .eq("session_id", sessionId);
        deleted.session_enrollments = enrollCount ?? 0;

        // 11. webinar_registrations + assessment_results (by email)
        if (email) {
          const { count: webinarCount } = await supabase
            .from("webinar_registrations")
            .delete({ count: "exact" })
            .eq("email", email);
          deleted.webinar_registrations = webinarCount ?? 0;

          const { count: assessCount } = await supabase
            .from("assessment_results")
            .delete({ count: "exact" })
            .eq("email", email);
          deleted.assessment_results = assessCount ?? 0;
        }

        return NextResponse.json({ success: true, operation, deleted });
      }

      case "create-enrollment": {
        // Directly create an enrollment for a specific session (bypasses auto-session-finding)
        const { userId, bookId, sessionId: targetSessionId } = body;
        if (!userId || !bookId || !targetSessionId) {
          return NextResponse.json(
            { error: "userId, bookId, and sessionId required" },
            { status: 400 }
          );
        }

        // Remove any existing enrollment for this user+book to avoid .single() conflicts
        await supabase
          .from("session_enrollments")
          .delete()
          .eq("user_id", userId)
          .eq("book_id", bookId);

        const enrollDate = new Date().toISOString();
        const { data: enrollment, error: enrollError } = await supabase
          .from("session_enrollments")
          .insert({
            user_id: userId,
            book_id: bookId,
            session_id: targetSessionId,
            enrollment_date: enrollDate,
          })
          .select()
          .single();
        if (enrollError) {
          return NextResponse.json({ error: enrollError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, operation, enrollment });
      }

      case "restore-enrollment": {
        // Re-create user's enrollment in the first available non-personal session
        const { userId, bookId } = body;
        if (!userId || !bookId) {
          return NextResponse.json({ error: "userId and bookId required" }, { status: 400 });
        }
        // Find the first non-personal, non-test session for this book
        const { data: originalSession } = await supabase
          .from("book_sessions")
          .select("id")
          .eq("book_id", bookId)
          .eq("is_personal", false)
          .not("cohort_label", "ilike", "E2E%")
          .order("start_date", { ascending: false })
          .limit(1)
          .single();
        if (originalSession) {
          // Check if enrollment already exists
          const { data: existing } = await supabase
            .from("session_enrollments")
            .select("id")
            .eq("user_id", userId)
            .eq("book_id", bookId)
            .limit(1);
          if (!existing?.length) {
            await supabase.from("session_enrollments").insert({
              user_id: userId,
              book_id: bookId,
              session_id: originalSession.id,
              enrollment_date: new Date().toISOString(),
            });
          }
        }
        return NextResponse.json({ success: true, operation });
      }

      case "cleanup-test-sessions": {
        // Remove orphaned test sessions from previous failed test runs
        const { labelPrefix } = body;
        if (!labelPrefix) {
          return NextResponse.json({ error: "labelPrefix required" }, { status: 400 });
        }
        const { data: testSessions } = await supabase
          .from("book_sessions")
          .select("id")
          .ilike("cohort_label", `${labelPrefix}%`);
        let cleaned = 0;
        for (const session of testSessions || []) {
          await supabase.from("session_enrollments").delete().eq("session_id", session.id);
          await supabase.from("cohorts").delete().eq("session_id", session.id);
          await supabase.from("book_sessions").delete().eq("id", session.id);
          cleaned++;
        }
        return NextResponse.json({ success: true, operation, cleaned });
      }

      case "delete-session": {
        const { sessionId } = body;
        if (!sessionId) {
          return NextResponse.json({ error: "sessionId required" }, { status: 400 });
        }

        // Delete cohort linked to session first
        await supabase.from("cohorts").delete().eq("session_id", sessionId);

        // Delete the session
        const { error } = await supabase.from("book_sessions").delete().eq("id", sessionId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, operation, sessionId });
      }

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
