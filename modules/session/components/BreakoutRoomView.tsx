"use client";

import React, { useState, useEffect } from "react";

import { HMSRoomProvider } from "@100mslive/react-sdk";

import { cn } from "@lib/utils/style";
import { VideoRoom } from "@modules/video";
import type { BreakoutRoom } from "@resources/types/session";

import SessionChat from "./SessionChat";

interface BreakoutRoomViewProps {
  breakoutRoom: BreakoutRoom;
  authToken: string;
  sessionId: string;
  userName: string;
  isHost: boolean;
  messages: Array<{
    id: string;
    sessionId: string;
    message: string;
    sentByUserId?: string;
    sentByName?: string;
    sentAt: string;
    breakoutRoomId?: string;
    isHostMessage: boolean;
    isPinned: boolean;
    isDeleted: boolean;
    metadata: Record<string, unknown>;
  }>;
  onSendMessage: (message: string) => Promise<unknown>;
  onReturn: () => void;
  isReturning: boolean;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BreakoutRoomView: React.FC<BreakoutRoomViewProps> = ({
  breakoutRoom,
  authToken,
  sessionId,
  userName,
  isHost,
  messages,
  onSendMessage,
  onReturn,
  isReturning,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!breakoutRoom.endsAt) return;

    const update = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(breakoutRoom.endsAt!).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(diff);
      if (diff <= 0) return;
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [breakoutRoom.endsAt]);

  return (
    <div className="relative flex h-full flex-col">
      {/* Return to main overlay */}
      {isReturning && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="text-lg font-medium text-white">Returning to Main Room...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800/80 px-4 py-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{breakoutRoom.name}</h3>
          {breakoutRoom.topic && <p className="text-xs text-gray-400">{breakoutRoom.topic}</p>}
        </div>

        <div className="flex items-center gap-3">
          {remainingSeconds !== null && (
            <span
              className={cn(
                "rounded-full px-3 py-1 font-mono text-sm font-bold",
                remainingSeconds <= 60
                  ? "bg-red-500/20 text-red-300"
                  : remainingSeconds <= 180
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-gray-700 text-gray-300"
              )}
            >
              {formatCountdown(remainingSeconds)}
            </span>
          )}
          <button
            onClick={onReturn}
            className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500"
          >
            Return to Main
          </button>
        </div>
      </div>

      {/* Content: Video + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1">
          <HMSRoomProvider>
            <VideoRoom
              authToken={authToken}
              roomId={breakoutRoom.hmsRoomId || sessionId}
              userName={userName}
              isHost={isHost}
              onLeave={onReturn}
            />
          </HMSRoomProvider>
        </div>

        {/* Chat sidebar */}
        <div className="w-72 border-l border-gray-700 bg-gray-900">
          <SessionChat
            messages={messages}
            onSend={onSendMessage}
            isHost={isHost}
            placeholder={`Chat in ${breakoutRoom.name}...`}
          />
        </div>
      </div>
    </div>
  );
};

export default BreakoutRoomView;
