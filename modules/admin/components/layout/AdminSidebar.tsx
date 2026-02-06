"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@lib/utils/style";

import type { AdminNavItem } from "../../types/admin";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingModeration?: number;
}

const navItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "gng-dashboard" },
  { label: "Users", href: "/admin/users", icon: "gng-user" },
  { label: "Content", href: "/admin/content", icon: "gng-book" },
  { label: "Community", href: "/admin/community", icon: "gng-community" },
  { label: "Payments", href: "/admin/payments", icon: "gng-credit-card" },
  { label: "Analytics", href: "/admin/analytics", icon: "gng-stats" },
  { label: "Gamification", href: "/admin/gamification", icon: "gng-trophy" },
  { label: "System", href: "/admin/system", icon: "gng-settings" },
];

export default function AdminSidebar({
  collapsed,
  onToggle,
  pendingModeration,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "bg-bkg-dark border-grey-800 fixed top-0 left-0 z-40 flex h-screen flex-col border-r transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="border-grey-800 flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-xl font-bold text-white">Gynergy</span>}
        <button
          onClick={onToggle}
          className="text-grey-400 hover:bg-grey-800 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i
            className={cn(
              "text-lg transition-transform",
              collapsed ? "gng-chevron-right" : "gng-chevron-left"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const showBadge =
              item.href === "/admin/community" && pendingModeration && pendingModeration > 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                    active
                      ? "bg-action-900 text-action-300"
                      : "text-grey-400 hover:bg-grey-800 hover:text-white"
                  )}
                >
                  <i
                    className={cn(
                      item.icon,
                      "text-xl transition-colors",
                      active ? "text-action-400" : "text-grey-500 group-hover:text-grey-300"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {showBadge && (
                        <span className="bg-danger ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
                          {pendingModeration > 99 ? "99+" : pendingModeration}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && showBadge && (
                    <span className="bg-danger absolute top-1 right-1 flex h-2 w-2 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings at bottom */}
      <div className="border-grey-800 border-t px-3 py-4">
        <Link
          href="/admin/settings"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
            pathname === "/admin/settings"
              ? "bg-action-900 text-action-300"
              : "text-grey-400 hover:bg-grey-800 hover:text-white"
          )}
        >
          <i className="gng-cog text-grey-500 group-hover:text-grey-300 text-xl" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
