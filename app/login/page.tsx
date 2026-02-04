"use client";

import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Input from "@modules/common/components/Input";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import images from "@resources/images";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { updateUserProfileData } from "@store/modules/profile";

type AuthMode = "login" | "signup" | "name-input";

function LoginPageContent() {
  const { session, authenticating } = useSession();
  const router = useRouter();
  const supabase = createClient();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  const searchParams = useSearchParams();
  const authError = searchParams.get("error_description");
  const redirectTo = searchParams.get("redirect") || "/date-zero-gratitude";

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Handle session changes - redirect if logged in with complete profile
  useEffect(() => {
    if (session && profile.current) {
      if (!profile.current?.firstName && !profile.current?.lastName) {
        setAuthMode("name-input");
        setMessage("");
        setError("");
      } else {
        router.push(redirectTo);
      }
    }
  }, [session, profile.current, redirectTo, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err?.message ?? "Error signing in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      if (authMode === "signup") {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        // Validate password strength
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          },
        });
        if (error) throw error;

        setMessage("Check your email to confirm your account.");
      } else if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Session will be handled by useEffect above
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err?.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (err?.message?.includes("User already registered")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err?.message ?? "Authentication error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name");
      return;
    }
    dispatch(updateUserProfileData({ firstName: firstName.trim(), lastName: lastName.trim() }));
  };

  // Name input form for new users
  if (authMode === "name-input") {
    return (
      <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-[50px] overflow-hidden md:grid md:gap-0">
        <Image
          className="hidden h-full object-cover md:order-1 md:flex"
          src={images.banner.login}
          unoptimized
          height={1}
          width={1}
          alt="Welcome"
        />
        <div className="mx-auto flex w-full flex-col items-start justify-center gap-[40px] px-5 lg:gap-[50px] xl:w-[640px]">
          <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-[10px]">
            <Image
              className="h-[40px] w-auto"
              src={icons.dateZeroLogo}
              unoptimized
              height={1}
              width={1}
              alt="Gynergy"
            />
            <Heading variant={headingVariants.heading} sx="!font-bold md:text-start text-center">
              What should we call you?
            </Heading>
            <Paragraph
              content="Enter your first and last name to get started."
              variant={paragraphVariants.title}
              sx="text-content-dark-secondary md:text-start text-center"
            />
          </div>

          <form onSubmit={handleNameSubmit} className="flex w-full flex-col gap-5 md:gap-[30px]">
            <div className="flex w-full flex-col gap-[15px] md:flex-row">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={authenticating || isLoading || profile.updating}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={authenticating || isLoading || profile.updating}
              />
            </div>
            {error && (
              <Paragraph content={error} variant={paragraphVariants.regular} sx="text-red-500" />
            )}
            <ActionButton
              isSpinner
              label="Continue"
              icon="arrow-right-long"
              onClick={handleNameSubmit}
              isLoading={authenticating || isLoading || profile.updating}
              disabled={authenticating || isLoading || profile.updating}
              sx="flex-row-reverse"
            />
          </form>
        </div>
      </section>
    );
  }

  // Main login/signup form
  return (
    <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-[50px] overflow-hidden md:grid md:gap-0">
      <Image
        className="h-[300px] w-full object-contain md:h-full md:object-cover"
        src={images.banner.login}
        unoptimized
        height={1}
        width={1}
        alt="Welcome"
      />
      <div className="mx-auto flex w-full flex-col items-start justify-center gap-[30px] px-5 lg:gap-[40px] xl:w-[640px]">
        <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-[10px]">
          <Image
            className="h-[40px] w-auto"
            src={icons.dateZeroLogo}
            unoptimized
            height={1}
            width={1}
            alt="Gynergy"
          />
          <Heading variant={headingVariants.heading} sx="!font-bold md:text-start text-center">
            {authMode === "signup" ? "Create Your Account" : "Welcome Back"}
          </Heading>
          <Paragraph
            content={
              authMode === "signup"
                ? "Start your transformation journey today"
                : "Sign in to continue your journey"
            }
            variant={paragraphVariants.title}
            sx="text-content-dark-secondary md:text-start text-center"
          />
        </div>

        {message ? (
          <div className="w-full rounded-lg bg-green-50 p-4">
            <Paragraph
              content={message}
              variant={paragraphVariants.regular}
              sx="text-green-700 text-center sm:text-start"
            />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-5">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || authenticating}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3",
                "text-gray-700 transition-colors hover:bg-gray-50",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">
                {authMode === "signup" ? "Sign up with Google" : "Sign in with Google"}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading || authenticating}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading || authenticating}
              />
              {authMode === "signup" && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading || authenticating}
                />
              )}

              {error && (
                <Paragraph
                  content={error}
                  variant={paragraphVariants.regular}
                  sx="text-red-500 text-sm"
                />
              )}

              <ActionButton
                isSpinner
                label={authMode === "signup" ? "Create Account" : "Sign In"}
                onClick={handleEmailAuth}
                isLoading={isLoading || authenticating}
                disabled={isLoading || authenticating || !email || !password}
              />
            </form>

            {/* Toggle between login and signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setError("");
                  setMessage("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="text-action-600 hover:text-action-700 text-sm font-medium"
              >
                {authMode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Wrap with Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-bkg-light flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
