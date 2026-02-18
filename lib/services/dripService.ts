/**
 * Drip Campaign Service
 *
 * Manages enrollment, advancement, and cancellation of users
 * through automated email drip campaigns.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient } from "@lib/supabase-server";

// ============================================================================
// Types
// ============================================================================

export type TriggerEvent =
  | "webinar_registered"
  | "assessment_completed"
  | "purchase_completed"
  | "cart_abandoned"
  | "user_inactive"
  | "friend_codes_issued"
  | "community_activated";

export interface EnrollResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
}

export interface DripEmail {
  id: string;
  campaign_id: string;
  sequence_order: number;
  delay_hours: number;
  subject: string;
  template_key: string;
}

export interface DripEnrollment {
  id: string;
  campaign_id: string;
  email: string;
  user_id: string | null;
  current_step: number;
  last_sent_at: string | null;
  enrolled_at: string;
  status: "active" | "completed" | "cancelled";
  metadata: Record<string, any>;
}

// ============================================================================
// Enrollment
// ============================================================================

/**
 * Enroll a user in a drip campaign.
 * Idempotent — if already enrolled, returns existing enrollment.
 */
export async function enrollInDrip(
  triggerEvent: TriggerEvent,
  email: string,
  metadata: Record<string, any> = {},
  userId?: string
): Promise<EnrollResult> {
  try {
    const supabase = createServiceClient();

    // Find the active campaign for this trigger
    const { data: campaign, error: campaignError } = await supabase
      .from("drip_campaigns")
      .select("id")
      .eq("trigger_event", triggerEvent)
      .eq("status", "active")
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: `No active campaign for trigger: ${triggerEvent}` };
    }

    // Check for existing enrollment
    const { data: existing } = await supabase
      .from("drip_enrollments")
      .select("id, status")
      .eq("campaign_id", campaign.id)
      .eq("email", email)
      .single();

    if (existing) {
      // If cancelled, re-enroll; if active/completed, skip
      if (existing.status !== "cancelled") {
        return { success: true, enrollmentId: existing.id };
      }

      // Re-activate cancelled enrollment
      const { error: updateError } = await supabase
        .from("drip_enrollments")
        .update({
          status: "active",
          current_step: 0,
          last_sent_at: null,
          enrolled_at: new Date().toISOString(),
          metadata,
        })
        .eq("id", existing.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, enrollmentId: existing.id };
    }

    // Create new enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("drip_enrollments")
      .insert({
        campaign_id: campaign.id,
        email,
        user_id: userId || null,
        current_step: 0,
        metadata,
      })
      .select("id")
      .single();

    if (enrollError) {
      return { success: false, error: enrollError.message };
    }

    return { success: true, enrollmentId: enrollment.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[dripService] Enrollment error:", message);
    return { success: false, error: message };
  }
}

// ============================================================================
// Cancellation
// ============================================================================

/**
 * Cancel a user's enrollment in a drip campaign.
 * Used when user converts (e.g., purchase cancels the webinar nurture drip).
 */
export async function cancelDrip(
  triggerEvent: TriggerEvent,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Find the campaign
    const { data: campaign } = await supabase
      .from("drip_campaigns")
      .select("id")
      .eq("trigger_event", triggerEvent)
      .single();

    if (!campaign) {
      return { success: true }; // No campaign = nothing to cancel
    }

    const { error } = await supabase
      .from("drip_enrollments")
      .update({ status: "cancelled" })
      .eq("campaign_id", campaign.id)
      .eq("email", email)
      .eq("status", "active");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[dripService] Cancel error:", message);
    return { success: false, error: message };
  }
}

// ============================================================================
// Step Advancement (used by cron processor)
// ============================================================================

/**
 * Get all active enrollments that are ready for their next email.
 */
export async function getReadyEnrollments(): Promise<
  Array<DripEnrollment & { nextEmail: DripEmail }>
> {
  try {
    const supabase = createServiceClient();

    // Get all active enrollments
    const { data: enrollments, error } = await supabase
      .from("drip_enrollments")
      .select("*")
      .eq("status", "active");

    if (error || !enrollments) {
      console.error("[dripService] Error fetching enrollments:", error);
      return [];
    }

    const ready: Array<DripEnrollment & { nextEmail: DripEmail }> = [];

    for (const enrollment of enrollments) {
      const nextStep = enrollment.current_step + 1;

      // Get the next email in sequence
      const { data: nextEmail } = await supabase
        .from("drip_emails")
        .select("*")
        .eq("campaign_id", enrollment.campaign_id)
        .eq("sequence_order", nextStep)
        .single();

      if (!nextEmail) {
        // No more emails — mark as completed
        await supabase
          .from("drip_enrollments")
          .update({ status: "completed" })
          .eq("id", enrollment.id);
        continue;
      }

      // Check if enough time has elapsed
      const referenceTime = enrollment.last_sent_at || enrollment.enrolled_at;
      const elapsed = (Date.now() - new Date(referenceTime).getTime()) / (1000 * 60 * 60);

      if (elapsed >= nextEmail.delay_hours) {
        ready.push({ ...enrollment, nextEmail });
      }
    }

    return ready;
  } catch (error) {
    console.error("[dripService] Error getting ready enrollments:", error);
    return [];
  }
}

/**
 * Advance an enrollment after sending an email.
 */
export async function advanceEnrollment(enrollmentId: string, step: number): Promise<void> {
  const supabase = createServiceClient();

  await supabase
    .from("drip_enrollments")
    .update({
      current_step: step,
      last_sent_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);
}
