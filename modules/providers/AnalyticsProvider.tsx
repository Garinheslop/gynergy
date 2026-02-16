"use client";

import { useEffect, type ReactNode } from "react";

import { analytics, consoleProvider, createLocalStorageProvider } from "@lib/utils/analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics Provider
 *
 * Initializes analytics on mount with appropriate providers based on environment.
 * In development: Console + localStorage providers for debugging
 * In production: Would add real providers (Amplitude, Mixpanel, etc.)
 */
export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";

    // Initialize analytics with providers
    analytics.init({
      debug: isDev,
      disabled: false,
      providers: isDev
        ? [consoleProvider, createLocalStorageProvider("gynergy_analytics")]
        : [
            // Production providers would go here
            // e.g., createAmplitudeProvider(), createMixpanelProvider()
            createLocalStorageProvider("gynergy_analytics"),
          ],
      batchSize: 10,
      flushInterval: isDev ? 2000 : 5000,
    });

    // Log initialization
    if (isDev) {
      console.log(
        "[Analytics] Initialized with providers:",
        isDev ? "console, localStorage" : "localStorage"
      );
    }

    return () => {
      // Flush any remaining events on unmount
      analytics.flush();
    };
  }, []);

  return <>{children}</>;
}
