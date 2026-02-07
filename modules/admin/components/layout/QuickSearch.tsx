"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@lib/utils/style";

interface SearchResult {
  id: string;
  type: "page" | "user" | "action" | "recent";
  title: string;
  description?: string;
  href?: string;
  icon: string;
  action?: () => void;
  keywords?: string[];
}

const ADMIN_PAGES: SearchResult[] = [
  {
    id: "dashboard",
    type: "page",
    title: "Dashboard",
    description: "Overview and key metrics",
    href: "/admin",
    icon: "gng-home",
    keywords: ["home", "overview", "stats", "kpi", "metrics"],
  },
  {
    id: "users",
    type: "page",
    title: "User Management",
    description: "View and manage users",
    href: "/admin/users",
    icon: "gng-users",
    keywords: ["members", "accounts", "profiles", "suspend", "customers"],
  },
  {
    id: "payments",
    type: "page",
    title: "Payment Analytics",
    description: "Revenue and sales data",
    href: "/admin/payments",
    icon: "gng-dollar",
    keywords: ["revenue", "money", "transactions", "stripe", "purchases", "mrr", "sales"],
  },
  {
    id: "analytics",
    type: "page",
    title: "Platform Analytics",
    description: "Engagement and growth metrics",
    href: "/admin/analytics",
    icon: "gng-bar-chart",
    keywords: ["metrics", "data", "reports", "insights", "charts", "growth", "retention"],
  },
  {
    id: "content",
    type: "page",
    title: "Content Library",
    description: "Videos and media management",
    href: "/admin/content",
    icon: "gng-video",
    keywords: ["videos", "media", "library", "courses", "bunny", "uploads"],
  },
  {
    id: "community",
    type: "page",
    title: "Community Moderation",
    description: "Content review and moderation",
    href: "/admin/community",
    icon: "gng-shield",
    keywords: ["posts", "moderation", "social", "feed", "flagged", "reports"],
  },
  {
    id: "gamification",
    type: "page",
    title: "Gamification",
    description: "Points, badges and streaks",
    href: "/admin/gamification",
    icon: "gng-trophy",
    keywords: ["badges", "points", "streaks", "rewards", "achievements", "leaderboard"],
  },
  {
    id: "system",
    type: "page",
    title: "System Health",
    description: "Infrastructure and audit logs",
    href: "/admin/system",
    icon: "gng-activity",
    keywords: ["health", "logs", "audit", "performance", "api", "errors", "monitoring"],
  },
  {
    id: "settings",
    type: "page",
    title: "Admin Settings",
    description: "Preferences and configuration",
    href: "/admin/settings",
    icon: "gng-settings",
    keywords: ["preferences", "config", "options", "aria", "theme"],
  },
];

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: "refresh",
    type: "action",
    title: "Refresh Data",
    description: "Reload current page data",
    icon: "gng-refresh",
    keywords: ["reload", "update", "sync"],
  },
  {
    id: "export-users",
    type: "action",
    title: "Export Users",
    description: "Download user data as CSV",
    icon: "gng-download",
    keywords: ["download", "csv", "export"],
  },
  {
    id: "export-payments",
    type: "action",
    title: "Export Payments",
    description: "Download payment history",
    icon: "gng-download",
    keywords: ["download", "csv", "revenue", "export"],
  },
  {
    id: "view-logs",
    type: "action",
    title: "View Audit Logs",
    description: "Recent admin activity",
    icon: "gng-file-text",
    href: "/admin/system?tab=logs",
    keywords: ["audit", "history", "activity", "trail"],
  },
  {
    id: "aria",
    type: "action",
    title: "Open Aria AI",
    description: "AI assistant for insights",
    icon: "gng-sparkles",
    keywords: ["ai", "assistant", "chat", "help", "insights"],
  },
];

// Fuzzy match implementation
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Direct substring match (highest priority)
  if (lowerText.includes(lowerQuery)) return true;

  // Character sequence match for fuzzy finding
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

