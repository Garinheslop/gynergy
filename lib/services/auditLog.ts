// Audit Logging Service
// Tracks all admin actions for security and compliance

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "user.view"
  | "user.update"
  | "user.suspend"
  | "user.delete"
  | "user.grant_access"
  | "user.reset_streak"
  | "user.add_points"
  | "content.create"
  | "content.update"
  | "content.delete"
  | "content.publish"
  | "moderation.approve"
  | "moderation.reject"
  | "moderation.escalate"
  | "payment.refund"
  | "payment.void"
  | "settings.update"
  | "export.users"
  | "export.payments"
  | "export.analytics";

export type AuditCategory =
  | "user_management"
  | "content_management"
  | "moderation"
  | "payments"
  | "settings"
  | "data_export";

export type AuditStatus = "success" | "failure" | "pending";

export interface AuditLogEntry {
  adminId: string;
  action: AuditAction;
  category: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  errorMessage?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .insert({
        admin_id: entry.adminId,
        action_type: entry.action,
        action_category: entry.category,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        previous_state: entry.previousState,
        new_state: entry.newState,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        status: entry.status,
        error_message: entry.errorMessage,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Audit log error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper to get category from action
 */
export function getCategoryFromAction(action: AuditAction): AuditCategory {
  if (action.startsWith("user.")) return "user_management";
  if (action.startsWith("content.")) return "content_management";
  if (action.startsWith("moderation.")) return "moderation";
  if (action.startsWith("payment.")) return "payments";
  if (action.startsWith("settings.")) return "settings";
  if (action.startsWith("export.")) return "data_export";
  return "user_management";
}

/**
 * Audit log wrapper for async operations
 * Automatically logs success/failure
 */
export async function withAuditLog<T>(
  supabase: SupabaseClient,
  entry: Omit<AuditLogEntry, "status" | "errorMessage">,
  operation: () => Promise<T>
): Promise<T> {
  try {
    const result = await operation();

    // Log success
    await createAuditLog(supabase, {
      ...entry,
      status: "success",
    });

    return result;
  } catch (error) {
    // Log failure
    await createAuditLog(supabase, {
      ...entry,
      status: "failure",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  supabase: SupabaseClient,
  options: {
    adminId?: string;
    action?: AuditAction;
    category?: AuditCategory;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  logs: Array<Record<string, unknown>>;
  total: number;
  error?: string;
}> {
  try {
    let query = supabase
      .from("admin_audit_logs")
      .select("*, admin:users!admin_id(first_name, last_name, email)", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (options.adminId) {
      query = query.eq("admin_id", options.adminId);
    }
    if (options.action) {
      query = query.eq("action_type", options.action);
    }
    if (options.category) {
      query = query.eq("action_category", options.category);
    }
    if (options.resourceType) {
      query = query.eq("resource_type", options.resourceType);
    }
    if (options.resourceId) {
      query = query.eq("resource_id", options.resourceId);
    }
    if (options.startDate) {
      query = query.gte("created_at", options.startDate);
    }
    if (options.endDate) {
      query = query.lte("created_at", options.endDate);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return { logs: [], total: 0, error: error.message };
    }

    return { logs: data || [], total: count || 0 };
  } catch (error) {
    return {
      logs: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get action description for display
 */
export function getActionDescription(action: AuditAction): string {
  const descriptions: Record<AuditAction, string> = {
    "user.view": "Viewed user profile",
    "user.update": "Updated user information",
    "user.suspend": "Suspended user account",
    "user.delete": "Deleted user account",
    "user.grant_access": "Granted access to user",
    "user.reset_streak": "Reset user streak",
    "user.add_points": "Added points to user",
    "content.create": "Created content",
    "content.update": "Updated content",
    "content.delete": "Deleted content",
    "content.publish": "Published content",
    "moderation.approve": "Approved content",
    "moderation.reject": "Rejected content",
    "moderation.escalate": "Escalated for review",
    "payment.refund": "Processed refund",
    "payment.void": "Voided payment",
    "settings.update": "Updated settings",
    "export.users": "Exported user data",
    "export.payments": "Exported payment data",
    "export.analytics": "Exported analytics data",
  };

  return descriptions[action] || action;
}
