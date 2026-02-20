"use client";

import React, { useState } from "react";

import { cn } from "@lib/utils/style";
import type { BreakoutRoom, BreakoutAssignmentMethod } from "@resources/types/session";

interface BreakoutManagerProps {
  rooms: BreakoutRoom[];
  hasActiveBreakouts: boolean;
  isReturning: boolean;
  onCreateBreakouts: (
    rooms: Array<{ name: string; topic?: string }>,
    method: BreakoutAssignmentMethod,
    durationSeconds: number
  ) => Promise<unknown>;
  onStartBreakouts: () => Promise<unknown>;
  onReturnToMain: () => Promise<unknown>;
  onCloseBreakouts: () => Promise<unknown>;
  onHostSwitch: (roomId: string) => Promise<void>;
}

const BreakoutManager: React.FC<BreakoutManagerProps> = ({
  rooms,
  hasActiveBreakouts,
  isReturning,
  onCreateBreakouts,
  onStartBreakouts,
  onReturnToMain,
  onCloseBreakouts,
  onHostSwitch,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [roomCount, setRoomCount] = useState(3);
  const [roomNames, setRoomNames] = useState<string[]>(["Room 1", "Room 2", "Room 3"]);
  const [method, setMethod] = useState<BreakoutAssignmentMethod>("random");
  const [duration, setDuration] = useState(10); // minutes
  const [isCreating, setIsCreating] = useState(false);

  const handleRoomCountChange = (count: number) => {
    setRoomCount(count);
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(roomNames[i] || `Room ${i + 1}`);
    }
    setRoomNames(names);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateBreakouts(
        roomNames.map((name) => ({ name })),
        method,
        duration * 60
      );
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create breakout rooms:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Active breakout rooms view
  if (hasActiveBreakouts || isReturning) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Breakout Rooms</h4>
          {isReturning ? (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              Returning...
            </span>
          ) : (
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs text-teal-300">Active</span>
          )}
        </div>

        {rooms
          .filter((r) => r.status === "active" || r.status === "returning")
          .map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{room.name}</p>
                {room.topic && <p className="text-xs text-gray-400">{room.topic}</p>}
                <p className="text-xs text-gray-500">{room.participantCount || 0} participants</p>
              </div>
              <button
                onClick={() => onHostSwitch(room.id)}
                className="rounded bg-gray-600 px-3 py-1.5 text-xs text-white hover:bg-gray-500"
              >
                Visit
              </button>
            </div>
          ))}

        <div className="flex gap-2 pt-2">
          {!isReturning && (
            <button
              onClick={onReturnToMain}
              className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Call Everyone Back
            </button>
          )}
          <button
            onClick={onCloseBreakouts}
            className="flex-1 rounded-lg bg-red-600/80 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Close Rooms
          </button>
        </div>
      </div>
    );
  }

  // Pending rooms (created but not started)
  const pendingRooms = rooms.filter((r) => r.status === "pending");
  if (pendingRooms.length > 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">
          Ready to Start ({pendingRooms.length} rooms)
        </h4>
        {pendingRooms.map((room) => (
          <div key={room.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
            <p className="text-sm font-medium text-white">{room.name}</p>
            <p className="text-xs text-gray-500">{room.participantCount || 0} assigned</p>
          </div>
        ))}
        <button
          onClick={onStartBreakouts}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-500"
        >
          Open Breakout Rooms
        </button>
      </div>
    );
  }

  // Create new breakout rooms
  if (showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Create Breakout Rooms</h4>
          <button
            onClick={() => setShowCreate(false)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>

        {/* Room count */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">Number of Rooms</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => handleRoomCountChange(n)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium",
                  roomCount === n
                    ? "bg-teal-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Room names */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">Room Names</label>
          <div className="space-y-2">
            {roomNames.map((name, i) => (
              <input
                key={i}
                type="text"
                value={name}
                onChange={(e) => {
                  const updated = [...roomNames];
                  updated[i] = e.target.value;
                  setRoomNames(updated);
                }}
                className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-teal-500"
                placeholder={`Room ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Assignment method */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">Assignment</label>
          <div className="flex gap-2">
            {(["random", "manual", "self_select"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium",
                  method === m
                    ? "bg-teal-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                {m === "random" ? "Random" : m === "manual" ? "Manual" : "Self-Select"}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1 block text-xs text-gray-400">Duration: {duration} minutes</label>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full accent-teal-500"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Rooms"}
        </button>
      </div>
    );
  }

  // Default: button to open creation flow
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="mb-2 text-3xl">🚪</span>
      <p className="mb-1 text-sm text-gray-400">No breakout rooms</p>
      <p className="mb-4 text-xs text-gray-500">
        Split participants into small groups for focused discussion
      </p>
      <button
        onClick={() => setShowCreate(true)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
      >
        Create Breakout Rooms
      </button>
    </div>
  );
};

export default BreakoutManager;
