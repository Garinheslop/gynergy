// AI Context Manager
// Builds user context for AI conversations with token budgeting

import { createClient } from "@lib/supabase-server";
import { UserContextForAI, TOKEN_BUDGET, ChatMessage, RelationshipStage } from "@resources/types/ai";

// Type definitions for database records
interface JournalRecord {
  id: string;
  journal_type: string;
  created_at: string;
  mood_score: number | null;
  energy_level: number | null;
  content: Record<string, unknown> | null;
}

interface DGARecord {
  id: string;
  created_at: string;
  reflection: string | null;
  is_completed: boolean;
}

interface UserBadgeRecord {
  id: string;
  badge_id: string;
  unlocked_at: string;
  badges: { name: string }[] | { name: string } | null;
}

interface StreakRecord {
  streak_type: string;
  current_streak: number;
}

interface ConversationRecord {
  role: string;
  content: string;
  created_at: string;
}

// Estimate tokens (rough: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate text to fit within token budget
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Build user profile section
function buildUserProfileSection(context: UserContextForAI): string {
  const { user } = context;
  const lines = [
    `Name: ${user.name}`,
    `Day in Journey: ${user.dayInJourney} of 45`,
    `Relationship Stage: ${context.relationshipStage}`,
    "",
    "Current Streaks:",
    `  - Morning Journal: ${user.currentStreak.morning} days`,
    `  - Evening Journal: ${user.currentStreak.evening} days`,
    `  - Gratitude (DGA): ${user.currentStreak.gratitude} days`,
    `  - Combined Streak: ${user.currentStreak.combined} days`,
  ];

  return truncateToTokens(lines.join("\n"), TOKEN_BUDGET.userProfile);
}

// Build recent journals section
function buildJournalsSection(context: UserContextForAI): string {
  if (!context.recentJournals.length) {
    return "No recent journal entries.";
  }

  const lines: string[] = ["Recent Journal Entries:"];

  for (const journal of context.recentJournals.slice(0, 5)) {
    lines.push("");
    lines.push(`[${journal.type.toUpperCase()} - ${formatDate(journal.date)}]`);
    if (journal.moodScore !== undefined) {
      lines.push(`Mood: ${journal.moodScore}/10`);
    }
    if (journal.highlights.length) {
      lines.push("Highlights:");
      journal.highlights.forEach((h) => lines.push(`  - ${h}`));
    }
  }

  return truncateToTokens(lines.join("\n"), TOKEN_BUDGET.recentJournals);
}

// Build DGA section
function buildDGASection(context: UserContextForAI): string {
  if (!context.recentDGAs.length) {
    return "No recent Daily Gratitude Actions.";
  }

  const lines: string[] = ["Recent Daily Gratitude Actions:"];

  for (const dga of context.recentDGAs.slice(0, 5)) {
    lines.push("");
    lines.push(`[${formatDate(dga.date)}${dga.theme ? ` - Theme: ${dga.theme}` : ""}]`);
    lines.push(`"${dga.reflection}"`);
  }

  return truncateToTokens(lines.join("\n"), TOKEN_BUDGET.recentJournals / 2);
}

// Build badges section
function buildBadgesSection(context: UserContextForAI): string {
  const { badges, milestones } = context;

  const lines: string[] = [
    `Total Badges Earned: ${badges.total}`,
    "",
    "Recent Badges:",
  ];

  if (badges.recent.length) {
    badges.recent.forEach((badge) => {
      lines.push(`  - ${badge.name} (${formatDate(badge.unlockedAt)})`);
    });
  } else {
    lines.push("  - None yet");
  }

  lines.push("");
  lines.push("Milestones:");
  lines.push(`  - Reached: ${milestones.reached.length > 0 ? milestones.reached.join(", ") : "None yet"}`);
  lines.push(`  - Next milestone: Day ${milestones.next}`);

  return truncateToTokens(lines.join("\n"), TOKEN_BUDGET.badges);
}

