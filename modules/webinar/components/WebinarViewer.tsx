"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import Hls from "hls.js";

import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";

// ============================================
// ICONS (SVG for professional appearance)
// ============================================

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const QuestionIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LiveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="4" />
    <path
      d="M4.93 4.93a10 10 0 0 0 0 14.14M19.07 4.93a10 10 0 0 1 0 14.14M7.76 7.76a6 6 0 0 0 0 8.48M16.24 7.76a6 6 0 0 1 0 8.48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

// ============================================
// TYPES
// ============================================

interface WebinarViewerProps {
  webinarId: string;
  webinarTitle: string;
  hlsStreamUrl: string | null;
  isLive: boolean;
  scheduledStart: Date;
  chatEnabled: boolean;
  qaEnabled: boolean;
  userEmail: string;
  userName?: string;
  attendanceId: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sent_by_name: string;
  sent_by_email: string;
  sent_at: string;
  is_host_message: boolean;
  is_pinned: boolean;
}

interface Question {
  id: string;
  question: string;
  asked_by_name: string;
  status: string;
  upvotes: number;
  answer_text?: string;
}

// ============================================
// COMPONENT
// ============================================

export default function WebinarViewer({
  webinarId,
  webinarTitle,
  hlsStreamUrl,
  isLive: initialIsLive,
  scheduledStart,
  chatEnabled,
  qaEnabled,
  userEmail,
  userName,
}: WebinarViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isLive, setIsLive] = useState(initialIsLive);
  const [streamUrl, setStreamUrl] = useState(hlsStreamUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isHostLate, setIsHostLate] = useState(false);
  const hlsRetryCount = useRef(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Q&A state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"chat" | "qa">("chat");

  // Initialize HLS player
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS error:", data);

          if (hlsRetryCount.current >= 10) {
            setError("Stream connection lost. Please refresh the page.");
            return;
          }

          const delay = Math.min(1000 * Math.pow(2, hlsRetryCount.current), 10000);
          hlsRetryCount.current += 1;
          setError(`Stream interrupted. Reconnecting in ${Math.round(delay / 1000)}s...`);

          retryTimeout = setTimeout(() => {
            retryTimeout = null;
            if (disposed) return;
            setError(null);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hlsRef.current?.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hlsRef.current?.recoverMediaError();
            } else {
              // Can't reuse a destroyed instance — create a new one
              hlsRef.current?.destroy();
              const newHls = new Hls({ enableWorker: true, lowLatencyMode: true });
              newHls.loadSource(streamUrl);
              newHls.attachMedia(video);
              hlsRef.current = newHls;
            }
          }, delay);
        }
      });

      hlsRef.current = hls;

      return () => {
        disposed = true;
        if (retryTimeout) clearTimeout(retryTimeout);
        hlsRef.current?.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      const onLoaded = () => {
        video.play().catch(() => {
          setIsPlaying(false);
        });
      };
      const onError = () => {
        setError("Stream playback error. Please refresh the page.");
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        video.src = "";
      };
    }
  }, [streamUrl]);

  // Supabase Realtime: instant GO LIVE detection + fallback polling
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/webinar/live?id=${webinarId}&action=status`);
        const data = await response.json();

        if (data.isLive && data.hlsStreamUrl) {
          setIsLive(true);
          setStreamUrl(data.hlsStreamUrl);
        }
        setViewerCount(data.viewerCount || 0);
      } catch {
        // Ignore polling errors
      }
    };

    checkStatus();
    // Fallback poll every 10s (Realtime handles instant detection)
    const interval = setInterval(checkStatus, 10000);

    // Realtime subscription for instant go-live
    const supabase = createClient();
    const channel = supabase
      .channel(`webinar-status-${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "webinars",
          filter: `id=eq.${webinarId}`,
        },
        (payload) => {
          const updated = payload.new as { status?: string; hls_stream_url?: string };
          if (updated.status === "live") {
            setIsLive(true);
            if (updated.hls_stream_url) {
              setStreamUrl(updated.hls_stream_url);
            }
            checkStatus();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [webinarId]);

  // Countdown timer
  useEffect(() => {
    if (isLive) return;

    // eslint-disable-next-line prefer-const
    let intervalId: ReturnType<typeof setInterval>;

    const updateCountdown = () => {
      const now = Date.now();
      const target = new Date(scheduledStart).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown(null);
        // If >5 minutes past scheduled start and still not live, host is late
        if (Math.abs(diff) > 5 * 60 * 1000) {
          setIsHostLate(true);
        }
        // Stop ticking — countdown is done
        clearInterval(intervalId);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [isLive, scheduledStart]);

  // Chat: initial fetch + Realtime subscription
  useEffect(() => {
    if (!chatEnabled) return;

    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/webinar/chat?webinarId=${webinarId}&limit=50`);
        const data = await response.json();
        setChatMessages(data.messages || []);
      } catch {
        // Ignore
      }
    };

    fetchChat();

    // Subscribe to Realtime for instant updates
    const supabase = createClient();
    const channel = supabase
      .channel(`webinar-chat-${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webinar_chat",
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    // Slow fallback poll every 30s as safety net
    const fallbackInterval = setInterval(fetchChat, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [chatEnabled, webinarId]);

  // Auto-scroll chat (only if user is near the bottom)
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages]);

  // Q&A: initial fetch + Realtime subscription
  useEffect(() => {
    if (!qaEnabled) return;

    const fetchQA = async () => {
      try {
        const response = await fetch(`/api/webinar/qa?webinarId=${webinarId}`);
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch {
        // Ignore
      }
    };

    fetchQA();

    // Subscribe to Realtime for instant updates
    const supabase = createClient();
    const channel = supabase
      .channel(`webinar-qa-${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "webinar_qa",
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setQuestions((prev) => prev.filter((q) => q.id !== deletedId));
            }
            return;
          }
          const updated = payload.new as Question;
          setQuestions((prev) => {
            const idx = prev.findIndex((q) => q.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [updated, ...prev];
          });
        }
      )
      .subscribe();

    // Slow fallback poll every 30s as safety net
    const fallbackInterval = setInterval(fetchQA, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [qaEnabled, webinarId]);

  // Send chat message
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || isSendingChat) return;

    setIsSendingChat(true);
    try {
      await fetch("/api/webinar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          webinarId,
          message: chatInput.trim(),
          email: userEmail,
          name: userName,
        }),
      });
      setChatInput("");
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSendingChat(false);
    }
  }, [chatInput, isSendingChat, webinarId, userEmail, userName]);

  // Submit question
  const submitQuestion = useCallback(async () => {
    if (!questionInput.trim() || isSendingQuestion) return;

    setIsSendingQuestion(true);
    try {
      await fetch("/api/webinar/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          webinarId,
          question: questionInput.trim(),
          email: userEmail,
          name: userName,
        }),
      });
      setQuestionInput("");
    } catch {
      setError("Failed to submit question");
    } finally {
      setIsSendingQuestion(false);
    }
  }, [questionInput, isSendingQuestion, webinarId, userEmail, userName]);

  // Handle video play
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-lp-dark text-lp-white font-oswald min-h-screen">
      {/* Header */}
      <header className="border-lp-border bg-lp-black/50 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Brand + Title */}
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="text-lp-gold shrink-0 text-xs font-light tracking-[0.3em] sm:text-sm">
                GYNERGY
              </span>
              <span className="text-lp-border hidden sm:block">|</span>
              <h1 className="truncate text-sm font-light sm:text-lg">{webinarTitle}</h1>
            </div>

            {/* Status */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              {isLive ? (
                <>
                  {/* Live indicator */}
                  <div className="flex items-center gap-2 border border-red-500/30 bg-red-600/20 px-2 py-1 sm:px-3 sm:py-1.5">
                    <LiveIcon className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
                    <span className="text-xs font-medium tracking-wider text-red-400 sm:text-sm">
                      LIVE
                    </span>
                  </div>
                  {/* Viewer count */}
                  <div className="text-lp-muted flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{viewerCount}</span>
                  </div>
                </>
              ) : (
                <div className="bg-lp-gold/10 border-lp-gold/30 flex items-center gap-2 border px-2 py-1 sm:px-3 sm:py-1.5">
                  <span className="text-lp-gold text-xs sm:text-sm">Starting Soon</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Video player - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-lp-black border-lp-border relative aspect-video overflow-hidden border">
              {isLive && streamUrl ? (
                <>
                  <video
                    ref={videoRef}
                    className="h-full w-full object-contain"
                    playsInline
                    controls
                  />
                  {!isPlaying && (
                    <button
                      onClick={handlePlay}
                      className="bg-lp-black/60 hover:bg-lp-black/50 group absolute inset-0 flex items-center justify-center transition-colors"
                      aria-label="Play video"
                    >
                      <div
                        className={cn(
                          "h-16 w-16 rounded-full sm:h-20 sm:w-20",
                          "bg-lp-gold/20 border-lp-gold border-2",
                          "flex items-center justify-center",
                          "group-hover:bg-lp-gold/30 group-hover:scale-110",
                          "transition-all duration-300"
                        )}
                      >
                        <PlayIcon className="text-lp-gold ml-1 h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    </button>
                  )}
                </>
              ) : (
                /* Waiting room */
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8">
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 h-8 w-8">
                    <div className="from-lp-gold/30 absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent" />
                    <div className="from-lp-gold/30 absolute top-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
                  </div>
                  <div className="absolute top-4 right-4 h-8 w-8">
                    <div className="from-lp-gold/30 absolute top-0 right-0 h-full w-px bg-gradient-to-b to-transparent" />
                    <div className="from-lp-gold/30 absolute top-0 right-0 h-px w-full bg-gradient-to-l to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <div className="border-lp-gold/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 sm:mb-6 sm:h-20 sm:w-20">
                      <LiveIcon className="text-lp-gold/60 h-8 w-8 sm:h-10 sm:w-10" />
                    </div>

                    <h2 className="font-bebas text-lp-gold-light mb-2 text-xl tracking-wide sm:text-2xl">
                      Webinar Starting Soon
                    </h2>
                    <p className="text-lp-muted mx-auto mb-6 max-w-sm text-sm font-extralight sm:mb-8 sm:text-base">
                      The host will begin broadcasting shortly. Stay on this page.
                    </p>

                    {countdown && (
                      <div className="mb-6 flex justify-center gap-3 sm:mb-8 sm:gap-4">
                        {countdown.days > 0 && (
                          <div className="bg-lp-card border-lp-border border px-3 py-2 text-center sm:px-4 sm:py-3">
                            <div className="font-bebas text-lp-gold-light text-2xl sm:text-3xl">
                              {countdown.days}
                            </div>
                            <div className="text-lp-muted text-[10px] tracking-widest sm:text-xs">
                              DAYS
                            </div>
                          </div>
                        )}
                        <div className="bg-lp-card border-lp-border border px-3 py-2 text-center sm:px-4 sm:py-3">
                          <div className="font-bebas text-lp-gold-light text-2xl sm:text-3xl">
                            {String(countdown.hours).padStart(2, "0")}
                          </div>
                          <div className="text-lp-muted text-[10px] tracking-widest sm:text-xs">
                            HRS
                          </div>
                        </div>
                        <div className="bg-lp-card border-lp-border border px-3 py-2 text-center sm:px-4 sm:py-3">
                          <div className="font-bebas text-lp-gold-light text-2xl sm:text-3xl">
                            {String(countdown.minutes).padStart(2, "0")}
                          </div>
                          <div className="text-lp-muted text-[10px] tracking-widest sm:text-xs">
                            MIN
                          </div>
                        </div>
                        <div className="bg-lp-card border-lp-border border px-3 py-2 text-center sm:px-4 sm:py-3">
                          <div className="font-bebas text-lp-gold-light text-2xl sm:text-3xl">
                            {String(countdown.seconds).padStart(2, "0")}
                          </div>
                          <div className="text-lp-muted text-[10px] tracking-widest sm:text-xs">
                            SEC
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-lp-muted flex items-center justify-center gap-2 text-xs sm:text-sm">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      <span className="font-extralight">
                        {isHostLate
                          ? "The host is running a few minutes late. We\u2019ll start shortly — stay on this page."
                          : "Connected \u2022 Waiting for host"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 border border-red-500/30 bg-red-900/20 p-3 text-sm font-light text-red-300 sm:p-4">
                {error}
              </div>
            )}

            {/* Video info bar */}
            <div className="text-lp-muted mt-4 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-extralight">
                {isLive ? "Live now" : `Scheduled: ${scheduledStart.toLocaleDateString()}`}
              </span>
              {isLive && viewerCount > 0 && (
                <span className="font-extralight">{viewerCount} watching now</span>
              )}
            </div>

            {/* Challenge CTA - visible during live webinar */}
            {isLive && (
              <a
                href="/pricing"
                className={cn(
                  "mt-4 flex items-center justify-between gap-4 p-4",
                  "bg-lp-gold/10 border-lp-gold/30 border",
                  "hover:bg-lp-gold/20 group transition-colors"
                )}
              >
                <div>
                  <p className="text-lp-gold text-sm font-medium tracking-wide">
                    Ready to go deeper?
                  </p>
                  <p className="text-lp-muted text-xs font-extralight">
                    The 45-Day Awakening Challenge opens after this training
                  </p>
                </div>
                <span className="text-lp-gold shrink-0 text-sm font-medium group-hover:underline">
                  Learn More →
                </span>
              </a>
            )}
          </div>

          {/* Sidebar - Chat & Q&A */}
          <div className="lg:col-span-1">
            <div className="bg-lp-card border-lp-border flex h-[400px] flex-col border sm:h-[500px]">
              {/* Tabs */}
              <div className="border-lp-border flex border-b">
                {chatEnabled && (
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-light tracking-wider transition-colors",
                      activeTab === "chat"
                        ? "text-lp-gold border-lp-gold bg-lp-gold/5 border-b-2"
                        : "text-lp-muted hover:text-lp-white"
                    )}
                  >
                    <ChatIcon className="h-4 w-4" />
                    <span>Chat</span>
                  </button>
                )}
                {qaEnabled && (
                  <button
                    onClick={() => setActiveTab("qa")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-light tracking-wider transition-colors",
                      activeTab === "qa"
                        ? "text-lp-gold border-lp-gold bg-lp-gold/5 border-b-2"
                        : "text-lp-muted hover:text-lp-white"
                    )}
                  >
                    <QuestionIcon className="h-4 w-4" />
                    <span>Q&A</span>
                  </button>
                )}
              </div>

              {/* Chat panel */}
              {activeTab === "chat" && chatEnabled && (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <ChatIcon className="text-lp-border mb-3 h-8 w-8" />
                        <p className="text-lp-muted text-sm font-extralight">
                          {isLive
                            ? "Be the first to say hello!"
                            : "Chat opens when the webinar goes live"}
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "text-sm",
                            msg.is_host_message &&
                              "bg-lp-gold/10 border-lp-gold border-l-2 px-3 py-2"
                          )}
                        >
                          <span
                            className={cn(
                              "font-medium",
                              msg.is_host_message ? "text-lp-gold" : "text-lp-gold/70"
                            )}
                          >
                            {msg.sent_by_name || "Anonymous"}
                            {msg.is_host_message && (
                              <span className="bg-lp-gold/20 ml-1.5 rounded px-1.5 py-0.5 text-[10px]">
                                HOST
                              </span>
                            )}
                          </span>
                          <p className="text-lp-gray mt-0.5 font-extralight">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat input */}
                  <div className="border-lp-border border-t p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                        placeholder={isLive ? "Send a message..." : "Chat opens when live"}
                        disabled={!isLive}
                        maxLength={500}
                        className={cn(
                          "bg-lp-black border-lp-border flex-1 border px-3 py-2.5",
                          "text-lp-white placeholder:text-lp-muted text-sm font-light",
                          "focus:border-lp-gold transition-colors outline-none",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isSendingChat || !isLive}
                        className={cn(
                          "bg-lp-gold text-lp-black px-3 py-2.5",
                          "hover:bg-lp-gold-light transition-colors",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          "flex items-center justify-center"
                        )}
                        aria-label="Send message"
                      >
                        <SendIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A panel */}
              {activeTab === "qa" && qaEnabled && (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Questions */}
                  <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                    {questions.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <QuestionIcon className="text-lp-border mb-3 h-8 w-8" />
                        <p className="text-lp-muted text-sm font-extralight">No questions yet</p>
                        <p className="text-lp-muted/60 mt-1 text-xs font-extralight">
                          Be the first to ask!
                        </p>
                      </div>
                    ) : (
                      questions.map((q) => (
                        <div key={q.id} className="bg-lp-black/50 border-lp-border border p-3">
                          <p className="text-lp-white text-sm font-light">{q.question}</p>
                          <p className="text-lp-muted mt-1.5 text-xs font-extralight">
                            — {q.asked_by_name || "Anonymous"}
                          </p>
                          {q.answer_text && (
                            <div className="border-lp-gold mt-3 border-l-2 pl-3">
                              <p className="text-lp-gold-light text-sm font-light">
                                {q.answer_text}
                              </p>
                              <p className="text-lp-gold/60 mt-1 text-[10px]">HOST ANSWER</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Question input */}
                  <div className="border-lp-border border-t p-3">
                    <textarea
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder={isLive ? "Ask a question..." : "Q&A opens when live"}
                      disabled={!isLive}
                      rows={2}
                      maxLength={500}
                      className={cn(
                        "bg-lp-black border-lp-border w-full border px-3 py-2.5",
                        "text-lp-white placeholder:text-lp-muted text-sm font-light",
                        "focus:border-lp-gold resize-none transition-colors outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    />
                    <button
                      onClick={submitQuestion}
                      disabled={!questionInput.trim() || isSendingQuestion || !isLive}
                      className={cn(
                        "bg-lp-gold text-lp-black mt-2 w-full py-2.5 text-sm font-medium tracking-wider",
                        "hover:bg-lp-gold-light transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      {isSendingQuestion ? "Submitting..." : "Submit Question"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-lp-border mt-8 border-t py-6 text-center">
        <p className="text-lp-muted text-xs font-extralight tracking-widest">
          © {new Date().getFullYear()} GYNERGY • The 5 Pillars of Integrated Power
        </p>
      </footer>
    </div>
  );
}
