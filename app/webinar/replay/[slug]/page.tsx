"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";

// Dynamic import to avoid SSR issues with HLS.js
const VideoPlayer = dynamic(() => import("@modules/content/components/VideoPlayer"), {
  ssr: false,
});

interface ReplayData {
  title: string;
  streamUrl: string;
  expiresAt: string;
  posterUrl?: string;
}

export default function WebinarReplayPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Check for saved credentials
  useEffect(() => {
    const saved = localStorage.getItem("gynergy_replay_access");
    if (saved) {
      try {
        const { email: savedEmail } = JSON.parse(saved);
        if (savedEmail) {
          setEmail(savedEmail);
          setRegistered(true);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch replay data
  useEffect(() => {
    async function fetchReplay() {
      try {
        const response = await fetch(`/api/webinar/replay?slug=${slug}`);
        if (!response.ok) {
          if (response.status === 410) {
            setExpired(true);
          }
          setLoading(false);
          return;
        }
        const data = await response.json();
        setReplay(data);

        // Check if expired
        if (new Date(data.expiresAt) < new Date()) {
          setExpired(true);
        }
      } catch {
        // Replay not available
      }
      setLoading(false);
    }
    fetchReplay();
  }, [slug]);

  // Countdown timer
  useEffect(() => {
    if (!replay?.expiresAt || expired) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(replay.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [replay?.expiresAt, expired]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);

    // Save access locally
    localStorage.setItem("gynergy_replay_access", JSON.stringify({ email, name }));
    setRegistered(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <span className="mb-4 inline-block bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
            G Y N E R G Y
          </span>
          <h1 className="mb-6 text-3xl font-bold">Replay Has Expired</h1>
          <p className="mb-8 text-lg text-gray-300">
            The 48-hour replay window has closed. The next live training is the best way to
            experience the Five Pillars framework.
          </p>
          <div className="space-y-4">
            <Link
              href="/webinar"
              className="inline-block rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300"
            >
              Register for the Next Training
            </Link>
            <p className="text-sm text-gray-500">
              Or{" "}
              <Link href="/" className="text-teal-400 hover:underline">
                learn about the 45-Day Challenge
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="mb-4 text-3xl font-bold">Replay Not Available</h1>
          <p className="mb-8 text-gray-300">This webinar replay is not currently available.</p>
          <Link
            href="/webinar"
            className="inline-block rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 font-semibold text-black"
          >
            Register for the Next Training
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-sm font-semibold tracking-[0.3em] text-transparent">
            G Y N E R G Y
          </span>
          {timeLeft && (
            <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-red-400">Replay expires in {timeLeft}</span>
            </div>
          )}
        </div>

        {!registered ? (
          /* Registration Gate */
          <div className="mx-auto max-w-md py-20">
            <h1 className="mb-4 text-center text-3xl font-bold">Watch the Replay</h1>
            <p className="mb-8 text-center text-gray-300">
              Enter your email to access the recording of{" "}
              <span className="text-white">{replay.title}</span>.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300 disabled:opacity-50"
              >
                {submitting ? "Loading..." : "Watch the Replay"}
              </button>
            </form>
          </div>
        ) : (
          /* Video Player */
          <>
            <h1 className="mb-4 text-2xl font-bold">{replay.title}</h1>

            <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
              <VideoPlayer src={replay.streamUrl} poster={replay.posterUrl} />
            </div>

            {/* CTA Below Video */}
            <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 text-center">
              <h2 className="mb-2 text-2xl font-bold">Ready to Start the Challenge?</h2>
              <p className="mb-6 text-gray-300">
                The 45-Day Awakening Challenge includes everything discussed in the training — plus
                the journal, live calls, and brotherhood.
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-lg font-semibold text-black transition-all hover:from-teal-400 hover:to-teal-300"
              >
                Learn More About the Challenge — $997
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
