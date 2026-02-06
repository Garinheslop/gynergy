"use client";

import { useState, useEffect, useCallback } from "react";

import { createColumnHelper } from "@tanstack/react-table";

import { cn } from "@lib/utils/style";
import { AdminLayout } from "@modules/admin";
import UserDetailPanel from "@modules/admin/components/panels/UserDetailPanel";
import DataTable from "@modules/admin/components/tables/DataTable";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImage?: string;
  isAnonymous: boolean;
  hasChallengeAccess: boolean;
  accessType?: string;
  hasCommunityAccess: boolean;
  totalPoints: number;
  currentStreak: number;
  level: number;
  createdAt: string;
}

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor("fullName", {
    header: "User",
    cell: (info) => {
      const user = info.row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="from-action-400 to-action-600 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br">
            {user.profileImage ? (
              <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-white">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{info.getValue()}</p>
            <p className="text-grey-500 text-xs">{user.email}</p>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("hasChallengeAccess", {
    header: "Access",
    cell: (info) => {
      const user = info.row.original;
      return (
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
              info.getValue() ? "bg-action-900 text-action-400" : "bg-grey-800 text-grey-400"
            )}
          >
            {info.getValue() ? "Challenge" : "No Access"}
          </span>
          {user.accessType && <span className="text-grey-500 text-xs">{user.accessType}</span>}
        </div>
      );
    },
  }),
  columnHelper.accessor("totalPoints", {
    header: "Points",
    cell: (info) => (
      <span className="text-primary font-medium">{info.getValue().toLocaleString()}</span>
    ),
  }),
  columnHelper.accessor("currentStreak", {
    header: "Streak",
    cell: (info) => (
      <div className="flex items-center gap-1">
        <i className="gng-fire text-warning" />
        <span>{info.getValue()} days</span>
      </div>
    ),
  }),
  columnHelper.accessor("level", {
    header: "Level",
    cell: (info) => (
      <span className="bg-purple/20 text-purple rounded-full px-2 py-0.5 text-xs font-medium">
        Lvl {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Joined",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: () => (
      <span className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 transition-colors hover:text-white">
        <i className="gng-chevron-right" />
      </span>
    ),
    size: 50,
  }),
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "anonymous">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsers(data.data);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRowClick = (user: User) => {
    setSelectedUserId(user.id);
    setDetailPanelOpen(true);
  };

  const handleExport = (selectedUsers: User[]) => {
    const csv = [
      ["Name", "Email", "Access", "Points", "Streak", "Level", "Joined"].join(","),
      ...selectedUsers.map((u) =>
        [
          u.fullName,
          u.email,
          u.hasChallengeAccess ? "Yes" : "No",
          u.totalPoints,
          u.currentStreak,
          u.level,
          u.createdAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="User Management" subtitle={`${pagination.total} total users`}>
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {(["all", "active", "anonymous"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {status === "all" ? "All Users" : status === "active" ? "Active" : "Anonymous"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-white">{pagination.total}</p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">With Challenge Access</p>
          <p className="text-action-400 mt-1 text-2xl font-bold">
            {users.filter((u) => u.hasChallengeAccess).length}
          </p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Active Streaks</p>
          <p className="text-warning mt-1 text-2xl font-bold">
            {users.filter((u) => u.currentStreak > 0).length}
          </p>
        </div>
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-4">
          <p className="text-grey-400 text-sm">Avg. Points</p>
          <p className="text-primary mt-1 text-2xl font-bold">
            {users.length > 0
              ? Math.round(
                  users.reduce((a, u) => a + u.totalPoints, 0) / users.length
                ).toLocaleString()
              : 0}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by name or email..."
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

      {/* User Detail Panel */}
      <UserDetailPanel
        userId={selectedUserId}
        isOpen={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
      />
    </AdminLayout>
  );
}
