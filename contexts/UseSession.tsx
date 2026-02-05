"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";

import { createClient } from "@lib/supabase-client";
import useCheckEnrollmentSession from "@modules/book/hooks/useCheckEnrollmentSession";
import { BookSessionData } from "@resources/types/book";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserBookSessionData, updateUserStreak } from "@store/modules/enrollment";
import { getUserProfile, signOutAndReset } from "@store/modules/profile";

export type SessionContextType = {
  session: {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
    user: User;
  };
  bookSession: {
    isCompleted: boolean;
    latest: BookSessionData;
  };
  authenticating: boolean;
  logout: () => void;
};

interface User {
  id: string;
  supabaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
}

const UseSessionContext = createContext<SessionContextType | any>({});

export const useSession = () => useContext(UseSessionContext) as SessionContextType;

const UseSessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathName = usePathname();

  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  const currentBook = useSelector((state) => state.books.current);
  const enrollments = useSelector((state) => state.enrollments);

  const { bookSessionCompleted, latestBookSession } = useCheckEnrollmentSession();

  const [session, setSession] = useState<Session | null>(null);
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    if (authenticating && !profile?.loading) {
      setAuthenticating(false);
    }
  }, [profile]);

  // Initial auth check and subscription to auth state changes
  useEffect(() => {
    setAuthenticating(true);
    // checking if the auth cookies are stale. If its stale it will return no user.
    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData?.user) {
        setAuthenticating(false);
        // Don't redirect - just clear session state for anonymous visitors
        setSession(null);
      }
    };
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when authenticated and profile not loaded
  useEffect(() => {
    if (session?.user && !profile.loading && !profile.current?.id) {
      dispatch(getUserProfile());
    }
  }, [session, profile.current]);

  useEffect(() => {
    if (
      session &&
      currentBook?.id &&
      !enrollments?.loading &&
      dayjs().diff(enrollments.lastFetched, "h") > 1
    ) {
      dispatch(getUserBookSessionData(currentBook?.id));
    }
  }, [session, currentBook]);

  useEffect(() => {
    if (session && profile?.current) {
      setAuthenticating(false);
      // If user needs to complete profile, redirect to login page (which has the name form)
      if (!profile.current?.firstName && !profile.current?.lastName) {
        if (pathName !== "/login") {
          router.push("/login");
        }
      } else if (pathName === "/login") {
        // If user is fully logged in and on login page, redirect to dashboard
        router.push("/date-zero-gratitude");
      }
      // Don't redirect from "/" - the landing page handles its own redirect logic
    }
  }, [session, profile.current, pathName, router]);

  useEffect(() => {
    if (
      session &&
      enrollments?.current?.session?.id &&
      !enrollments.streak?.loading &&
      (!enrollments.streak.lastFetched || !dayjs().isSame(enrollments.streak.lastFetched, "d"))
    ) {
      dispatch(updateUserStreak(enrollments?.current?.session?.id));
    }
  }, [session, enrollments]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      dispatch(signOutAndReset());
      router.push("/");
    } catch (error) {
      // Logout error handled silently
    }
  };
  return (
    <UseSessionContext.Provider
      value={{
        //states
        authenticating,
        session,
        logout,
        bookSession: {
          isCompleted: bookSessionCompleted,
          latest: latestBookSession,
        },
      }}
    >
      {children}
    </UseSessionContext.Provider>
  );
};

export default UseSessionContextProvider;
