"use client";

import { useState, useEffect, useRef } from "react";

import { cn } from "@lib/utils/style";

interface Notification {
  id: string;
  type: "alert" | "insight" | "system" | "user";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

interface NotificationsDropdownProps {
  onClose: () => void;
}

export default function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // Fetch alerts and insights
      const [alertsRes, insightsRes] = await Promise.all([
        fetch("/api/admin/alerts"),
        fetch("/api/admin/insights"),
      ]);

      const alertsData = alertsRes.ok ? await alertsRes.json() : { data: [] };
      const insightsData = insightsRes.ok ? await insightsRes.json() : { data: [] };

      // Transform to notifications
      const alertNotifications: Notification[] = (alertsData.data || []).map(
        (alert: { id: string; type: string; message: string; createdAt: string }) => ({
          id: `alert-${alert.id}`,
          type: "alert" as const,
          title: getAlertTitle(alert.type),
          message: alert.message,
          timestamp: alert.createdAt,
          isRead: false,
        })
      );

      const insightNotifications: Notification[] = (insightsData.data || [])
        .slice(0, 3)
        .map((insight: { id: string; title: string; summary: string; generatedAt: string }) => ({
          id: `insight-${insight.id}`,
          type: "insight" as const,
          title: insight.title,
          message: insight.summary,
          timestamp: insight.generatedAt,
          isRead: false,
        }));

      setNotifications([...alertNotifications, ...insightNotifications].slice(0, 10));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertTitle = (type: string): string => {
    switch (type) {
      case "revenue_drop":
        return "Revenue Alert";
      case "high_refunds":
        return "Refund Alert";
      case "churn_spike":
        return "Churn Alert";
      case "moderation_backlog":
        return "Moderation Alert";
      default:
        return "System Alert";
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return { icon: "gng-alert-triangle", color: "text-warning bg-warning/20" };
      case "insight":
        return { icon: "gng-sparkle", color: "text-purple bg-purple/20" };
      case "system":
        return { icon: "gng-settings", color: "text-grey-400 bg-grey-800" };
      case "user":
        return { icon: "gng-user", color: "text-action-400 bg-action-900" };
      default:
        return { icon: "gng-bell", color: "text-grey-400 bg-grey-800" };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={dropdownRef}
      className="border-grey-800 bg-grey-900 absolute top-full right-0 mt-2 w-96 overflow-hidden rounded-xl border shadow-2xl"
    >
      {/* Header */}
      <div className="border-grey-800 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-danger flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-action-400 hover:text-action-300 text-xs">
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="border-action-500 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-grey-800 divide-y">
            {notifications.map((notification) => {
              const { icon, color } = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "hover:bg-grey-800/50 flex cursor-pointer gap-3 p-4 transition-colors",
                    !notification.isRead && "bg-grey-800/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                      color
                    )}
                  >
                    <i className={icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between">
                      <p className="font-medium text-white">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="bg-action-400 ml-2 h-2 w-2 flex-shrink-0 rounded-full" />
                      )}
                    </div>
                    <p className="text-grey-400 line-clamp-2 text-sm">{notification.message}</p>
                    <p className="text-grey-500 mt-1 text-xs">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <i className="gng-bell-off text-grey-600 mb-2 text-3xl" />
            <p className="text-grey-400">No notifications</p>
            <p className="text-grey-500 text-xs">You&apos;re all caught up!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-grey-800 border-t p-3">
          <button className="text-action-400 hover:bg-grey-800 w-full rounded-lg py-2 text-center text-sm transition-colors">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
