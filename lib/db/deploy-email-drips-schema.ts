import { readFileSync } from "fs";
import { join } from "path";

import dotenv from "dotenv";
import postgres from "postgres";

// Load .env.local if DATABASE_URL not already set
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
}

async function deployEmailDripsSchema() {
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
    // Read the email drips schema file
    const schemaPath = join(process.cwd(), "supabase/schema/email-drips.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    console.log("Deploying email drips schema...");

    // Execute the schema
    await sql.unsafe(schemaSql);

    console.log("  ✓ Email drips schema deployed successfully\n");

    // Verify tables were created
    console.log("--- Verification ---\n");

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('drip_campaigns', 'drip_emails', 'drip_enrollments')
      ORDER BY table_name;
    `;

    console.log("Tables created:");
    for (const table of tables) {
      console.log(`  ✓ ${table.table_name}`);
    }

    // Verify seed data
    const campaigns = await sql`
      SELECT name, trigger_event, status FROM drip_campaigns ORDER BY trigger_event;
    `;

    console.log(`\nCampaigns seeded: ${campaigns.length}`);
    for (const campaign of campaigns) {
      console.log(`  ✓ ${campaign.name} (${campaign.trigger_event}) [${campaign.status}]`);
    }

    const emailCount = await sql`SELECT count(*) as count FROM drip_emails;`;
    console.log(`\nDrip emails seeded: ${emailCount[0].count}`);

    console.log("\n--- Deployment Complete ---");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

deployEmailDripsSchema();
