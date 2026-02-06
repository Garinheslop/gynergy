"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout, StatCard } from "@modules/admin";

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category?: string;
  requirement?: string;
  pointsAwarded: number;
  isActive: boolean;
  earnedCount: number;
  createdAt: string;
}

interface PointRule {
  id: string;
  action: string;
  name: string;
  description?: string;
  points: number;
  maxPerDay?: number;
  isActive: boolean;
}

interface Reward {
  id: string;
  name: string;
  description?: string;
  type: string;
  pointsRequired: number;
  isActive: boolean;
  claimedCount: number;
}

interface GamificationStats {
  totalBadges: number;
  activeBadges: number;
  totalBadgesEarned: number;
  totalPointRules: number;
  totalRewards: number;
  avgPointsTop10: number;
}

interface GamificationData {
  stats: GamificationStats;
  badges: Badge[];
  pointRules: PointRule[];
  rewards: Reward[];
  leaderboardPreview: Array<{
    user_id: string;
    total_points: number;
    current_streak: number;
    level: number;
  }>;
}

const defaultData: GamificationData = {
  stats: {
    totalBadges: 0,
    activeBadges: 0,
    totalBadgesEarned: 0,
    totalPointRules: 0,
    totalRewards: 0,
    avgPointsTop10: 0,
  },
  badges: [],
  pointRules: [],
  rewards: [],
  leaderboardPreview: [],
};

type GamificationTab = "badges" | "points" | "rewards" | "leaderboard";

