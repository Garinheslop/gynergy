"use client";

import { ToastProvider } from "@modules/admin";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
