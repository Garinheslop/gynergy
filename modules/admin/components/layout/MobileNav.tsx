"use client";

import { useEffect, useCallback } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@lib/utils/style";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function MobileNav({ isOpen, onClose, items }: MobileNavProps) {
  const pathname = usePathname();

  // Close on escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={cn(
          "bg-grey-900 fixed top-0 left-0 z-50 h-full w-72 shadow-2xl lg:hidden",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="border-grey-800 flex h-16 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold text-white">Admin</span>
          <button
            onClick={onClose}
            className="text-grey-400 hover:bg-grey-800 flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-white"
            aria-label="Close navigation"
          >
            <i className="gng-close text-xl" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-action-900/50 text-action-300"
                        : "text-grey-400 hover:bg-grey-800 hover:text-white"
                    )}
                  >
                    <i className={cn(item.icon, "text-lg")} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-danger flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-grey-800 border-t p-4">
          <button className="text-grey-400 hover:bg-grey-800 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:text-white">
            <i className="gng-log-out text-lg" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// Mobile nav toggle button
export function MobileNavToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-grey-400 hover:bg-grey-800 flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-white lg:hidden"
      aria-label="Open navigation menu"
    >
      <i className="gng-menu text-xl" />
    </button>
  );
}
