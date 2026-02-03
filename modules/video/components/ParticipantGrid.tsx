"use client";

import React, { useMemo } from "react";

import {
  useVideo,
  useHMSStore,
  selectCameraStreamByPeerID,
  selectScreenShareByPeerID,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  HMSPeer,
} from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";

interface ParticipantGridProps {
  peers: HMSPeer[];
  localPeerId?: string;
  isScreenSharing?: boolean;
}

interface VideoTileProps {
  peer: HMSPeer;
  isLocal?: boolean;
  isLarge?: boolean;
}

// Individual video tile component
const VideoTile: React.FC<VideoTileProps> = ({ peer, isLocal = false, isLarge = false }) => {
  const videoTrack = useHMSStore(selectCameraStreamByPeerID(peer.id));
  const screenTrack = useHMSStore(selectScreenShareByPeerID(peer.id));
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));
  const isVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer.id));

  // Use the appropriate track (screen share takes priority)
  const trackToDisplay = screenTrack || videoTrack;

  const { videoRef } = useVideo({
    trackId: trackToDisplay?.id,
  });

  return (
    <div
      className={cn(
        "bg-bkg-dark-secondary relative overflow-hidden rounded-xl",
        "transition-all duration-300",
        isLarge ? "col-span-2 row-span-2" : "",
        isLocal && "ring-action ring-2"
      )}
    >
      {/* Video element */}
      {isVideoEnabled && trackToDisplay ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "h-full w-full object-cover",
            isLocal && !screenTrack && "scale-x-[-1] transform" // Mirror local video
          )}
        />
      ) : (
        // Avatar placeholder when video is off
        <div className="flex h-full w-full items-center justify-center">
          <div
            className={cn(
              "bg-action/20 flex items-center justify-center rounded-full",
              isLarge ? "h-24 w-24" : "h-16 w-16"
            )}
          >
            <span className={cn("text-action font-bold", isLarge ? "text-3xl" : "text-xl")}>
              {peer.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        </div>
      )}

      {/* Name and status overlay */}
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 truncate text-sm font-medium text-white">
            {peer.name || "Guest"}
            {isLocal && <span className="text-action ml-1 text-xs">(You)</span>}
          </span>

          <div className="flex items-center gap-1">
            {/* Audio indicator */}
            {!isAudioEnabled && (
              <span className="bg-danger/80 flex h-6 w-6 items-center justify-center rounded-full">
                <i className="gng-mic-off text-xs text-white" />
              </span>
            )}

            {/* Screen sharing indicator */}
            {screenTrack && (
              <span className="bg-action/80 flex h-6 w-6 items-center justify-center rounded-full">
                <i className="gng-share text-xs text-white" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Speaking indicator */}
      {/* This would require useAudioLevelSelector for actual implementation */}
    </div>
  );
};

const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  peers,
  localPeerId,
  isScreenSharing,
}) => {
  // Find screen sharing peer (check if auxiliaryTracks has any items)
  const screenSharePeer = useMemo(() => {
    return peers.find((peer) => peer.auxiliaryTracks && peer.auxiliaryTracks.length > 0);
  }, [peers]);

  // Calculate grid layout based on participant count
  const gridClass = useMemo(() => {
    const count = peers.length;

    if (screenSharePeer || isScreenSharing) {
      // Screen share mode: Large screen share + small tiles
      return "grid grid-cols-4 grid-rows-3 gap-2";
    }

    if (count === 1) {
      return "grid grid-cols-1 gap-2";
    }
    if (count === 2) {
      return "grid grid-cols-2 gap-2";
    }
    if (count <= 4) {
      return "grid grid-cols-2 gap-2";
    }
    if (count <= 6) {
      return "grid grid-cols-3 gap-2";
    }
    if (count <= 9) {
      return "grid grid-cols-3 gap-2";
    }
    // 10+ participants
    return "grid grid-cols-4 gap-2 auto-rows-fr";
  }, [peers.length, screenSharePeer, isScreenSharing]);

  // Sort peers: local peer last, screen sharer first
  const sortedPeers = useMemo(() => {
    return [...peers].sort((a, b) => {
      // Screen sharer comes first
      if (screenSharePeer) {
        if (a.id === screenSharePeer.id) return -1;
        if (b.id === screenSharePeer.id) return 1;
      }
      // Local peer comes last
      if (a.id === localPeerId) return 1;
      if (b.id === localPeerId) return -1;
      return 0;
    });
  }, [peers, localPeerId, screenSharePeer]);

  if (peers.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-content-muted">Waiting for participants...</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full", gridClass)}>
      {sortedPeers.map((peer) => (
        <VideoTile
          key={peer.id}
          peer={peer}
          isLocal={peer.id === localPeerId}
          isLarge={(screenSharePeer && peer.id === screenSharePeer.id) || peers.length === 1}
        />
      ))}
    </div>
  );
};

export default ParticipantGrid;
