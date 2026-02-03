import postgres from "postgres";

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { ssl: "require", max: 1 });

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log("✅ Connected successfully!");
    console.log(`\nTables in database (${tables.length} total):`);
    tables.forEach((t) => console.log(`  - ${t.table_name}`));
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection();
