"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

import {
  useDashboardLayout,
  DASHBOARD_WIDGETS,
  type WidgetConfig,
} from "../../hooks/useDashboardLayout";

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardCustomizer({ isOpen, onClose }: DashboardCustomizerProps) {
  const {
    layout,
    toggleWidget,
    setWidgetSize,
    moveWidgetUp,
    moveWidgetDown,
    resetLayout,
    getWidgetState,
  } = useDashboardLayout();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Widgets", icon: "gng-layout-grid" },
    { id: "stats", label: "Stats", icon: "gng-bar-chart" },
    { id: "charts", label: "Charts", icon: "gng-trending-up" },
    { id: "activity", label: "Activity", icon: "gng-activity" },
    { id: "insights", label: "Insights", icon: "gng-sparkle" },
  ];

  const filteredWidgets =
    activeCategory === "all"
      ? DASHBOARD_WIDGETS
      : DASHBOARD_WIDGETS.filter((w) => w.category === activeCategory);

  const sortedWidgets = [...filteredWidgets].sort((a, b) => {
    const stateA = getWidgetState(a.id);
    const stateB = getWidgetState(b.id);
    return (stateA?.order ?? 0) - (stateB?.order ?? 0);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="bg-grey-900 border-grey-700 relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl">
        {/* Header */}
        <div className="border-grey-800 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Customize Dashboard</h2>
            <p className="text-grey-400 text-sm">Personalize your workspace</p>
          </div>
          <button
            onClick={onClose}
            className="text-grey-400 hover:bg-grey-800 hover:text-grey-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <i className="gng-x" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="border-grey-800 flex gap-1 overflow-x-auto border-b px-4 py-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-action-900 text-action-300"
                  : "text-grey-400 hover:bg-grey-800 hover:text-grey-200"
              )}
            >
              <i className={cn(cat.icon, "text-xs")} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sortedWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                state={getWidgetState(widget.id)}
                onToggle={() => toggleWidget(widget.id)}
                onSizeChange={(size) => setWidgetSize(widget.id, size)}
                onMoveUp={() => moveWidgetUp(widget.id)}
                onMoveDown={() => moveWidgetDown(widget.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-grey-800 flex items-center justify-between border-t px-6 py-4">
          <button
            onClick={resetLayout}
            className="text-grey-400 hover:text-grey-200 text-sm transition-colors"
          >
            Reset to default
          </button>
          <div className="text-grey-500 text-xs">
            Last saved: {new Date(layout.lastModified).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual widget card in the customizer
interface WidgetCardProps {
  widget: WidgetConfig;
  state: ReturnType<ReturnType<typeof useDashboardLayout>["getWidgetState"]>;
  onToggle: () => void;
  onSizeChange: (size: "sm" | "md" | "lg" | "xl" | "full") => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function WidgetCard({
  widget,
  state,
  onToggle,
  onSizeChange,
  onMoveUp,
  onMoveDown,
}: WidgetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isVisible = state?.visible ?? widget.defaultVisible;
  const currentSize = state?.size ?? widget.defaultSize;

  const sizes = [
    { value: "sm", label: "S", title: "Small" },
    { value: "md", label: "M", title: "Medium" },
    { value: "lg", label: "L", title: "Large" },
    { value: "xl", label: "XL", title: "Extra Large" },
    { value: "full", label: "Full", title: "Full Width" },
  ] as const;

  const categoryIcons: Record<string, string> = {
    stats: "gng-bar-chart",
    charts: "gng-trending-up",
    activity: "gng-activity",
    insights: "gng-sparkle",
  };

  return (
    <div
      className={cn(
        "border-grey-700 rounded-lg border transition-all",
        isVisible ? "bg-grey-800/50" : "bg-grey-900/50 opacity-60"
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle & Order */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            className="text-grey-600 hover:text-grey-400 p-0.5 transition-colors"
            title="Move up"
          >
            <i className="gng-chevron-up text-xs" />
          </button>
          <button
            onClick={onMoveDown}
            className="text-grey-600 hover:text-grey-400 p-0.5 transition-colors"
            title="Move down"
          >
            <i className="gng-chevron-down text-xs" />
          </button>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            isVisible ? "bg-action-900" : "bg-grey-800"
          )}
        >
          <i
            className={cn(
              categoryIcons[widget.category] || "gng-box",
              isVisible ? "text-action-400" : "text-grey-500"
            )}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-medium text-white">{widget.title}</h4>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs uppercase",
                isVisible ? "bg-action-900/50 text-action-400" : "bg-grey-800 text-grey-500"
              )}
            >
              {currentSize}
            </span>
          </div>
          <p className="text-grey-500 truncate text-xs">{widget.description}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            isVisible ? "bg-action-500" : "bg-grey-700"
          )}
          role="switch"
          aria-checked={isVisible}
        >
          <span
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
              isVisible ? "left-6" : "left-1"
            )}
          />
        </button>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "text-grey-500 hover:text-grey-300 flex h-8 w-8 items-center justify-center rounded transition-colors",
            expanded && "bg-grey-700"
          )}
        >
          <i className={cn("gng-settings text-sm", expanded && "rotate-90")} />
        </button>
      </div>

      {/* Expanded Options */}
      {expanded && (
        <div className="border-grey-700 border-t px-3 py-3">
          <div className="mb-2 text-xs font-medium text-white">Widget Size</div>
          <div className="flex gap-1">
            {sizes.map((size) => {
              const isDisabled =
                widget.minSize &&
                sizes.findIndex((s) => s.value === size.value) <
                  sizes.findIndex((s) => s.value === widget.minSize);

              return (
                <button
                  key={size.value}
                  onClick={() => !isDisabled && onSizeChange(size.value)}
                  disabled={isDisabled}
                  title={size.title}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                    currentSize === size.value
                      ? "bg-action-500 text-white"
                      : isDisabled
                        ? "bg-grey-800 text-grey-600 cursor-not-allowed"
                        : "bg-grey-800 text-grey-400 hover:bg-grey-700 hover:text-grey-200"
                  )}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Button to open the customizer
export function CustomizeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border-grey-700 bg-grey-800 hover:bg-grey-700 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-colors"
    >
      <i className="gng-sliders" />
      <span>Customize</span>
    </button>
  );
}