// Score results for better ranking
function scoreResult(result: SearchResult, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Title starts with query (highest)
  if (result.title.toLowerCase().startsWith(lowerQuery)) score += 100;
  // Title contains query
  else if (result.title.toLowerCase().includes(lowerQuery)) score += 50;
  // Fuzzy match on title
  else if (fuzzyMatch(result.title, query)) score += 25;

  // Description match
  if (result.description?.toLowerCase().includes(lowerQuery)) score += 20;

  // Keyword exact match
  if (result.keywords?.some((kw) => kw.toLowerCase() === lowerQuery)) score += 40;
  // Keyword partial match
  else if (result.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))) score += 15;

  // Boost pages over actions for navigation
  if (result.type === "page") score += 5;
  if (result.type === "recent") score += 10;

  return score;
}

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin-recent-searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Filter and rank results based on query
  useEffect(() => {
    const allItems = [...ADMIN_PAGES, ...QUICK_ACTIONS];

    if (!query.trim()) {
      // Show recent searches first, then pages
      const recentIds = new Set(recentSearches.map((r) => r.id));
      const nonRecent = allItems.filter((item) => !recentIds.has(item.id));
      setResults([...recentSearches.slice(0, 3), ...nonRecent]);
    } else {
      // Filter by fuzzy match on title, description, or keywords
      const filtered = allItems.filter((item) => {
        if (fuzzyMatch(item.title, query)) return true;
        if (item.description && fuzzyMatch(item.description, query)) return true;
        if (item.keywords?.some((kw) => fuzzyMatch(kw, query))) return true;
        return false;
      });

      // Sort by relevance score
      filtered.sort((a, b) => scoreResult(b, query) - scoreResult(a, query));
      setResults(filtered);
    }
    setSelectedIndex(0);
  }, [query, recentSearches]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results.length]);

  // Save to recent searches
  const addToRecent = useCallback((result: SearchResult) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.id !== result.id);
      const recentResult = { ...result, type: "recent" as const };
      const updated = [recentResult, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("admin-recent-searches", JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      addToRecent(result);
      onClose();
      setQuery("");

      if (result.href) {
        router.push(result.href);
      } else if (result.action) {
        result.action();
      }
    },
    [router, onClose, addToRecent]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, onClose, handleSelect]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Search Modal */}
      <div className="border-grey-800 bg-grey-900 relative w-full max-w-lg rounded-xl border shadow-2xl">
        {/* Search Input */}
        <div className="border-grey-800 flex items-center gap-3 border-b p-4">
          <i className="gng-search text-grey-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, users, or actions..."
            className="placeholder-grey-500 flex-1 bg-transparent text-white outline-none"
          />
          <kbd className="bg-grey-800 text-grey-400 hidden rounded px-2 py-1 text-xs sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div ref={listRef} className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-action-600 text-white"
                      : "text-grey-300 hover:bg-grey-800"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      selectedIndex === index
                        ? "bg-action-700"
                        : result.type === "page"
                          ? "bg-grey-800"
                          : "bg-purple/20"
                    )}
                  >
                    <i
                      className={cn(
                        result.icon,
                        selectedIndex === index
                          ? "text-white"
                          : result.type === "page"
                            ? "text-grey-400"
                            : "text-purple"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{result.title}</p>
                    {result.description && (
                      <p
                        className={cn(
                          "truncate text-sm",
                          selectedIndex === index ? "text-white/70" : "text-grey-500"
                        )}
                      >
                        {result.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                      selectedIndex === index
                        ? "bg-action-700 text-white"
                        : result.type === "page"
                          ? "bg-grey-800 text-grey-400"
                          : result.type === "recent"
                            ? "bg-warning/20 text-warning"
                            : "bg-purple/20 text-purple"
                    )}
                  >
                    {result.type === "recent" ? "recent" : result.type}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-grey-500 py-8 text-center">
              <i className="gng-search mb-2 text-2xl" />
              <p>No results found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-grey-800 text-grey-500 flex items-center justify-between border-t px-4 py-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-grey-800 rounded px-1.5 py-0.5">↑</kbd>
              <kbd className="bg-grey-800 rounded px-1.5 py-0.5">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-grey-800 rounded px-1.5 py-0.5">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="bg-grey-800 rounded px-1.5 py-0.5">⌘</kbd>
            <kbd className="bg-grey-800 rounded px-1.5 py-0.5">K</kbd>
            to open
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook to handle keyboard shortcut
export function useQuickSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
