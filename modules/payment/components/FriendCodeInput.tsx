"use client";

import { useState, useEffect } from "react";

import { cn } from "@lib/utils/style";
import { validateFriendCode } from "@store/modules/payment";

interface FriendCodeInputProps {
  onRedeem: (code: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  onClose?: () => void;
}

export default function FriendCodeInput({
  onRedeem,
  isLoading,
  error: externalError,
  success,
  onClose,
}: FriendCodeInputProps) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    message?: string;
    reason?: string;
  } | null>(null);

  // Debounced validation
  useEffect(() => {
    if (code.length >= 6) {
      const timer = setTimeout(async () => {
        setValidating(true);
        const result = await validateFriendCode(code);
        setValidation(result);
        setValidating(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setValidation(null);
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;

    await onRedeem(code.trim());
  };

  const formatCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    return cleaned;
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Redeem Friend Code</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Enter the friend code you received to join the 45-Day Awakening Challenge for free.
        </p>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-gray-900">Welcome to the Challenge!</h4>
            <p className="text-sm text-gray-600">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="friend-code" className="mb-2 block text-sm font-medium text-gray-700">
                Friend Code
              </label>
              <div className="relative">
                <input
                  id="friend-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(formatCode(e.target.value))}
                  placeholder="FRIEND-XXXXXX"
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-center font-mono text-lg tracking-wider",
                    "focus:ring-action-500 focus:border-transparent focus:ring-2 focus:outline-none",
                    externalError || (validation && !validation.valid)
                      ? "border-red-300 bg-red-50"
                      : validation?.valid
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300"
                  )}
                  maxLength={13}
                  disabled={isLoading}
                />
                {validating && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}
                {!validating && validation?.valid && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Validation message */}
              {validation && !validation.valid && (
                <p className="mt-2 text-sm text-red-600">{validation.reason}</p>
              )}
              {validation?.valid && (
                <p className="mt-2 text-sm text-green-600">{validation.message}</p>
              )}
              {externalError && <p className="mt-2 text-sm text-red-600">{externalError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !code.trim() || (validation !== null && !validation.valid)}
              className={cn(
                "w-full rounded-lg px-4 py-3 font-semibold transition-colors",
                "bg-action-600 hover:bg-action-700 text-white",
                "disabled:cursor-not-allowed disabled:bg-gray-300"
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Redeeming...
                </span>
              ) : (
                "Redeem Code"
              )}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-gray-500">
          Don&apos;t have a code?{" "}
          <button onClick={onClose} className="text-action-600 hover:underline">
            Purchase the challenge
          </button>{" "}
          and get 2 friend codes to share.
        </p>
      </div>
    </div>
  );
}
