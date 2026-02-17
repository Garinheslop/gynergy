import { readFileSync } from "fs";
import { join } from "path";

import dotenv from "dotenv";
import postgres from "postgres";

// Load .env.local if DATABASE_URL not already set
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
}

async function deployAutomationSchema() {
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
    // Read the automation schema file
    const schemaPath = join(process.cwd(), "supabase/schema/automation.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    console.log("Deploying automation schema...");

    // Execute the schema
    await sql.unsafe(schemaSql);

    console.log("  ✓ Automation schema deployed successfully\n");

    // Verify tables were created
    console.log("--- Verification ---\n");

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('automation_events', 'automation_rules')
      ORDER BY table_name;
    `;

    console.log("Tables created:");
    for (const table of tables) {
      console.log(`  ✓ ${table.table_name}`);
    }

    // Verify seed data
    const rules = await sql`
      SELECT name, trigger_event, is_active FROM automation_rules ORDER BY priority DESC;
    `;

    console.log(`\nRules seeded: ${rules.length}`);
    for (const rule of rules) {
      console.log(
        `  ✓ ${rule.name} (${rule.trigger_event}) [${rule.is_active ? "active" : "inactive"}]`
      );
    }

    console.log("\n--- Deployment Complete ---");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

deployAutomationSchema();
