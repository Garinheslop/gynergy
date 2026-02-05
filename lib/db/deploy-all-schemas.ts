import { readFileSync } from "fs";
import { join } from "path";

import postgres from "postgres";

async function deployAllSchemas() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
  });

  console.log("Connected to database\n");

  // Deploy schemas in dependency order
  const schemas = [
    { name: "Gamification", file: "gamification.sql" },
    { name: "Cohort", file: "cohort.sql" },
    { name: "Social", file: "social.sql" },
    { name: "Video Calls", file: "video-calls.sql" },
    { name: "Community Extended", file: "community-extended.sql" },
  ];

  for (const schema of schemas) {
    try {
      const schemaPath = join(process.cwd(), `supabse/schema/${schema.file}`);
      const schemaSql = readFileSync(schemaPath, "utf-8");

      console.log(`Deploying ${schema.name} schema...`);
      await sql.unsafe(schemaSql);
      console.log(`  ✓ ${schema.name} deployed successfully\n`);
    } catch (error: any) {
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate key")
      ) {
        console.log(`  ⚠ ${schema.name} - objects already exist, continuing...\n`);
      } else {
        console.error(`  ✗ ${schema.name} failed:`, error.message, "\n");
        // Continue with other schemas
      }
    }
  }

  // Verify tables
  console.log("--- Verification ---\n");

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'badges', 'user_badges', 'points_transactions',
        'cohorts', 'cohort_memberships',
        'activity_events', 'activity_reactions', 'direct_messages', 'encouragements',
        'video_rooms', 'video_room_participants',
        'community_posts', 'post_comments', 'post_reactions',
        'social_connections', 'social_shares',
        'referral_codes', 'referrals', 'referral_milestones',
        'profile_settings', 'weekly_highlights'
      )
      ORDER BY table_name
    `;

    console.log("Community tables found:");
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

    // Create referral codes for existing users
    console.log("\nSetting up referral codes for existing users...");
    try {
      const result = await sql`
        INSERT INTO referral_codes (user_id, code)
        SELECT u.id, generate_referral_code(u.id)
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM referral_codes rc WHERE rc.user_id = u.id
        )
        RETURNING user_id
      `;
      console.log(`  Created ${result.length} referral codes`);
    } catch (e: any) {
      console.log(`  ⚠ Referral codes: ${e.message}`);
    }

    // Create profile settings for existing users
    console.log("\nSetting up profile settings for existing users...");
    try {
      const profileResult = await sql`
        INSERT INTO profile_settings (user_id)
        SELECT u.id
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM profile_settings ps WHERE ps.user_id = u.id
        )
        RETURNING user_id
      `;
      console.log(`  Created ${profileResult.length} profile settings`);
    } catch (e: any) {
      console.log(`  ⚠ Profile settings: ${e.message}`);
    }
  } catch (error: any) {
    console.error("Verification error:", error.message);
  }

  await sql.end();
  console.log("\n✓ Schema deployment complete!");
}

deployAllSchemas();
