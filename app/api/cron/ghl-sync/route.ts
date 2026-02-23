export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createOrUpdateGHLContact, addTagsToContact } from "@lib/services/ghlService";
import type { GHLTag } from "@lib/services/ghlService";
import { createServiceClient } from "@lib/supabase-server";

/**
 * GHL Bulk Sync Cron Job
 *
 * Catches missed syncs by scanning for contacts that exist in Supabase
 * but have not been synced to GHL yet. Processes in batches of 50
 * with 1-second delays to respect GHL rate limits (~100 req/min).
 *
 * Schedule: Daily at 3 AM UTC (configured in vercel.json)
 */

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results = { synced: 0, errors: 0, skipped: 0 };

  try {
    // 1. Sync unsynced webinar registrations
    await syncTable(supabase, results, {
      table: "webinar_registrations",
      emailColumn: "email",
      nameColumn: "first_name",
      tags: ["webinar-registered"],
    });

    // 2. Sync unsynced assessment completions
    await syncTable(supabase, results, {
      table: "assessment_results",
      emailColumn: "email",
      nameColumn: null,
      tags: ["assessment-completed"],
    });

    // 3. Sync unsynced purchases
    await syncTable(supabase, results, {
      table: "purchases",
      emailColumn: "email",
      nameColumn: null,
      tags: ["challenge-purchased"],
      filter: { column: "status", value: "completed" },
    });

    // 4. Sync unsynced landing leads
    await syncTable(supabase, results, {
      table: "landing_leads",
      emailColumn: "email",
      nameColumn: null,
      tags: ["lead-landing-page"],
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/ghl-sync] Fatal error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ============================================================================
// Helpers
// ============================================================================

interface SyncConfig {
  table: string;
  emailColumn: string;
  nameColumn: string | null;
  tags: GHLTag[];
  filter?: { column: string; value: string };
}

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

async function syncTable(
  supabase: SupabaseServiceClient,
  results: { synced: number; errors: number; skipped: number },
  config: SyncConfig
) {
  // Get emails already synced to GHL
  const { data: syncedContacts } = await supabase.from("ghl_contact_sync").select("email");

  const syncedEmails = new Set((syncedContacts || []).map((c) => c.email));

  // Get emails from source table
  const selectColumns = config.nameColumn
    ? `${config.emailColumn}, ${config.nameColumn}`
    : config.emailColumn;

  let query = supabase.from(config.table).select(selectColumns);

  if (config.filter) {
    query = query.eq(config.filter.column, config.filter.value);
  }

  const { data: sourceRows, error } = await query;

  if (error) {
    // Table might not exist yet — skip gracefully
    if (error.code === "42P01") return;
    console.error(`[cron/ghl-sync] Error reading ${config.table}:`, error.message);
    return;
  }

  if (!sourceRows) return;

  // Filter to unsynced emails
  const rows = sourceRows as unknown as Record<string, unknown>[];
  const unsynced = rows.filter(
    (row) => row[config.emailColumn] && !syncedEmails.has(row[config.emailColumn] as string)
  );

  // Process in batches
  for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
    const batch = unsynced.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const email = row[config.emailColumn] as string;
      const firstName = config.nameColumn ? (row[config.nameColumn] as string) : undefined;

      try {
        const result = await createOrUpdateGHLContact({
          email,
          firstName: firstName || undefined,
          tags: config.tags,
        });

        if (result.success && result.contactId) {
          await addTagsToContact(result.contactId, config.tags).catch(() => {});

          // Record sync
          await supabase.from("ghl_contact_sync").upsert(
            {
              ghl_contact_id: result.contactId,
              email: email.toLowerCase().trim(),
              first_name: firstName || null,
              tags: config.tags,
              last_synced_to_ghl: new Date().toISOString(),
              sync_status: "synced",
            },
            { onConflict: "email" }
          );

          results.synced++;
        } else {
          results.errors++;
        }
      } catch {
        results.errors++;
      }
    }

    // Rate limit delay between batches (1 second)
    if (i + BATCH_SIZE < unsynced.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
