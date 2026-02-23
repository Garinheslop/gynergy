// AI-Generated DGA (Daily Gratitude Action) for Post-Day-45 Subscribers
// Aria generates personalized actions based on recent journal patterns.
// Falls back to cycling static actions if AI generation fails.

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { createServiceClient } from "@lib/supabase-server";

import { complete, isAIConfigured } from "./providers";

dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================================================
// Types
// ============================================================================

interface GeneratedAction {
  id: string;
  bookId: string;
  period: number;
  title: string;
  tip: string | null;
  isSelf: boolean;
  isDraw: boolean;
  isList: boolean;
  actionType: "daily";
  source: "ai" | "fallback";
}

interface GenerateDGAOptions {
  userId: string;
  bookId: string;
  currentDay: number;
  userTimezone: string;
}

interface JournalContextEntry {
  journal_type: string;
  mood_score: number | null;
  captured_essence: string | null;
  mood_contribution: string | null;
  insight: string | null;
  success: string | null;
  changes: string | null;
  wins: string | null;
  challenges: string | null;
  lessons: string | null;
  entry_date: string;
}

interface JournalEntryRecord {
  content: string[];
  entry_type: string;
}

interface ActionLogContextEntry {
  reflection: string | null;
  note: string | null;
  obstacles: string | null;
  entry_date: string;
  is_completed: boolean;
}

