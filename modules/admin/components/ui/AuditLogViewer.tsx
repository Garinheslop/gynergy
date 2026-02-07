"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";

import type { AuditLogEntry } from "../../types/admin";

interface AuditLogViewerProps {
  initialFilters?: AuditFilters;
  showFilters?: boolean;
  maxHeight?: string;
  onEntryClick?: (entry: AuditLogEntry) => void;
}

interface AuditFilters {
  actionType?: string;
  actionCategory?: string;
  resourceType?: string;
  adminId?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

const ACTION_TYPES = [
  { value: "view", label: "View", icon: "gng-eye", color: "text-grey-400" },
  { value: "create", label: "Create", icon: "gng-plus", color: "text-action-400" },
  { value: "update", label: "Update", icon: "gng-edit", color: "text-warning" },
  { value: "delete", label: "Delete", icon: "gng-trash", color: "text-error" },
  { value: "export", label: "Export", icon: "gng-download", color: "text-purple" },
  { value: "suspend", label: "Suspend", icon: "gng-user-x", color: "text-error" },
  { value: "unsuspend", label: "Unsuspend", icon: "gng-user-check", color: "text-action-400" },
  { value: "approve", label: "Approve", icon: "gng-check", color: "text-action-400" },
  { value: "reject", label: "Reject", icon: "gng-x", color: "text-error" },
  { value: "escalate", label: "Escalate", icon: "gng-alert-triangle", color: "text-warning" },
];

const ACTION_CATEGORIES = [
  { value: "user_management", label: "User Management" },
  { value: "content_moderation", label: "Content Moderation" },
  { value: "payment", label: "Payments" },
  { value: "system", label: "System" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Settings" },
];

function getActionConfig(type: string) {
  return ACTION_TYPES.find((a) => a.value === type) || ACTION_TYPES[0];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AuditLogViewer({
  initialFilters = {},
  showFilters = true,
  maxHeight = "600px",
  onEntryClick,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    hasMore: true,
  });

  const fetchLogs = useCallback(
    async (reset = false) => {
      if (!reset && !pagination.hasMore) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: reset ? "1" : pagination.page.toString(),
          pageSize: pagination.pageSize.toString(),
        });

        if (filters.actionType) params.set("actionType", filters.actionType);
        if (filters.actionCategory) params.set("actionCategory", filters.actionCategory);
        if (filters.resourceType) params.set("resourceType", filters.resourceType);
        if (filters.search) params.set("search", filters.search);

        const res = await fetch(`/api/admin/audit-logs?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLogs(reset ? data.data : [...logs, ...data.data]);
            setPagination((prev) => ({
              ...prev,
              page: reset ? 2 : prev.page + 1,
              total: data.pagination?.total || 0,
              hasMore: data.data.length === pagination.pageSize,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, logs, pagination.hasMore, pagination.page, pagination.pageSize]
  );

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleLoadMore = () => {
    fetchLogs();
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      {showFilters && (
        <div className="bg-grey-900 border-grey-800 mb-4 flex flex-wrap items-center gap-3 rounded-lg border p-4">
          {/* Search */}
          <div className="relative flex-1">
            <i className="gng-search text-grey-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="bg-grey-800 border-grey-700 text-grey-200 placeholder:text-grey-500 focus:ring-action-600 w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          {/* Action Type Filter */}
          <select
            value={filters.actionType || ""}
            onChange={(e) => handleFilterChange("actionType", e.target.value)}
            className="bg-grey-800 border-grey-700 text-grey-200 focus:ring-action-600 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Actions</option>
            {ACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.actionCategory || ""}
            onChange={(e) => handleFilterChange("actionCategory", e.target.value)}
            className="bg-grey-800 border-grey-700 text-grey-200 focus:ring-action-600 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Categories</option>
            {ACTION_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(filters.actionType || filters.actionCategory || filters.search) && (
            <button
              onClick={() => setFilters({})}
              className="text-grey-400 text-sm underline hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Log List */}
      <div
        className="bg-grey-900 border-grey-800 flex-1 overflow-y-auto rounded-lg border"
        style={{ maxHeight }}
      >
        {logs.length === 0 && !isLoading ? (
          <div className="text-grey-500 flex h-full items-center justify-center py-12">
            No audit logs found
          </div>
        ) : (
          <div className="divide-grey-800 divide-y">
            {logs.map((log) => {
              const actionConfig = getActionConfig(log.actionType);
              const isExpanded = expandedId === log.id;

              return (
                <div
                  key={log.id}
                  className={cn(
                    "hover:bg-grey-800/50 cursor-pointer transition-colors",
                    isExpanded && "bg-grey-800/30"
                  )}
                  onClick={() => {
                    toggleExpanded(log.id);
                    onEntryClick?.(log);
                  }}
                >
                  {/* Main Row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Action Icon */}
                    <div
                      className={cn(
                        "bg-grey-800 flex h-10 w-10 items-center justify-center rounded-lg",
                        actionConfig.color
                      )}
                    >
                      <i className={actionConfig.icon} />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{actionConfig.label}</span>
                        <span className="text-grey-400 text-sm">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="bg-grey-700 text-grey-300 rounded px-1.5 py-0.5 font-mono text-xs">
                            {log.resourceId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="text-grey-500 mt-0.5 text-sm">
                        by {log.adminEmail || log.adminId.slice(0, 8)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        log.status === "success" && "bg-action-900 text-action-400",
                        log.status === "failure" && "bg-error/20 text-error",
                        log.status === "pending" && "bg-warning/20 text-warning"
                      )}
                    >
                      {log.status}
                    </div>

                    {/* Timestamp */}
                    <div className="text-grey-500 text-right text-sm">
                      <div>{formatTimeAgo(new Date(log.createdAt))}</div>
                      <div className="text-grey-600 text-xs">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <i
                      className={cn(
                        "gng-chevron-down text-grey-400 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-grey-800/50 border-grey-700 border-t px-4 py-3">
                      <div className="grid gap-4 text-sm md:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-grey-500">Category:</span>{" "}
                            <span className="text-grey-300">{log.actionCategory}</span>
                          </div>
                          <div>
                            <span className="text-grey-500">Admin ID:</span>{" "}
                            <span className="text-grey-300 font-mono">{log.adminId}</span>
                          </div>
                          {log.ipAddress && (
                            <div>
                              <span className="text-grey-500">IP Address:</span>{" "}
                              <span className="text-grey-300 font-mono">{log.ipAddress}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-grey-500">Full Timestamp:</span>{" "}
                            <span className="text-grey-300">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div>
                              <span className="text-grey-500">Metadata:</span>
                              <pre className="bg-grey-900 text-grey-300 mt-1 overflow-x-auto rounded p-2 font-mono text-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* State Changes */}
                      {(log.previousState || log.newState) && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {log.previousState && (
                            <div>
                              <div className="text-grey-500 mb-1 text-xs font-medium uppercase">
                                Previous State
                              </div>
                              <pre className="bg-grey-900 text-grey-300 overflow-x-auto rounded p-2 font-mono text-xs">
                                {JSON.stringify(log.previousState, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newState && (
                            <div>
                              <div className="text-grey-500 mb-1 text-xs font-medium uppercase">
                                New State
                              </div>
                              <pre className="bg-grey-900 text-grey-300 overflow-x-auto rounded p-2 font-mono text-xs">
                                {JSON.stringify(log.newState, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More */}
            {pagination.hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="text-action-400 hover:text-action-300 text-sm disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && logs.length === 0 && (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4">
                <div className="bg-grey-800 h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="bg-grey-800 h-4 w-1/3 rounded" />
                  <div className="bg-grey-800 h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="text-grey-500 mt-2 text-center text-sm">
        Showing {logs.length} of {pagination.total} entries
      </div>
    </div>
  );
}
