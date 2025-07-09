"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { createClient } from "@lib/supabase-client";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserProfile, signOutAndReset } from "@store/modules/profile";
import { RootState } from "@store/configureStore";
import { getUserBookSessionData, updateUserStreak } from "@store/modules/enrollment";
import useCheckEnrollmentSession from "@modules/book/hooks/useCheckEnrollmentSession";
import { BookSessionData } from "@resources/types/book";
import { usePathname, useRouter } from "next/navigation";
import dayjs from "dayjs";

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
        logout();
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
      if (!profile.current?.firstName && !profile.current?.lastName) {
        router.push("/");
      } else if (pathName === "/") {
        router.push("/date-zero-gratitude");
      }
    }
  }, [session, profile.current, pathName]);

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
    console.log("logged out");

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      dispatch(signOutAndReset());
      router.push("/");
    } catch (error) {
      console.log("logout ====> ", error);
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
