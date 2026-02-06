"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@lib/utils/style";

interface SearchResult {
  id: string;
  type: "page" | "user" | "action";
  title: string;
  description?: string;
  href?: string;
  icon: string;
  action?: () => void;
}

const ADMIN_PAGES: SearchResult[] = [
  {
    id: "dashboard",
    type: "page",
    title: "Dashboard",
    description: "Overview and key metrics",
    href: "/admin",
    icon: "gng-home",
  },
  {
    id: "users",
    type: "page",
    title: "User Management",
    description: "View and manage users",
    href: "/admin/users",
    icon: "gng-users",
  },
  {
    id: "payments",
    type: "page",
    title: "Payment Analytics",
    description: "Revenue and sales data",
    href: "/admin/payments",
    icon: "gng-dollar",
  },
  {
    id: "analytics",
    type: "page",
    title: "Platform Analytics",
    description: "Engagement and growth metrics",
    href: "/admin/analytics",
    icon: "gng-bar-chart",
  },
  {
    id: "community",
    type: "page",
    title: "Community Moderation",
    description: "Content review and moderation",
    href: "/admin/community",
    icon: "gng-shield",
  },
  {
    id: "system",
    type: "page",
    title: "System Health",
    description: "Infrastructure and audit logs",
    href: "/admin/system",
    icon: "gng-activity",
  },
];

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: "refresh",
    type: "action",
    title: "Refresh Data",
    description: "Reload current page data",
    icon: "gng-refresh",
  },
  {
    id: "export-users",
    type: "action",
    title: "Export Users",
    description: "Download user data as CSV",
    icon: "gng-download",
  },
];

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([...ADMIN_PAGES, ...QUICK_ACTIONS]);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = [...ADMIN_PAGES, ...QUICK_ACTIONS].filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    }
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
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
    [results, selectedIndex, onClose]
  );

  const handleSelect = (result: SearchResult) => {
    if (result.href) {
      router.push(result.href);
    } else if (result.action) {
      result.action();
    }
    onClose();
    setQuery("");
  };

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
            <div className="space-y-1">
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
                      "rounded-full px-2 py-0.5 text-xs",
                      selectedIndex === index
                        ? "bg-action-700 text-white"
                        : result.type === "page"
                          ? "bg-grey-800 text-grey-400"
                          : "bg-purple/20 text-purple"
                    )}
                  >
                    {result.type}
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
