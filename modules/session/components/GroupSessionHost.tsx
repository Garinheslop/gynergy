"use client";

import React, { useCallback, useState } from "react";

import { HMSRoomProvider } from "@100mslive/react-sdk";

import { VideoRoom } from "@modules/video";

import BreakoutManager from "./BreakoutManager";
import BreakoutRoomView from "./BreakoutRoomView";
import HotSeatPanel from "./HotSeatPanel";
import HotSeatSpotlight from "./HotSeatSpotlight";
import SessionChat from "./SessionChat";
import SessionSidebar from "./SessionSidebar";
import { useBreakout } from "../hooks/useBreakout";
import { useHandRaise } from "../hooks/useHandRaise";
import { useHotSeatTimer } from "../hooks/useHotSeatTimer";
import { useSessionChat } from "../hooks/useSessionChat";

interface GroupSessionHostProps {
  sessionId: string;
  authToken: string;
  sessionTitle: string;
  hostName: string;
  hotSeatEnabled: boolean;
  breakoutEnabled: boolean;
  chatEnabled: boolean;
  onEndSession: () => Promise<void>;
}

const GroupSessionHostContent: React.FC<GroupSessionHostProps> = ({
  sessionId,
  authToken,
  sessionTitle,
  hostName,
  hotSeatEnabled,
  breakoutEnabled,
  chatEnabled,
  onEndSession,
}) => {
  const [isEnding, setIsEnding] = useState(false);

  // Hooks
  const handRaise = useHandRaise(sessionId);
  const breakout = useBreakout(sessionId);
  const mainChat = useSessionChat(sessionId);
  const breakoutChat = useSessionChat(
    breakout.isInBreakout ? sessionId : null,
    breakout.currentBreakoutId
  );

  // Hot seat timer — auto-complete when expired
  const handleHotSeatExpired = useCallback(
    (handRaiseId: string) => {
      handRaise.completeHotSeat(handRaiseId);
    },
    [handRaise]
  );
  const timerState = useHotSeatTimer(handleHotSeatExpired);

  // End session handler
  const handleEndSession = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await onEndSession();
    } finally {
      setIsEnding(false);
    }
  }, [onEndSession, isEnding]);

  // If host is in a breakout room, show BreakoutRoomView
  if (breakout.isInBreakout && breakout.currentBreakoutId) {
    const currentRoom = breakout.rooms.find((r) => r.id === breakout.currentBreakoutId);
    if (currentRoom) {
      return (
        <BreakoutRoomView
          breakoutRoom={currentRoom}
          authToken={authToken}
          sessionId={sessionId}
          userName={hostName}
          isHost={true}
          messages={breakoutChat.messages}
          onSendMessage={(msg) => breakoutChat.sendMessage(msg, hostName)}
          onReturn={() => breakout.exitBreakout()}
          isReturning={breakout.isReturning}
        />
      );
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Hot seat timer banner */}
      {timerState && timerState.isActive && (
        <div className="px-4 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{sessionTitle}</h2>
          </div>
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
            userName={hostName}
            isHost={true}
            onLeave={handleEndSession}
            onEndRoom={handleEndSession}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80">
          <SessionSidebar
            hotSeatEnabled={hotSeatEnabled}
            breakoutEnabled={breakoutEnabled}
            chatTab={
              <SessionChat
                messages={mainChat.messages}
                onSend={(msg) => mainChat.sendMessage(msg, hostName)}
                onPin={mainChat.pinMessage}
                onDelete={mainChat.deleteMessage}
                isHost={true}
                disabled={!chatEnabled}
              />
            }
            handRaiseTab={
              hotSeatEnabled ? (
                <div className="h-full overflow-y-auto p-3">
                  <HotSeatPanel
                    queue={handRaise.queue}
                    activeHotSeat={handRaise.activeHotSeat}
                    timerState={timerState}
                    isHost={true}
                    onAcknowledge={handRaise.acknowledgeHand}
                    onActivate={handRaise.activateHotSeat}
                    onDismiss={handRaise.dismissHand}
                    onExtend={handRaise.extendTime}
                    onComplete={handRaise.completeHotSeat}
                  />
                </div>
              ) : undefined
            }
            breakoutTab={
              breakoutEnabled ? (
                <BreakoutManager
                  rooms={breakout.rooms}
                  hasActiveBreakouts={breakout.hasActiveBreakouts}
                  isReturning={breakout.isReturning}
                  onCreateBreakouts={breakout.createBreakouts}
                  onStartBreakouts={breakout.startBreakouts}
                  onReturnToMain={breakout.returnToMain}
                  onCloseBreakouts={breakout.closeBreakouts}
                  onHostSwitch={async (roomId) => {
                    await breakout.hostSwitchRoom(roomId);
                  }}
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

// Wrapper with HMSRoomProvider
const GroupSessionHost: React.FC<GroupSessionHostProps> = (props) => {
  return (
    <HMSRoomProvider>
      <GroupSessionHostContent {...props} />
    </HMSRoomProvider>
  );
};

export default GroupSessionHost;
