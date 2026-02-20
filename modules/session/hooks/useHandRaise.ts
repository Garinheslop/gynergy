"use client";

import { useCallback, useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { createClient } from "@lib/supabase-client";
import type { HandRaise, HandRaiseRow } from "@resources/types/session";
import { handRaiseRowToHandRaise } from "@resources/types/session";
import type { RootState, AppDispatch } from "@store/configureStore";
import { sessionActions } from "@store/modules/session/reducers";

export function useHandRaise(sessionId: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const handRaises = useSelector((state: RootState) => state.session.handRaises);
  const hotSeat = useSelector((state: RootState) => state.session.hotSeat);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Fetch initial queue
  const fetchQueue = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/session/hand-raise?sessionId=${sessionId}`);
      const data = await res.json();
      const raises: HandRaise[] = data.handRaises || [];
      dispatch(sessionActions.handRaisesFetched(raises));

      // Set active hot seat if any
      const active = raises.find((h) => h.status === "active");
      if (active) {
        dispatch(sessionActions.hotSeatActivated(active));
      }
    } catch (err) {
      console.error("Failed to fetch hand raises:", err);
    }
  }, [sessionId, dispatch]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    fetchQueue();

    const supabase = createClient();
    const channel = supabase
      .channel(`session-hands-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hand_raises",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const hr = handRaiseRowToHandRaise(payload.new as HandRaiseRow);
            dispatch(sessionActions.handRaiseAdded(hr));
          } else if (payload.eventType === "UPDATE") {
            const hr = handRaiseRowToHandRaise(payload.new as HandRaiseRow);
            dispatch(sessionActions.handRaiseUpdated(hr));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string })?.id;
            if (id) dispatch(sessionActions.handRaiseRemoved(id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Polling fallback every 30s
    const fallback = setInterval(fetchQueue, 30000);

    return () => {
      clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchQueue, dispatch]);

  // Actions
  const raiseHand = useCallback(
    async (topic?: string, userName?: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "raise", sessionId, topic, userName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to raise hand");
      return data.handRaise as HandRaise;
    },
    [sessionId]
  );

  const lowerHand = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch("/api/session/hand-raise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lower", sessionId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to lower hand");
  }, [sessionId]);

  const acknowledgeHand = useCallback(
    async (handRaiseId: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", sessionId, handRaiseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to acknowledge hand raise");
    },
    [sessionId]
  );

  const activateHotSeat = useCallback(
    async (handRaiseId: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", sessionId, handRaiseId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to activate hot seat");
      return data.handRaise as HandRaise;
    },
    [sessionId]
  );

  const completeHotSeat = useCallback(
    async (handRaiseId: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", sessionId, handRaiseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to complete hot seat");
      dispatch(sessionActions.hotSeatCleared());
    },
    [sessionId, dispatch]
  );

  const dismissHand = useCallback(
    async (handRaiseId: string) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", sessionId, handRaiseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to dismiss hand raise");
    },
    [sessionId]
  );

  const extendTime = useCallback(
    async (handRaiseId: string, extraSeconds: number) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/hand-raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", sessionId, handRaiseId, extraSeconds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to extend time");
      return data.handRaise as HandRaise;
    },
    [sessionId]
  );

  // Queue sorted by raised_at (pending hands only)
  const queue = handRaises.data
    .filter((h) => h.status === "raised" || h.status === "acknowledged")
    .sort((a, b) => new Date(a.raisedAt).getTime() - new Date(b.raisedAt).getTime());

  return {
    queue,
    activeHotSeat: hotSeat.active,
    timerState: hotSeat.timerState,
    loading: handRaises.loading,
    raiseHand,
    lowerHand,
    acknowledgeHand,
    activateHotSeat,
    completeHotSeat,
    dismissHand,
    extendTime,
    refetch: fetchQueue,
  };
}
