"use client";

import { FC, useEffect, useState, useCallback } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import CalendarDropdown from "@modules/community/components/CalendarDropdown";
import VideoRoomPage from "@modules/video/components/VideoRoomPage";

interface RoomInfo {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  durationMinutes: number;
  hostName: string;
  hostAvatar?: string;
  participantCount: number;
  maxParticipants: number;
  rsvpCount: number;
  isHost: boolean;
}

const CommunityCallPage: FC = () => {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { session, authenticating } = useSession();

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Fetch room info for pre-join screen
  const fetchRoomInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/video/get-room?roomId=${roomId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Room not found");
      }

      const room = await response.json();
      const host = room.host || {};
      const participants = room.participants || [];

      const scheduledStart = room.scheduled_start;
      const scheduledEnd = room.scheduled_end;
      const durationMinutes =
        scheduledEnd && scheduledStart
          ? Math.round(
              (new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000
            )
          : 60;

      setRoomInfo({
        id: room.id,
        title: room.title || "Community Call",
        description: room.description,
        status: room.status,
        scheduledStart,
        scheduledEnd,
        durationMinutes,
        hostName: host.name || "Host",
        hostAvatar: host.avatar_url,
        participantCount: participants.filter((p: Record<string, unknown>) => p.joined_at).length,
        maxParticipants: room.max_participants || 50,
        rsvpCount: participants.filter((p: Record<string, unknown>) => p.rsvp_status === "accepted")
          .length,
        isHost: room.host_id === session?.user?.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [roomId, session?.user?.id]);

  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
      return;
    }
    if (session?.user && roomId) {
      fetchRoomInfo();
    }
  }, [session, authenticating, router, roomId, fetchRoomInfo]);

  // If user clicks "Join", hand off to the existing VideoRoomPage component
  if (joining) {
    return <VideoRoomPage roomId={roomId} />;
  }

  // Loading state
  if (loading || authenticating) {
    return (
      <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-action mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-content-dark text-lg">Loading call...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roomInfo) {
    return (
      <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center p-4">
        <div className="bg-bkg-light w-full max-w-md rounded-2xl p-8 text-center">
          <div className="bg-action-50 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <svg
              className="text-action-600 h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-content-dark mb-2 text-xl font-bold">Call Not Found</h1>
          <p className="text-grey-500 mb-6">{error || "This call doesn't exist or has ended."}</p>
          <Link
            href="/community"
            className="bg-action text-content-dark hover:bg-action-100 inline-block rounded-xl px-6 py-3 font-medium transition-colors"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  // Ended state
  if (roomInfo.status === "ended" || roomInfo.status === "cancelled") {
    return (
      <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center p-4">
        <div className="bg-bkg-light w-full max-w-md rounded-2xl p-8 text-center">
          <div className="bg-success/20 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <svg
              className="text-success h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-content-dark mb-2 text-xl font-bold">Call Has Ended</h1>
          <p className="text-grey-500 mb-2">{roomInfo.title}</p>
          <p className="text-grey-500 mb-6 text-sm">Hosted by {roomInfo.hostName}</p>
          <Link
            href="/community"
            className="bg-action text-content-dark hover:bg-action-100 inline-block rounded-xl px-6 py-3 font-medium transition-colors"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  // Pre-join screen
  const isLive = roomInfo.status === "live";
  const scheduledDate = roomInfo.scheduledStart ? new Date(roomInfo.scheduledStart) : null;

  const handleJoin = () => {
    triggerHaptic("medium");
    setJoining(true);
  };

  return (
    <div className="bg-bkg-light-secondary flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/community"
          className="text-grey-500 hover:text-content-dark mb-6 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Community
        </Link>

        {/* Pre-join card */}
        <div className="bg-bkg-light overflow-hidden rounded-2xl shadow-2xl">
          {/* Header gradient */}
          <div
            className={cn(
              "px-6 py-8 text-center",
              isLive
                ? "bg-gradient-to-br from-red-900/80 to-red-800/60"
                : "from-action-800 to-action-600 bg-gradient-to-br"
            )}
          >
            {isLive && (
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-bold tracking-wider text-red-300 uppercase">
                  Live Now
                </span>
              </div>
            )}

            <h1 className="mb-2 text-2xl font-bold text-white">{roomInfo.title}</h1>

            {roomInfo.description && (
              <p className="text-sm text-white/70">{roomInfo.description}</p>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            {/* Host */}
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-grey-100 relative h-10 w-10 overflow-hidden rounded-full">
                {roomInfo.hostAvatar ? (
                  <Image
                    src={roomInfo.hostAvatar}
                    alt={roomInfo.hostName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="from-action-400 to-action-600 flex h-full w-full items-center justify-center bg-gradient-to-br text-sm font-semibold text-white">
                    {roomInfo.hostName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-content-dark font-semibold">{roomInfo.hostName}</p>
                <p className="text-grey-500 text-sm">Host</p>
              </div>
            </div>

            {/* Stats */}
            <div className="border-border-light mb-4 grid grid-cols-2 gap-3 rounded-lg border p-3">
              {scheduledDate && (
                <div>
                  <p className="text-grey-500 text-xs">When</p>
                  <p className="text-content-dark text-sm font-medium">
                    {isLive
                      ? "Happening now"
                      : scheduledDate.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-grey-500 text-xs">Duration</p>
                <p className="text-content-dark text-sm font-medium">
                  {roomInfo.durationMinutes} minutes
                </p>
              </div>
              <div>
                <p className="text-grey-500 text-xs">{isLive ? "In Call" : "RSVPs"}</p>
                <p className="text-content-dark text-sm font-medium">
                  {isLive ? roomInfo.participantCount : roomInfo.rsvpCount} /{" "}
                  {roomInfo.maxParticipants}
                </p>
              </div>
            </div>

            {/* Join button */}
            <button
              onClick={handleJoin}
              className={cn(
                "focus-visible:ring-action flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
                isLive
                  ? "from-primary to-primary-500 bg-gradient-to-r text-white"
                  : "bg-action text-content-dark hover:bg-action-100"
              )}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {isLive ? "Join Call" : "Join When Ready"}
            </button>

            {/* Calendar add */}
            {scheduledDate && !isLive && (
              <div className="mt-3 flex justify-center">
                <CalendarDropdown
                  event={{
                    title: roomInfo.title,
                    description:
                      roomInfo.description || `Community call hosted by ${roomInfo.hostName}`,
                    startDate: scheduledDate,
                    durationMinutes: roomInfo.durationMinutes,
                    location: typeof window !== "undefined" ? window.location.href : "",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCallPage;
