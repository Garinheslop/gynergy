import { readFileSync } from "fs";
import { join } from "path";

import postgres from "postgres";

async function deployCommunitySchema() {
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

  const schemas = [
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
      if (error.message?.includes("already exists")) {
        console.log(`  ⚠ ${schema.name} - some objects already exist, continuing...\n`);
      } else if (error.message?.includes("does not exist")) {
        console.log(`  ⚠ ${schema.name} - dependency not found, may need manual resolution\n`);
        console.log(`    Error: ${error.message}\n`);
      } else {
        console.error(`  ✗ ${schema.name} failed:`, error.message, "\n");
      }
    }
  }

  // Verify tables
  console.log("--- Verification ---\n");

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'cohorts', 'cohort_memberships',
      'activity_events', 'activity_reactions', 'direct_messages', 'encouragements',
      'video_rooms', 'video_room_participants', 'video_call_notes',
      'community_posts', 'post_comments', 'post_reactions',
      'social_connections', 'social_shares',
      'referral_codes', 'referrals', 'referral_milestones',
      'profile_settings', 'weekly_highlights'
    )
    ORDER BY table_name
  `;

  console.log("Community tables created:");
  tables.forEach((t) => console.log(`  - ${t.table_name}`));

  // Create referral codes for existing users who don't have one
  console.log("\nCreating referral codes for existing users...");
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

  // Create profile settings for existing users
  console.log("\nCreating profile settings for existing users...");
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

  await sql.end();
  console.log("\n✓ Community schema deployment complete!");
}

deployCommunitySchema();
