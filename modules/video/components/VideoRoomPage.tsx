"use client";

import React, { useEffect, useState, useCallback } from "react";

import { useRouter } from "next/navigation";

import PreCallCheck from "./PreCallCheck";
import VideoRoom from "./VideoRoom";
import WaitingRoom from "./WaitingRoom";

// Flow stages
type FlowStage = "loading" | "pre-call" | "waiting" | "in-call" | "error";

interface VideoRoomPageProps {
  roomId: string;
}

interface RoomData {
  id: string;
  room_id: string;
  title: string;
  description?: string;
  host_id: string;
  status: string;
  scheduled_start?: string;
  host?: {
    id: string;
    name: string;
  };
}

interface JoinResponse {
  authToken: string;
  roomId: string;
  role: string;
  roomDetails: RoomData;
}

const VideoRoomPage: React.FC<VideoRoomPageProps> = ({ roomId }) => {
  const router = useRouter();

  // State
  const [stage, setStage] = useState<FlowStage>("loading");
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Guest");
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Poll room status when in waiting room (for participant count updates)
  useEffect(() => {
    if (stage !== "waiting" || !roomId) return;

    const pollRoomStatus = async () => {
      try {
        const response = await fetch(`/api/video/get-room?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.participant_count !== undefined) {
            setParticipantCount(data.participant_count);
          }
          // Auto-admit if room becomes active
          if (data.status === "active") {
            setStage("in-call");
          }
        }
      } catch (err) {
        console.error("Failed to poll room status:", err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollRoomStatus, 5000);
    pollRoomStatus(); // Initial poll

    return () => clearInterval(interval);
  }, [stage, roomId]);

  // Fetch room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomResponse = await fetch(`/api/video/get-room?roomId=${roomId}`);
        if (!roomResponse.ok) {
          const errorData = await roomResponse.json();
          throw new Error(errorData.error || "Failed to fetch room details");
        }
        const room: RoomData = await roomResponse.json();
        setRoomData(room);

        // Move to pre-call check stage
        setStage("pre-call");
      } catch (err) {
        console.error("Failed to fetch room:", err);
        setError(err instanceof Error ? err.message : "Failed to load room");
        setStage("error");
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  // Join room and get auth token
  const joinRoom = useCallback(async () => {
    if (!roomData) return;

    try {
      const joinResponse = await fetch("/api/video/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: roomId }),
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || "Failed to join room");
      }

      const joinData: JoinResponse = await joinResponse.json();
      setAuthToken(joinData.authToken);
      setIsHost(joinData.role === "host");
      setUserName(joinData.roomDetails.host?.name || "Guest");

      // Check if we need waiting room (non-host joining scheduled room)
      const isScheduledRoom =
        roomData.scheduled_start && new Date(roomData.scheduled_start) > new Date();
      const needsWaiting =
        !joinData.role.includes("host") && isScheduledRoom && roomData.status === "scheduled";

      if (needsWaiting) {
        setStage("waiting");
      } else {
        setStage("in-call");
      }
    } catch (err) {
      console.error("Failed to join room:", err);
      setError(err instanceof Error ? err.message : "Failed to join room");
      setStage("error");
    }
  }, [roomId, roomData]);

  // Handle pre-call check complete
  const handlePreCallReady = useCallback(() => {
    joinRoom();
  }, [joinRoom]);

  // Handle cancel from pre-call or waiting room
  const handleCancel = useCallback(() => {
    router.push("/");
  }, [router]);

  // Handle admit from waiting room
  const handleAdmit = useCallback(() => {
    setStage("in-call");
  }, []);

  // Handle leaving the room
  const handleLeave = useCallback(() => {
    router.push("/");
  }, [router]);

  // Handle ending the room (host only)
  const handleEndRoom = useCallback(async () => {
    try {
      await fetch("/api/video/end-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      router.push("/");
    } catch (err) {
      console.error("Failed to end room:", err);
    }
  }, [roomId, router]);

  // Render based on stage
  switch (stage) {
    case "loading":
      return (
        <div className="bg-bkg-dark flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-action mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-content-light text-lg">Loading room...</p>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="bg-bkg-dark flex min-h-screen items-center justify-center p-4">
          <div className="bg-bkg-dark-secondary w-full max-w-md rounded-2xl p-8 text-center">
            <div className="bg-danger/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <i className="gng-warning text-danger text-3xl" />
            </div>
            <h1 className="text-content-light mb-2 text-xl font-bold">Unable to Join</h1>
            <p className="text-content-muted mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-action hover:bg-action/90 rounded-xl px-6 py-3 font-medium text-white transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );

    case "pre-call":
      return (
        <PreCallCheck
          onReady={handlePreCallReady}
          onCancel={handleCancel}
          userName={userName || "Guest"}
        />
      );

    case "waiting":
      return (
        <WaitingRoom
          roomTitle={roomData?.title || "Video Call"}
          hostName={roomData?.host?.name}
          scheduledStart={
            roomData?.scheduled_start ? new Date(roomData.scheduled_start) : undefined
          }
          participantCount={participantCount}
          onAdmit={handleAdmit}
          onCancel={handleCancel}
        />
      );

    case "in-call":
      if (!roomData || !authToken) {
        return (
          <div className="bg-bkg-dark flex min-h-screen items-center justify-center p-4">
            <div className="bg-bkg-dark-secondary w-full max-w-md rounded-2xl p-8 text-center">
              <div className="bg-content-muted/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <i className="gng-video-off text-content-muted text-3xl" />
              </div>
              <h1 className="text-content-light mb-2 text-xl font-bold">Room Not Found</h1>
              <p className="text-content-muted mb-6">
                This video room doesn&apos;t exist or has ended.
              </p>
              <button
                onClick={() => router.push("/")}
                className="bg-action hover:bg-action/90 rounded-xl px-6 py-3 font-medium text-white transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-bkg-dark min-h-screen">
          {/* Header */}
          <header className="bg-bkg-dark-secondary/80 fixed top-0 right-0 left-0 z-50 border-b border-white/10 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Recording indicator */}
                <div className="flex items-center gap-2">
                  <div className="bg-success h-2 w-2 animate-pulse rounded-full" />
                  <span className="text-content-muted text-xs">Live</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div>
                  <h1 className="text-content-light max-w-[200px] truncate text-sm font-semibold md:max-w-none">
                    {roomData.title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isHost && (
                  <span className="bg-action/20 text-action rounded-full px-2 py-1 text-xs font-medium">
                    Host
                  </span>
                )}
                {/* Connection quality would go here */}
              </div>
            </div>
          </header>

          {/* Video Room */}
          <main className="h-screen pt-14">
            <VideoRoom
              authToken={authToken}
              roomId={roomData.room_id}
              userName={userName}
              isHost={isHost}
              onLeave={handleLeave}
              onEndRoom={handleEndRoom}
            />
          </main>
        </div>
      );

    default:
      return null;
  }
};

export default VideoRoomPage;
