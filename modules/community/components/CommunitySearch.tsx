"use client";

import { FC, useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";

import { useDebounce } from "@lib/hooks/useDebounce";
import { formatTimeAgo } from "@lib/utils/date";
import { cn } from "@lib/utils/style";
import { Avatar } from "@modules/common/components/ui";

interface SearchPost {
  id: string;
  userId: string;
  postType: string;
  title: string | null;
  content: string;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  } | null;
}

interface SearchMember {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  role: string;
}

interface SearchResults {
  query: string;
  posts: SearchPost[];
  members: SearchMember[];
  totalResults: number;
}

interface CommunitySearchProps {
  onNavigateToPost: (postId: string) => void;
  onNavigateToMember: (memberId: string) => void;
}

/** Highlight matching query text within a string */
function HighlightMatch({ text, query }: Readonly<{ text: string; query: string }>) {
  if (!query || query.length < 2) return <>{text}</>;

  const escaped = query.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  // Build stable keys using character offset.
  // When split() uses a capturing group, odd-indexed parts are the matches.
  let offset = 0;
  return (
    <>
      {parts.map((part, i) => {
        const key = `${offset}`;
        offset += part.length;
        return i % 2 === 1 ? (
          <mark key={key} className="bg-action-50 rounded-sm text-inherit">
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
        );
      })}
    </>
  );
}

const CommunitySearch: FC<CommunitySearchProps> = ({ onNavigateToPost, onNavigateToMember }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Build a flat list of selectable items for keyboard nav
  const flatItems: { type: "member" | "post"; id: string }[] = [];
  if (results) {
    for (const member of results.members) {
      flatItems.push({ type: "member", id: member.id });
    }
    for (const post of results.posts) {
      flatItems.push({ type: "post", id: post.id });
    }
  }

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery, limit: "8" });
        const res = await fetch(`/api/community/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResults = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handlePostClick = (postId: string) => {
    setIsOpen(false);
    onNavigateToPost(postId);
  };

  const handleMemberClick = (memberId: string) => {
    setIsOpen(false);
    onNavigateToMember(memberId);
  };

  // Scroll active item into view
  const scrollActiveIntoView = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-search-item]");
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = activeIndex < flatItems.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(next);
        scrollActiveIntoView(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = activeIndex > 0 ? activeIndex - 1 : flatItems.length - 1;
        setActiveIndex(prev);
        scrollActiveIntoView(prev);
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          const item = flatItems[activeIndex];
          if (item.type === "member") handleMemberClick(item.id);
          else handlePostClick(item.id);
        }
        break;
      }
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const hasResults = results && results.totalResults > 0;
  const noResults = results && results.totalResults === 0;

  // Track item index across sections for keyboard nav
  let itemIndex = 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-grey-500 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && results.totalResults > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search posts and members..."
          role="combobox"
          aria-label="Search community"
          aria-expanded={isOpen}
          aria-controls="search-results-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          className={cn(
            "border-border-light bg-bkg-light-secondary text-content-dark placeholder:text-grey-500",
            "focus:border-action focus:ring-action w-full rounded-lg border py-2.5 pr-9 pl-9 text-sm",
            "focus:ring-1 focus:outline-none"
          )}
        />
        {/* Loading indicator or clear button */}
        {isLoading ? (
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <div className="border-action h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : query.length > 0 ? (
          <button
            onClick={handleClear}
            className="text-grey-500 hover:text-content-dark absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          id="search-results-listbox"
          role="listbox"
          ref={listRef}
          className="border-border-light bg-bkg-light absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border shadow-2xl"
        >
          {/* No Results */}
          {noResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-grey-500 text-sm">No results for &ldquo;{results.query}&rdquo;</p>
              <p className="text-grey-500 mt-1 text-xs">Try a different search term</p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="max-h-80 overflow-y-auto">
              {/* Members Section */}
              {results.members.length > 0 && (
                <div>
                  <div className="text-grey-500 border-border-light border-b px-4 py-2 text-xs font-semibold tracking-wider uppercase">
                    Members ({results.members.length})
                  </div>
                  {results.members.map((member) => {
                    const currentIndex = itemIndex++;
                    return (
                      <button
                        key={member.id}
                        id={`search-item-${currentIndex}`}
                        role="option"
                        aria-selected={activeIndex === currentIndex}
                        data-search-item
                        onClick={() => handleMemberClick(member.id)}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          activeIndex === currentIndex ? "bg-grey-100" : "hover:bg-grey-100"
                        )}
                      >
                        <Avatar
                          src={member.profileImage}
                          name={member.firstName + " " + member.lastName}
                          size="sm"
                        />
                        <div>
                          <p className="text-content-dark text-sm font-medium">
                            <HighlightMatch
                              text={member.firstName + " " + member.lastName}
                              query={query}
                            />
                          </p>
                          {member.role === "coach" && (
                            <span className="text-action-600 text-xs">Coach</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Posts Section */}
              {results.posts.length > 0 && (
                <div>
                  <div className="text-grey-500 border-border-light border-b px-4 py-2 text-xs font-semibold tracking-wider uppercase">
                    Posts ({results.posts.length})
                  </div>
                  {results.posts.map((post) => {
                    const currentIndex = itemIndex++;
                    return (
                      <button
                        key={post.id}
                        id={`search-item-${currentIndex}`}
                        role="option"
                        aria-selected={activeIndex === currentIndex}
                        data-search-item
                        onClick={() => handlePostClick(post.id)}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                          activeIndex === currentIndex ? "bg-grey-100" : "hover:bg-grey-100"
                        )}
                      >
                        <Avatar
                          src={post.author?.profileImage}
                          name={
                            post.author
                              ? post.author.firstName + " " + post.author.lastName
                              : "Unknown"
                          }
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-content-dark text-sm font-medium">
                              {post.author?.firstName} {post.author?.lastName}
                            </p>
                            <span className="text-grey-500 text-xs">
                              {formatTimeAgo(post.createdAt, { compact: true })}
                            </span>
                          </div>
                          <p className="text-grey-500 mt-0.5 line-clamp-2 text-xs">
                            {post.title && (
                              <>
                                <HighlightMatch text={post.title} query={query} />
                                {": "}
                              </>
                            )}
                            <HighlightMatch text={post.content} query={query} />
                          </p>
                          <div className="text-grey-500 mt-1 flex gap-3 text-[11px]">
                            {post.reactionCount > 0 && (
                              <span>
                                {post.reactionCount} reaction
                                {post.reactionCount === 1 ? "" : "s"}
                              </span>
                            )}
                            {post.commentCount > 0 && (
                              <span>
                                {post.commentCount} comment
                                {post.commentCount === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunitySearch;
