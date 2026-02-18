"use client";

import { FC, useState, useEffect, useRef, useCallback } from "react";

import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";

interface BlockUserButtonProps {
  userId: string;
  userName: string;
  onBlocked?: () => void;
  variant?: "menu-item" | "button";
}

const BlockUserButton: FC<BlockUserButtonProps> = ({
  userId,
  userName,
  onBlocked,
  variant = "menu-item",
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showConfirm) {
      dialog.showModal();
    } else {
      dialog.close();
      setError(null);
    }
  }, [showConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !blocking) {
        setShowConfirm(false);
      }
    },
    [blocking]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current && !blocking) {
        setShowConfirm(false);
      }
    },
    [blocking]
  );

  const handleBlock = async () => {
    setBlocking(true);
    setError(null);

    try {
      const response = await fetch("/api/community/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to block user");
      }

      triggerHaptic("success");
      setShowConfirm(false);
      onBlocked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
      {variant === "menu-item" ? (
        <button
          className="text-grey-300 hover:bg-bkg-dark-800 flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors"
          onClick={() => setShowConfirm(true)}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          Block User
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className={cn(
            "text-danger hover:bg-danger/10 min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:ring-action focus-visible:ring-2 focus-visible:outline-none"
          )}
        >
          Block User
        </button>
      )}

      {/* Confirmation Dialog */}
      <dialog
        ref={dialogRef}
        className="border-border-dark bg-bkg-dark-secondary fixed inset-0 z-50 m-auto max-w-sm overflow-hidden rounded-xl border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        onKeyDown={handleKeyDown}
        onClick={handleBackdropClick}
        aria-labelledby="block-confirm-title"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-danger/20 flex h-11 w-11 items-center justify-center rounded-full">
              <svg
                className="text-danger h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 id="block-confirm-title" className="text-content-light text-lg font-semibold">
              Block {userName}?
            </h2>
          </div>

          <p className="text-grey-300 mb-6 text-sm leading-relaxed">
            Blocking this user means you won&apos;t see their posts or comments, and they won&apos;t
            see yours. You can unblock them later from your settings.
          </p>

          {error && (
            <div className="border-danger/30 bg-danger/10 mb-4 rounded-lg border px-4 py-2.5">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={blocking}
              className={cn(
                "min-h-[44px] flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors",
                "border-border-dark text-grey-300 hover:bg-bkg-dark border",
                "focus-visible:ring-action focus-visible:ring-2 focus-visible:outline-none",
                "disabled:opacity-50"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={blocking}
              className={cn(
                "bg-danger hover:bg-danger/90 min-h-[44px] flex-1 rounded-lg px-4 py-2.5 font-medium text-white transition-colors",
                "focus-visible:ring-action focus-visible:ring-2 focus-visible:outline-none",
                "disabled:opacity-50"
              )}
            >
              {blocking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Blocking...
                </span>
              ) : (
                "Block"
              )}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default BlockUserButton;
