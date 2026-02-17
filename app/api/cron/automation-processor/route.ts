import { NextRequest, NextResponse } from "next/server";

import { processUnhandledEvents } from "@lib/services/eventService";

// Automation Processor Cron Job
//
// Backup processor that catches any events missed by real-time processing.
// Runs every 5 minutes.
// Vercel Cron schedule: every 5 minutes

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processUnhandledEvents();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/automation-processor] Fatal error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
