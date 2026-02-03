"use client";

import React, { useState, useCallback } from "react";

import { cn } from "@lib/utils/style";

interface VideoControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onToggleRecording?: () => void;
  onToggleVirtualBackground?: () => void;
  onLeave: () => void;
  onEndRoom?: () => void;
  onReaction?: (emoji: string) => void;
  isHost?: boolean;
  sx?: string;
}

// Tooltip component for controls
const Tooltip: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div className="group relative">
    {children}
    <div className="pointer-events-none invisible absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-black/90 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
      {label}
      <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-black/90" />
    </div>
  </div>
);

// Control button component
const ControlButton: React.FC<{
  onClick: () => void;
  icon: string;
  label: string;
  isActive?: boolean;
  isDanger?: boolean;
  isHighlighted?: boolean;
  pulse?: boolean;
}> = ({
  onClick,
  icon,
  label,
  isActive = false,
  isDanger = false,
  isHighlighted = false,
  pulse = false,
}) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full",
        "transform transition-all duration-200 hover:scale-105 active:scale-95",
        isDanger && "bg-danger/20 text-danger hover:bg-danger/30",
        isHighlighted && !isDanger && "bg-action hover:bg-action/90 text-white",
        isActive && !isDanger && !isHighlighted && "bg-action/20 text-action hover:bg-action/30",
        !isActive && !isDanger && !isHighlighted && "bg-white/10 text-white hover:bg-white/20",
        pulse && "animate-pulse"
      )}
    >
      <i className={cn("text-xl", icon)} />
    </button>
  </Tooltip>
);

// Reactions popup
const REACTIONS = ["👏", "❤️", "🙏", "✨", "💪", "🔥"];

const VideoControls: React.FC<VideoControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing = false,
  isRecording = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleVirtualBackground,
  onLeave,
  onEndRoom,
  onReaction,
  isHost = false,
  sx,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleReaction = useCallback(
    (emoji: string) => {
      onReaction?.(emoji);
      setShowReactions(false);
    },
    [onReaction]
  );

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-3",
        "rounded-2xl bg-black/80 shadow-2xl backdrop-blur-xl",
        "border border-white/10",
        sx
      )}
    >
      {/* Left section: Audio & Video */}
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={onToggleAudio}
          icon={isAudioMuted ? "gng-mic-off" : "gng-mic"}
          label={isAudioMuted ? "Unmute (m)" : "Mute (m)"}
          isDanger={isAudioMuted}
        />
        <ControlButton
          onClick={onToggleVideo}
          icon={isVideoMuted ? "gng-video-off" : "gng-video"}
          label={isVideoMuted ? "Turn on camera (v)" : "Turn off camera (v)"}
          isDanger={isVideoMuted}
        />
      </div>

      {/* Divider */}
      <div className="mx-2 h-10 w-px bg-white/20" />

      {/* Middle section: Features */}
      <div className="flex items-center gap-2">
        {/* Screen share */}
        {onToggleScreenShare && (
          <ControlButton
            onClick={onToggleScreenShare}
            icon="gng-share"
            label={isScreenSharing ? "Stop sharing" : "Share screen"}
            isActive={isScreenSharing}
          />
        )}

        {/* Virtual Background */}
        {onToggleVirtualBackground && (
          <ControlButton
            onClick={onToggleVirtualBackground}
            icon="gng-image"
            label="Virtual background"
          />
        )}

        {/* Reactions */}
        <div className="relative">
          {showReactions && (
            <div className="animate-in slide-in-from-bottom-2 absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl duration-200">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex h-10 w-10 transform items-center justify-center rounded-xl transition-colors hover:scale-110 hover:bg-white/10"
                >
                  <span className="text-xl">{emoji}</span>
                </button>
              ))}
            </div>
          )}
          <Tooltip label="Reactions">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                "transform transition-all duration-200 hover:scale-105",
                showReactions ? "bg-action text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <span className="text-xl">😊</span>
            </button>
          </Tooltip>
        </div>

        {/* Hand raise */}
        <Tooltip label="Raise hand">
          <button
            onClick={() => handleReaction("✋")}
            className="flex h-14 w-14 transform items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:scale-105 hover:bg-white/20"
          >
            <span className="text-xl">✋</span>
          </button>
        </Tooltip>

        {/* More options (host) */}
        {isHost && (
          <div className="relative">
            {showMore && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full left-1/2 mb-3 min-w-[180px] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/90 p-2 backdrop-blur-xl duration-200">
                {onToggleRecording && (
                  <button
                    onClick={() => {
                      onToggleRecording();
                      setShowMore(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/10"
                  >
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        isRecording ? "bg-danger animate-pulse" : "bg-white/40"
                      )}
                    />
                    <span className="text-sm text-white">
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setShowMore(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/10"
                >
                  <i className="gng-settings text-white/60" />
                  <span className="text-sm text-white">Settings</span>
                </button>
              </div>
            )}
            <ControlButton
              onClick={() => setShowMore(!showMore)}
              icon="gng-more"
              label="More options"
              isActive={showMore}
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-2 h-10 w-px bg-white/20" />

      {/* Right section: Leave */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLeave}
          className={cn(
            "flex items-center gap-2 rounded-full px-6 py-3",
            "bg-danger font-medium text-white",
            "hover:bg-danger/90 transition-all duration-200",
            "transform hover:scale-105 active:scale-95"
          )}
        >
          <i className="gng-phone-off text-lg" />
          <span>Leave</span>
        </button>

        {/* End room button (host only) */}
        {isHost && onEndRoom && (
          <Tooltip label="End call for everyone">
            <button
              onClick={onEndRoom}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                "text-danger border-danger/50 border-2 bg-transparent",
                "hover:bg-danger/10 hover:border-danger transition-all duration-200",
                "transform hover:scale-105 active:scale-95"
              )}
            >
              <i className="gng-close text-xl" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default VideoControls;
