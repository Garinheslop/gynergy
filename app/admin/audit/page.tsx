"use client";

import { useState, useEffect, useCallback } from "react";

import { createColumnHelper, CellContext } from "@tanstack/react-table";

import { cn } from "@lib/utils/style";
import { AdminLayout } from "@modules/admin";
import DataTable from "@modules/admin/components/tables/DataTable";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  actionType: string;
  actionCategory: string;
  resourceType: string;
  resourceId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  status: "success" | "failure" | "pending";
  createdAt: string;
}

const ACTION_CATEGORY_LABELS: Record<string, string> = {
  user_management: "User Management",
  content_management: "Content",
  moderation: "Moderation",
  payments: "Payments",
  settings: "Settings",
  data_export: "Data Export",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  "user.view": "Viewed User",
  "user.update": "Updated User",
  "user.suspend": "Suspended User",
  "user.delete": "Deleted User",
  "user.grant_access": "Granted Access",
  "user.reset_streak": "Reset Streak",
  "user.add_points": "Added Points",
  "content.create": "Created Content",
  "content.update": "Updated Content",
  "content.delete": "Deleted Content",
  "content.publish": "Published Content",
  "moderation.approve": "Approved Content",
  "moderation.reject": "Rejected Content",
  "moderation.escalate": "Escalated Content",
  "payment.refund": "Processed Refund",
  "payment.void": "Voided Payment",
  "settings.update": "Updated Settings",
  "export.users": "Exported Users",
  "export.payments": "Exported Payments",
  "export.analytics": "Exported Analytics",
};

const columnHelper = createColumnHelper<AuditLog>();

const columns = [
  columnHelper.accessor("createdAt", {
    header: "Time",
    cell: (info: CellContext<AuditLog, string>) => {
      const date = new Date(info.getValue());
      return (
        <div className="text-sm">
          <p className="text-white">{date.toLocaleDateString()}</p>
          <p className="text-grey-500 text-xs">{date.toLocaleTimeString()}</p>
        </div>
      );
    },
  }),
  columnHelper.accessor("adminEmail", {
    header: "Admin",
    cell: (info: CellContext<AuditLog, string | undefined>) => (
      <span className="text-grey-300 text-sm">{info.getValue() || "Unknown"}</span>
    ),
  }),
  columnHelper.accessor("actionType", {
    header: "Action",
    cell: (info: CellContext<AuditLog, string>) => {
      const log = info.row.original;
      return (
        <div>
          <p className="font-medium text-white">
            {ACTION_TYPE_LABELS[info.getValue()] || info.getValue()}
          </p>
          <p className="text-grey-500 text-xs">
            {ACTION_CATEGORY_LABELS[log.actionCategory] || log.actionCategory}
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor("resourceType", {
    header: "Resource",
    cell: (info: CellContext<AuditLog, string>) => {
      const log = info.row.original;
      return (
        <div className="text-sm">
          <p className="text-white capitalize">{info.getValue()}</p>
          {log.resourceId && (
            <p className="text-grey-500 font-mono text-xs">{log.resourceId.slice(0, 8)}...</p>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info: CellContext<AuditLog, string>) => {
      const status = info.getValue();
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            status === "success" && "bg-action-900 text-action-400",
            status === "failure" && "bg-red-900 text-red-400",
            status === "pending" && "bg-yellow-900 text-yellow-400"
          )}
        >
          {status}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "details",
    header: "",
    cell: () => (
      <span className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 transition-colors hover:text-white">
        <i className="gng-eye" />
      </span>
    ),
    size: 50,
  }),
];

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "user_management", label: "User Management" },
  { value: "content_management", label: "Content" },
  { value: "moderation", label: "Moderation" },
  { value: "payments", label: "Payments" },
  { value: "settings", label: "Settings" },
  { value: "data_export", label: "Data Export" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (categoryFilter !== "all") {
        params.set("actionCategory", categoryFilter);
      }

      // Calculate date range
      if (dateRange !== "all") {
        const now = new Date();
        let startDate: Date;
        if (dateRange === "today") {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        params.set("startDate", startDate.toISOString());
      }

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, categoryFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const handleExport = (selectedLogs: AuditLog[]) => {
    const csv = [
      ["Time", "Admin", "Action", "Category", "Resource", "Status"].join(","),
      ...selectedLogs.map((log) =>
        [
          log.createdAt,
          log.adminEmail || "Unknown",
          log.actionType,
          log.actionCategory,
          `${log.resourceType}:${log.resourceId || ""}`,
          log.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Calculate stats
  const successCount = logs.filter((l) => l.status === "success").length;
  const failureCount = logs.filter((l) => l.status === "failure").length;
  const userActions = logs.filter((l) => l.actionCategory === "user_management").length;

  return (
    <AdminLayout title="Audit Logs" subtitle="Track all administrative actions">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {(["today", "7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                dateRange === range
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {range === "today"
                ? "Today"
                : range === "7d"
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : "All Time"}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-grey-800 text-grey-300 border-grey-700 rounded-lg border px-4 py-2 text-sm"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Total Logs</p>
          <p className="mt-1 text-2xl font-bold text-white">{pagination.total}</p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Successful</p>
          <p className="text-action-400 mt-1 text-2xl font-bold">{successCount}</p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Failed</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{failureCount}</p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">User Actions</p>
          <p className="text-primary mt-1 text-2xl font-bold">{userActions}</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search by admin or action..."
        isLoading={isLoading}
        onRowClick={handleRowClick}
        bulkActions={[
          {
            label: "Export",
            icon: "gng-download",
            action: handleExport,
          },
        ]}
      />

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-grey-900 border-grey-800 w-full max-w-2xl rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-grey-400 hover:text-white"
              >
                <i className="gng-close text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-grey-500 text-sm">Time</p>
                  <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-grey-500 text-sm">Admin</p>
                  <p className="text-white">{selectedLog.adminEmail || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-grey-500 text-sm">Action</p>
                  <p className="text-white">
                    {ACTION_TYPE_LABELS[selectedLog.actionType] || selectedLog.actionType}
                  </p>
                </div>
                <div>
                  <p className="text-grey-500 text-sm">Status</p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      selectedLog.status === "success" && "bg-action-900 text-action-400",
                      selectedLog.status === "failure" && "bg-red-900 text-red-400"
                    )}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className="text-grey-500 text-sm">Resource</p>
                  <p className="text-white capitalize">{selectedLog.resourceType}</p>
                </div>
                <div>
                  <p className="text-grey-500 text-sm">Resource ID</p>
                  <p className="font-mono text-white">{selectedLog.resourceId || "N/A"}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-grey-500 text-sm">IP Address</p>
                    <p className="font-mono text-white">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedLog.previousState && (
                <div>
                  <p className="text-grey-500 mb-2 text-sm">Previous State</p>
                  <pre className="bg-grey-800 overflow-auto rounded-lg p-3 text-xs text-white">
                    {JSON.stringify(selectedLog.previousState, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newState && (
                <div>
                  <p className="text-grey-500 mb-2 text-sm">New State</p>
                  <pre className="bg-grey-800 overflow-auto rounded-lg p-3 text-xs text-white">
                    {JSON.stringify(selectedLog.newState, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-grey-500 mb-2 text-sm">Metadata</p>
                  <pre className="bg-grey-800 overflow-auto rounded-lg p-3 text-xs text-white">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
