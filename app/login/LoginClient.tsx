"use client";

import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
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

type AuthMode = "login" | "signup" | "name-input" | "forgot-password";

type MessageType = "success" | "info";

interface StatusMessage {
  text: string;
  type: MessageType;
  title?: string;
}

// Email icon for status messages
function EmailIcon() {
  return (
    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

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
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Handle session changes - redirect if logged in with complete profile
  useEffect(() => {
    const currentProfile = profile.current;
    if (session && currentProfile) {
      if (!currentProfile?.firstName && !currentProfile?.lastName) {
        setAuthMode("name-input");
        setStatusMessage(null);
        setError("");
      } else {
        router.push(redirectTo);
      }
    }
  }, [session, profile, redirectTo, router]);

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
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.error("Google sign in error:", err);
      setError(authErr?.message ?? "Error signing in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.error("Apple sign in error:", err);
      setError(authErr?.message ?? "Error signing in with Apple. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
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

        setStatusMessage({
          type: "success",
          title: "Check your email",
          text: `We've sent a confirmation link to ${email}. Click the link in your email to activate your account.`,
        });
      } else if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Session will be handled by useEffect above
      }
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.error("Auth error:", err);
      if (authErr?.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (authErr?.message?.includes("User already registered")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(authErr?.message ?? "Authentication error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;

      setStatusMessage({
        type: "success",
        title: "Reset link sent",
        text: `If an account exists for ${email}, you'll receive a password reset link shortly. Check your inbox and spam folder.`,
      });
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.error("Password reset error:", err);
      setError(authErr?.message ?? "Failed to send reset email. Please try again.");
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

  const switchToMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");
    setStatusMessage(null);
    if (mode !== "forgot-password") {
      setPassword("");
      setConfirmPassword("");
    }
  };

  // Name input form for new users
  if (authMode === "name-input") {
    return (
      <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
        <Image
          className="hidden h-full object-cover md:order-1 md:flex"
          src={images.banner.login}
          unoptimized
          height={1}
          width={1}
          alt="Welcome"
        />
        <div className="mx-auto flex w-full flex-col items-start justify-center gap-10 px-5 lg:gap-12 xl:w-[640px]">
          <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-2.5">
            <Image
              className="h-10 w-auto"
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

          <form onSubmit={handleNameSubmit} className="flex w-full flex-col gap-5 md:gap-8">
            <div className="flex w-full flex-col gap-4 md:flex-row">
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

  // Forgot password form
  if (authMode === "forgot-password") {
    return (
      <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
        <Image
          className="h-[300px] w-full object-contain md:h-full md:object-cover"
          src={images.banner.login}
          unoptimized
          height={1}
          width={1}
          alt="Welcome"
        />
        <div className="mx-auto flex w-full flex-col items-start justify-center gap-8 px-5 lg:gap-10 xl:w-[640px]">
          <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-2.5">
            <Image
              className="h-10 w-auto"
              src={icons.dateZeroLogo}
              unoptimized
              height={1}
              width={1}
              alt="Gynergy"
            />
            <Heading variant={headingVariants.heading} sx="!font-bold md:text-start text-center">
              Reset Your Password
            </Heading>
            <Paragraph
              content="Enter your email and we'll send you a link to reset your password."
              variant={paragraphVariants.title}
              sx="text-content-dark-secondary md:text-start text-center"
            />
          </div>

          {statusMessage ? (
            <div
              className={cn(
                "w-full rounded-lg p-6",
                statusMessage.type === "success" ? "bg-green-50" : "bg-blue-50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <EmailIcon />
                </div>
                <div className="flex-1">
                  {statusMessage.title && (
                    <h3 className="mb-1 font-semibold text-green-800">{statusMessage.title}</h3>
                  )}
                  <p className="text-sm text-green-700">{statusMessage.text}</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => switchToMode("login")}
                  className="text-action-600 hover:text-action-700 text-sm font-medium"
                >
                  ← Back to sign in
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-5">
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                />

                {error && (
                  <Paragraph
                    content={error}
                    variant={paragraphVariants.regular}
                    sx="text-red-500 text-sm"
                  />
                )}

                <ActionButton
                  isSpinner
                  label="Send Reset Link"
                  onClick={handleForgotPassword}
                  isLoading={isLoading}
                  disabled={isLoading || !email}
                />
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchToMode("login")}
                  className="text-action-600 hover:text-action-700 text-sm font-medium"
                >
                  ← Back to sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Main login/signup form
  return (
    <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
      <Image
        className="h-[300px] w-full object-contain md:h-full md:object-cover"
        src={images.banner.login}
        unoptimized
        height={1}
        width={1}
        alt="Welcome"
      />
      <div className="mx-auto flex w-full flex-col items-start justify-center gap-8 px-5 lg:gap-10 xl:w-[640px]">
        {/* Back to home link */}
        <Link
          href="/"
          className="text-content-dark-secondary hover:text-content-dark flex items-center gap-2 text-sm transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to home
        </Link>

        <div className="flex w-full flex-col items-center justify-center gap-5 md:items-start md:justify-start md:gap-2.5">
          <Image
            className="h-10 w-auto"
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

        {statusMessage ? (
          <div
            className={cn(
              "w-full rounded-lg p-6",
              statusMessage.type === "success" ? "bg-green-50" : "bg-blue-50"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <EmailIcon />
              </div>
              <div className="flex-1">
                {statusMessage.title && (
                  <h3
                    className={cn(
                      "mb-1 font-semibold",
                      statusMessage.type === "success" ? "text-green-800" : "text-blue-800"
                    )}
                  >
                    {statusMessage.title}
                  </h3>
                )}
                <p
                  className={cn(
                    "text-sm",
                    statusMessage.type === "success" ? "text-green-700" : "text-blue-700"
                  )}
                >
                  {statusMessage.text}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusMessage(null);
                  setError("");
                }}
                className="text-action-600 hover:text-action-700 text-sm font-medium"
              >
                Try again with a different email
              </button>
            </div>
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

            {/* Apple Sign In Button (Apple Guideline 4.8 — required when offering Google OAuth) */}
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isLoading || authenticating}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-lg border border-black bg-black px-4 py-3",
                "text-white transition-colors hover:bg-gray-900",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="font-medium">
                {authMode === "signup" ? "Sign up with Apple" : "Sign in with Apple"}
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
              <div>
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
                {authMode === "login" && (
                  <div className="mt-1 text-right">
                    <button
                      type="button"
                      onClick={() => switchToMode("forgot-password")}
                      className="text-action-600 hover:text-action-700 text-xs font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
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
                onClick={() => switchToMode(authMode === "login" ? "signup" : "login")}
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
export default function LoginClient() {
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
