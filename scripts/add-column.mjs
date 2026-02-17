import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(databaseUrl);

try {
  // Check if column exists
  const existing = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'assessment_results'
    AND column_name = 'prior_coaching'
  `;

  if (existing.length > 0) {
    console.log("✅ Column 'prior_coaching' already exists!");
  } else {
    // Add the column
    await sql`
      ALTER TABLE assessment_results
      ADD COLUMN prior_coaching TEXT
      CHECK (prior_coaching IN ('never', 'free_content', 'under_1k', '1k_5k', '5k_15k', '15k_plus'))
    `;
    console.log("✅ Column 'prior_coaching' added successfully!");
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await sql.end();
}
