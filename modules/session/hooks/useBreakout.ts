"use client";

import { useCallback, useEffect, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { createClient } from "@lib/supabase-client";
import type {
  BreakoutRoom,
  BreakoutRoomRow,
  BreakoutAssignmentMethod,
} from "@resources/types/session";
import { breakoutRowToBreakout } from "@resources/types/session";
import type { RootState, AppDispatch } from "@store/configureStore";
import { sessionActions } from "@store/modules/session/reducers";

export function useBreakout(sessionId: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const breakoutRooms = useSelector((state: RootState) => state.session.breakoutRooms);
  const breakoutConnection = useSelector((state: RootState) => state.session.breakoutConnection);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!sessionId) return null;
    try {
      const res = await fetch(`/api/session/breakout?sessionId=${sessionId}`);
      const data = await res.json();
      dispatch(sessionActions.breakoutRoomsFetched(data.breakoutRooms || []));
      return data.myBreakoutRoomId as string | null;
    } catch (err) {
      console.error("Failed to fetch breakout rooms:", err);
      return null;
    }
  }, [sessionId, dispatch]);

  // Realtime subscription on breakout_rooms
  useEffect(() => {
    if (!sessionId) return;

    fetchRooms();

    const supabase = createClient();
    const channel = supabase
      .channel(`session-breakouts-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "breakout_rooms",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const room = breakoutRowToBreakout(payload.new as BreakoutRoomRow);
            dispatch(sessionActions.breakoutRoomUpdated(room));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    const fallback = setInterval(fetchRooms, 30000);

    return () => {
      clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchRooms, dispatch]);

  // Actions
  const createBreakouts = useCallback(
    async (
      rooms: Array<{ name: string; topic?: string }>,
      assignmentMethod: BreakoutAssignmentMethod = "random",
      durationSeconds: number = 600
    ) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          sessionId,
          rooms,
          assignmentMethod,
          durationSeconds,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create breakout rooms");
      dispatch(sessionActions.breakoutRoomsFetched(data.breakoutRooms));
      return data.breakoutRooms as BreakoutRoom[];
    },
    [sessionId, dispatch]
  );

  const assignParticipants = useCallback(
    async (assignments: Array<{ userId: string; breakoutRoomId: string }>) => {
      if (!sessionId) return;
      const res = await fetch("/api/session/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", sessionId, assignments }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to assign participants");
    },
    [sessionId]
  );

  const startBreakouts = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch("/api/session/breakout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", sessionId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to start breakouts");
    dispatch(sessionActions.breakoutRoomsFetched(data.breakoutRooms));
    return data.breakoutRooms as BreakoutRoom[];
  }, [sessionId, dispatch]);

  const joinBreakout = useCallback(
    async (breakoutRoomId: string) => {
      if (!sessionId) return null;
      const res = await fetch("/api/session/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join-breakout", sessionId, breakoutRoomId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to join breakout");
      dispatch(
        sessionActions.enteredBreakout({
          breakoutRoomId,
          authToken: data.authToken,
        })
      );
      return {
        authToken: data.authToken as string,
        hmsRoomId: data.hmsRoomId as string,
        breakoutRoom: data.breakoutRoom as BreakoutRoom,
      };
    },
    [sessionId, dispatch]
  );

  const hostSwitchRoom = useCallback(
    async (breakoutRoomId: string) => {
      if (!sessionId) return null;
      const res = await fetch("/api/session/breakout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "host-switch", sessionId, breakoutRoomId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to switch rooms");
      dispatch(
        sessionActions.enteredBreakout({
          breakoutRoomId,
          authToken: data.authToken,
        })
      );
      return {
        authToken: data.authToken as string,
        hmsRoomId: data.hmsRoomId as string,
      };
    },
    [sessionId, dispatch]
  );

  const returnToMain = useCallback(async () => {
    if (!sessionId) return;
    await fetch("/api/session/breakout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", sessionId }),
    });
    dispatch(sessionActions.exitedBreakout());
  }, [sessionId, dispatch]);

  const closeBreakouts = useCallback(async () => {
    if (!sessionId) return;
    await fetch("/api/session/breakout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", sessionId }),
    });
    dispatch(sessionActions.exitedBreakout());
    dispatch(sessionActions.breakoutRoomsCleared());
  }, [sessionId, dispatch]);

  const exitBreakout = useCallback(() => {
    dispatch(sessionActions.exitedBreakout());
  }, [dispatch]);

  // Derived state
  const activeRooms = breakoutRooms.data.filter((r) => r.status === "active");
  const returningRooms = breakoutRooms.data.filter((r) => r.status === "returning");
  const hasActiveBreakouts = activeRooms.length > 0;
  const isReturning = returningRooms.length > 0;

  return {
    rooms: breakoutRooms.data,
    activeRooms,
    isInBreakout: breakoutConnection.isInBreakout,
    currentBreakoutId: breakoutConnection.breakoutRoomId,
    hasActiveBreakouts,
    isReturning,
    loading: breakoutRooms.loading,
    createBreakouts,
    assignParticipants,
    startBreakouts,
    joinBreakout,
    hostSwitchRoom,
    returnToMain,
    closeBreakouts,
    exitBreakout,
    refetch: fetchRooms,
  };
}
