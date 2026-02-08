"use client";

import { ToastProvider, ConfirmProvider } from "@modules/admin";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