interface AIGeneratedDGA {
  title: string;
  tip: string;
  is_self: boolean;
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function getOrGenerateDGA(options: GenerateDGAOptions): Promise<GeneratedAction> {
  const { userId, bookId, currentDay, userTimezone } = options;
  const supabase = createServiceClient();
  const today = dayjs().tz(userTimezone).format("YYYY-MM-DD");

  // 1. Check cache first
  const { data: cached } = await supabase
    .from("generated_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("generation_date", today)
    .eq("action_type", "daily")
    .single();

  if (cached) {
    return {
      id: cached.id,
      bookId: cached.book_id,
      period: cached.period,
      title: cached.title,
      tip: cached.tip,
      isSelf: cached.is_self,
      isDraw: cached.is_draw,
      isList: cached.is_list,
      actionType: "daily",
      source: cached.source,
    };
  }

  // 2. Try AI generation
  if (isAIConfigured()) {
    try {
      const generated = await generateWithAI(userId, bookId, currentDay, userTimezone);
      if (generated) {
        const { data: saved } = await supabase
          .from("generated_actions")
          .insert({
            user_id: userId,
            book_id: bookId,
            period: currentDay,
            title: generated.title,
            tip: generated.tip,
            is_self: generated.is_self,
            is_draw: false,
            is_list: false,
            action_type: "daily",
            source: "ai",
            generation_date: today,
          })
          .select()
          .single();

        if (saved) {
          return {
            id: saved.id,
            bookId: saved.book_id,
            period: saved.period,
            title: saved.title,
            tip: saved.tip,
            isSelf: saved.is_self,
            isDraw: false,
            isList: false,
            actionType: "daily",
            source: "ai",
          };
        }
      }
    } catch {
      // AI failed — fall through to fallback
    }
  }

  // 3. Fallback: cycle static actions
  return await getFallbackAction(userId, bookId, currentDay, today);
}

// ============================================================================
// AI Generation
// ============================================================================

async function generateWithAI(
  userId: string,
  bookId: string,
  currentDay: number,
  userTimezone: string
): Promise<AIGeneratedDGA | null> {
  const context = await buildJournalContext(userId, bookId, userTimezone);

  const systemPrompt = `You are Aria, the AI wellness coach at Gynergy. Your task is to generate ONE personalized Daily Gratitude Action (DGA) for a user who has completed their 45-day challenge and is continuing their gratitude practice as a subscriber.

WHAT A DGA IS:
A DGA is a specific, actionable task the user should complete today to practice gratitude. Examples:
- "Call or message someone who has made a positive impact"
- "Write a detailed thank-you note to yourself"
- "Do a random act of kindness for a stranger"
- "Create one boundary you can gently reinforce or establish"

RULES:
1. The action MUST be completable in one day
2. The title should be imperative and specific (under 80 characters)
3. The tip should explain HOW to do the action and WHY (under 250 characters)
4. Alternate between self-focused (is_self=true) and other-focused (is_self=false) actions
5. Target growth areas revealed by their journal patterns
6. Stay aligned with gratitude, personal growth, and connection themes
7. Never repeat an action they recently completed
8. Do NOT include emojis or special characters in the title or tip

RESPOND WITH ONLY VALID JSON — no markdown, no explanation:
{"title": "...", "tip": "...", "is_self": true/false}`;

  const userPrompt = `This user is on Day ${currentDay} of their ongoing journey (completed the 45-day challenge).

${context}

Generate a personalized DGA for today.`;

  const result = await complete(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
      maxTokens: 200,
    },
    "anthropic"
  );

  return parseAIResponse(result.content);
}

function parseAIResponse(content: string): AIGeneratedDGA | null {
  try {
    // Strip markdown code fences if present
    const cleaned = content
      .replace(/```json?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.title || typeof parsed.title !== "string") return null;

    return {
      title: parsed.title.slice(0, 100),
      tip: typeof parsed.tip === "string" ? parsed.tip.slice(0, 300) : "",
      is_self: parsed.is_self === true,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Journal Context Builder
// ============================================================================

async function buildJournalContext(
  userId: string,
  bookId: string,
  userTimezone: string
): Promise<string> {
  const supabase = createServiceClient();
  const sevenDaysAgo = dayjs().tz(userTimezone).subtract(7, "day").startOf("day").toISOString();

  // Fetch recent journals
  const { data: journals } = await supabase
    .from("journals")
    .select(
      "journal_type, mood_score, captured_essence, mood_contribution, insight, success, changes, wins, challenges, lessons, entry_date"
    )
    .eq("user_id", userId)
    .gte("entry_date", sevenDaysAgo)
    .order("entry_date", { ascending: false })
    .limit(14);

  // Fetch recent journal entries (gratitudes, affirmations)
  const { data: journalEntries } = await supabase
    .from("journal_entries")
    .select("content, entry_type, journal_id")
    .in(
      "journal_id",
      (journals || []).map((j: JournalContextEntry & { id?: string }) => j.id).filter(Boolean)
    )
    .limit(20);

  // Fetch recent action log reflections
  const { data: actionLogs } = await supabase
    .from("action_logs")
    .select("reflection, note, obstacles, entry_date, is_completed")
    .eq("user_id", userId)
    .eq("action_type", "gratitude")
    .gte("entry_date", sevenDaysAgo)
    .order("entry_date", { ascending: false })
    .limit(7);

  // Fetch recently completed action titles (to avoid repeats)
  const { data: recentActions } = await supabase
    .from("generated_actions")
    .select("title")
    .eq("user_id", userId)
    .order("generation_date", { ascending: false })
    .limit(7);

  // Also fetch static action titles they did recently (from action_logs join)
  const { data: recentStaticLogs } = await supabase
    .from("action_logs")
    .select("action_id")
    .eq("user_id", userId)
    .eq("action_type", "gratitude")
    .order("entry_date", { ascending: false })
    .limit(7);

  let recentStaticTitles: string[] = [];
  if (recentStaticLogs?.length) {
    const actionIds = recentStaticLogs
      .map((l: { action_id: string }) => l.action_id)
      .filter(Boolean);
    if (actionIds.length) {
      const { data: staticActions } = await supabase
        .from("actions")
        .select("title")
        .in("id", actionIds);
      recentStaticTitles = (staticActions || []).map((a: { title: string }) => a.title);
    }
  }

  // Build context string
  const sections: string[] = [];

  // Mood trend
  const typedJournals = (journals || []) as JournalContextEntry[];
  const moodScores = typedJournals
    .filter((j) => j.mood_score !== null)
    .map((j) => ({ score: j.mood_score!, date: j.entry_date }));

  if (moodScores.length) {
    const avg = moodScores.reduce((sum, m) => sum + m.score, 0) / moodScores.length;
    sections.push(`MOOD TREND (last 7 days): Average ${avg.toFixed(1)}/10`);
    sections.push(
      moodScores.map((m) => `  ${dayjs(m.date).format("MMM D")}: ${m.score}/10`).join("\n")
    );
  }

  // Journal highlights
  const morningJournals = typedJournals.filter((j) => j.journal_type === "morning");
  const eveningJournals = typedJournals.filter((j) => j.journal_type === "evening");

  if (morningJournals.length) {
    sections.push("\nMORNING JOURNAL THEMES:");
    for (const j of morningJournals.slice(0, 3)) {
      const parts: string[] = [];
      if (j.captured_essence) parts.push(`Essence: ${j.captured_essence}`);
      if (j.mood_contribution) parts.push(`Mood driver: ${j.mood_contribution}`);
      if (parts.length)
        sections.push(`  ${dayjs(j.entry_date).format("MMM D")}: ${parts.join(", ")}`);
    }
  }

  if (eveningJournals.length) {
    sections.push("\nEVENING REFLECTIONS:");
    for (const j of eveningJournals.slice(0, 3)) {
      const parts: string[] = [];
      if (j.insight) parts.push(`Insight: ${j.insight}`);
      if (j.success) parts.push(`Win: ${j.success}`);
      if (j.changes) parts.push(`Growth area: ${j.changes}`);
      if (parts.length)
        sections.push(`  ${dayjs(j.entry_date).format("MMM D")}: ${parts.join(", ")}`);
    }
  }

  // Gratitude entries
  const typedEntries = (journalEntries || []) as JournalEntryRecord[];
  const gratitudes = typedEntries.filter((e) => e.entry_type === "gratitude");
  if (gratitudes.length) {
    sections.push("\nRECENT GRATITUDES:");
    const allGratitudes = gratitudes.flatMap((g) => g.content).slice(0, 5);
    for (const g of allGratitudes) {
      sections.push(`  - ${g}`);
    }
  }

  // DGA reflections
  const typedLogs = (actionLogs || []) as ActionLogContextEntry[];
  if (typedLogs.length) {
    sections.push("\nRECENT DGA REFLECTIONS:");
    for (const log of typedLogs.slice(0, 3)) {
      const parts: string[] = [];
      if (log.reflection) parts.push(log.reflection);
      if (log.note) parts.push(log.note);
      if (parts.length) {
        sections.push(`  ${dayjs(log.entry_date).format("MMM D")}: ${parts.join(" | ")}`);
      }
    }
  }

  // Recent actions to avoid
  const allRecentTitles = [
    ...(recentActions || []).map((a: { title: string }) => a.title),
    ...recentStaticTitles,
  ];
  if (allRecentTitles.length) {
    sections.push("\nRECENTLY COMPLETED ACTIONS (avoid repeating):");
    for (const title of allRecentTitles) {
      sections.push(`  - ${title}`);
    }
  }

  return sections.join("\n") || "No recent journal data available.";
}

// ============================================================================
// Fallback: Cycle Static Actions
// ============================================================================

async function getFallbackAction(
  userId: string,
  bookId: string,
  currentDay: number,
  today: string
): Promise<GeneratedAction> {
  const supabase = createServiceClient();
  const cycledPeriod = ((currentDay - 1) % 45) + 1;

  const { data: staticAction } = await supabase
    .from("actions")
    .select("*")
    .eq("book_id", bookId)
    .eq("period", cycledPeriod)
    .eq("action_type", "daily")
    .single();

  if (staticAction) {
    // Cache the fallback so we don't re-query
    const { data: saved } = await supabase
      .from("generated_actions")
      .insert({
        user_id: userId,
        book_id: bookId,
        period: currentDay,
        title: staticAction.title,
        tip: staticAction.tip,
        is_self: staticAction.is_self,
        is_draw: staticAction.is_draw,
        is_list: staticAction.is_list,
        action_type: "daily",
        source: "fallback",
        generation_date: today,
      })
      .select()
      .single();

    if (saved) {
      return {
        id: saved.id,
        bookId: saved.book_id,
        period: saved.period,
        title: saved.title,
        tip: saved.tip,
        isSelf: saved.is_self,
        isDraw: saved.is_draw,
        isList: saved.is_list,
        actionType: "daily",
        source: "fallback",
      };
    }
  }

  // Ultimate fallback — hardcoded action if DB query fails
  return {
    id: "fallback-" + today,
    bookId,
    period: currentDay,
    title: "Reach out to someone you appreciate and tell them why",
    tip: "Think of someone who has positively impacted your life recently. Send them a genuine message of appreciation.",
    isSelf: false,
    isDraw: false,
    isList: false,
    actionType: "daily",
    source: "fallback",
  };
}
