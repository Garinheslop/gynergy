"use client";

import { Component, type ReactNode } from "react";

import { cn } from "@lib/utils/style";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AssessmentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error("Assessment Error:", error, errorInfo);

    // Track the error (using beacon for reliability)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/beacon",
        JSON.stringify({
          event: "assessment_error",
          properties: {
            error_message: error.message,
            error_stack: error.stack?.slice(0, 500),
            component_stack: errorInfo.componentStack?.slice(0, 500),
            url: typeof window !== "undefined" ? window.location.href : null,
            timestamp: Date.now(),
          },
        })
      );
    }
  }

  handleRetry = () => {
    // Clear any corrupted localStorage data
    try {
      localStorage.removeItem("gynergy_assessment_v3_progress");
    } catch {
      // Ignore localStorage errors
    }

    // Reset error state and reload
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  handleResume = () => {
    // Just reset the error state, let the component try to recover
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "text-lp-white font-oswald",
            "relative min-h-screen",
            "flex flex-col items-center justify-center",
            "px-4 py-8 sm:px-6 sm:py-12"
          )}
          style={{
            background: `
              radial-gradient(ellipse 50% 42% at 50% 45%, rgba(184,148,62,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 100% 100% at 50% 50%, #0D0C0A 0%, #050505 80%)
            `,
          }}
        >
          <div className="max-w-md text-center">
            {/* Icon */}
            <div className="mb-6">
              <svg
                className="text-lp-gold mx-auto h-16 w-16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 className="font-bebas text-lp-white mb-4 text-3xl">Something Went Wrong</h2>

            <p className="font-oswald text-lp-gray mb-6 text-base font-extralight">
              Don&apos;t worry — your progress has been saved. You can try to continue where you
              left off, or start fresh.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleResume}
                className={cn(
                  "px-6 py-3",
                  "font-oswald text-sm font-medium tracking-wider uppercase",
                  "bg-lp-gold text-lp-black",
                  "hover:bg-lp-gold-light",
                  "transition-colors"
                )}
              >
                Try to Continue
              </button>
              <button
                onClick={this.handleRetry}
                className={cn(
                  "px-6 py-3",
                  "font-oswald text-sm font-medium tracking-wider uppercase",
                  "border-lp-border text-lp-gray border",
                  "hover:border-lp-gold hover:text-lp-white",
                  "transition-colors"
                )}
              >
                Start Fresh
              </button>
            </div>

            <p className="font-oswald text-lp-muted mt-8 text-xs">
              If this keeps happening, please contact{" "}
              <a href="mailto:support@gynergy.app" className="text-lp-gold hover:underline">
                support@gynergy.app
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
