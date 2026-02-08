import postgres from "postgres";

async function fixPurchaseTrigger() {
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
    // 1. Update the trigger function to handle both INSERT and UPDATE
    console.log("Updating trigger function...");
    await sql`
      CREATE OR REPLACE FUNCTION create_friend_code_for_purchase()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Only create friend codes for completed challenge purchases with a user_id
          -- Handle both INSERT (new completed purchase) and UPDATE (status changed to completed)
          IF NEW.status = 'completed' AND NEW.purchase_type = 'challenge' AND NEW.user_id IS NOT NULL THEN
              -- For UPDATE: only trigger if status actually changed to completed
              -- For INSERT: always trigger for completed purchases
              IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed') THEN
                  -- Create TWO friend codes per purchase (Accountability Trio model)
                  INSERT INTO friend_codes (code, creator_id, purchase_id)
                  VALUES
                      (generate_friend_code(), NEW.user_id, NEW.id),
                      (generate_friend_code(), NEW.user_id, NEW.id);

                  -- Grant challenge access to purchaser
                  PERFORM grant_challenge_access(NEW.user_id, 'purchased');
              END IF;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;

    // 2. Recreate trigger to fire on both INSERT and UPDATE
    console.log("Recreating trigger...");
    await sql`DROP TRIGGER IF EXISTS create_friend_code_trigger ON purchases`;
    await sql`
      CREATE TRIGGER create_friend_code_trigger
          AFTER INSERT OR UPDATE ON purchases
          FOR EACH ROW
          EXECUTE FUNCTION create_friend_code_for_purchase()
    `;

    console.log("Trigger updated successfully!");

    // 3. Check for any completed purchases without friend codes and fix them
    console.log("\nChecking for purchases missing friend codes...");
    const purchasesMissingCodes = await sql`
      SELECT p.id, p.user_id, p.status, p.purchase_type
      FROM purchases p
      WHERE p.status = 'completed'
        AND p.purchase_type = 'challenge'
        AND p.user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM friend_codes fc WHERE fc.purchase_id = p.id
        )
    `;

    if (purchasesMissingCodes.length > 0) {
      console.log(`Found ${purchasesMissingCodes.length} purchases missing friend codes:`);
      for (const purchase of purchasesMissingCodes) {
        console.log(`  - Purchase ${purchase.id} for user ${purchase.user_id}`);

        // Create friend codes for this purchase
        await sql`
          INSERT INTO friend_codes (code, creator_id, purchase_id)
          SELECT generate_friend_code(), ${purchase.user_id}::uuid, ${purchase.id}::uuid
          FROM generate_series(1, 2)
        `;

        // Grant challenge access
        await sql`
          INSERT INTO user_entitlements (user_id, has_challenge_access, challenge_access_type, challenge_access_granted_at)
          VALUES (${purchase.user_id}::uuid, TRUE, 'purchased', NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            has_challenge_access = TRUE,
            challenge_access_type = 'purchased',
            challenge_access_granted_at = COALESCE(user_entitlements.challenge_access_granted_at, NOW()),
            updated_at = NOW()
        `;

        console.log(`    ✓ Created friend codes and granted access`);
      }
    } else {
      console.log("No purchases missing friend codes found.");
    }

    // 4. Show current state
    console.log("\n--- Current State ---");

    const purchases =
      await sql`SELECT id, user_id, status, purchase_type, created_at FROM purchases ORDER BY created_at DESC LIMIT 5`;
    console.log("\nRecent purchases:");
    purchases.forEach((p) =>
      console.log(`  - ${p.id} | user: ${p.user_id} | ${p.status} | ${p.purchase_type}`)
    );

    const friendCodes =
      await sql`SELECT code, creator_id, used_by_id, created_at FROM friend_codes ORDER BY created_at DESC LIMIT 5`;
    console.log("\nRecent friend codes:");
    friendCodes.forEach((fc) =>
      console.log(`  - ${fc.code} | creator: ${fc.creator_id} | used: ${fc.used_by_id || "no"}`)
    );

    const entitlements =
      await sql`SELECT user_id, has_challenge_access, challenge_access_type FROM user_entitlements LIMIT 5`;
    console.log("\nUser entitlements:");
    entitlements.forEach((e) =>
      console.log(
        `  - user: ${e.user_id} | challenge: ${e.has_challenge_access} (${e.challenge_access_type})`
      )
    );
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixPurchaseTrigger();
