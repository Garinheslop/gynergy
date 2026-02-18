import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

// Blog content — will move to CMS/database later
const BLOG_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    category: string;
    readTime: string;
    content: string;
  }
> = {
  "five-pillar-framework": {
    title: "What Is the Five Pillar Framework?",
    description:
      "What if the five areas of your life don't add up — they multiply? The framework that's helped 500+ men reclaim what actually matters.",
    category: "Framework",
    readTime: "7 min",
    content: `What if the five areas of your life don't add up — they multiply?

That's the core insight behind the Five Pillar Framework: Wealth, Health, Relationships, Growth, and Purpose. Most men optimize for one or two pillars while ignoring the rest. They build a $10M business (Wealth: 9) but can't look their wife in the eye (Relationships: 3).

The math is brutal: 9 × 7 × 3 × 8 × 2 = a fractured life.

## The Five Pillars

**Wealth** — Not just income. Financial clarity, security, and the freedom that comes from knowing your money serves your life, not the other way around.

**Health** — Physical vitality, energy, sleep, nutrition. The foundation everything else stands on. When this drops, everything drops with it.

**Relationships** — The quality of your connections. With your partner. Your children. Your friends. Not the quantity — the depth.

**Growth** — Personal development, learning, intellectual stimulation. The sense that you're evolving, not just maintaining.

**Purpose** — The reason you get up that has nothing to do with money. Contribution. Legacy. The thing that makes the wins mean something.

## Why Multiplication Matters

Most self-improvement frameworks treat these areas as additive. Get better at health, add some points. Work on relationships, add more.

The Five Pillar Framework recognizes that these areas **multiply**. A 9 in Wealth means nothing if you're a 2 in Purpose. The 2 collapses everything.

This is why men who've "built everything" feel empty. Their total life score is dominated by their lowest pillar, not their highest.

## What to Do About It

The first step is radical honesty: take the Five Pillar Assessment and get your actual score. Most men are shocked by their number.

The second step is identifying your lowest pillar — the one that's dragging everything down. That's where the work starts.

The third step is daily practice. Not a weekend retreat. Not a one-time workshop. A 10-minute morning practice, done consistently, that touches all five pillars simultaneously.

That's what the 45-Day Awakening Challenge provides: a structured daily practice, accountability through brotherhood, and a framework that doesn't let you hide behind your strongest pillar while your weakest one bleeds.`,
  },
  "why-successful-men-feel-empty": {
    title: "Why Successful Men Feel Empty",
    description:
      "You built everything. You feel nothing. The Emptiness Equation explains why high achievers feel hollow despite external success.",
    category: "Insight",
    readTime: "6 min",
    content: `You built everything. You feel nothing.

This is the conversation nobody has. The one that happens at 2 AM when the house is quiet and the wins from the day feel like they happened to someone else.

## The Golden Cage

Here's what happens: you spend 15-20 years building. Companies. Teams. Portfolios. Reputations. You get good at it. Really good. The scoreboard says you're winning.

But somewhere around year 12, the wins stop landing. The dopamine hit from closing a deal lasts about 30 minutes. The satisfaction of a good quarter evaporates by Monday. You can't explain it to anyone because from the outside, your life is enviable.

This is The Golden Cage. Everything looks perfect from the outside. Inside, you're performing success instead of living it.

## The Emptiness Equation

We've developed a simple formula that explains this phenomenon:

**What you've built − What you feel ÷ How long you've ignored the gap = The Hollow Feeling**

The longer the gap persists, the deeper the hollowness. And here's the trap: most men respond by building MORE. Another company. Another deal. Another achievement. But you can't solve an integration problem with a wealth solution.

## What Actually Works

The men who've broken out of The Golden Cage share three things in common:

1. **They got honest about their number.** They took a hard look at all five areas of their life — not just the ones on the scoreboard — and confronted what they saw.

2. **They started a daily practice.** Not meditation apps. Not weekend retreats. A structured, daily practice that forces them to show up for themselves for 10 minutes before the world gets loud.

3. **They found other men who get it.** Not support groups. Not therapy (though that has its place). A brotherhood of men who've built at the same level and are dealing with the same hollow feeling.

The feeling doesn't go away because you ignore it. It goes away because you integrate what you've built with what you actually feel. That's the work.`,
  },
  "integration-multiplier": {
    title: "The Integration Multiplier Explained",
    description:
      "9 x 8 x 3 x 7 x 2. This equation explains your entire life. Why improving one area while ignoring others leads to collapse.",
    category: "Framework",
    readTime: "8 min",
    content: `9 × 8 × 3 × 7 × 2.

Write those numbers down. Rate yourself 1-10 in each of the Five Pillars: Wealth, Health, Relationships, Growth, Purpose. Then multiply them together.

That number? That's your Integration Score. And for most successful men, it's devastatingly low.

## Addition vs. Multiplication

Traditional self-improvement treats life areas as additive. You're an 8 in wealth and a 3 in relationships? That's 11/20 — not great, but not terrible.

The Integration Multiplier reveals the truth: 8 × 3 = 24 out of a possible 100. Your 3 in relationships doesn't just bring the average down — it **collapses the total**.

This is why you can be winning on every visible metric and still feel like something is fundamentally broken. Because it is.

## A Real Example

Consider a man who:
- Closes a $2M deal (Wealth: 9)
- Works out 5x/week (Health: 7)
- Hasn't had a real conversation with his wife in weeks (Relationships: 3)
- Reads 2 books/month (Growth: 8)
- Can't remember why any of it matters (Purpose: 2)

His Integration Score: 9 × 7 × 3 × 8 × 2 = 3,024 out of 100,000 possible. That's 3%.

He's winning at 3% of his potential. Not because he's lazy or broken — because he optimized for two pillars and let three bleed.

## The Multiplier Effect Works Both Ways

Here's the good news: if a low score in one pillar collapses everything, then even a modest improvement creates exponential gains.

Take that same man. If he moves his Relationships from 3 to 6 and his Purpose from 2 to 5: 9 × 7 × 6 × 8 × 5 = 15,120. That's a **5x improvement** in total life integration — from two moderate changes.

This is why the 45-Day Awakening Challenge focuses on all five pillars simultaneously. You don't need to become a 10 in everything. You need to eliminate the 2s and 3s. The multiplication handles the rest.`,
  },
  "morning-practice-guide": {
    title: "The 10-Minute Morning Practice That Changed My Life",
    description:
      "497 consecutive days. Same 10-minute practice every morning. Here's exactly what I do and why it works.",
    category: "Practice",
    readTime: "5 min",
    content: `497 days. Same practice. Every single morning.

Before the emails. Before the calls. Before the world gets loud. 10 minutes that have done more for my life than 15 years of relentless building.

Here's exactly what the practice looks like:

## The Morning Journal (5-7 minutes)

**Mood Score** — Rate how you feel right now, 1-10. No analysis. First number that comes to mind.

**Captured Essence** — One sentence about the energy you want to carry today. Not a goal. An essence. "Steady" or "Present" or "Curious."

**Mantra** — A phrase that grounds you. Mine changes monthly. Right now it's: "Integration multiplies."

**3 Affirmations** — What you're becoming. Present tense. "I am present with my family." Not "I will be."

**3 Gratitudes** — Specific. Not "my family." Instead: "The way my daughter laughed at breakfast yesterday."

**3 Excitements** — What you're looking forward to today. Forces your brain to find something.

## Why It Works

This isn't journaling for the sake of journaling. Each element is designed to do something specific:

- **Mood scoring** creates self-awareness (most men can't identify how they feel)
- **Affirmations** rewire identity (you become what you repeatedly declare)
- **Gratitudes** shift attention from what's missing to what's present
- **Excitements** create forward momentum before the day's demands take over

## The Compound Effect

Day 1 feels awkward. Day 7 feels like a habit. Day 21 feels natural. Day 45 feels necessary.

By Day 90, you have 90 data points on your emotional state. You can see patterns. You notice what triggers low days. You recognize what precedes breakthroughs.

By Day 497, you've built an entirely different relationship with yourself. Not because one morning was transformative — because 497 mornings, stacked, created something that can't be achieved any other way.

## Start Tomorrow

Set your alarm 10 minutes earlier. Open a journal — digital or physical. Write. Don't edit. Don't judge. Just show up.

The only mistake is overthinking it. Short is fine. Honest is better. Consistent is everything.`,
  },
  "work-life-integration": {
    title: "Work-Life Balance Is a Lie. Here's What Actually Works.",
    description:
      "Balance implies equal weight. Integration implies multiplication. The difference changes everything for men who can't slow down.",
    category: "Insight",
    readTime: "6 min",
    content: `Every productivity guru tells you to find "work-life balance." Scale back. Set boundaries. Leave the office at 5.

Here's the problem: you didn't build a $5M-$40M business by being balanced. You built it by being obsessed. Relentless. All-in.

Telling a high-achiever to "balance" is like telling a sprinter to jog. It's not in the wiring.

## The Problem With Balance

Balance implies equal weight. 50% work, 50% life. As if life is what happens when you stop working.

For men who've built at scale, this framework doesn't just fail — it creates shame. You feel guilty for working too much AND guilty for not working enough. You're failing at balance from both directions.

## Integration Is Different

Integration doesn't ask you to do less. It asks you to be **whole** while you do what you do.

Here's what that looks like in practice:

**Integrated Wealth:** Your financial pursuits serve your life purpose, not the other way around.

**Integrated Health:** You train your body not for vanity, but because high performance requires a functioning vessel.

**Integrated Relationships:** You're present at dinner. Not checking your phone. Not mentally replaying the deal. Actually there.

**Integrated Growth:** You learn for the sake of evolution, not just competitive advantage.

**Integrated Purpose:** You know WHY you build, beyond the number.

## The Multiplication Principle

When these areas multiply instead of compete, something remarkable happens: the energy from one pillar fuels the others.

A strong morning practice (Growth) gives you clarity in meetings (Wealth). Present evenings with family (Relationships) give you purpose-driven energy the next day (Purpose). Physical vitality (Health) sustains all of it.

This is the Integration Multiplier in action. Not balance. Multiplication.

## How to Start

Stop trying to balance. Start integrating. The first step is knowing where you stand: take the Five Pillar Assessment and see your actual Integration Score.

Then commit to 10 minutes a day. That's it. Not less work. Not more meditation. Ten minutes of structured practice that touches all five pillars simultaneously.

The men who do this don't become "balanced." They become integrated. And integrated men don't choose between building empires and feeling alive. They do both.`,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_CONTENT[slug];
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} — Gynergy Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_CONTENT[slug];

  if (!post) {
    notFound();
  }

  // Convert markdown-style content to HTML paragraphs
  const paragraphs = post.content.split("\n\n");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center text-sm text-gray-400 hover:text-teal-400"
        >
          &larr; Back to Blog
        </Link>

        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-full bg-teal-500/10 px-3 py-0.5 text-xs font-medium text-teal-400">
            {post.category}
          </span>
          <span className="text-xs text-gray-500">{post.readTime} read</span>
        </div>

        <h1 className="mb-8 text-4xl leading-tight font-bold md:text-5xl">{post.title}</h1>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-6 pb-16">
        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => {
            // Handle headings
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={index} className="mt-8 text-2xl font-bold text-white">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }

            // Handle bold lines
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <p key={index} className="font-semibold text-white">
                  {paragraph.replace(/\*\*/g, "")}
                </p>
              );
            }

            // Handle list items (lines starting with -)
            if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
              const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
              return (
                <ul key={index} className="space-y-2 pl-4">
                  {items.map((item, i) => (
                    <li key={i} className="text-lg leading-relaxed text-gray-300">
                      {item.replace("- ", "")}
                    </li>
                  ))}
                </ul>
              );
            }

            // Handle numbered items
            if (/^\d\./.test(paragraph)) {
              return (
                <p key={index} className="text-lg leading-relaxed text-gray-300">
                  {paragraph}
                </p>
              );
            }

            // Regular paragraphs — handle inline bold
            const parts = paragraph.split(/(\*\*.*?\*\*)/g);
            return (
              <p key={index} className="text-lg leading-relaxed text-gray-300">
                {parts.map((part, i) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i} className="text-white">
                      {part.replace(/\*\*/g, "")}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>
      </article>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">Know Your Number</h2>
          <p className="mb-6 text-gray-300">
            Take the free Five Pillar Assessment and find out exactly where you stand.
          </p>
          <Link
            href="/assessment"
            className="inline-block rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300"
          >
            Take the Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
