"use client";

import { FC, useCallback, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import {
  useNotificationCenter,
  NotificationItem,
  NotificationCategory,
} from "@lib/hooks/useNotificationCenter";
import { formatTimeAgo } from "@lib/utils/date";
import { cn } from "@lib/utils/style";
import TransitionWrapper from "@modules/common/components/wrappers/TransitionWrapper";
import useComponentVisible from "@modules/common/hooks/useComponentVisible";

const CATEGORY_CONFIG: Record<NotificationCategory, { icon: string; color: string; bg: string }> = {
  social: { icon: "gng-people", color: "text-action-400", bg: "bg-action-900" },
  encouragement: { icon: "gng-heart", color: "text-primary-400", bg: "bg-primary-900" },
  achievement: { icon: "gng-badge", color: "text-yellow-400", bg: "bg-yellow-900" },
  reminder: { icon: "gng-clock", color: "text-blue-400", bg: "bg-blue-900" },
  system: { icon: "gng-settings", color: "text-grey-400", bg: "bg-grey-800" },
};

const NotificationBell: FC = () => {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible<HTMLDivElement>(false);

  const { notifications, unreadCount, isLoading, hasMore, markAsRead, markAllAsRead, loadMore } =
    useNotificationCenter(userId);

  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    if (!isComponentVisible) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsComponentVisible(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isComponentVisible, setIsComponentVisible]);

  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      // Fire-and-forget: optimistic update is instant, don't block navigation
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      if (notification.actionType === "navigate" && notification.actionData?.route) {
        setIsComponentVisible(false);
        router.push(notification.actionData.route as string);
      }
    },
    [markAsRead, router, setIsComponentVisible]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  if (!userId) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setIsComponentVisible(!isComponentVisible)}
        className="focus-visible:ring-action-500 relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isComponentVisible}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-content-secondary h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="bg-danger absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <TransitionWrapper
        isOpen={isComponentVisible}
        sx="absolute right-0 top-[48px] z-modal w-80 sm:w-96"
      >
        <div className="border-border-light bg-bkg-light overflow-hidden rounded-xl border shadow-2xl">
          {/* Header */}
          <div className="border-border-light flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-content-dark text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-danger flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-action hover:text-action-100 text-xs font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="border-action h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-border-light divide-y">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-content-secondary mb-2 h-8 w-8 opacity-40"
                  aria-hidden="true"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <p className="text-content-secondary text-sm">No notifications yet</p>
                <p className="text-content-secondary mt-0.5 text-xs opacity-60">
                  You&apos;re all caught up!
                </p>
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="border-border-light border-t px-4 py-2">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="text-action hover:text-action-100 w-full py-1 text-center text-xs font-medium disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </TransitionWrapper>
    </div>
  );
};

interface NotificationRowProps {
  notification: NotificationItem;
  onClick: (notification: NotificationItem) => void;
}

const NotificationRow: FC<NotificationRowProps> = ({ notification, onClick }) => {
  const config = CATEGORY_CONFIG[notification.category] || CATEGORY_CONFIG.system;

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-bkg-dark/5",
        !notification.isRead && "bg-action/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
          config.bg
        )}
      >
        <i className={cn(config.icon, config.color, "text-sm")} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-content-dark text-sm leading-snug",
              !notification.isRead && "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="bg-action mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
          )}
        </div>
        <p className="text-content-secondary mt-0.5 line-clamp-2 text-xs">{notification.body}</p>
        <p className="text-content-secondary mt-1 text-[11px] opacity-60">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
};

export default NotificationBell;
