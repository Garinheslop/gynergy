"use client";

import { useState, useEffect, useRef } from "react";

import { cn } from "@lib/utils/style";

interface ExitIntentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => Promise<void>;
}

export default function ExitIntentPopup({ isOpen, onClose, onSubmit }: ExitIntentPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management: Focus input when opened, restore focus when closed
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the email input after a brief delay for animation
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Restore focus to previous element when closing
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit?.(email);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setEmail("");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200]",
        "flex items-center justify-center",
        "bg-black/85 backdrop-blur-sm",
        "p-4"
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      <div
        className={cn(
          "relative w-full max-w-[500px]",
          "bg-lp-card border-lp-gold border",
          "p-8 md:p-12",
          "text-center"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4",
            "font-oswald text-lp-muted text-xl",
            "hover:text-lp-white transition-colors",
            "cursor-pointer border-none bg-transparent p-1",
            "focus-visible:ring-lp-gold focus:outline-none focus-visible:ring-2"
          )}
          aria-label="Close popup"
        >
          ×
        </button>

        {submitted ? (
          <>
            <h3 id="exit-intent-title" className="font-bebas text-lp-gold-light mb-2 text-2xl">
              You&apos;re In!
            </h3>
            <p className="font-oswald text-lp-gray text-sm font-light">
              Check your email for exclusive details.
            </p>
          </>
        ) : (
          <>
            <h3
              id="exit-intent-title"
              className="font-bebas text-lp-white mb-2 text-2xl md:text-3xl"
            >
              Wait — Before You Go
            </h3>
            <p className="font-oswald text-lp-gray mb-6 text-sm leading-relaxed font-light md:text-base">
              Get the free &ldquo;5 Pillar Assessment&rdquo; to discover which area of your life is
              silently sabotaging the others.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                aria-label="Email address"
                className={cn(
                  "flex-1",
                  "font-oswald text-sm font-light",
                  "px-4 py-3",
                  "bg-lp-black border-lp-border border",
                  "text-lp-white placeholder:text-lp-muted",
                  "outline-none",
                  "focus:border-lp-gold focus:ring-lp-gold transition-colors focus:ring-1"
                )}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "font-oswald text-xs font-medium tracking-widest uppercase",
                  "px-6 py-3",
                  "bg-lp-gold text-lp-black",
                  "cursor-pointer border-none",
                  "transition-all duration-300",
                  "hover:bg-lp-gold-light",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  "focus-visible:ring-lp-gold-light focus-visible:ring-offset-lp-card focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                )}
              >
                {isSubmitting ? "..." : "Get It Free"}
              </button>
            </form>

            {error && (
              <p className="font-oswald mt-3 text-xs font-light text-red-400" role="alert">
                {error}
              </p>
            )}

            <p className="font-oswald text-lp-muted mt-4 text-xs font-light">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
