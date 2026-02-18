"use client";

import { FC, useState, useEffect, useRef, useCallback } from "react";

import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";

const REPORT_REASONS = [
  {
    value: "spam",
    label: "Spam or misleading",
    svgPath:
      "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
  {
    value: "harassment",
    label: "Harassment or bullying",
    svgPath:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  {
    value: "hate_speech",
    label: "Hate speech",
    svgPath:
      "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01",
  },
  {
    value: "misinformation",
    label: "Misinformation",
    svgPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate content",
    svgPath:
      "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  },
  {
    value: "self_harm",
    label: "Self-harm or dangerous behavior",
    svgPath:
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    value: "other",
    label: "Other",
    svgPath:
      "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  },
] as const;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: "post" | "comment";
  contentId: string;
  onSuccess?: () => void;
}

const ReportModal: FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else {
      dialog.close();
      // Reset state when closing
      setSelectedReason(null);
      setDetails("");
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    },
    [submitting, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current && !submitting) {
        onClose();
      }
    },
    [submitting, onClose]
  );

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSubmitted(true);
      triggerHaptic("success");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="border-border-light bg-bkg-light fixed inset-0 z-50 m-auto max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      aria-labelledby="report-title"
    >
      <div className="p-6">
        {submitted ? (
          /* Success State */
          <div className="text-center">
            <div className="bg-success/20 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
              <svg
                className="text-success h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-content-dark mb-2 text-lg font-semibold">Report Submitted</h2>
            <p className="text-grey-500 mb-6 text-sm">
              Thank you for helping keep our community safe. Our team will review this report.
            </p>
            <button
              onClick={onClose}
              className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action min-h-[44px] w-full rounded-lg px-4 py-2.5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 id="report-title" className="text-content-dark text-lg font-semibold">
                Report {contentType === "post" ? "Post" : "Comment"}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                disabled={submitting}
                aria-label="Close"
                className="text-grey-500 hover:text-content-dark focus-visible:ring-action flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Reason Selection */}
            <fieldset className="mb-4 border-none p-0">
              <legend className="text-grey-500 mb-3 text-sm font-medium">
                Why are you reporting this?
              </legend>
              <div className="space-y-2">
                {REPORT_REASONS.map(({ value, label, svgPath }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedReason(value)}
                    className={cn(
                      "focus-visible:ring-action flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      selectedReason === value
                        ? "border-action bg-action-50 text-content-dark"
                        : "border-border-light text-content-dark-secondary hover:border-grey-400 hover:bg-grey-100"
                    )}
                  >
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={svgPath}
                      />
                    </svg>
                    <span>{label}</span>
                    {selectedReason === value && (
                      <svg
                        className="text-action-600 ml-auto h-5 w-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Additional Details */}
            {selectedReason && (
              <div className="mb-4">
                <label
                  htmlFor="report-details"
                  className="text-grey-500 mb-1.5 block text-sm font-medium"
                >
                  Additional details (optional)
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  rows={3}
                  maxLength={500}
                  className="border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-400 focus:border-action w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none"
                />
                <p className="text-grey-400 mt-1 text-right text-xs">{details.length}/500</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border-danger/30 bg-danger/10 mb-4 rounded-lg border px-4 py-2.5">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
              className="bg-danger hover:bg-danger/90 focus-visible:ring-action min-h-[44px] w-full rounded-lg px-4 py-2.5 font-medium text-white transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </span>
              ) : (
                "Submit Report"
              )}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
};

export default ReportModal;
