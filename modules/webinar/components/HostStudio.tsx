"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectLocalPeer,
  selectHLSState,
} from "@100mslive/react-sdk";

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

// ============================================
// TYPES
// ============================================

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

  const [isJoining, setIsJoining] = useState(true);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const joinedRef = useRef(false);

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

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
  }, [hmsActions, isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
  }, [hmsActions, isVideoEnabled]);

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

        {/* Sidebar - Q&A Panel */}
        <aside className="border-lp-border bg-lp-card w-full overflow-y-auto border-t p-4 lg:w-80 lg:border-t-0 lg:border-l">
          <h3 className="text-lp-gold-light mb-4 flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
            <UsersIcon className="h-4 w-4" />
            Q&A Panel
          </h3>
          {isLive ? (
            <p className="text-lp-muted text-sm font-light">
              Questions from viewers will appear here.
            </p>
          ) : (
            <div className="py-8 text-center">
              <div className="bg-lp-border/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <LiveIcon className="text-lp-muted h-8 w-8" />
              </div>
              <p className="text-lp-muted text-sm font-light">Go live to see viewer questions</p>
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
