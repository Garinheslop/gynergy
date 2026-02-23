export const dynamic = "force-dynamic";

import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@lib/supabase-server";

/**
 * GoHighLevel Webhook Handler
 *
 * Receives events from GHL when contacts are created/updated,
 * forms are submitted, appointments are booked, etc.
 *
 * Configure in GHL Settings > Webhooks:
 *   URL: https://www.gynergy.app/api/webhooks/ghl
 *   Events: ContactCreate, ContactUpdate, FormSubmission, AppointmentBooked
 */

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    if (GHL_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-ghl-signature");
      if (!signature) {
        console.warn("GHL webhook: Missing signature header");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", GHL_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        console.warn("GHL webhook: Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const supabase = createServiceClient();

    // Deduplication via webhook_events table
    const eventId = body.id || body.event_id || crypto.randomUUID();

    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id, status")
      .eq("stripe_event_id", eventId)
      .maybeSingle();

    if (existingEvent?.status === "processed") {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // Record event for tracking
    const { error: upsertError } = await supabase.from("webhook_events").upsert(
      {
        stripe_event_id: eventId,
        event_type: `ghl.${body.type || body.event || "unknown"}`,
        status: "processing",
        payload: body,
        attempts: ((existingEvent as { attempts?: number })?.attempts ?? 0) + 1,
        created_at: new Date().toISOString(),
      },
      { onConflict: "stripe_event_id" }
    );

    if (upsertError) {
      console.error("[ghl-webhook] Event upsert error:", upsertError);
    }

    // Route to handlers
    const eventType = body.type || body.event;

    switch (eventType) {
      case "ContactCreate":
      case "ContactUpdate":
        await handleContactSync(supabase, body);
        break;

      case "FormSubmission":
        await handleFormSubmission(supabase, body);
        break;

      case "AppointmentBooked":
        await handleAppointmentBooked(supabase, body);
        break;

      case "TagAdded":
      case "TagRemoved":
        await handleTagChange(supabase, body);
        break;

      default:
        // eslint-disable-next-line no-console
        console.log(`[ghl-webhook] Unhandled event: ${eventType}`);
        break;
    }

    // Mark processed
    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("GHL webhook error:", error);
    // Always return 200 to prevent GHL retry storms
    return NextResponse.json({ received: true, error: "Handler failed" });
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

async function handleContactSync(supabase: SupabaseServiceClient, body: Record<string, unknown>) {
  const contact = (body.contact || body) as {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    customField?: Record<string, unknown>;
  };

  const email = contact.email;
  if (!email) return;

  await supabase.from("ghl_contact_sync").upsert(
    {
      ghl_contact_id: contact.id || "",
      email: email.toLowerCase().trim(),
      first_name: contact.firstName || null,
      last_name: contact.lastName || null,
      phone: contact.phone || null,
      tags: contact.tags || [],
      custom_fields: contact.customField || {},
      last_synced_from_ghl: new Date().toISOString(),
      sync_status: "synced",
    },
    { onConflict: "ghl_contact_id" }
  );
}

async function handleFormSubmission(
  supabase: SupabaseServiceClient,
  body: Record<string, unknown>
) {
  const contact = (body.contact || {}) as { email?: string };
  const email = contact.email;
  if (!email) return;

  await supabase.from("ghl_webhook_log").insert({
    event_type: "form_submission",
    email: email.toLowerCase().trim(),
    payload: body,
  });
}

async function handleAppointmentBooked(
  supabase: SupabaseServiceClient,
  body: Record<string, unknown>
) {
  const contact = (body.contact || {}) as { email?: string };

  await supabase.from("ghl_webhook_log").insert({
    event_type: "appointment_booked",
    email: contact.email?.toLowerCase().trim() || null,
    payload: body,
  });
}

async function handleTagChange(supabase: SupabaseServiceClient, body: Record<string, unknown>) {
  const contactId = (body as { contactId?: string }).contactId;
  if (!contactId) return;

  const tags = (body as { tags?: string[] }).tags || [];

  await supabase
    .from("ghl_contact_sync")
    .update({
      tags,
      last_synced_from_ghl: new Date().toISOString(),
    })
    .eq("ghl_contact_id", contactId);
}
