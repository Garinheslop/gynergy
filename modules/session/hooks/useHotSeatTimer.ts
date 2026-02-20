"use client";

import { useEffect, useRef, useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import type { HandRaise, HotSeatTimerState } from "@resources/types/session";
import type { RootState, AppDispatch } from "@store/configureStore";
import { sessionActions } from "@store/modules/session/reducers";

/**
 * Client-side countdown timer for the active hot seat.
 * Computes remaining time and updates Redux once per second (not 60fps).
 */
export function useHotSeatTimer(onExpired?: (handRaiseId: string) => void) {
  const dispatch = useDispatch<AppDispatch>();
  const hotSeat = useSelector((state: RootState) => state.session.hotSeat);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const active = hotSeat.active;
    if (!active || active.status !== "active" || !active.hotSeatStartedAt) {
      // Clear timer if no active hot seat
      clearTimer();
      dispatch(sessionActions.hotSeatTimerUpdated(null));
      expiredRef.current = false;
      return;
    }

    expiredRef.current = false;

    const tick = () => {
      const state = computeTimerState(active);
      dispatch(sessionActions.hotSeatTimerUpdated(state));

      if (state.isExpired && !expiredRef.current) {
        expiredRef.current = true;
        clearTimer();
        onExpiredRef.current?.(active.id);
      }
    };

    // Dispatch immediately, then once per second
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return clearTimer;
  }, [hotSeat.active, dispatch, clearTimer]);

  return hotSeat.timerState;
}

function computeTimerState(handRaise: HandRaise): HotSeatTimerState {
  const startedAt = new Date(handRaise.hotSeatStartedAt!).getTime();
  const durationMs = (handRaise.hotSeatDurationSeconds || 300) * 1000;
  const extensionsMs = (handRaise.timeExtendedSeconds || 0) * 1000;
  const totalMs = durationMs + extensionsMs;
  const elapsed = Date.now() - startedAt;
  const remainingMs = Math.max(0, totalMs - elapsed);
  const percentComplete = Math.min(100, (elapsed / totalMs) * 100);

  return {
    handRaiseId: handRaise.id,
    userId: handRaise.userId,
    userName: handRaise.userName || "Participant",
    topic: handRaise.topic,
    startedAt,
    durationMs,
    extensionsMs,
    remainingMs,
    percentComplete,
    isActive: remainingMs > 0,
    isExpiring: remainingMs > 0 && remainingMs < 60000,
    isExpired: remainingMs <= 0,
  };
}
