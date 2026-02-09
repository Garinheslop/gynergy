"use client";

import { useState, useEffect } from "react";

import { cn } from "@lib/utils/style";
import { useToast } from "../ui/Toast";

type ActionType = "grant_access" | "reset_streak" | "add_points" | "send_email";

interface UserDetail {
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
  longestStreak: number;
  level: number;
  createdAt: string;
  lastActiveAt?: string;
  // Challenge progress
  challengeProgress: {
    currentDay: number;
    completedDays: number;
    totalDays: number;
    completionRate: number;
  };
  // Activity timeline
  recentActivity: Array<{
    id: string;
    type: "journal" | "reflection" | "video" | "post" | "badge" | "purchase";
    title: string;
    description?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  // Purchase history
  purchases: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    date: string;
  }>;
  // Badges earned
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: string;
  }>;
}

interface UserDetailPanelProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailPanel({ userId, isOpen, onClose }: UserDetailPanelProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "purchases">("overview");
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetail(userId);
    }
  }, [userId, isOpen]);

  const fetchUserDetail = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch user: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.error || "Failed to load user data");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load user";
      setError(message);
      addToast({
        type: "error",
        title: "Error loading user",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: ActionType) => {
    if (!user || actionLoading) return;

    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error(`Action failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Action completed",
          message: `Successfully performed ${action.replace("_", " ")}`,
        });
        // Refresh user data
        fetchUserDetail(user.id);
      } else {
        throw new Error(data.error || "Action failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      addToast({
        type: "error",
        title: "Action failed",
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "journal":
        return "gng-book";
      case "reflection":
        return "gng-heart";
      case "video":
        return "gng-play";
      case "post":
        return "gng-message-circle";
      case "badge":
        return "gng-award";
      case "purchase":
        return "gng-dollar";
      default:
        return "gng-activity";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "journal":
        return "bg-action-900 text-action-400";
      case "reflection":
        return "bg-pink-900 text-pink-400";
      case "video":
        return "bg-purple/20 text-purple";
      case "post":
        return "bg-warning/20 text-warning";
      case "badge":
        return "bg-yellow-900 text-yellow-400";
      case "purchase":
        return "bg-green-900 text-green-400";
      default:
        return "bg-grey-800 text-grey-400";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close panel"
      />

      {/* Panel */}
      <div className="border-grey-800 bg-grey-900 fixed top-0 right-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l shadow-2xl">
        {/* Header */}
        <div className="border-grey-800 bg-grey-900 sticky top-0 z-10 flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 hover:text-white"
          >
            <i className="gng-x text-lg" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="border-action-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
              <i className="gng-alert-circle text-2xl text-red-400" />
            </div>
            <p className="text-grey-400 text-center text-sm">{error}</p>
            <button
              onClick={() => userId && fetchUserDetail(userId)}
              className="bg-grey-800 hover:bg-grey-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        ) : user ? (
          <div className="p-4">
            {/* Profile Header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="from-action-400 to-action-600 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.firstName?.[0] ?? user.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{user.fullName}</h3>
                <p className="text-grey-400">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.hasChallengeAccess && (
                    <span className="bg-action-900 text-action-400 rounded-full px-2 py-0.5 text-xs font-medium">
                      Challenge Access
                    </span>
                  )}
                  {user.accessType && (
                    <span className="bg-purple/20 text-purple rounded-full px-2 py-0.5 text-xs font-medium">
                      {user.accessType}
                    </span>
                  )}
                  <span className="bg-grey-800 text-grey-400 rounded-full px-2 py-0.5 text-xs font-medium">
                    Level {user.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-6 grid grid-cols-4 gap-3">
              <div className="bg-grey-800 rounded-lg p-3 text-center">
                <p className="text-action-400 text-lg font-bold">{user.currentStreak}</p>
                <p className="text-grey-500 text-xs">Streak</p>
              </div>
              <div className="bg-grey-800 rounded-lg p-3 text-center">
                <p className="text-warning text-lg font-bold">
                  {user.totalPoints.toLocaleString()}
                </p>
                <p className="text-grey-500 text-xs">Points</p>
              </div>
              <div className="bg-grey-800 rounded-lg p-3 text-center">
                <p className="text-purple text-lg font-bold">
                  {user.challengeProgress?.completedDays || 0}
                </p>
                <p className="text-grey-500 text-xs">Days Done</p>
              </div>
              <div className="bg-grey-800 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{user.badges?.length || 0}</p>
                <p className="text-grey-500 text-xs">Badges</p>
              </div>
            </div>

            {/* Challenge Progress */}
            {user.challengeProgress && (
              <div className="bg-grey-800 mb-6 rounded-lg p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Challenge Progress</span>
                  <span className="text-grey-400 text-sm">
                    Day {user.challengeProgress.currentDay} of {user.challengeProgress.totalDays}
                  </span>
                </div>
                <div className="bg-grey-700 mb-2 h-2 overflow-hidden rounded-full">
                  <div
                    className="from-action-600 to-action-400 h-full rounded-full bg-gradient-to-r"
                    style={{ width: `${user.challengeProgress.completionRate}%` }}
                  />
                </div>
                <p className="text-grey-500 text-xs">
                  {user.challengeProgress.completionRate.toFixed(0)}% complete •{" "}
                  {user.challengeProgress.completedDays} days completed
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-grey-800 mb-4 flex gap-1 rounded-lg p-1">
              {(["overview", "activity", "purchases"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
                    activeTab === tab ? "bg-grey-700 text-white" : "text-grey-400 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="border-grey-800 rounded-lg border p-4">
                  <h4 className="text-grey-400 mb-3 text-sm font-medium">Account Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-grey-500">Joined</span>
                      <span className="text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-grey-500">Last Active</span>
                      <span className="text-white">
                        {user.lastActiveAt
                          ? new Date(user.lastActiveAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-grey-500">Longest Streak</span>
                      <span className="text-white">{user.longestStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-grey-500">Account Type</span>
                      <span className="text-white">
                        {user.isAnonymous ? "Anonymous" : "Registered"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                  <div className="border-grey-800 rounded-lg border p-4">
                    <h4 className="text-grey-400 mb-3 text-sm font-medium">Badges Earned</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.badges.map((badge) => (
                        <div
                          key={badge.id}
                          className="flex items-center gap-2 rounded-full bg-yellow-900/30 px-3 py-1"
                          title={`Earned ${new Date(badge.earnedAt).toLocaleDateString()}`}
                        >
                          <i className={cn(badge.icon, "text-yellow-400")} />
                          <span className="text-xs font-medium text-yellow-400">{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-grey-800 rounded-lg border p-4">
                  <h4 className="text-grey-400 mb-3 text-sm font-medium">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction("grant_access")}
                      disabled={actionLoading !== null}
                      className="bg-action-600 hover:bg-action-700 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === "grant_access" ? (
                        <i className="gng-loader animate-spin" />
                      ) : (
                        <i className="gng-key" />
                      )}
                      Grant Access
                    </button>
                    <button
                      onClick={() => handleAction("reset_streak")}
                      disabled={actionLoading !== null}
                      className="bg-grey-800 text-grey-300 hover:bg-grey-700 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === "reset_streak" ? (
                        <i className="gng-loader animate-spin" />
                      ) : (
                        <i className="gng-refresh" />
                      )}
                      Reset Streak
                    </button>
                    <button
                      onClick={() => handleAction("add_points")}
                      disabled={actionLoading !== null}
                      className="bg-grey-800 text-grey-300 hover:bg-grey-700 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === "add_points" ? (
                        <i className="gng-loader animate-spin" />
                      ) : (
                        <i className="gng-plus" />
                      )}
                      Add Points
                    </button>
                    <button
                      onClick={() => handleAction("send_email")}
                      disabled={actionLoading !== null}
                      className="bg-grey-800 text-grey-300 hover:bg-grey-700 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === "send_email" ? (
                        <i className="gng-loader animate-spin" />
                      ) : (
                        <i className="gng-mail" />
                      )}
                      Send Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-3">
                {user.recentActivity && user.recentActivity.length > 0 ? (
                  user.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-grey-800 flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          getActivityColor(activity.type)
                        )}
                      >
                        <i className={getActivityIcon(activity.type)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-grey-400 text-xs">{activity.description}</p>
                        )}
                        <p className="text-grey-500 mt-1 text-xs">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-grey-500 py-8 text-center">No recent activity</div>
                )}
              </div>
            )}

            {activeTab === "purchases" && (
              <div className="space-y-3">
                {user.purchases && user.purchases.length > 0 ? (
                  user.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border-grey-800 flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{purchase.type}</p>
                        <p className="text-grey-400 text-xs">
                          {new Date(purchase.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-action-400 font-medium">
                          ${(purchase.amount / 100).toFixed(2)}
                        </p>
                        <span
                          className={cn(
                            "text-xs",
                            purchase.status === "completed"
                              ? "text-action-400"
                              : purchase.status === "refunded"
                                ? "text-error"
                                : "text-grey-400"
                          )}
                        >
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-grey-500 py-8 text-center">No purchase history</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-grey-500 flex h-64 items-center justify-center">User not found</div>
        )}
      </div>
    </>
  );
}
