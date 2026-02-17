import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  console.log("URL:", supabaseUrl ? "✓" : "✗");
  console.log("KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test if column exists by trying to select it
const { error } = await supabase
  .from("assessment_results")
  .select("prior_coaching")
  .limit(1);

if (error?.message?.includes("does not exist")) {
  console.log("❌ Column 'prior_coaching' does not exist yet.");
  console.log("\n📋 Please run this SQL in Supabase Dashboard:");
  console.log("https://supabase.com/dashboard/project/lhpmebczgzizqlypzwcj/sql/new\n");
  console.log(`ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS prior_coaching TEXT
CHECK (prior_coaching IN ('never', 'free_content', 'under_1k', '1k_5k', '5k_15k', '15k_plus'));`);
} else if (error) {
  console.log("Error:", error.message);
} else {
  console.log("✅ Column 'prior_coaching' already exists!");
}
