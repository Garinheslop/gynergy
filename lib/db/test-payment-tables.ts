import postgres from "postgres";

async function testPaymentTables() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { ssl: "require", max: 1 });

  try {
    console.log("Testing payment tables...\n");

    // Test purchases table
    const purchases = await sql`SELECT COUNT(*) as count FROM purchases`;
    console.log(`✅ purchases table: ${purchases[0].count} records`);

    // Test friend_codes table
    const friendCodes = await sql`SELECT COUNT(*) as count FROM friend_codes`;
    console.log(`✅ friend_codes table: ${friendCodes[0].count} records`);

    // Test subscriptions table
    const subscriptions = await sql`SELECT COUNT(*) as count FROM subscriptions`;
    console.log(`✅ subscriptions table: ${subscriptions[0].count} records`);

    // Test user_entitlements table
    const entitlements = await sql`SELECT COUNT(*) as count FROM user_entitlements`;
    console.log(`✅ user_entitlements table: ${entitlements[0].count} records`);

    // Test generate_friend_code function
    const code = await sql`SELECT generate_friend_code() as code`;
    console.log(`✅ generate_friend_code() function works: ${code[0].code}`);

    // List sample friend code (if any)
    const sampleCodes = await sql`
      SELECT code, is_active, used_by_id
      FROM friend_codes
      LIMIT 3
    `;
    if (sampleCodes.length > 0) {
      console.log("\nSample friend codes:");
      sampleCodes.forEach((fc) => {
        console.log(
          `  - ${fc.code} (active: ${fc.is_active}, used: ${fc.used_by_id ? "yes" : "no"})`
        );
      });
    }

    console.log("\n✅ All payment tables are working correctly!");
  } catch (error) {
    console.error("❌ Error testing payment tables:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testPaymentTables();
