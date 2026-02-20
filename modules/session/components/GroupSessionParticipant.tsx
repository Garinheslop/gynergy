"use client";

import React, { useCallback, useState } from "react";

import { HMSRoomProvider } from "@100mslive/react-sdk";

import { VideoRoom } from "@modules/video";

import BreakoutAssignment from "./BreakoutAssignment";
import BreakoutRoomView from "./BreakoutRoomView";
import BreakoutSelfSelect from "./BreakoutSelfSelect";
import HotSeatSpotlight from "./HotSeatSpotlight";
import HotSeatTimer from "./HotSeatTimer";
import SessionChat from "./SessionChat";
import SessionSidebar from "./SessionSidebar";
import { useBreakout } from "../hooks/useBreakout";
import { useHandRaise } from "../hooks/useHandRaise";
import { useHotSeatTimer } from "../hooks/useHotSeatTimer";
import { useSessionChat } from "../hooks/useSessionChat";

interface GroupSessionParticipantProps {
  sessionId: string;
  authToken: string;
  sessionTitle: string;
  userName: string;
  hotSeatEnabled: boolean;
  breakoutEnabled: boolean;
  chatEnabled: boolean;
  onLeave: () => void;
}

const GroupSessionParticipantContent: React.FC<GroupSessionParticipantProps> = ({
  sessionId,
  authToken,
  sessionTitle: _sessionTitle,
  userName,
  hotSeatEnabled,
  breakoutEnabled: _breakoutEnabled,
  chatEnabled,
  onLeave,
}) => {
  const [isJoiningBreakout, setIsJoiningBreakout] = useState(false);
  const [handRaiseTopic, setHandRaiseTopic] = useState("");
  const [showRaiseForm, setShowRaiseForm] = useState(false);

  // Hooks
  const handRaise = useHandRaise(sessionId);
  const breakout = useBreakout(sessionId);
  const mainChat = useSessionChat(sessionId);
  const breakoutChat = useSessionChat(
    breakout.isInBreakout ? sessionId : null,
    breakout.currentBreakoutId
  );
  const timerState = useHotSeatTimer();

  // Check if user has a hand raised
  const myRaise = handRaise.queue.find((h) => h.userName === userName);

  // Handle hand raise
  const handleRaiseHand = useCallback(async () => {
    try {
      await handRaise.raiseHand(handRaiseTopic || undefined, userName);
      setShowRaiseForm(false);
      setHandRaiseTopic("");
    } catch {
      // already raised or rate limited
    }
  }, [handRaise, handRaiseTopic, userName]);

  // Handle joining breakout
  const handleJoinBreakout = useCallback(
    async (roomId: string) => {
      setIsJoiningBreakout(true);
      try {
        await breakout.joinBreakout(roomId);
      } finally {
        setIsJoiningBreakout(false);
      }
    },
    [breakout]
  );

  // If participant is in a breakout room
  if (breakout.isInBreakout && breakout.currentBreakoutId) {
    const currentRoom = breakout.rooms.find((r) => r.id === breakout.currentBreakoutId);
    if (currentRoom) {
      return (
        <BreakoutRoomView
          breakoutRoom={currentRoom}
          authToken={authToken}
          sessionId={sessionId}
          userName={userName}
          isHost={false}
          messages={breakoutChat.messages}
          onSendMessage={(msg) => breakoutChat.sendMessage(msg, userName)}
          onReturn={() => breakout.exitBreakout()}
          isReturning={breakout.isReturning}
        />
      );
    }
  }

  // Check for pending breakout assignment
  const myBreakout = breakout.rooms.find(
    (r) => r.status === "active" && breakout.hasActiveBreakouts && !breakout.isInBreakout
  );

  // Check for self-select breakouts
  const selfSelectRooms = breakout.rooms.filter(
    (r) => r.status === "active" && r.assignmentMethod === "self_select"
  );

  return (
    <div className="relative flex h-full flex-col bg-gray-900">
      {/* Breakout assignment overlay */}
      {myBreakout && selfSelectRooms.length === 0 && (
        <BreakoutAssignment
          breakoutRoom={myBreakout}
          onJoin={() => handleJoinBreakout(myBreakout.id)}
          isJoining={isJoiningBreakout}
        />
      )}

      {/* Self-select overlay */}
      {selfSelectRooms.length > 0 && !breakout.isInBreakout && (
        <BreakoutSelfSelect
          rooms={selfSelectRooms}
          onSelect={handleJoinBreakout}
          isJoining={isJoiningBreakout}
        />
      )}

      {/* Hot seat timer banner */}
      {timerState && timerState.isActive && (
        <div className="px-4 pt-3">
          <HotSeatTimer timerState={timerState} isHost={false} />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="relative flex-1">
          <HotSeatSpotlight timerState={timerState} />
          <VideoRoom
            authToken={authToken}
            roomId={sessionId}
            userName={userName}
            isHost={false}
            onLeave={onLeave}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80">
          <SessionSidebar
            hotSeatEnabled={hotSeatEnabled}
            breakoutEnabled={false}
            chatTab={
              <SessionChat
                messages={mainChat.messages}
                onSend={(msg) => mainChat.sendMessage(msg, userName)}
                isHost={false}
                disabled={!chatEnabled}
              />
            }
            handRaiseTab={
              hotSeatEnabled ? (
                <div className="h-full overflow-y-auto p-3">
                  {/* Raise hand controls */}
                  <div className="mb-4">
                    {myRaise ? (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-center">
                        <p className="text-sm text-amber-300">
                          Your hand is raised
                          {myRaise.status === "acknowledged" && " — you're next!"}
                        </p>
                        <button
                          onClick={() => handRaise.lowerHand()}
                          className="mt-2 rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-500"
                        >
                          Lower Hand
                        </button>
                      </div>
                    ) : showRaiseForm ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={handRaiseTopic}
                          onChange={(e) => setHandRaiseTopic(e.target.value)}
                          placeholder="What would you like to discuss? (optional)"
                          className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-teal-500"
                          maxLength={100}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRaiseHand}
                            className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-500"
                          >
                            Raise Hand
                          </button>
                          <button
                            onClick={() => setShowRaiseForm(false)}
                            className="rounded-lg bg-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRaiseForm(true)}
                        className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-500"
                      >
                        ✋ Raise Hand
                      </button>
                    )}
                  </div>

                  {/* Queue (read-only for participants) */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Queue ({handRaise.queue.length})
                    </h4>
                    {handRaise.queue.map((h, i) => (
                      <div
                        key={h.id}
                        className="mb-1 flex items-center gap-2 rounded px-2 py-1.5 text-sm"
                      >
                        <span className="text-xs text-gray-500">{i + 1}.</span>
                        <span className="text-gray-300">{h.userName || "Participant"}</span>
                        {h.topic && (
                          <span className="truncate text-xs text-gray-500">— {h.topic}</span>
                        )}
                      </div>
                    ))}
                    {handRaise.queue.length === 0 && (
                      <p className="text-center text-xs text-gray-500">Queue is empty</p>
                    )}
                  </div>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

// Wrapper with HMSRoomProvider
const GroupSessionParticipant: React.FC<GroupSessionParticipantProps> = (props) => {
  return (
    <HMSRoomProvider>
      <GroupSessionParticipantContent {...props} />
    </HMSRoomProvider>
  );
};

export default GroupSessionParticipant;
