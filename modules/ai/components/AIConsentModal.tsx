"use client";

import { FC, useState, useEffect, useRef, useCallback } from "react";

import { cn } from "@lib/utils/style";

interface AIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const AIConsentModal: FC<AIConsentModalProps> = ({ isOpen, onAccept, onDecline }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      acceptButtonRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onDecline();
      }
    },
    [submitting, onDecline]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current && !submitting) {
        onDecline();
      }
    },
    [submitting, onDecline]
  );

  const handleAccept = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ai_chat" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record consent");
      }

      onAccept();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="border-border-dark bg-bkg-dark-secondary fixed inset-0 z-50 m-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      aria-labelledby="ai-consent-title"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="bg-action/20 flex h-11 w-11 items-center justify-center rounded-full">
            <svg
              className="text-action h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>
          <h2 id="ai-consent-title" className="text-content-light text-lg font-semibold">
            AI Coaching Disclosure
          </h2>
        </div>

        {/* Body */}
        <div className="text-grey-300 mb-6 space-y-4 text-sm leading-relaxed">
          <p>
            Gynergy&apos;s AI coaching feature uses{" "}
            <strong className="text-content-light">Anthropic&apos;s Claude</strong> to provide
            personalized wellness guidance. Before using this feature, please understand:
          </p>

          <div className="border-border-dark space-y-3 rounded-lg border p-4">
            <div className="flex gap-3">
              <svg
                className="text-action mt-0.5 h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              <p>
                <strong className="text-content-light">Data Processing:</strong> Your chat messages
                are sent to Anthropic&apos;s servers for processing. Anthropic may use this data in
                accordance with their privacy policy.
              </p>
            </div>

            <div className="flex gap-3">
              <svg
                className="text-action mt-0.5 h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p>
                <strong className="text-content-light">What&apos;s Shared:</strong> Your messages,
                selected coach character, and session context. We do not share your journal entries,
                personal profile, or payment information with AI providers.
              </p>
            </div>

            <div className="flex gap-3">
              <svg
                className="text-action mt-0.5 h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                <strong className="text-content-light">Not Medical Advice:</strong> AI coaching is
                for wellness support only and is not a substitute for professional medical, mental
                health, or therapeutic advice.
              </p>
            </div>
          </div>

          <p className="text-grey-400 text-xs">
            By accepting, you consent to the processing of your chat data by Anthropic as described
            above. You can withdraw consent at any time in your account settings. See our{" "}
            <a href="/privacy" className="text-action hover:underline">
              Privacy Policy
            </a>{" "}
            for more details.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-danger/30 bg-danger/10 mb-4 rounded-lg border px-4 py-2.5">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            disabled={submitting}
            className={cn(
              "min-h-[44px] flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors",
              "border-border-dark text-grey-300 hover:bg-bkg-dark border",
              "focus-visible:ring-action focus-visible:ring-2 focus-visible:outline-none",
              "disabled:opacity-50"
            )}
          >
            Decline
          </button>
          <button
            ref={acceptButtonRef}
            onClick={handleAccept}
            disabled={submitting}
            className={cn(
              "min-h-[44px] flex-1 rounded-lg px-4 py-2.5 font-medium text-white transition-colors",
              "bg-action hover:bg-action-100",
              "focus-visible:ring-action focus-visible:ring-2 focus-visible:outline-none",
              "disabled:opacity-50"
            )}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Accepting...
              </span>
            ) : (
              "Accept & Continue"
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default AIConsentModal;
