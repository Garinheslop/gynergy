"use client";

import React, { useState, useEffect } from "react";

import { cn } from "@lib/utils/style";

interface WaitingRoomProps {
  roomTitle: string;
  hostName?: string;
  scheduledStart?: Date;
  participantCount?: number;
  onAdmit: () => void;
  onCancel: () => void;
  isAdmitted?: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomTitle,
  hostName,
  scheduledStart,
  participantCount = 0,
  onAdmit,
  onCancel,
  isAdmitted = false,
}) => {
  const [dots, setDots] = useState("");
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [countdown, setCountdown] = useState<string | null>(null);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Breathing animation
  useEffect(() => {
    const phases: Array<"inhale" | "hold" | "exhale"> = ["inhale", "hold", "exhale"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % phases.length;
      setBreathPhase(phases[index]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!scheduledStart) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = scheduledStart.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        setCountdown(`Starts in ${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setCountdown(`Starts in ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`Starts in ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledStart]);

  // Auto-admit when ready
  useEffect(() => {
    if (isAdmitted) {
      onAdmit();
    }
  }, [isAdmitted, onAdmit]);

  return (
    <div className="bg-bkg-dark flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Breathing circle animation */}
        <div className="relative mx-auto mb-8 h-48 w-48">
          {/* Outer glow */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-[4000ms] ease-in-out",
              breathPhase === "inhale" && "scale-100 opacity-30",
              breathPhase === "hold" && "scale-110 opacity-40",
              breathPhase === "exhale" && "scale-90 opacity-20"
            )}
            style={{
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
            }}
          />

          {/* Inner circle */}
          <div
            className={cn(
              "from-action/30 to-action/10 absolute inset-8 rounded-full bg-gradient-to-br backdrop-blur-sm",
              "flex items-center justify-center transition-all duration-[4000ms] ease-in-out",
              breathPhase === "inhale" && "scale-100",
              breathPhase === "hold" && "scale-105",
              breathPhase === "exhale" && "scale-95"
            )}
          >
            <div className="text-center">
              <span className="text-action/80 text-lg capitalize">{breathPhase}</span>
            </div>
          </div>

          {/* Decorative rings */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className={cn(
                "border-action/20 absolute inset-0 rounded-full border",
                "transition-all duration-[4000ms] ease-in-out"
              )}
              style={{
                transform: `scale(${breathPhase === "hold" ? 1 + ring * 0.1 : 1 + ring * 0.05})`,
                opacity: 0.3 - ring * 0.08,
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <div className="mb-8">
          <h1 className="text-content-light mb-2 text-2xl font-bold">{roomTitle}</h1>

          {hostName && (
            <p className="text-content-muted mb-4">
              Hosted by <span className="text-action">{hostName}</span>
            </p>
          )}

          {countdown && (
            <div className="bg-action/10 mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2">
              <i className="gng-clock text-action" />
              <span className="text-action font-medium">{countdown}</span>
            </div>
          )}

          <p className="text-content-muted">Waiting for the host to let you in{dots}</p>

          {participantCount > 0 && (
            <p className="text-content-muted mt-2 text-sm">
              {participantCount} participant{participantCount !== 1 ? "s" : ""} in the call
            </p>
          )}
        </div>

        {/* Wellness tip */}
        <div className="bg-bkg-dark-secondary mb-8 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-action/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
              <span className="text-xl">🧘</span>
            </div>
            <div className="text-left">
              <p className="text-content-light mb-1 text-sm font-medium">While you wait...</p>
              <p className="text-content-muted text-sm">
                Take a moment to breathe deeply. Follow the circle above for a calming breath
                exercise. Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={onCancel}
          className="text-content-muted hover:text-content-light px-6 py-2 transition-colors"
        >
          Leave waiting room
        </button>
      </div>
    </div>
  );
};

export default WaitingRoom;
