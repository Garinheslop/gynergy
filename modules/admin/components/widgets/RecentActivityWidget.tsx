"use client";

import { cn } from "@lib/utils/style";

interface ActivityItem {
  id: string;
  type: "user_signup" | "purchase" | "completion" | "moderation" | "system";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

const activityConfig = {
  user_signup: {
    icon: "gng-user-plus",
    color: "text-action-400",
    bgColor: "bg-action-900",
  },
  purchase: {
    icon: "gng-credit-card",
    color: "text-primary",
    bgColor: "bg-primary/20",
  },
  completion: {
    icon: "gng-check-circle",
    color: "text-success",
    bgColor: "bg-success/20",
  },
  moderation: {
    icon: "gng-flag",
    color: "text-warning",
    bgColor: "bg-warning/20",
  },
  system: {
    icon: "gng-cog",
    color: "text-grey-400",
    bgColor: "bg-grey-800",
  },
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export default function RecentActivityWidget({
  activities,
  isLoading = false,
}: RecentActivityWidgetProps) {
  if (isLoading) {
    return (
      <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
        <div className="bg-grey-800 mb-4 h-6 w-32 animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="bg-grey-800 h-10 w-10 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-grey-800 h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-grey-800 h-3 w-1/2 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Recent Activity</h3>
        <button className="text-action-400 hover:text-action-300 text-sm">View all</button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-grey-500 py-8 text-center text-sm">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const config = activityConfig[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    config.bgColor
                  )}
                >
                  <i className={cn(config.icon, config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-grey-500 mt-0.5 line-clamp-1 text-xs">
                    {activity.description}
                  </p>
                </div>
                <span className="text-grey-600 flex-shrink-0 text-xs">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
