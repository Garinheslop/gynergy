"use client";
import { ReactNode } from "react";
import AppContextProvider from "./context";
import StoreProvider from "./store";
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AppContextProvider>{children}</AppContextProvider>
    </StoreProvider>
  );
}
