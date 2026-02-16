"use client";

import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@lib/supabase-client";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Input from "@modules/common/components/Input";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import images from "@resources/images";
import { headingVariants, paragraphVariants } from "@resources/variants";

type ResetState = "loading" | "ready" | "success" | "error" | "expired";

function CheckIcon() {
  return (
    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClient();
  const _searchParams = useSearchParams();

  const [resetState, setResetState] = useState<ResetState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      // Supabase handles the token exchange automatically via the URL hash
      // We need to check if there's a valid session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);
        setResetState("expired");
        return;
      }

      if (data.session) {
        setResetState("ready");
      } else {
        // No session - link may have expired or been used
        setResetState("expired");
      }
    };

    // Small delay to allow Supabase to process the hash
    const timer = setTimeout(checkSession, 500);
    return () => clearTimeout(timer);
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setResetState("success");
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      console.error("Password reset error:", err);

      if (authErr?.message?.includes("same password")) {
        setError("New password must be different from your current password");
      } else {
        setError(authErr?.message ?? "Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (resetState === "loading") {
    return (
      <section className="bg-bkg-light flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </section>
    );
  }

  // Expired or invalid link
  if (resetState === "expired") {
    return (
      <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
        <Image
          className="h-[300px] w-full object-contain md:h-full md:object-cover"
          src={images.banner.login}
          unoptimized
          height={1}
          width={1}
          alt="Reset Password"
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
              Link Expired
            </Heading>
            <Paragraph
              content="This password reset link has expired or has already been used."
              variant={paragraphVariants.title}
              sx="text-content-dark-secondary md:text-start text-center"
            />
          </div>

          <div className="w-full rounded-lg bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-amber-800">Reset link invalid</h3>
                <p className="text-sm text-amber-700">
                  Password reset links are valid for 1 hour. Please request a new link to reset your
                  password.
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Link href="/login" className="w-full">
              <ActionButton label="Request New Reset Link" onClick={() => {}} sx="w-full" />
            </Link>
            <div className="text-center">
              <Link
                href="/login"
                className="text-action-600 hover:text-action-700 text-sm font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Success state
  if (resetState === "success") {
    return (
      <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
        <Image
          className="h-[300px] w-full object-contain md:h-full md:object-cover"
          src={images.banner.login}
          unoptimized
          height={1}
          width={1}
          alt="Success"
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
              Password Updated!
            </Heading>
            <Paragraph
              content="Your password has been successfully reset."
              variant={paragraphVariants.title}
              sx="text-content-dark-secondary md:text-start text-center"
            />
          </div>

          <div className="w-full rounded-lg bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CheckIcon />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-green-800">Success!</h3>
                <p className="text-sm text-green-700">
                  You can now sign in with your new password. You&apos;ll be redirected shortly...
                </p>
              </div>
            </div>
          </div>

          <ActionButton
            label="Continue to Dashboard"
            onClick={() => router.push("/date-zero-gratitude")}
            sx="w-full"
          />
        </div>
      </section>
    );
  }

  // Ready state - show reset form
  return (
    <section className="bg-bkg-light flex h-screen grid-cols-2 flex-col items-center justify-center gap-12 overflow-hidden md:grid md:gap-0">
      <Image
        className="h-[300px] w-full object-contain md:h-full md:object-cover"
        src={images.banner.login}
        unoptimized
        height={1}
        width={1}
        alt="Reset Password"
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
            Create New Password
          </Heading>
          <Paragraph
            content="Enter your new password below. Make sure it's at least 8 characters."
            variant={paragraphVariants.title}
            sx="text-content-dark-secondary md:text-start text-center"
          />
        </div>

        <form onSubmit={handleResetPassword} className="flex w-full flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
          />

          {/* Password requirements hint */}
          <div className="text-xs text-gray-500">
            <p>Password must:</p>
            <ul className="mt-1 list-inside list-disc">
              <li className={cn(password.length >= 8 ? "text-green-600" : "")}>
                Be at least 8 characters
              </li>
              <li
                className={cn(
                  password && confirmPassword && password === confirmPassword
                    ? "text-green-600"
                    : ""
                )}
              >
                Match in both fields
              </li>
            </ul>
          </div>

          {error && (
            <Paragraph
              content={error}
              variant={paragraphVariants.regular}
              sx="text-red-500 text-sm"
            />
          )}

          <ActionButton
            isSpinner
            label="Reset Password"
            onClick={handleResetPassword}
            isLoading={isLoading}
            disabled={isLoading || !password || !confirmPassword}
          />
        </form>

        <div className="text-center">
          <Link href="/login" className="text-action-600 hover:text-action-700 text-sm font-medium">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-bkg-light flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
