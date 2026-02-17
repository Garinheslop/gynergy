/**
 * Event Service
 *
 * Central event bus for the automation engine.
 * emitEvent() logs an event and evaluates matching rules.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// Types
// ============================================================================

export type EventType =
  | "journal_completed"
  | "action_completed"
  | "streak_reached"
  | "badge_earned"
  | "assessment_completed"
  | "webinar_registered"
  | "purchase_completed"
  | "points_milestone";

export interface AutomationEvent {
  id: string;
  event_type: EventType;
  user_id: string | null;
  email: string | null;
  payload: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger_event: string;
  conditions: Record<string, any>;
  actions: Array<{ type: string; [key: string]: any }>;
  is_active: boolean;
  priority: number;
}

export interface EmitResult {
  eventId: string;
  rulesMatched: number;
  actionsExecuted: number;
}

// ============================================================================
// Event Emission
// ============================================================================

/**
 * Emit an event into the automation system.
 *
 * 1. Logs the event to automation_events
 * 2. Finds matching active rules
 * 3. Evaluates conditions
 * 4. Executes actions
 * 5. Marks event as processed
 *
 * Non-blocking: errors are caught and logged.
 */
export async function emitEvent(
  eventType: EventType,
  payload: Record<string, any>,
  options?: { userId?: string; email?: string }
): Promise<EmitResult | null> {
  try {
    const supabase = createServiceClient();

    // 1. Log the event
    const { data: event, error: insertError } = await supabase
      .from("automation_events")
      .insert({
        event_type: eventType,
        user_id: options?.userId || null,
        email: options?.email || null,
        payload,
      })
      .select("id")
      .single();

    if (insertError || !event) {
      console.error("[eventService] Failed to log event:", insertError);
      return null;
    }

    // 2. Find matching rules
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_event", eventType)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (!rules || rules.length === 0) {
      // No rules to evaluate — mark processed
      await supabase
        .from("automation_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", event.id);

      return { eventId: event.id, rulesMatched: 0, actionsExecuted: 0 };
    }

    // 3. Evaluate conditions and execute actions
    let rulesMatched = 0;
    let actionsExecuted = 0;

    for (const rule of rules) {
      if (evaluateConditions(rule.conditions, payload)) {
        rulesMatched++;

        for (const action of rule.actions || []) {
          try {
            await executeAction(action, payload, options);
            actionsExecuted++;
          } catch (err) {
            console.error(`[eventService] Action failed for rule "${rule.name}":`, err);
          }
        }
      }
    }

    // 4. Mark processed
    await supabase
      .from("automation_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return { eventId: event.id, rulesMatched, actionsExecuted };
  } catch (error) {
    console.error("[eventService] emitEvent error:", error);
    return null;
  }
}

// ============================================================================
// Condition Evaluation
// ============================================================================

/**
 * Check if an event's payload satisfies a rule's conditions.
 *
 * Supports:
 * - Exact match: {"key": "value"}
 * - Numeric comparison: {"key": 7} (checks payload.key >= 7)
 * - Boolean: {"key": true}
 * - Empty conditions: always matches
 */
function evaluateConditions(
  conditions: Record<string, any>,
  payload: Record<string, any>
): boolean {
  // Empty conditions = always match
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = payload[key];

    if (typeof expected === "number") {
      // Numeric: payload value must be >= expected
      if (typeof actual !== "number" || actual < expected) {
        return false;
      }
    } else if (typeof expected === "boolean") {
      if (actual !== expected) {
        return false;
      }
    } else if (typeof expected === "string") {
      if (actual !== expected) {
        return false;
      }
    } else {
      // Complex conditions — skip for now (future: $gte, $lte, $in operators)
      continue;
    }
  }

  return true;
}

// ============================================================================
// Action Execution
// ============================================================================

/**
 * Execute a single automation action.
 *
 * Supported action types:
 * - send_email: Send an email using a template
 * - log: Log a message (for debugging)
 */
async function executeAction(
  action: { type: string; [key: string]: any },
  payload: Record<string, any>,
  options?: { userId?: string; email?: string }
): Promise<void> {
  switch (action.type) {
    case "send_email": {
      // Dynamically import to avoid circular deps
      const { sendEmail } = await import("@lib/email");
      const { renderDripTemplate } = await import("@lib/email/drip-templates");

      const email = options?.email || payload.email;
      if (!email) {
        console.warn("[eventService] send_email action has no recipient");
        return;
      }

      const template = renderDripTemplate(action.template, {
        ...payload,
        firstName: payload.firstName || payload.first_name,
      });

      if (template) {
        await sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });
      }
      break;
    }

    case "log": {
      console.log(`[automation] ${action.message || "Event processed"}`, payload);
      break;
    }

    default:
      console.warn(`[eventService] Unknown action type: ${action.type}`);
  }
}

// ============================================================================
// Batch Processor (for cron backup)
// ============================================================================

/**
 * Process any unprocessed events (backup for missed real-time processing).
 * Called by the automation cron job.
 */
export async function processUnhandledEvents(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = createServiceClient();
  let processed = 0;
  let errors = 0;

  try {
    // Get unprocessed events older than 1 minute (give real-time a chance)
    const cutoff = new Date(Date.now() - 60_000).toISOString();

    const { data: events } = await supabase
      .from("automation_events")
      .select("*")
      .eq("processed", false)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!events || events.length === 0) {
      return { processed: 0, errors: 0 };
    }

    for (const event of events) {
      try {
        // Find matching rules
        const { data: rules } = await supabase
          .from("automation_rules")
          .select("*")
          .eq("trigger_event", event.event_type)
          .eq("is_active", true)
          .order("priority", { ascending: false });

        if (rules) {
          for (const rule of rules) {
            if (evaluateConditions(rule.conditions, event.payload)) {
              for (const action of rule.actions || []) {
                try {
                  await executeAction(action, event.payload, {
                    userId: event.user_id,
                    email: event.email,
                  });
                } catch {
                  errors++;
                }
              }
            }
          }
        }

        // Mark processed
        await supabase
          .from("automation_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", event.id);

        processed++;
      } catch {
        errors++;
      }
    }
  } catch (error) {
    console.error("[eventService] Batch processing error:", error);
  }

  return { processed, errors };
}
