"use client";

import React, { useEffect, useState, useCallback } from "react";

import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectLocalPeer,
  selectRoomState,
  HMSRoomState,
} from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";

import ParticipantGrid from "./ParticipantGrid";
import VideoControls from "./VideoControls";
import VirtualBackground from "./VirtualBackground";

interface VideoRoomProps {
  authToken: string;
  roomId: string;
  userName: string;
  isHost?: boolean;
  onLeave?: () => void;
  onEndRoom?: () => void;
}

// Inner component that uses HMS hooks
const VideoRoomContent: React.FC<VideoRoomProps> = ({
  authToken,
  userName,
  isHost = false,
  onLeave,
  onEndRoom,
}) => {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenSharing = useHMSStore(selectIsLocalScreenShared);
  const localPeer = useHMSStore(selectLocalPeer);
  const roomState = useHMSStore(selectRoomState);

  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVirtualBackground, setShowVirtualBackground] = useState(false);

  // Join room on mount
  useEffect(() => {
    const joinRoom = async () => {
      try {
        setIsJoining(true);
        setError(null);

        await hmsActions.join({
          authToken,
          userName,
          settings: {
            isAudioMuted: true,
            isVideoMuted: false,
          },
        });
      } catch (err) {
        console.error("Failed to join room:", err);
        setError(err instanceof Error ? err.message : "Failed to join room");
      } finally {
        setIsJoining(false);
      }
    };

    if (authToken) {
      joinRoom();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };
  }, [authToken, userName, hmsActions, isConnected]);

  // Handle leave
  const handleLeave = useCallback(async () => {
    try {
      await hmsActions.leave();
      onLeave?.();
    } catch (err) {
      console.error("Failed to leave room:", err);
    }
  }, [hmsActions, onLeave]);

  // Handle end room (host only)
  const handleEndRoom = useCallback(async () => {
    if (!isHost) return;

    try {
      await hmsActions.leave();
      onEndRoom?.();
    } catch (err) {
      console.error("Failed to end room:", err);
    }
  }, [hmsActions, isHost, onEndRoom]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (err) {
      console.error("Failed to toggle audio:", err);
    }
  }, [hmsActions, isLocalAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (err) {
      console.error("Failed to toggle video:", err);
    }
  }, [hmsActions, isLocalVideoEnabled]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await hmsActions.setScreenShareEnabled(false);
      } else {
        await hmsActions.setScreenShareEnabled(true);
      }
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
    }
  }, [hmsActions, isScreenSharing]);

  // Loading state
  if (isJoining || roomState === HMSRoomState.Connecting) {
    return (
      <div className="bg-bkg-dark flex min-h-[400px] flex-col items-center justify-center rounded-2xl">
        <div className="border-action mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-content-light text-lg">Joining call...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-bkg-dark flex min-h-[400px] flex-col items-center justify-center rounded-2xl p-6">
        <i className="gng-warning text-danger mb-4 text-4xl" />
        <p className="text-content-light mb-2 text-lg">Failed to join call</p>
        <p className="text-content-muted mb-4 text-sm">{error}</p>
        <button
          onClick={onLeave}
          className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Disconnected state
  if (!isConnected && roomState === HMSRoomState.Disconnected) {
    return (
      <div className="bg-bkg-dark flex min-h-[400px] flex-col items-center justify-center rounded-2xl p-6">
        <i className="gng-video-off text-content-muted mb-4 text-4xl" />
        <p className="text-content-light mb-4 text-lg">Call ended</p>
        <button
          onClick={onLeave}
          className="bg-action hover:bg-action/90 rounded-lg px-6 py-2 text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bkg-dark flex h-full flex-col overflow-hidden rounded-2xl">
      {/* Participant grid */}
      <div className="flex-1 overflow-hidden p-4">
        <ParticipantGrid
          peers={peers}
          localPeerId={localPeer?.id}
          isScreenSharing={isScreenSharing}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center p-4">
        <VideoControls
          isAudioMuted={!isLocalAudioEnabled}
          isVideoMuted={!isLocalVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onToggleVirtualBackground={() => setShowVirtualBackground(true)}
          onLeave={handleLeave}
          onEndRoom={isHost ? handleEndRoom : undefined}
          isHost={isHost}
        />
      </div>

      {/* Virtual Background Modal */}
      <VirtualBackground
        isOpen={showVirtualBackground}
        onClose={() => setShowVirtualBackground(false)}
      />

      {/* Participant count */}
      <div className="bg-bkg-dark/80 absolute top-4 left-4 rounded-full px-3 py-1.5 backdrop-blur-sm">
        <span className="text-content-light flex items-center gap-2 text-sm">
          <i className="gng-users text-action" />
          {peers.length} participant{peers.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};

// Wrapper component with HMSRoomProvider
const VideoRoom: React.FC<VideoRoomProps> = (props) => {
  return (
    <HMSRoomProvider>
      <div className={cn("relative h-full min-h-[500px] w-full")}>
        <VideoRoomContent {...props} />
      </div>
    </HMSRoomProvider>
  );
};

export default VideoRoom;
