"use client";

import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import type { GroupSession, SessionParticipant } from "@resources/types/session";
import { sessionRowToSession } from "@resources/types/session";
import type { RootState, AppDispatch } from "@store/configureStore";
import { sessionActions } from "@store/modules/session/reducers";

export function useSession() {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector((state: RootState) => state.session.sessions);
  const currentSession = useSelector((state: RootState) => state.session.currentSession);
  const connection = useSelector((state: RootState) => state.session.connection);

  const fetchUpcoming = useCallback(async () => {
    dispatch(sessionActions.sessionsRequested());
    try {
      const res = await fetch("/api/session?upcoming=true");
      const data = await res.json();
      dispatch(sessionActions.sessionsFetched({ sessions: data.sessions || [] }));
    } catch (err) {
      dispatch(
        sessionActions.sessionsFailed(
          err instanceof Error ? err.message : "Failed to fetch sessions"
        )
      );
    }
  }, [dispatch]);

  const fetchSession = useCallback(
    async (sessionId: string) => {
      dispatch(sessionActions.currentSessionRequested());
      try {
        const res = await fetch(`/api/session?id=${sessionId}`);
        const data = await res.json();
        if (data.error) {
          dispatch(sessionActions.currentSessionFailed(data.error));
          return null;
        }
        dispatch(
          sessionActions.currentSessionFetched({
            session: data.session,
            participants: data.participants || [],
          })
        );
        return data.session as GroupSession;
      } catch (err) {
        dispatch(
          sessionActions.currentSessionFailed(err instanceof Error ? err.message : "Failed")
        );
        return null;
      }
    },
    [dispatch]
  );

  const createSession = useCallback(
    async (params: {
      title: string;
      description?: string;
      sessionType?: string;
      scheduledStart: string;
      scheduledEnd?: string;
      maxParticipants?: number;
      hotSeatEnabled?: boolean;
      hotSeatDurationSeconds?: number;
      breakoutEnabled?: boolean;
      chatEnabled?: boolean;
      recordingEnabled?: boolean;
    }) => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...params }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create session");
      return data.session as GroupSession;
    },
    []
  );

  const joinSession = useCallback(
    async (sessionId: string) => {
      dispatch(sessionActions.connectionStarted());
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", sessionId }),
        });
        const data = await res.json();
        if (!data.success) {
          dispatch(sessionActions.connectionFailed(data.error || "Failed to join"));
          return null;
        }
        dispatch(sessionActions.connectionEstablished({ authToken: data.authToken }));
        dispatch(
          sessionActions.currentSessionFetched({
            session: data.session,
            participants: data.participants || [],
          })
        );
        return {
          authToken: data.authToken as string,
          role: data.role as string,
          session: data.session as GroupSession,
          participants: data.participants as SessionParticipant[],
        };
      } catch (err) {
        dispatch(sessionActions.connectionFailed(err instanceof Error ? err.message : "Failed"));
        return null;
      }
    },
    [dispatch]
  );

  const startSession = useCallback(
    async (sessionId: string) => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", sessionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start session");
      dispatch(sessionActions.sessionUpdated(data.session));
      return sessionRowToSession(data.session);
    },
    [dispatch]
  );

  const leaveSession = useCallback(
    async (sessionId: string) => {
      dispatch(sessionActions.connectionClosed());
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", sessionId }),
      });
    },
    [dispatch]
  );

  const endSession = useCallback(
    async (sessionId: string) => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to end session");
      dispatch(sessionActions.connectionClosed());
      if (data.session) {
        dispatch(sessionActions.sessionUpdated(data.session));
      }
    },
    [dispatch]
  );

  const clearSession = useCallback(() => {
    dispatch(sessionActions.currentSessionCleared());
    dispatch(sessionActions.connectionClosed());
  }, [dispatch]);

  return {
    sessions,
    currentSession,
    connection,
    fetchUpcoming,
    fetchSession,
    createSession,
    joinSession,
    startSession,
    leaveSession,
    endSession,
    clearSession,
  };
}
