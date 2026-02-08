// Admin Module Exports

// Layout Components
export { default as AdminLayout } from "./components/layout/AdminLayout";
export { default as AdminSidebar } from "./components/layout/AdminSidebar";
export { default as AdminHeader } from "./components/layout/AdminHeader";
export { default as QuickStatsBar } from "./components/layout/QuickStatsBar";
export { default as Breadcrumbs, CollapsibleBreadcrumbs } from "./components/layout/Breadcrumbs";

// Stats Components
export { default as StatCard } from "./components/stats/StatCard";

// Chart Components
export { default as ChartContainer } from "./components/charts/ChartContainer";
export { default as AreaChartWidget } from "./components/charts/AreaChartWidget";
export { default as BarChartWidget } from "./components/charts/BarChartWidget";
export { default as PieChartWidget } from "./components/charts/PieChartWidget";
export { default as LineChartWidget } from "./components/charts/LineChartWidget";
export { default as FunnelChartWidget } from "./components/charts/FunnelChartWidget";
export { default as HeatmapWidget } from "./components/charts/HeatmapWidget";
export { EngagementHeatmap, RetentionHeatmap } from "./components/charts/HeatmapWidget";
export { default as CohortChart } from "./components/charts/CohortChart";

// Widget Components
export { default as RecentActivityWidget } from "./components/widgets/RecentActivityWidget";
export { default as AlertsWidget } from "./components/widgets/AlertsWidget";

// UI Components
export { default as DateRangePicker } from "./components/ui/DateRangePicker";
export { default as AuditLogViewer } from "./components/ui/AuditLogViewer";
export { ToastProvider, useToast, toast } from "./components/ui/Toast";
export type { Toast, ToastType } from "./components/ui/Toast";
export {
  default as KeyboardShortcutsModal,
  useKeyboardShortcuts,
} from "./components/ui/KeyboardShortcutsModal";
export {
  Skeleton,
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  WidgetSkeleton,
  UserCardSkeleton,
  DashboardSkeleton,
  PanelSkeleton,
} from "./components/ui/Skeleton";
export { default as ExportButton, QuickExport } from "./components/ui/ExportButton";
export type { ExportFormat } from "./components/ui/ExportButton";
export {
  default as ConfirmDialog,
  ConfirmProvider,
  useConfirm,
  useDeleteConfirm,
  useActionConfirm,
} from "./components/ui/ConfirmDialog";
export type { ConfirmDialogVariant } from "./components/ui/ConfirmDialog";
export {
  EmptyState,
  NoResultsState,
  NoDataState,
  NoUsersState,
  NoChartDataState,
  ErrorState,
  SuccessState,
  NoAccessState,
  ComingSoonState,
  MaintenanceState,
} from "./components/ui/EmptyState";
export {
  default as DashboardCustomizer,
  CustomizeButton,
} from "./components/ui/DashboardCustomizer";

// Aria AI
export { default as AriaPanel } from "./components/aria/AriaPanel";

// Hooks
export {
  useRealtimeStats,
  formatCurrency,
  formatNumber,
  formatTimeAgo,
} from "./hooks/useRealtimeStats";
export type { RealtimeStats, UseRealtimeStatsOptions } from "./hooks/useRealtimeStats";
export { useDashboardLayout, DASHBOARD_WIDGETS, sizeToGridCols } from "./hooks/useDashboardLayout";
export type { WidgetConfig, WidgetState, DashboardLayout } from "./hooks/useDashboardLayout";

// Types
export * from "./types/admin";
