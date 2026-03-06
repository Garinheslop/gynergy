"use client";

import { useState, useCallback } from "react";

import { cn } from "@lib/utils/style";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;

      setSubmitting(true);
      setError("");

      try {
        const response = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: firstName || undefined,
            source: "full_cohort",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to join waitlist");
        }

        setSubmitted(true);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, firstName]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn("relative w-full max-w-md", "border-lp-gold bg-lp-card border", "p-8")}>
        <button
          onClick={onClose}
          className="text-lp-muted hover:text-lp-white absolute top-4 right-4 text-xl transition-colors"
          aria-label="Close"
        >
          &times;
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="font-bebas text-lp-gold-light mb-4 text-4xl">You&apos;re In.</div>
            <p className="font-oswald text-lp-gray text-sm font-light">
              We&apos;ll email you the moment the next cohort opens. You&apos;ll get first access
              before it goes public.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="font-bebas text-lp-gold-light mb-2 text-3xl">This Cohort Is Full</div>
              <p className="font-oswald text-lp-gray text-sm font-light">
                Join the waitlist and be first to know when the next cohort opens. Waitlist members
                get priority enrollment.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="First Name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="font-oswald border-lp-border bg-lp-dark text-lp-white placeholder:text-lp-muted focus:border-lp-gold w-full border px-4 py-3 text-sm font-light tracking-wide focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-oswald border-lp-border bg-lp-dark text-lp-white placeholder:text-lp-muted focus:border-lp-gold w-full border px-4 py-3 text-sm font-light tracking-wide focus:outline-none"
              />

              {error && <p className="font-oswald text-sm font-light text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !email}
                className={cn(
                  "bg-lp-gold text-lp-bg font-oswald w-full py-3 text-sm font-semibold tracking-wider uppercase transition-opacity",
                  submitting ? "cursor-wait opacity-60" : "hover:opacity-90"
                )}
              >
                {submitting ? "Joining..." : "Join the Waitlist"}
              </button>

              <p className="font-oswald text-lp-muted text-center text-xs font-extralight">
                No spam. Just one email when the next cohort opens.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
