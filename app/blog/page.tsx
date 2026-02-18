import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gynergy Blog — Insights for Men Who've Built Everything",
  description:
    "Articles on the Five Pillar Framework, integration vs. fragmentation, and why successful men feel empty despite having everything.",
  openGraph: {
    title: "Gynergy Blog",
    description: "Insights for men who've built everything and feel nothing.",
    type: "website",
  },
};

// Blog post data — will move to CMS/database later
const BLOG_POSTS = [
  {
    slug: "five-pillar-framework",
    title: "What Is the Five Pillar Framework?",
    excerpt:
      "What if the five areas of your life don't add up — they multiply? The framework that's helped 500+ men reclaim what actually matters.",
    category: "Framework",
    readTime: "7 min",
    publishedAt: "2026-03-01",
  },
  {
    slug: "why-successful-men-feel-empty",
    title: "Why Successful Men Feel Empty",
    excerpt:
      "You built everything. You feel nothing. The Emptiness Equation explains why high achievers feel hollow despite external success.",
    category: "Insight",
    readTime: "6 min",
    publishedAt: "2026-03-01",
  },
  {
    slug: "integration-multiplier",
    title: "The Integration Multiplier Explained",
    excerpt:
      "9 x 8 x 3 x 7 x 2. This equation explains your entire life. Why improving one area while ignoring others leads to collapse.",
    category: "Framework",
    readTime: "8 min",
    publishedAt: "2026-03-01",
  },
  {
    slug: "morning-practice-guide",
    title: "The 10-Minute Morning Practice That Changed My Life",
    excerpt:
      "497 consecutive days. Same 10-minute practice every morning. Here's exactly what I do and why it works.",
    category: "Practice",
    readTime: "5 min",
    publishedAt: "2026-03-01",
  },
  {
    slug: "work-life-integration",
    title: "Work-Life Balance Is a Lie. Here's What Actually Works.",
    excerpt:
      "Balance implies equal weight. Integration implies multiplication. The difference changes everything for men who can't slow down.",
    category: "Insight",
    readTime: "6 min",
    publishedAt: "2026-03-01",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-center">
          <Link href="/">
            <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
              G Y N E R G Y
            </span>
          </Link>
        </div>
        <h1 className="mb-4 text-center text-4xl font-bold md:text-5xl">The Blog</h1>
        <p className="mx-auto max-w-2xl text-center text-xl text-gray-300">
          Insights for men who&apos;ve built everything and are ready to feel it.
        </p>
      </section>

      {/* Posts Grid */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 transition-all hover:border-teal-500/30"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-teal-500/10 px-3 py-0.5 text-xs font-medium text-teal-400">
                  {post.category}
                </span>
                <span className="text-xs text-gray-500">{post.readTime}</span>
              </div>
              <h2 className="mb-2 text-xl font-bold transition-colors group-hover:text-teal-400">
                {post.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-400">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
          <h2 className="mb-2 text-2xl font-bold">Know Your Number</h2>
          <p className="mb-6 text-gray-300">
            Take the free Five Pillar Assessment and find out exactly where you stand across the 5
            areas that matter most.
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
