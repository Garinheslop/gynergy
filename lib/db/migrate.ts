import { readFileSync } from "fs";
import { join } from "path";

import postgres from "postgres";

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
  });

  console.log("Connected to database");

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), "supabse/migrations/001_complete_migration.sql");
    const migrationSql = readFileSync(migrationPath, "utf-8");

    console.log("Running migration...");

    // Execute the migration
    await sql.unsafe(migrationSql);

    console.log("Migration completed successfully!");

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log("\nTables in database:");
    tables.forEach((t) => console.log(`  - ${t.table_name}`));
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