// Build mood trend section
function buildMoodSection(context: UserContextForAI): string {
  const trendDescriptions = {
    improving: "Their mood has been trending upward recently - a positive sign!",
    stable: "Their mood has been consistent and stable.",
    declining: "Their mood has been trending downward - they may need extra support.",
  };

  return truncateToTokens(
    `Mood Trend: ${context.moodTrend}\n${trendDescriptions[context.moodTrend]}`,
    TOKEN_BUDGET.moodTrend
  );
}

// Build complete user context string
export function buildUserContextString(context: UserContextForAI): string {
  const sections = [
    "=== USER PROFILE ===",
    buildUserProfileSection(context),
    "",
    "=== RECENT JOURNALS ===",
    buildJournalsSection(context),
    "",
    "=== DAILY GRATITUDE ACTIONS ===",
    buildDGASection(context),
    "",
    "=== BADGES & MILESTONES ===",
    buildBadgesSection(context),
    "",
    "=== MOOD INSIGHTS ===",
    buildMoodSection(context),
  ];

  return sections.join("\n");
}

// Fetch user context from database
export async function fetchUserContext(userId: string): Promise<UserContextForAI | null> {
  const supabase = createClient();

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  // Fetch active session enrollment
  const { data: enrollment } = await supabase
    .from("session_enrollments")
    .select("id, session_id, enrolled_at, current_streak_count")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  const enrolledAt = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const dayInJourney = Math.floor((Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Fetch recent journals (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: journals } = await supabase
    .from("journals")
    .select("id, journal_type, created_at, mood_score, energy_level, content")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch recent DGAs (last 7 days)
  const { data: dgas } = await supabase
    .from("dgactions")
    .select("id, created_at, reflection, is_completed")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(7);

  // Fetch user badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("id, badge_id, unlocked_at, badges(name)")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false })
    .limit(10);

  // Fetch streak data
  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("streak_type, current_streak")
    .eq("user_id", userId);

  // Build streak object
  const streaks = {
    morning: 0,
    evening: 0,
    gratitude: 0,
    combined: enrollment?.current_streak_count || 0,
  };

  if (streakData) {
    for (const streak of streakData as StreakRecord[]) {
      if (streak.streak_type === "morning_journal") streaks.morning = streak.current_streak;
      if (streak.streak_type === "evening_journal") streaks.evening = streak.current_streak;
      if (streak.streak_type === "dga") streaks.gratitude = streak.current_streak;
    }
  }

  // Calculate mood trend from recent journals
  const typedJournals = (journals || []) as JournalRecord[];
  const moodScores = typedJournals
    .filter((j: JournalRecord) => j.mood_score !== null)
    .map((j: JournalRecord) => j.mood_score as number)
    .slice(0, 5);

  let moodTrend: "improving" | "stable" | "declining" = "stable";
  if (moodScores.length >= 3) {
    const recent = moodScores.slice(0, 2).reduce((a: number, b: number) => a + b, 0) / 2;
    const older = moodScores.slice(-2).reduce((a: number, b: number) => a + b, 0) / 2;
    if (recent > older + 0.5) moodTrend = "improving";
    else if (recent < older - 0.5) moodTrend = "declining";
  }

  // Determine relationship stage based on conversation count
  const { count: conversationCount } = await supabase
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  let relationshipStage: RelationshipStage = "introduction";
  if (conversationCount && conversationCount > 50) relationshipStage = "deep";
  else if (conversationCount && conversationCount > 20) relationshipStage = "established";
  else if (conversationCount && conversationCount > 5) relationshipStage = "building";

  // Process journals into highlights
  const recentJournals = typedJournals.map((j: JournalRecord) => {
    // Extract highlights from journal content
    const content = j.content;
    const highlights: string[] = [];

    if (content) {
      // Extract gratitude items
      if (Array.isArray(content.gratitudeItems)) {
        highlights.push(...content.gratitudeItems.slice(0, 3));
      }
      // Extract wins/accomplishments
      if (content.wins && typeof content.wins === "string") {
        highlights.push(content.wins);
      }
      // Extract intentions
      if (content.intentions && typeof content.intentions === "string") {
        highlights.push(content.intentions);
      }
    }

    return {
      type: j.journal_type as "morning" | "evening" | "weekly",
      date: j.created_at,
      moodScore: j.mood_score || undefined,
      highlights: highlights.slice(0, 3),
    };
  });

  // Process DGAs
  const typedDGAs = (dgas || []) as DGARecord[];
  const recentDGAs = typedDGAs.map((d: DGARecord) => ({
    date: d.created_at,
    reflection: d.reflection || "",
  }));

  // Process badges
  const typedBadges = (userBadges || []) as UserBadgeRecord[];
  const recentBadges = typedBadges.slice(0, 5).map((ub: UserBadgeRecord) => {
    // Handle both array and object forms of badges relation
    let badgeName = "Unknown Badge";
    if (ub.badges) {
      if (Array.isArray(ub.badges) && ub.badges.length > 0) {
        badgeName = ub.badges[0].name;
      } else if (!Array.isArray(ub.badges)) {
        badgeName = ub.badges.name;
      }
    }
    return {
      name: badgeName,
      unlockedAt: ub.unlocked_at,
    };
  });

  // Calculate next milestone
  const milestonesDays = [7, 14, 21, 30, 45];
  const reachedMilestones = milestonesDays.filter((m) => dayInJourney >= m);
  const nextMilestone = milestonesDays.find((m) => dayInJourney < m) || 45;

  return {
    user: {
      name: profile.full_name || profile.email?.split("@")[0] || "Friend",
      dayInJourney: Math.min(dayInJourney, 45),
      currentStreak: streaks,
    },
    recentJournals,
    recentDGAs,
    badges: {
      recent: recentBadges,
      total: typedBadges.length,
    },
    milestones: {
      reached: reachedMilestones,
      next: nextMilestone,
    },
    moodTrend,
    relationshipStage,
  };
}

// Fetch recent conversation history
export async function fetchConversationHistory(
  userId: string,
  characterId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from("ai_conversations")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !messages) {
    console.error("Error fetching conversation history:", error);
    return [];
  }

  // Reverse to get chronological order and format
  const typedMessages = messages as ConversationRecord[];
  return typedMessages.reverse().map((m: ConversationRecord) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    timestamp: m.created_at,
  }));
}

