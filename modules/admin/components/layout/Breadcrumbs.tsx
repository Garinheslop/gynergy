"use client";

import { useMemo } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@lib/utils/style";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
}

// Route configuration for breadcrumb labels and icons
const ROUTE_CONFIG: Record<string, { label: string; icon?: string }> = {
  admin: { label: "Dashboard", icon: "gng-layout-dashboard" },
  users: { label: "Users", icon: "gng-users" },
  content: { label: "Content", icon: "gng-film" },
  community: { label: "Community", icon: "gng-message-circle" },
  payments: { label: "Payments", icon: "gng-credit-card" },
  analytics: { label: "Analytics", icon: "gng-bar-chart-2" },
  gamification: { label: "Gamification", icon: "gng-award" },
  system: { label: "System", icon: "gng-settings" },
  settings: { label: "Settings", icon: "gng-sliders" },
  moderation: { label: "Moderation", icon: "gng-shield" },
  audit: { label: "Audit Log", icon: "gng-file-text" },
  reports: { label: "Reports", icon: "gng-pie-chart" },
};

interface BreadcrumbsProps {
  className?: string;
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumbs({ className, customItems, showHome = true }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    // If custom items provided, use those
    if (customItems) {
      return customItems;
    }

    // Parse pathname into breadcrumbs
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Build breadcrumb items from path segments
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      const config = ROUTE_CONFIG[segment];

      // Skip numeric IDs - they're typically detail pages
      if (/^\d+$/.test(segment)) {
        continue;
      }

      // Skip UUIDs
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        continue;
      }

      items.push({
        label: config?.label || formatSegmentLabel(segment),
        href: currentPath,
        icon: config?.icon,
      });
    }

    return items;
  }, [pathname, customItems]);

  // Don't render if only one breadcrumb (we're at root)
  if (breadcrumbs.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav className={cn("flex items-center", className)} aria-label="Breadcrumb navigation">
      <ol className="flex items-center gap-1">
        {/* Home/Admin root */}
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/admin"
              className="text-grey-500 hover:text-grey-300 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors"
            >
              <i className="gng-home text-xs" />
              <span className="sr-only">Admin Home</span>
            </Link>
          </li>
        )}

        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.href} className="flex items-center">
              {/* Separator */}
              {(showHome || !isFirst) && (
                <i className="gng-chevron-right text-grey-600 mx-1 text-xs" />
              )}

              {isLast ? (
                // Current page - not a link
                <span
                  className="text-grey-200 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-medium"
                  aria-current="page"
                >
                  {item.icon && <i className={cn(item.icon, "text-xs")} />}
                  {item.label}
                </span>
              ) : (
                // Navigation link
                <Link
                  href={item.href}
                  className="text-grey-500 hover:text-grey-300 hover:bg-grey-800 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors"
                >
                  {item.icon && <i className={cn(item.icon, "text-xs")} />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper to format segment labels from URL slugs
function formatSegmentLabel(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Export a more feature-rich breadcrumb with dropdown for long paths
interface CollapsibleBreadcrumbsProps extends BreadcrumbsProps {
  maxVisible?: number;
}

export function CollapsibleBreadcrumbs({ maxVisible = 4, ...props }: CollapsibleBreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    if (props.customItems) {
      return props.customItems;
    }

    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;

      if (/^\d+$/.test(segment) || /^[0-9a-f]{8}-/.test(segment)) {
        continue;
      }

      const config = ROUTE_CONFIG[segment];
      items.push({
        label: config?.label || formatSegmentLabel(segment),
        href: currentPath,
        icon: config?.icon,
      });
    }

    return items;
  }, [pathname, props.customItems]);

  // If within limit, render normal breadcrumbs
  if (breadcrumbs.length <= maxVisible) {
    return <Breadcrumbs {...props} />;
  }

  // Collapse middle items
  const firstItem = breadcrumbs[0];
  const lastItems = breadcrumbs.slice(-2);
  const hiddenItems = breadcrumbs.slice(1, -2);

  return (
    <nav className={cn("flex items-center", props.className)} aria-label="Breadcrumb navigation">
      <ol className="flex items-center gap-1">
        {/* Home */}
        {props.showHome !== false && (
          <li className="flex items-center">
            <Link
              href="/admin"
              className="text-grey-500 hover:text-grey-300 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors"
            >
              <i className="gng-home text-xs" />
            </Link>
          </li>
        )}

        {/* First item */}
        <li className="flex items-center">
          <i className="gng-chevron-right text-grey-600 mx-1 text-xs" />
          <Link
            href={firstItem.href}
            className="text-grey-500 hover:text-grey-300 hover:bg-grey-800 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors"
          >
            {firstItem.icon && <i className={cn(firstItem.icon, "text-xs")} />}
            {firstItem.label}
          </Link>
        </li>

        {/* Collapsed items indicator */}
        <li className="flex items-center">
          <i className="gng-chevron-right text-grey-600 mx-1 text-xs" />
          <div className="group relative">
            <button
              className="text-grey-500 hover:text-grey-300 hover:bg-grey-800 flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors"
              aria-label={`${hiddenItems.length} more pages`}
            >
              <i className="gng-more-horizontal text-xs" />
            </button>

            {/* Dropdown */}
            <div className="bg-grey-900 border-grey-700 invisible absolute top-full left-0 mt-1 min-w-40 rounded-lg border py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              {hiddenItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-grey-400 hover:bg-grey-800 hover:text-grey-200 flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                >
                  {item.icon && <i className={cn(item.icon, "text-xs")} />}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </li>

        {/* Last items */}
        {lastItems.map((item, index) => {
          const isLast = index === lastItems.length - 1;

          return (
            <li key={item.href} className="flex items-center">
              <i className="gng-chevron-right text-grey-600 mx-1 text-xs" />
              {isLast ? (
                <span
                  className="text-grey-200 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-medium"
                  aria-current="page"
                >
                  {item.icon && <i className={cn(item.icon, "text-xs")} />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-grey-500 hover:text-grey-300 hover:bg-grey-800 flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors"
                >
                  {item.icon && <i className={cn(item.icon, "text-xs")} />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
