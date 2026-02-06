"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { QuickSearch } from "./QuickSearch";
import AriaPanel from "../aria/AriaPanel";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ariaOpen, setAriaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingModeration, setPendingModeration] = useState(0);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      // Cmd/Ctrl + . for Aria
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setAriaOpen((prev) => !prev);
      }
      // Escape to close panels
      if (e.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else if (ariaOpen) setAriaOpen(false);
      }
    },
    [ariaOpen, searchOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Fetch pending moderation count
  useEffect(() => {
    const fetchModerationCount = async () => {
      try {
        const res = await fetch("/api/admin/moderation/count");
        if (res.ok) {
          const data = await res.json();
          setPendingModeration(data.count || 0);
        }
      } catch {
        // Silently fail - badge just won't show
      }
    };

    fetchModerationCount();
    // Refresh every 5 minutes
    const interval = setInterval(fetchModerationCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-bkg-dark min-h-screen">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        pendingModeration={pendingModeration}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        {/* Header */}
        <AdminHeader
          title={title}
          subtitle={subtitle}
          sidebarCollapsed={false} // Header position is handled by its own margin
          onAriaToggle={() => setAriaOpen((prev) => !prev)}
          ariaOpen={ariaOpen}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Aria AI Panel */}
      <AriaPanel isOpen={ariaOpen} onClose={() => setAriaOpen(false)} />

      {/* Quick Search Modal */}
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
