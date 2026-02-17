/**
 * Migration: Add prior_coaching column to assessment_results
 * Run with: npx tsx scripts/add-prior-coaching-column.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log("Adding prior_coaching column to assessment_results...");

  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE assessment_results
      ADD COLUMN IF NOT EXISTS prior_coaching TEXT
      CHECK (prior_coaching IN ('never', 'free_content', 'under_1k', '1k_5k', '5k_15k', '15k_plus'));
    `,
  });

  if (error) {
    // Try direct approach if RPC doesn't exist
    console.log("RPC not available, trying Supabase dashboard approach...");
    console.log("\n📋 Run this SQL in your Supabase dashboard (SQL Editor):\n");
    console.log(`ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS prior_coaching TEXT
CHECK (prior_coaching IN ('never', 'free_content', 'under_1k', '1k_5k', '5k_15k', '15k_plus'));`);
    console.log("\n🔗 Go to: https://supabase.com/dashboard/project/lhpmebczgzizqlypzwcj/sql/new");
    return;
  }

  console.log("✅ Migration complete!");
}

migrate().catch(console.error);
