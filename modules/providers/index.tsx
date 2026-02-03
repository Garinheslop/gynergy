"use client";
import { ReactNode } from "react";

import { InstallPrompt } from "@modules/pwa";

import AppContextProvider from "./context";
import StoreProvider from "./store";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AppContextProvider>
        {children}
        <InstallPrompt />
      </AppContextProvider>
    </StoreProvider>
  );
}
