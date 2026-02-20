"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  useDevices,
  DeviceType,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectLocalPeer,
  selectHLSState,
} from "@100mslive/react-sdk";

import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";

// ============================================
// ICONS (SVG for professional appearance)
// ============================================

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const VideoOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ScreenShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
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

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
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

const PinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 17v5M9 3h6l1 7h-8l1-7zM4.5 10h15" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const RecordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

// ============================================
// TYPES
// ============================================

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
  asked_by_email: string;
  status: string;
  upvotes: number;
  answer_text?: string;
  asked_at: string;
  is_pinned: boolean;
}

interface HostStudioProps {
  webinarId: string;
  authToken: string;
  webinarTitle: string;
  scheduledStart?: Date;
  onGoLive: () => Promise<void>;
  onEndWebinar: () => Promise<void>;
}

// ============================================
// INNER COMPONENT (uses HMS hooks)
// ============================================

function HostStudioContent({
  webinarId,
  authToken,
  webinarTitle,
  scheduledStart,
  onGoLive,
  onEndWebinar,
}: HostStudioProps) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const localPeer = useHMSStore(selectLocalPeer);
  const hlsState = useHMSStore(selectHLSState);

  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();

  const [isJoining, setIsJoining] = useState(true);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const joinedRef = useRef(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Sidebar state
  const [activeTab, setActiveTab] = useState<"chat" | "qa">("qa");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qaFilter, setQaFilter] = useState<"all" | "pending" | "approved" | "answered">("pending");
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isLive = hlsState?.running || false;

  // Join room on mount (ref guard prevents double-join from React strict mode)
  useEffect(() => {
    if (!authToken || joinedRef.current) return;

    const joinRoom = async () => {
      try {
        joinedRef.current = true;
        setIsJoining(true);
        setError(null);

        await hmsActions.join({
          authToken,
          userName: "Host",
          settings: {
            isAudioMuted: true,
            isVideoMuted: true, // Start muted — host enables camera when ready
          },
        });
      } catch (err) {
        console.error("Failed to join studio:", err);
        setError(err instanceof Error ? err.message : "Failed to join studio");
        joinedRef.current = false; // Allow retry on error
      } finally {
        setIsJoining(false);
      }
    };

    joinRoom();

    return () => {
      hmsActions.leave();
      joinedRef.current = false;
    };
  }, [authToken, hmsActions]);

  // Poll viewer count
  useEffect(() => {
    if (!isLive) return;

    const pollViewerCount = async () => {
      try {
        const response = await fetch(`/api/webinar/live?id=${webinarId}&action=status`);
        const data = await response.json();
        setViewerCount(data.viewerCount || 0);
      } catch {
        // Ignore polling errors
      }
    };

    pollViewerCount();
    const interval = setInterval(pollViewerCount, 10000);

    return () => clearInterval(interval);
  }, [isLive, webinarId]);

  // Supabase Realtime: Chat messages
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/webinar/chat?webinarId=${webinarId}&limit=100`);
        const data = await response.json();
        setChatMessages(data.messages || []);
      } catch {
        // Ignore fetch errors
      }
    };

    fetchChat();

    const supabase = createClient();
    const channel = supabase
      .channel(`host-chat-${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "webinar_chat",
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const msg = payload.new as ChatMessage;
          setChatMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === msg.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = msg;
              return next;
            }
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    const fallback = setInterval(fetchChat, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [webinarId]);

  // Supabase Realtime: Q&A questions (host sees all statuses)
  useEffect(() => {
    const fetchQA = async () => {
      try {
        const response = await fetch(`/api/webinar/qa?webinarId=${webinarId}&isHost=true`);
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch {
        // Ignore fetch errors
      }
    };

    fetchQA();

    const supabase = createClient();
    const channel = supabase
      .channel(`host-qa-${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "webinar_qa",
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const q = payload.new as Question;
          setQuestions((prev) => {
            const idx = prev.findIndex((existing) => existing.id === q.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = q;
              return next;
            }
            return [q, ...prev];
          });
        }
      )
      .subscribe();

    const fallback = setInterval(fetchQA, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [webinarId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Warn before leaving during live stream
  useEffect(() => {
    if (!isLive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    globalThis.addEventListener("beforeunload", handler);
    return () => globalThis.removeEventListener("beforeunload", handler);
  }, [isLive]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
  }, [hmsActions, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
  }, [hmsActions, isVideoEnabled]);

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await hmsActions.setScreenShareEnabled(false);
    } else {
      await hmsActions.setScreenShareEnabled(true);
    }
  }, [hmsActions, isScreenSharing]);

  // Handle go live
  const handleGoLive = useCallback(async () => {
    try {
      setIsGoingLive(true);
      setError(null);

      // Start HLS streaming via 100ms
      await hmsActions.startHLSStreaming({});

      // Notify backend
      await onGoLive();
    } catch (err) {
      console.error("Failed to go live:", err);
      setError(err instanceof Error ? err.message : "Failed to go live");
    } finally {
      setIsGoingLive(false);
    }
  }, [hmsActions, onGoLive]);

  // Handle end webinar
  const handleEndWebinar = useCallback(async () => {
    if (!confirm("Are you sure you want to end this webinar? This will disconnect all viewers."))
      return;

    try {
      setIsEnding(true);
      setError(null);

      // Stop HLS streaming
      await hmsActions.stopHLSStreaming().catch(() => {});

      // Leave room
      await hmsActions.leave();

      // Notify backend
      await onEndWebinar();
    } catch (err) {
      console.error("Failed to end webinar:", err);
      setError(err instanceof Error ? err.message : "Failed to end webinar");
    } finally {
      setIsEnding(false);
    }
  }, [hmsActions, onEndWebinar]);

  // Send host chat message
  const sendHostChat = useCallback(async () => {
    if (!chatInput.trim() || isSendingChat) return;
    setIsSendingChat(true);
    try {
      const response = await fetch("/api/webinar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          webinarId,
          message: chatInput.trim(),
          email: "host@gynergy.app",
          name: "Host",
          isHost: true,
        }),
      });
      if (!response.ok) throw new Error("Send failed");
      setChatInput("");
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSendingChat(false);
    }
  }, [chatInput, isSendingChat, webinarId]);

  // Pin/unpin chat message
  const togglePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    try {
      await fetch("/api/webinar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", messageId, isPinned: !isPinned }),
      });
    } catch {
      setError("Failed to pin message");
    }
  }, []);

  // Delete chat message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await fetch("/api/webinar/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", messageId }),
      });
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      setError("Failed to delete message");
    }
  }, []);

  // Approve question
  const approveQuestion = useCallback(async (questionId: string) => {
    try {
      await fetch("/api/webinar/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", questionId }),
      });
    } catch {
      setError("Failed to approve question");
    }
  }, []);

  // Dismiss question
  const dismissQuestion = useCallback(async (questionId: string) => {
    try {
      await fetch("/api/webinar/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", questionId }),
      });
    } catch {
      setError("Failed to dismiss question");
    }
  }, []);

  // Answer question
  const submitAnswer = useCallback(async () => {
    if (!answeringQuestionId || !answerText.trim()) return;
    try {
      await fetch("/api/webinar/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionId: answeringQuestionId,
          answer: answerText.trim(),
        }),
      });
      setAnsweringQuestionId(null);
      setAnswerText("");
    } catch {
      setError("Failed to answer question");
    }
  }, [answeringQuestionId, answerText]);

  // Loading state
  if (isJoining) {
    return (
      <div className="bg-lp-dark flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-lp-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-lp-white font-oswald font-light">Preparing studio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isConnected) {
    return (
      <div className="bg-lp-dark flex min-h-screen items-center justify-center">
        <div className="bg-lp-card border-lp-border max-w-md border p-8 text-center">
          <AlertIcon className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="font-oswald mb-4 font-light text-red-400">{error}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="bg-lp-gold text-lp-black font-oswald hover:bg-lp-gold-light px-6 py-3 font-medium tracking-wider transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

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
              <div className="min-w-0">
                <h1 className="truncate text-sm font-light sm:text-lg">{webinarTitle}</h1>
                <p className="text-lp-muted text-xs font-extralight">
                  Host Studio
                  {!isLive && scheduledStart && (
                    <span className="text-lp-gold/70 ml-2">
                      Scheduled:{" "}
                      {scheduledStart.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Status + Actions */}
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              {isLive && (
                <>
                  {/* Live indicator */}
                  <div className="flex items-center gap-2 border border-red-500/30 bg-red-600/20 px-2 py-1 sm:px-3 sm:py-1.5">
                    <LiveIcon className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
                    <span className="text-xs font-medium tracking-wider text-red-400 sm:text-sm">
                      LIVE
                    </span>
                  </div>
                  {/* Recording indicator */}
                  <div className="flex items-center gap-1.5 border border-red-500/20 bg-red-900/20 px-2 py-1 sm:px-3 sm:py-1.5">
                    <RecordIcon className="h-2.5 w-2.5 animate-pulse text-red-500 sm:h-3 sm:w-3" />
                    <span className="text-[10px] font-medium tracking-wider text-red-400 sm:text-xs">
                      REC
                    </span>
                  </div>
                  {/* Viewer count */}
                  <div className="text-lp-muted flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">{viewerCount} viewers</span>
                  </div>
                </>
              )}

              {/* Go Live / End buttons */}
              {!isLive ? (
                <button
                  onClick={handleGoLive}
                  disabled={isGoingLive || !isConnected}
                  className={cn(
                    "px-4 py-2 text-sm font-medium tracking-wider sm:px-6 sm:py-2.5",
                    "bg-red-600 text-white hover:bg-red-700",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "flex items-center gap-2 transition-colors"
                  )}
                >
                  <LiveIcon className="h-4 w-4" />
                  {isGoingLive ? "Starting..." : "GO LIVE"}
                </button>
              ) : (
                <button
                  onClick={handleEndWebinar}
                  disabled={isEnding}
                  className={cn(
                    "px-4 py-2 text-sm font-medium tracking-wider sm:px-6 sm:py-2.5",
                    "bg-lp-border hover:bg-lp-muted/20 text-lp-white",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "flex items-center gap-2 transition-colors"
                  )}
                >
                  <StopIcon className="h-4 w-4" />
                  {isEnding ? "Ending..." : "End Webinar"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-[calc(100vh-72px)] flex-col lg:flex-row">
        {/* Video preview area */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="bg-lp-black border-lp-border relative aspect-video max-h-[60vh] overflow-hidden border lg:max-h-none">
            {/* Decorative corners */}
            <div className="absolute top-3 left-3 z-10 h-6 w-6">
              <div className="from-lp-gold/50 absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent" />
              <div className="from-lp-gold/50 absolute top-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
            </div>
            <div className="absolute top-3 right-3 z-10 h-6 w-6">
              <div className="from-lp-gold/50 absolute top-0 right-0 h-full w-px bg-gradient-to-b to-transparent" />
              <div className="from-lp-gold/50 absolute top-0 right-0 h-px w-full bg-gradient-to-l to-transparent" />
            </div>

            {/* Local video preview */}
            {localPeer?.videoTrack ? (
              <video
                ref={(el) => {
                  if (el && localPeer.videoTrack) {
                    hmsActions.attachVideo(localPeer.videoTrack, el);
                  }
                }}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-lp-card border-lp-border mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border sm:h-24 sm:w-24">
                    <VideoOffIcon className="text-lp-muted h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <p className="text-lp-muted font-light">Camera is off</p>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-1/2 flex -translate-x-1/2 gap-2">
              {/* Screen share indicator */}
              {isScreenSharing && (
                <div className="flex items-center gap-1.5 bg-blue-600/90 px-3 py-1.5 text-xs font-medium tracking-wider text-white backdrop-blur-sm">
                  <ScreenShareIcon className="h-3.5 w-3.5" />
                  Screen Sharing
                </div>
              )}
            </div>

            {/* Audio indicator */}
            {!isAudioEnabled && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-red-600/90 px-3 py-1.5 text-xs font-medium tracking-wider text-white backdrop-blur-sm">
                <MicOffIcon className="h-3.5 w-3.5" />
                Muted
              </div>
            )}

            {/* Live badge */}
            {isLive && (
              <div className="absolute right-3 bottom-3 flex animate-pulse items-center gap-1.5 bg-red-600 px-3 py-1.5 text-xs font-medium tracking-wider text-white">
                <LiveIcon className="h-3.5 w-3.5" />
                LIVE
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex justify-center gap-3 sm:gap-4">
            <button
              onClick={toggleAudio}
              className={cn(
                "rounded-full p-3 transition-all sm:p-4",
                isAudioEnabled
                  ? "bg-lp-card border-lp-border hover:border-lp-gold border"
                  : "bg-red-600 hover:bg-red-700"
              )}
              aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? (
                <MicIcon className="text-lp-white h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <MicOffIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={cn(
                "rounded-full p-3 transition-all sm:p-4",
                isVideoEnabled
                  ? "bg-lp-card border-lp-border hover:border-lp-gold border"
                  : "bg-red-600 hover:bg-red-700"
              )}
              aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <VideoIcon className="text-lp-white h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <VideoOffIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              className={cn(
                "rounded-full p-3 transition-all sm:p-4",
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-lp-card border-lp-border hover:border-lp-gold border"
              )}
              aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
            >
              <ScreenShareIcon
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6",
                  isScreenSharing ? "text-white" : "text-lp-white"
                )}
              />
            </button>

            {/* Device settings button */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "rounded-full p-3 transition-all sm:p-4",
                  showSettings
                    ? "bg-lp-gold/20 border-lp-gold border"
                    : "bg-lp-card border-lp-border hover:border-lp-gold border"
                )}
                aria-label="Device settings"
              >
                <SettingsIcon
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6",
                    showSettings ? "text-lp-gold" : "text-lp-white"
                  )}
                />
              </button>

              {/* Device settings panel */}
              {showSettings && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="device-settings-heading"
                  className="bg-lp-card border-lp-border absolute bottom-full left-1/2 mb-3 w-72 -translate-x-1/2 border p-4 shadow-xl sm:w-80"
                >
                  <h4
                    id="device-settings-heading"
                    className="text-lp-gold-light mb-4 text-xs font-medium tracking-wider uppercase"
                  >
                    Device Settings
                  </h4>

                  {/* Camera */}
                  <div className="mb-3">
                    <label className="text-lp-muted mb-1.5 flex items-center gap-2 text-xs font-light">
                      <VideoIcon className="h-3.5 w-3.5" />
                      Camera
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDeviceIDs.videoInput || ""}
                        onChange={(e) =>
                          updateDevice({
                            deviceType: DeviceType.videoInput,
                            deviceId: e.target.value,
                          })
                        }
                        className="bg-lp-black border-lp-border text-lp-white focus:border-lp-gold w-full appearance-none border px-3 py-2 pr-8 text-xs font-light focus:outline-none"
                      >
                        {!allDevices.videoInput?.length && (
                          <option value="">No cameras found</option>
                        )}
                        {allDevices.videoInput?.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="text-lp-muted pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Microphone */}
                  <div className="mb-3">
                    <label className="text-lp-muted mb-1.5 flex items-center gap-2 text-xs font-light">
                      <MicIcon className="h-3.5 w-3.5" />
                      Microphone
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDeviceIDs.audioInput || ""}
                        onChange={(e) =>
                          updateDevice({
                            deviceType: DeviceType.audioInput,
                            deviceId: e.target.value,
                          })
                        }
                        className="bg-lp-black border-lp-border text-lp-white focus:border-lp-gold w-full appearance-none border px-3 py-2 pr-8 text-xs font-light focus:outline-none"
                      >
                        {!allDevices.audioInput?.length && (
                          <option value="">No microphones found</option>
                        )}
                        {allDevices.audioInput?.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="text-lp-muted pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Speaker */}
                  <div>
                    <label className="text-lp-muted mb-1.5 flex items-center gap-2 text-xs font-light">
                      <SpeakerIcon className="h-3.5 w-3.5" />
                      Speaker
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDeviceIDs.audioOutput || ""}
                        onChange={(e) =>
                          updateDevice({
                            deviceType: DeviceType.audioOutput,
                            deviceId: e.target.value,
                          })
                        }
                        className="bg-lp-black border-lp-border text-lp-white focus:border-lp-gold w-full appearance-none border px-3 py-2 pr-8 text-xs font-light focus:outline-none"
                      >
                        {!allDevices.audioOutput?.length && (
                          <option value="">No speakers found</option>
                        )}
                        {allDevices.audioOutput?.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="text-lp-muted pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pre-live checklist */}
          {!isLive && (
            <div className="bg-lp-card border-lp-border mx-auto mt-8 max-w-md border p-6">
              <h3 className="text-lp-gold-light mb-4 text-sm font-medium tracking-wider uppercase">
                Pre-Live Checklist
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isConnected ? "bg-green-600" : "bg-lp-border"
                    )}
                  >
                    {isConnected && <CheckIcon className="h-3 w-3 text-white" />}
                  </span>
                  <span className={isConnected ? "text-lp-white" : "text-lp-muted"}>
                    Connected to studio
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isVideoEnabled ? "bg-green-600" : "bg-yellow-600"
                    )}
                  >
                    {isVideoEnabled ? (
                      <CheckIcon className="h-3 w-3 text-white" />
                    ) : (
                      <AlertIcon className="h-3 w-3 text-white" />
                    )}
                  </span>
                  <span className={isVideoEnabled ? "text-lp-white" : "text-yellow-400"}>
                    Camera {isVideoEnabled ? "on" : "off"}
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isAudioEnabled ? "bg-green-600" : "bg-yellow-600"
                    )}
                  >
                    {isAudioEnabled ? (
                      <CheckIcon className="h-3 w-3 text-white" />
                    ) : (
                      <AlertIcon className="h-3 w-3 text-white" />
                    )}
                  </span>
                  <span className={isAudioEnabled ? "text-lp-white" : "text-yellow-400"}>
                    Microphone {isAudioEnabled ? "on" : "off (unmute before going live)"}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar - Chat & Q&A Moderation */}
        <aside className="border-lp-border bg-lp-card flex w-full flex-col overflow-hidden border-t lg:w-96 lg:border-t-0 lg:border-l">
          {/* Tabs */}
          <div className="border-lp-border flex shrink-0 border-b">
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
              Chat
              {chatMessages.length > 0 && (
                <span className="bg-lp-gold/20 text-lp-gold rounded-full px-1.5 text-[10px]">
                  {chatMessages.length}
                </span>
              )}
            </button>
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
              Q&A
              {questions.filter((q) => q.status === "pending").length > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-400">
                  {questions.filter((q) => q.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {/* Chat panel */}
          {activeTab === "chat" && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Pinned messages */}
              {chatMessages
                .filter((m) => m.is_pinned)
                .map((msg) => (
                  <div
                    key={`pin-${msg.id}`}
                    className="border-lp-gold/30 bg-lp-gold/5 shrink-0 border-b px-3 py-2"
                  >
                    <div className="text-lp-gold flex items-center gap-1.5 text-[10px]">
                      <PinIcon className="h-3 w-3" />
                      PINNED
                    </div>
                    <p className="text-lp-white mt-1 text-xs font-light">{msg.message}</p>
                  </div>
                ))}

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 space-y-1 overflow-y-auto p-3">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-lp-muted text-sm font-extralight">
                      {isLive ? "No messages yet" : "Chat will appear when live"}
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "group hover:bg-lp-black/30 relative rounded px-2 py-1.5",
                        msg.is_host_message && "bg-lp-gold/5"
                      )}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            msg.is_host_message ? "text-lp-gold" : "text-lp-gold/70"
                          )}
                        >
                          {msg.sent_by_name || "Anonymous"}
                          {msg.is_host_message && (
                            <span className="bg-lp-gold/20 ml-1 rounded px-1 py-0.5 text-[9px]">
                              HOST
                            </span>
                          )}
                        </span>
                        <span className="text-lp-muted text-[10px] font-extralight">
                          {new Date(msg.sent_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-lp-gray text-xs font-extralight">{msg.message}</p>
                      {/* Host moderation actions */}
                      <div className="absolute top-1 right-1 hidden gap-1 group-hover:flex">
                        <button
                          onClick={() => togglePinMessage(msg.id, msg.is_pinned)}
                          className={cn(
                            "rounded p-1 transition-colors",
                            msg.is_pinned
                              ? "text-lp-gold bg-lp-gold/20"
                              : "text-lp-muted hover:text-lp-gold hover:bg-lp-gold/10"
                          )}
                          aria-label={msg.is_pinned ? "Unpin message" : "Pin message"}
                        >
                          <PinIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-lp-muted rounded p-1 transition-colors hover:bg-red-600/20 hover:text-red-400"
                          aria-label="Delete message"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Host chat input */}
              <div className="border-lp-border shrink-0 border-t p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendHostChat()}
                    placeholder="Send as host..."
                    maxLength={500}
                    aria-label="Host chat message"
                    className="bg-lp-black border-lp-border text-lp-white placeholder:text-lp-muted focus:border-lp-gold flex-1 border px-3 py-2 text-xs font-light transition-colors outline-none"
                  />
                  <button
                    onClick={sendHostChat}
                    disabled={!chatInput.trim() || isSendingChat}
                    className="bg-lp-gold text-lp-black hover:bg-lp-gold-light flex items-center justify-center px-3 py-2 transition-colors disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <SendIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Q&A panel */}
          {activeTab === "qa" && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Status filters */}
              <div className="border-lp-border flex shrink-0 gap-1 border-b px-3 py-2">
                {(["pending", "approved", "answered", "all"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setQaFilter(filter)}
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-medium tracking-wider uppercase transition-colors",
                      qaFilter === filter
                        ? "bg-lp-gold/20 text-lp-gold"
                        : "text-lp-muted hover:text-lp-white"
                    )}
                  >
                    {filter}
                    {filter === "pending" &&
                      questions.filter((q) => q.status === "pending").length > 0 && (
                        <span className="ml-1 text-amber-400">
                          ({questions.filter((q) => q.status === "pending").length})
                        </span>
                      )}
                  </button>
                ))}
              </div>

              {/* Questions list */}
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {questions
                  .filter((q) => qaFilter === "all" || q.status === qaFilter)
                  .map((q) => (
                    <div key={q.id} className="bg-lp-black/50 border-lp-border border p-3">
                      {/* Status badge + upvotes */}
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            q.status === "pending" && "bg-amber-500/20 text-amber-400",
                            q.status === "approved" && "bg-green-500/20 text-green-400",
                            q.status === "answered" && "bg-blue-500/20 text-blue-400",
                            q.status === "dismissed" && "bg-red-500/20 text-red-400"
                          )}
                        >
                          {q.status}
                        </span>
                        {q.upvotes > 0 && (
                          <span className="text-lp-muted text-[10px]">▲ {q.upvotes}</span>
                        )}
                      </div>

                      {/* Question text */}
                      <p className="text-lp-white text-sm font-light">{q.question}</p>
                      <p className="text-lp-muted mt-1 text-[10px] font-extralight">
                        — {q.asked_by_name || "Anonymous"}
                      </p>

                      {/* Answer display */}
                      {q.answer_text && (
                        <div className="border-lp-gold mt-2 border-l-2 pl-2">
                          <p className="text-lp-gold-light text-xs font-light">{q.answer_text}</p>
                        </div>
                      )}

                      {/* Answer input */}
                      {answeringQuestionId === q.id && (
                        <div className="mt-2">
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Type your answer..."
                            rows={2}
                            aria-label="Answer text"
                            className="bg-lp-black border-lp-border text-lp-white placeholder:text-lp-muted focus:border-lp-gold w-full resize-none border px-2 py-1.5 text-xs font-light outline-none"
                          />
                          <div className="mt-1 flex gap-1">
                            <button
                              onClick={submitAnswer}
                              disabled={!answerText.trim()}
                              className="bg-lp-gold text-lp-black px-2 py-1 text-[10px] font-medium disabled:opacity-50"
                            >
                              Submit Answer
                            </button>
                            <button
                              onClick={() => {
                                setAnsweringQuestionId(null);
                                setAnswerText("");
                              }}
                              className="text-lp-muted hover:text-lp-white px-2 py-1 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons for pending */}
                      {q.status === "pending" && answeringQuestionId !== q.id && (
                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={() => approveQuestion(q.id)}
                            className="bg-green-600/20 px-2 py-1 text-[10px] font-medium text-green-400 hover:bg-green-600/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setAnsweringQuestionId(q.id);
                              setAnswerText("");
                            }}
                            className="bg-lp-gold/20 text-lp-gold hover:bg-lp-gold/30 px-2 py-1 text-[10px] font-medium"
                          >
                            Answer
                          </button>
                          <button
                            onClick={() => dismissQuestion(q.id)}
                            className="bg-red-600/20 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-600/30"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {/* Answer button for approved (unanswered) */}
                      {q.status === "approved" &&
                        answeringQuestionId !== q.id &&
                        !q.answer_text && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setAnsweringQuestionId(q.id);
                                setAnswerText("");
                              }}
                              className="bg-lp-gold/20 text-lp-gold hover:bg-lp-gold/30 px-2 py-1 text-[10px] font-medium"
                            >
                              Answer
                            </button>
                          </div>
                        )}
                    </div>
                  ))}

                {/* Empty state */}
                {questions.filter((q) => qaFilter === "all" || q.status === qaFilter).length ===
                  0 && (
                  <div className="flex h-full items-center justify-center py-8">
                    <div className="text-center">
                      <QuestionIcon className="text-lp-border mx-auto mb-2 h-8 w-8" />
                      <p className="text-lp-muted text-sm font-extralight">
                        {qaFilter === "all" ? "No questions yet" : `No ${qaFilter} questions`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Error toast */}
      {error && isConnected && (
        <div className="fixed right-4 bottom-4 flex max-w-md items-center gap-3 bg-red-600 px-4 py-3 text-white shadow-lg">
          <AlertIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-light">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-lg font-bold hover:opacity-80"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// WRAPPER WITH HMS PROVIDER
// ============================================

export default function HostStudio(props: HostStudioProps) {
  return (
    <HMSRoomProvider>
      <HostStudioContent {...props} />
    </HMSRoomProvider>
  );
}
