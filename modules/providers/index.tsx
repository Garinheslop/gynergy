"use client";
import { ReactNode } from "react";

import { InstallPrompt } from "@modules/pwa";

import AnalyticsProvider from "./AnalyticsProvider";
import AppContextProvider from "./context";
import StoreProvider from "./store";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AppContextProvider>
        <AnalyticsProvider>
          {children}
          <InstallPrompt />
        </AnalyticsProvider>
      </AppContextProvider>
    </StoreProvider>
  );
}