// Trim conversation history to fit token budget
export function trimConversationHistory(
  messages: ChatMessage[],
  maxTokens: number = TOKEN_BUDGET.recentMessages
): ChatMessage[] {
  let totalTokens = 0;
  const trimmedMessages: ChatMessage[] = [];

  // Process from most recent to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const messageTokens = estimateTokens(messages[i].content);
    if (totalTokens + messageTokens > maxTokens) {
      break;
    }
    totalTokens += messageTokens;
    trimmedMessages.unshift(messages[i]);
  }

  return trimmedMessages;
}

// Save a conversation message
export async function saveConversationMessage(
  userId: string,
  characterId: string,
  role: "user" | "assistant",
  content: string,
  sessionId?: string,
  tokensUsed?: number
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("ai_conversations").insert({
    user_id: userId,
    character_id: characterId,
    role,
    content,
    session_id: sessionId || null,
    tokens_used: tokensUsed || null,
  });

  if (error) {
    console.error("Error saving conversation:", error);
  }
}

// Get or create chat session
export async function getOrCreateChatSession(
  userId: string,
  characterId: string
): Promise<string | null> {
  const supabase = createClient();

  // Check for active session (started within last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: existingSession } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .eq("is_active", true)
    .gte("started_at", oneDayAgo.toISOString())
    .single();

  if (existingSession) {
    // Update message count
    await supabase.rpc("increment_chat_session_messages", {
      session_id: existingSession.id,
    });
    return existingSession.id;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from("ai_chat_sessions")
    .insert({
      user_id: userId,
      character_id: characterId,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating chat session:", error);
    return null;
  }

  return newSession?.id || null;
}

// End a chat session
export async function endChatSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("ai_chat_sessions")
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}
