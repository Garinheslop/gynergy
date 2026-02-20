"use client";

import React from "react";

import type { HandRaise, HotSeatTimerState } from "@resources/types/session";

import HandRaiseQueue from "./HandRaiseQueue";
import HotSeatTimer from "./HotSeatTimer";

interface HotSeatPanelProps {
  queue: HandRaise[];
  activeHotSeat: HandRaise | null;
  timerState: HotSeatTimerState | null;
  isHost: boolean;
  onAcknowledge: (id: string) => void;
  onActivate: (id: string) => void;
  onDismiss: (id: string) => void;
  onExtend: (id: string, extraSeconds: number) => void;
  onComplete: (id: string) => void;
}

const HotSeatPanel: React.FC<HotSeatPanelProps> = ({
  queue,
  activeHotSeat,
  timerState,
  isHost,
  onAcknowledge,
  onActivate,
  onDismiss,
  onExtend,
  onComplete,
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Active Hot Seat */}
      {timerState && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Hot Seat
          </h4>
          <HotSeatTimer
            timerState={timerState}
            isHost={isHost}
            onExtend={
              activeHotSeat ? (extraSeconds) => onExtend(activeHotSeat.id, extraSeconds) : undefined
            }
            onEnd={activeHotSeat ? () => onComplete(activeHotSeat.id) : undefined}
          />
        </div>
      )}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto">
        <HandRaiseQueue
          queue={queue}
          isHost={isHost}
          onAcknowledge={onAcknowledge}
          onActivate={onActivate}
          onDismiss={onDismiss}
        />
      </div>
    </div>
  );
};

export default HotSeatPanel;
