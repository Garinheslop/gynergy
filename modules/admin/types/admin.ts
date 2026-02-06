// Admin Dashboard Types

// Stat card types
export interface StatCardData {
  title: string;
  value: number | string;
  change?: {
    value: number;
    period: "24h" | "7d" | "30d";
    isPositive: boolean;
  };
  icon?: string;
  sparklineData?: number[];
  format?: "number" | "currency" | "percentage";
}

// Chart types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: "area" | "bar" | "line" | "pie" | "funnel";
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  secondaryColor?: string;
}

// User management types
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  status: "active" | "suspended" | "pending";
  role: "user" | "admin";
  createdAt: string;
  lastActive?: string;
  hasChallengeAccess: boolean;
  totalPoints: number;
  currentStreak: number;
}

// Moderation types
export interface ModerationItem {
  id: string;
  contentType: "post" | "comment" | "reflection" | "profile" | "message";
  contentId: string;
  contentPreview: string;
  reportedBy?: string;
  reportReason?: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_review" | "approved" | "rejected" | "escalated";
  aiRiskScore?: number;
  aiRiskFactors?: string[];
  aiRecommendation?: string;
  createdAt: string;
}

// Audit log types
export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  actionType:
    | "view"
    | "create"
    | "update"
    | "delete"
    | "export"
    | "suspend"
    | "unsuspend"
    | "approve"
    | "reject"
    | "escalate";
  actionCategory:
    | "user_management"
    | "content_moderation"
    | "payment"
    | "system"
    | "analytics"
    | "settings";
  resourceType: string;
  resourceId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  status: "success" | "failure" | "pending";
  createdAt: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersWeek: number;

  // Revenue metrics
  totalRevenue: number;
  revenueMonth: number;
  refundsTotal?: number;
  mrr?: number; // Monthly Recurring Revenue
  arr?: number; // Annual Recurring Revenue

  // Sales breakdown
  challengePurchases?: number;
  friendCodeRedemptions?: number;
  friendCodeConversionRate?: number;
  activeSubscriptions?: number;

  // Engagement metrics
  totalJournalEntries?: number;
  challengeCompletionRate: number;
  averageStreak: number;

  // Moderation
  pendingModeration: number;

  // System
  systemHealth: "healthy" | "degraded" | "down";
  lastUpdated?: string;
}

// Payment analytics types
export interface PaymentMetrics {
  // Revenue
  totalRevenue: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  mrr: number;
  arr: number;

  // Refunds
  refundsTotal: number;
  refundRate: number;

  // Sales breakdown
  challengePurchases: number;
  challengeRevenue: number;
  friendCodeRedemptions: number;
  subscriptionRevenue: number;

  // Trends
  revenueTrend: ChartDataPoint[];
  purchasesByDay: ChartDataPoint[];

  // Friend codes
  friendCodesCreated: number;
  friendCodesUsed: number;
  friendCodeConversionRate: number;
}

export interface PurchaseRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  purchaseType: "challenge" | "challenge_friend_code";
  amountCents: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripeSessionId?: string;
  purchasedAt?: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: "active" | "past_due" | "canceled" | "unpaid" | "trialing";
  amountCents: number;
  interval: "month" | "year";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// Navigation
export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface TableFilters {
  search?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  [key: string]: unknown;
}

// Aria AI types
export interface AriaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionItems?: AriaActionItem[];
}

export interface AriaActionItem {
  id: string;
  label: string;
  type: "navigate" | "action" | "insight";
  data?: Record<string, unknown>;
}

export interface AriaInsight {
  id: string;
  type: "alert" | "opportunity" | "trend" | "anomaly";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
}

// Admin preferences
export interface AdminPreferences {
  dashboardLayout: {
    widgets: string[];
  };
  defaultDateRange: "24h" | "7d" | "30d" | "90d" | "1y" | "all";
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  ariaEnabled: boolean;
  ariaAutoInsights: boolean;
  ariaVoiceEnabled: boolean;
}

// API response types
export interface AdminApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
