import { readFileSync } from "fs";
import { join } from "path";

import dotenv from "dotenv";
import postgres from "postgres";

// Load .env.local if DATABASE_URL not already set
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
}

async function deployWebinarSchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
  });

  console.log("Connected to database\n");

  try {
    // Read the webinar schema file
    const schemaPath = join(process.cwd(), "supabase/schema/webinars.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    console.log("Deploying webinar schema...");

    // Execute the schema
    await sql.unsafe(schemaSql);

    console.log("  ✓ Webinar schema deployed successfully\n");

    // Verify tables were created
    console.log("--- Verification ---\n");

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'webinars',
        'webinar_registrations',
        'webinar_attendance',
        'webinar_qa',
        'webinar_chat'
      )
      ORDER BY table_name
    `;

    console.log("Webinar tables created:");
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

    // Verify functions were created
    const functions = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('update_webinar_updated_at', 'update_watch_duration')
      ORDER BY routine_name
    `;

    console.log("\nWebinar functions created:");
    functions.forEach((f) => console.log(`  - ${f.routine_name}`));

    // Check for the seed webinar
    const webinar = await sql`
      SELECT id, title, slug, scheduled_start, status
      FROM webinars
      WHERE slug = 'five-pillars-march-2026'
      LIMIT 1
    `;

    if (webinar.length > 0) {
      console.log("\n--- Seed Data ---\n");
      console.log("March 2026 Webinar:");
      console.log(`  ID: ${webinar[0].id}`);
      console.log(`  Title: ${webinar[0].title}`);
      console.log(`  Slug: ${webinar[0].slug}`);
      console.log(`  Status: ${webinar[0].status}`);
      console.log(`  Scheduled: ${webinar[0].scheduled_start}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is "already exists" type
    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate key")) {
      console.log("  ⚠ Some objects already exist, continuing...\n");

      // Still verify what exists
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'webinar%'
        ORDER BY table_name
      `;

      console.log("Existing webinar tables:");
      tables.forEach((t) => console.log(`  - ${t.table_name}`));
    } else {
      console.error("Deployment failed:", errorMessage);
      process.exit(1);
    }
  } finally {
    await sql.end();
    console.log("\n✓ Webinar schema deployment complete!");
  }
}

deployWebinarSchema();
