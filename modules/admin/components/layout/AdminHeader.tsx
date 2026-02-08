"use client";

import { useState, useEffect } from "react";

import { cn } from "@lib/utils/style";

import NotificationsDropdown from "./NotificationsDropdown";
import QuickStatsBar from "./QuickStatsBar";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onAriaToggle: () => void;
  ariaOpen: boolean;
}

export default function AdminHeader({
  title,
  subtitle,
  sidebarCollapsed,
  onAriaToggle,
  ariaOpen,
}: AdminHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/admin/alerts");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.data?.length || 0);
        }
      } catch {
        // Silently fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={cn(
        "bg-bkg-dark border-grey-800 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 transition-all duration-300",
        sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
      )}
    >
      {/* Title Section */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-grey-500 text-sm">{subtitle}</p>}
      </div>

      {/* Quick Stats - Real-time metrics */}
      <QuickStatsBar className="mx-4" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search Toggle */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-grey-700 bg-grey-800 placeholder-grey-500 focus:border-action-500 focus:ring-action-500 h-9 w-64 rounded-lg border px-3 text-sm text-white outline-none focus:ring-1"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-grey-400 hover:bg-grey-800 flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-white"
              >
                <i className="gng-close text-lg" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="border-grey-700 bg-grey-800 text-grey-400 hover:border-grey-600 hover:text-grey-300 flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
            >
              <i className="gng-search" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="bg-grey-700 text-grey-400 ml-2 hidden rounded px-1.5 py-0.5 text-xs sm:inline">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              notificationsOpen
                ? "bg-grey-800 text-white"
                : "text-grey-400 hover:bg-grey-800 hover:text-white"
            )}
          >
            <i className="gng-bell text-lg" />
            {unreadCount > 0 && (
              <span className="bg-danger absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full" />
            )}
          </button>
          {notificationsOpen && (
            <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
          )}
        </div>

        {/* Aria AI Toggle */}
        <button
          onClick={onAriaToggle}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all",
            ariaOpen
              ? "border-action-500 bg-action-900/50 text-action-300"
              : "border-purple bg-purple/10 text-purple hover:bg-purple/20"
          )}
        >
          <i className="gng-sparkle" />
          <span className="hidden sm:inline">Aria</span>
        </button>

        {/* User Avatar */}
        <button className="from-action-400 to-action-600 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br">
          <span className="text-sm font-semibold text-white">A</span>
        </button>
      </div>
    </header>
  );
}
