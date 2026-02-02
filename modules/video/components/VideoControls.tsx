"use client";

import React from "react";

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
  onLeave: () => void;
  onEndRoom?: () => void;
  isHost?: boolean;
  sx?: string;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing = false,
  isRecording = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onLeave,
  onEndRoom,
  isHost = false,
  sx,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 p-4",
        "bg-bkg-dark/90 backdrop-blur-sm rounded-2xl",
        sx
      )}
    >
      {/* Audio toggle */}
      <button
        onClick={onToggleAudio}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "transition-all duration-200",
          isAudioMuted
            ? "bg-danger/20 text-danger hover:bg-danger/30"
            : "bg-bkg-light text-content-dark hover:bg-bkg-light/80"
        )}
        title={isAudioMuted ? "Unmute" : "Mute"}
      >
        <i
          className={cn(
            "text-[20px]",
            isAudioMuted ? "gng-mic-off" : "gng-mic"
          )}
        />
      </button>

      {/* Video toggle */}
      <button
        onClick={onToggleVideo}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "transition-all duration-200",
          isVideoMuted
            ? "bg-danger/20 text-danger hover:bg-danger/30"
            : "bg-bkg-light text-content-dark hover:bg-bkg-light/80"
        )}
        title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
      >
        <i
          className={cn(
            "text-[20px]",
            isVideoMuted ? "gng-video-off" : "gng-video"
          )}
        />
      </button>

      {/* Screen share toggle */}
      {onToggleScreenShare && (
        <button
          onClick={onToggleScreenShare}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "transition-all duration-200",
            isScreenSharing
              ? "bg-action/20 text-action hover:bg-action/30"
              : "bg-bkg-light text-content-dark hover:bg-bkg-light/80"
          )}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          <i className="gng-share text-[20px]" />
        </button>
      )}

      {/* Recording toggle (host only) */}
      {isHost && onToggleRecording && (
        <button
          onClick={onToggleRecording}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "transition-all duration-200",
            isRecording
              ? "bg-danger/20 text-danger hover:bg-danger/30 animate-pulse"
              : "bg-bkg-light text-content-dark hover:bg-bkg-light/80"
          )}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          <i className="gng-record text-[20px]" />
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-border-light/30 mx-2" />

      {/* Leave button */}
      <button
        onClick={onLeave}
        className={cn(
          "px-6 py-3 rounded-full flex items-center gap-2",
          "bg-danger text-white font-medium",
          "hover:bg-danger/90 transition-colors duration-200"
        )}
      >
        <i className="gng-phone-off text-[18px]" />
        <span>Leave</span>
      </button>

      {/* End room button (host only) */}
      {isHost && onEndRoom && (
        <button
          onClick={onEndRoom}
          className={cn(
            "px-4 py-3 rounded-full flex items-center gap-2",
            "bg-transparent text-danger border border-danger",
            "hover:bg-danger/10 transition-colors duration-200"
          )}
          title="End room for everyone"
        >
          <i className="gng-close text-[18px]" />
          <span className="font-medium">End</span>
        </button>
      )}
    </div>
  );
};

export default VideoControls;
