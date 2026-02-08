"use client";

import { useState, useEffect, useCallback } from "react";

// Widget configuration
export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  defaultVisible: boolean;
  defaultSize: "sm" | "md" | "lg" | "xl" | "full";
  category: "stats" | "charts" | "activity" | "insights";
  minSize?: "sm" | "md";
}

// Available widgets in the dashboard
export const DASHBOARD_WIDGETS: WidgetConfig[] = [
  {
    id: "stats-users",
    title: "Active Users",
    description: "Current user activity metrics",
    defaultVisible: true,
    defaultSize: "sm",
    category: "stats",
  },
  {
    id: "stats-revenue",
    title: "Revenue",
    description: "Today's revenue and trends",
    defaultVisible: true,
    defaultSize: "sm",
    category: "stats",
  },
  {
    id: "stats-completion",
    title: "Completion Rate",
    description: "Challenge completion metrics",
    defaultVisible: true,
    defaultSize: "sm",
    category: "stats",
  },
  {
    id: "stats-moderation",
    title: "Moderation Queue",
    description: "Pending moderation items",
    defaultVisible: true,
    defaultSize: "sm",
    category: "stats",
  },
  {
    id: "chart-growth",
    title: "User Growth",
    description: "User signups over time",
    defaultVisible: true,
    defaultSize: "lg",
    category: "charts",
    minSize: "md",
  },
  {
    id: "chart-revenue",
    title: "Revenue Trend",
    description: "Revenue over the past 30 days",
    defaultVisible: true,
    defaultSize: "lg",
    category: "charts",
    minSize: "md",
  },
  {
    id: "chart-engagement",
    title: "Engagement Heatmap",
    description: "User activity by time of day",
    defaultVisible: false,
    defaultSize: "lg",
    category: "charts",
    minSize: "md",
  },
  {
    id: "chart-funnel",
    title: "Conversion Funnel",
    description: "User journey conversion rates",
    defaultVisible: false,
    defaultSize: "lg",
    category: "charts",
    minSize: "md",
  },
  {
    id: "activity-recent",
    title: "Recent Activity",
    description: "Latest platform events",
    defaultVisible: true,
    defaultSize: "md",
    category: "activity",
  },
  {
    id: "activity-alerts",
    title: "System Alerts",
    description: "Important notifications",
    defaultVisible: true,
    defaultSize: "md",
    category: "activity",
  },
  {
    id: "insights-aria",
    title: "Aria Insights",
    description: "AI-powered recommendations",
    defaultVisible: true,
    defaultSize: "md",
    category: "insights",
  },
];

// Layout state
export interface WidgetState {
  id: string;
  visible: boolean;
  size: "sm" | "md" | "lg" | "xl" | "full";
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetState[];
  lastModified: string;
}

const STORAGE_KEY = "admin-dashboard-layout";
const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: DASHBOARD_WIDGETS.map((w, i) => ({
    id: w.id,
    visible: w.defaultVisible,
    size: w.defaultSize,
    order: i,
  })),
  lastModified: new Date().toISOString(),
};

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Merge with defaults to handle new widgets
        const mergedWidgets = DASHBOARD_WIDGETS.map((defaultWidget, index) => {
          const stored = parsed.widgets.find((w) => w.id === defaultWidget.id);
          return (
            stored || {
              id: defaultWidget.id,
              visible: defaultWidget.defaultVisible,
              size: defaultWidget.defaultSize,
              order: index,
            }
          );
        });
        setLayout({
          widgets: mergedWidgets.sort((a, b) => a.order - b.order),
          lastModified: parsed.lastModified,
        });
      }
    } catch {
      // Use defaults on error
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch {
        // Storage might be full or disabled
      }
    }
  }, [layout, isLoaded]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w)),
      lastModified: new Date().toISOString(),
    }));
  }, []);

  // Set widget visibility explicitly
  const setWidgetVisible = useCallback((widgetId: string, visible: boolean) => {
    setLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, visible } : w)),
      lastModified: new Date().toISOString(),
    }));
  }, []);

  // Change widget size
  const setWidgetSize = useCallback(
    (widgetId: string, size: "sm" | "md" | "lg" | "xl" | "full") => {
      const widget = DASHBOARD_WIDGETS.find((w) => w.id === widgetId);
      const minSize = widget?.minSize;

      // Respect minimum size
      const sizes = ["sm", "md", "lg", "xl", "full"];
      const minIndex = minSize ? sizes.indexOf(minSize) : 0;
      const sizeIndex = sizes.indexOf(size);
      const finalSize = sizeIndex < minIndex ? (minSize as typeof size) : size;

      setLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, size: finalSize } : w)),
        lastModified: new Date().toISOString(),
      }));
    },
    []
  );

  // Move widget up in order
  const moveWidgetUp = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const widgets = [...prev.widgets];
      const index = widgets.findIndex((w) => w.id === widgetId);
      if (index > 0) {
        [widgets[index - 1], widgets[index]] = [widgets[index], widgets[index - 1]];
        // Update order numbers
        widgets.forEach((w, i) => {
          w.order = i;
        });
      }
      return { ...prev, widgets, lastModified: new Date().toISOString() };
    });
  }, []);

  // Move widget down in order
  const moveWidgetDown = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const widgets = [...prev.widgets];
      const index = widgets.findIndex((w) => w.id === widgetId);
      if (index < widgets.length - 1) {
        [widgets[index], widgets[index + 1]] = [widgets[index + 1], widgets[index]];
        // Update order numbers
        widgets.forEach((w, i) => {
          w.order = i;
        });
      }
      return { ...prev, widgets, lastModified: new Date().toISOString() };
    });
  }, []);

  // Reset to defaults
  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get visible widgets sorted by order
  const visibleWidgets = layout.widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  // Get widget config by ID
  const getWidgetConfig = useCallback((widgetId: string) => {
    return DASHBOARD_WIDGETS.find((w) => w.id === widgetId);
  }, []);

  // Get widget state by ID
  const getWidgetState = useCallback(
    (widgetId: string) => {
      return layout.widgets.find((w) => w.id === widgetId);
    },
    [layout.widgets]
  );

  // Check if widget is visible
  const isWidgetVisible = useCallback(
    (widgetId: string) => {
      return layout.widgets.find((w) => w.id === widgetId)?.visible ?? false;
    },
    [layout.widgets]
  );

  return {
    layout,
    visibleWidgets,
    isLoaded,
    toggleWidget,
    setWidgetVisible,
    setWidgetSize,
    moveWidgetUp,
    moveWidgetDown,
    resetLayout,
    getWidgetConfig,
    getWidgetState,
    isWidgetVisible,
  };
}

// Size to grid column classes mapping
export const sizeToGridCols: Record<string, string> = {
  sm: "col-span-1",
  md: "col-span-1 lg:col-span-2",
  lg: "col-span-1 lg:col-span-2 xl:col-span-3",
  xl: "col-span-1 lg:col-span-2 xl:col-span-4",
  full: "col-span-full",
};
