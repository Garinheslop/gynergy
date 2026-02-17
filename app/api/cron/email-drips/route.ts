import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@lib/email";
import { renderDripTemplate } from "@lib/email/drip-templates";
import { getReadyEnrollments, advanceEnrollment } from "@lib/services/dripService";

// Email Drips Cron Job
//
// Runs every 15 minutes. Checks for active drip enrollments that are
// ready for their next email and sends them.
// Vercel Cron schedule: every 15 minutes

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    errors: [] as string[],
  };

  try {
    // Get enrollments ready for their next email
    const ready = await getReadyEnrollments();
    results.processed = ready.length;

    for (const enrollment of ready) {
      try {
        const { nextEmail, metadata } = enrollment;

        // Render the template
        const template = renderDripTemplate(nextEmail.template_key, metadata || {});
        if (!template) {
          results.errors.push(
            `Unknown template: ${nextEmail.template_key} for enrollment ${enrollment.id}`
          );
          continue;
        }

        // Resolve subject line with metadata variables
        const subject = resolveSubject(nextEmail.subject, metadata || {});

        // Send the email
        const emailResult = await sendEmail({
          to: enrollment.email,
          subject,
          html: template.html,
          text: template.text,
        });

        if (emailResult.success) {
          // Advance the enrollment
          await advanceEnrollment(enrollment.id, nextEmail.sequence_order);
          results.sent++;
        } else {
          results.errors.push(`Failed to send to ${enrollment.email}: ${emailResult.error}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.errors.push(`Error processing enrollment ${enrollment.id}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/email-drips] Fatal error:", message);
    return NextResponse.json({ success: false, error: message, ...results }, { status: 500 });
  }
}

/**
 * Replace {{variable}} placeholders in subject lines with metadata values.
 */
function resolveSubject(subject: string, metadata: Record<string, any>): string {
  return subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return metadata[key] ?? key;
  });
}
