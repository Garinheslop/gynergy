#!/usr/bin/env npx tsx
// Script to deploy SQL schema to Supabase using DATABASE_URL

import { readFileSync } from "fs";
import { resolve } from "path";

import { config } from "dotenv";
import { Client } from "pg";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function deploySchema() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.log("\nAdd to .env.local:");
    console.log(
      'DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"'
    );
    process.exit(1);
  }

  // Get schema file from command line or default to content-library
  const schemaFile = process.argv[2] || "supabse/schema/content-library.sql";
  const schemaPath = resolve(process.cwd(), schemaFile);

  console.log(`📄 Reading schema from: ${schemaFile}`);

  let sql: string;
  try {
    sql = readFileSync(schemaPath, "utf-8");
  } catch (err) {
    console.error(`❌ Failed to read schema file: ${schemaPath}`);
    process.exit(1);
  }

  console.log(`🔌 Connecting to database...`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    console.log("🚀 Executing schema...");
    await client.query(sql);

    console.log("✅ Schema deployed successfully!");
  } catch (err: any) {
    console.error("❌ Failed to deploy schema:", err.message);

    // Show more helpful error context
    if (err.message.includes("already exists")) {
      console.log("\n💡 Some tables may already exist. This is often fine for idempotent schemas.");
    }
    if (err.message.includes("authentication")) {
      console.log("\n💡 Check your DATABASE_URL password is correct.");
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

deploySchema();
