"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@lib/utils/style";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { QuickSearch } from "./QuickSearch";
import KeyboardShortcutsModal, { useKeyboardShortcuts } from "../ui/KeyboardShortcutsModal";
import type { AriaInsight } from "../../types/admin";
import AriaPanel from "../aria/AriaPanel";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ariaOpen, setAriaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pendingModeration, setPendingModeration] = useState(0);
  const [proactiveInsights, setProactiveInsights] = useState<AriaInsight[]>([]);
  const { handleGlobalShortcuts } = useKeyboardShortcuts();

  // Set up keyboard shortcuts with the hook
  useEffect(() => {
    return handleGlobalShortcuts({
      onSearch: () => setSearchOpen((prev) => !prev),
      onAria: () => setAriaOpen((prev) => !prev),
      onShortcuts: () => setShortcutsOpen((prev) => !prev),
      onRefresh: () => globalThis.location.reload(),
      onNavigate: (path) => router.push(path),
    });
  }, [handleGlobalShortcuts, router]);

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

  // Fetch proactive insights for Aria
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/admin/insights");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            // Transform to AriaInsight format
            const insights: AriaInsight[] = data.data
              .slice(0, 3)
              .map(
                (insight: {
                  id: string;
                  type: string;
                  priority: string;
                  title: string;
                  summary: string;
                }) => ({
                  id: insight.id,
                  type:
                    insight.type === "risk"
                      ? "alert"
                      : insight.type === "growth"
                        ? "trend"
                        : "opportunity",
                  priority: insight.priority,
                  title: insight.title,
                  description: insight.summary,
                  createdAt: new Date().toISOString(),
                })
              );
            setProactiveInsights(insights);
          }
        }
      } catch {
        // Silently fail - insights just won't show
      }
    };

    fetchInsights();
    // Refresh insights every 10 minutes
    const interval = setInterval(fetchInsights, 10 * 60 * 1000);
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
      <AriaPanel
        isOpen={ariaOpen}
        onClose={() => setAriaOpen(false)}
        insights={proactiveInsights}
      />

      {/* Quick Search Modal */}
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
