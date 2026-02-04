import { readFileSync } from "fs";
import { join } from "path";

import postgres from "postgres";

async function deployPaymentsSchema() {
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
    // Read the payments schema file
    const schemaPath = join(process.cwd(), "supabse/schema/payments.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    console.log("Deploying payments schema...");

    // Execute the schema
    await sql.unsafe(schemaSql);

    console.log("Payments schema deployed successfully!");

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('purchases', 'friend_codes', 'subscriptions', 'user_entitlements')
      ORDER BY table_name
    `;

    console.log("\nPayment tables created:");
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

    // Verify functions were created
    const functions = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('generate_friend_code', 'grant_challenge_access', 'redeem_friend_code', 'grant_community_access')
      ORDER BY routine_name
    `;

    console.log("\nPayment functions created:");
    functions.forEach((f) => console.log(`  - ${f.routine_name}`));
  } catch (error: any) {
    // Check if error is "already exists" type
    if (error.message?.includes("already exists")) {
      console.log("Some objects already exist, continuing...");
    } else {
      console.error("Deployment failed:", error);
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

deployPaymentsSchema();