export default function GamificationPage() {
  const [data, setData] = useState<GamificationData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GamificationTab>("badges");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/gamification");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleBadge = async (badge: Badge) => {
    try {
      const res = await fetch("/api/admin/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          entityType: "badge",
          data: { id: badge.id, isActive: !badge.isActive },
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling badge:", error);
    }
  };

  const tabs: { id: GamificationTab; label: string; icon: string }[] = [
    { id: "badges", label: "Badges", icon: "gng-award" },
    { id: "points", label: "Point Rules", icon: "gng-star" },
    { id: "rewards", label: "Rewards", icon: "gng-gift" },
    { id: "leaderboard", label: "Leaderboard", icon: "gng-trending-up" },
  ];

  return (
    <AdminLayout
      title="Gamification Control"
      subtitle="Manage badges, points, rewards, and engagement"
    >
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Badges" value={data.stats.totalBadges} icon="gng-award" />
        <StatCard
          title="Badges Earned"
          value={data.stats.totalBadgesEarned}
          icon="gng-check-circle"
        />
        <StatCard title="Point Rules" value={data.stats.totalPointRules} icon="gng-star" />
        <StatCard
          title="Avg Points (Top 10)"
          value={data.stats.avgPointsTop10.toLocaleString()}
          icon="gng-trending-up"
        />
      </div>

      {/* Tabs */}
      <div className="bg-grey-800 mb-6 flex items-center gap-1 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id ? "bg-grey-700 text-white" : "text-grey-400 hover:text-white"
            )}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-action-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Badges Tab */}
          {activeTab === "badges" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Achievement Badges</h3>
                <button className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white">
                  <i className="gng-plus" />
                  Create Badge
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      badge.isActive
                        ? "border-yellow-800 bg-yellow-900/20"
                        : "border-grey-800 bg-grey-900"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            badge.isActive
                              ? "bg-yellow-600 text-white"
                              : "bg-grey-700 text-grey-400"
                          )}
                        >
                          <i className={cn(badge.icon, "text-xl")} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{badge.name}</h4>
                          {badge.category && (
                            <span className="text-grey-500 text-xs">{badge.category}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleBadge(badge)}
                        className={cn(
                          "rounded-lg p-2 transition-colors",
                          badge.isActive
                            ? "text-yellow-400 hover:bg-yellow-900"
                            : "text-grey-500 hover:bg-grey-800"
                        )}
                      >
                        <i className={badge.isActive ? "gng-toggle-right" : "gng-toggle-left"} />
                      </button>
                    </div>

                    {badge.description && (
                      <p className="text-grey-400 mb-3 text-sm">{badge.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-grey-500">
                        <i className="gng-star mr-1" />+{badge.pointsAwarded} pts
                      </span>
                      <span className="text-action-400">
                        <i className="gng-users mr-1" />
                        {badge.earnedCount} earned
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {data.badges.length === 0 && (
                <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
                  <i className="gng-award text-grey-600 mb-4 text-4xl" />
                  <h3 className="mb-2 text-lg font-medium text-white">No Badges</h3>
                  <p className="text-grey-400">Create badges to reward user achievements</p>
                </div>
              )}
            </div>
          )}

          {/* Point Rules Tab */}
          {activeTab === "points" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Point Rules</h3>
                <button className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white">
                  <i className="gng-plus" />
                  Add Rule
                </button>
              </div>

              <div className="border-grey-800 bg-grey-900 rounded-xl border">
                <table className="w-full">
                  <thead>
                    <tr className="border-grey-800 text-grey-400 border-b text-left text-sm">
                      <th className="p-4 font-medium">Action</th>
                      <th className="p-4 font-medium">Description</th>
                      <th className="p-4 font-medium">Points</th>
                      <th className="p-4 font-medium">Daily Limit</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-grey-800 divide-y">
                    {data.pointRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className="p-4">
                          <span className="font-medium text-white">{rule.name}</span>
                          <p className="text-grey-500 text-xs">{rule.action}</p>
                        </td>
                        <td className="text-grey-400 p-4 text-sm">{rule.description || "-"}</td>
                        <td className="p-4">
                          <span className="text-warning font-bold">+{rule.points}</span>
                        </td>
                        <td className="text-grey-400 p-4 text-sm">
                          {rule.maxPerDay ? `${rule.maxPerDay}x` : "Unlimited"}
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              rule.isActive
                                ? "bg-action-900 text-action-400"
                                : "bg-grey-800 text-grey-400"
                            )}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 hover:text-white">
                            <i className="gng-edit" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.pointRules.length === 0 && (
                  <div className="p-12 text-center">
                    <i className="gng-star text-grey-600 mb-4 text-4xl" />
                    <h3 className="mb-2 text-lg font-medium text-white">No Point Rules</h3>
                    <p className="text-grey-400">Define actions that award points</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Redeemable Rewards</h3>
                <button className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white">
                  <i className="gng-plus" />
                  Create Reward
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={cn(
                      "rounded-xl border p-4",
                      reward.isActive
                        ? "border-purple/50 bg-purple/10"
                        : "border-grey-800 bg-grey-900"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{reward.name}</h4>
                        <span className="text-grey-500 text-xs">{reward.type}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          reward.isActive ? "bg-purple/20 text-purple" : "bg-grey-800 text-grey-400"
                        )}
                      >
                        {reward.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {reward.description && (
                      <p className="text-grey-400 mb-3 text-sm">{reward.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-warning font-bold">
                        {reward.pointsRequired.toLocaleString()} pts
                      </span>
                      <span className="text-grey-500 text-xs">{reward.claimedCount} claimed</span>
                    </div>
                  </div>
                ))}
              </div>

              {data.rewards.length === 0 && (
                <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
                  <i className="gng-gift text-grey-600 mb-4 text-4xl" />
                  <h3 className="mb-2 text-lg font-medium text-white">No Rewards</h3>
                  <p className="text-grey-400">Create rewards users can redeem with points</p>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Top 10 Leaderboard</h3>
                <button className="bg-grey-800 text-grey-400 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
                  <i className="gng-download" />
                  Export Full Leaderboard
                </button>
              </div>

              <div className="border-grey-800 bg-grey-900 rounded-xl border">
                {data.leaderboardPreview.length > 0 ? (
                  <div className="divide-grey-800 divide-y">
                    {data.leaderboardPreview.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-4 p-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                            index === 0
                              ? "bg-yellow-600 text-white"
                              : index === 1
                                ? "bg-grey-400 text-grey-900"
                                : index === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-grey-800 text-grey-400"
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">User #{user.user_id.slice(0, 8)}</p>
                          <p className="text-grey-500 text-xs">Level {user.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-warning font-bold">
                            {user.total_points.toLocaleString()} pts
                          </p>
                          <p className="text-grey-500 text-xs">
                            <i className="gng-fire mr-1" />
                            {user.current_streak} day streak
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <i className="gng-trending-up text-grey-600 mb-4 text-4xl" />
                    <h3 className="mb-2 text-lg font-medium text-white">No Data</h3>
                    <p className="text-grey-400">Leaderboard will populate as users earn points</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
