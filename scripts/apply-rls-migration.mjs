import pg from "pg";

const client = new pg.Client({
  connectionString:
    "postgresql://postgres:ikoOEb8q0j0AY7gT@db.lhpmebczgzizqlypzwcj.supabase.co:5432/postgres",
});

async function run() {
  console.log("=== Applying Migration 006: user_roles RLS ===\n");

  await client.connect();
  console.log("Connected to database.");

  // Check existing policies
  const { rows: existing } = await client.query(
    "SELECT policyname FROM pg_policies WHERE tablename = 'user_roles';"
  );
  console.log("Existing policies on user_roles:", existing);

  if (existing.some((r) => r.policyname === "Users can read own roles")) {
    console.log("\nPolicy already exists. Nothing to do.");
    await client.end();
    return;
  }

  // Apply the migration
  await client.query(`
    CREATE POLICY "Users can read own roles"
      ON user_roles
      FOR SELECT
      USING (auth.uid() = user_id);
  `);

  console.log("\nSUCCESS: RLS policy 'Users can read own roles' created on user_roles.");

  // Verify
  const { rows: after } = await client.query(
    "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'user_roles';"
  );
  console.log("Policies after migration:", after);

  await client.end();
  console.log("\n=== Migration complete ===");
}

run().catch((err) => {
  console.error("FAILED:", err.message);
  client.end();
  process.exit(1);
});
