/**
 * GoHighLevel (GHL) CRM Service
 *
 * Manages contact sync between Gynergy/Supabase and GHL.
 * All operations are non-blocking and retryable.
 *
 * GHL API v1 Docs: https://highlevel.stoplight.io/docs/integrations
 * Base URL: https://rest.gohighlevel.com/v1
 * Auth: Authorization: Bearer <GHL_API_KEY>
 */

// ============================================================================
// Types
// ============================================================================

export interface GHLContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  tags?: string[];
  customField?: Record<string, string>;
  source?: string;
}

export interface GHLContactResponse {
  contact: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tags: string[];
    customField?: Record<string, unknown>;
  };
}

export interface GHLLookupResponse {
  contacts: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tags: string[];
    customField?: Record<string, unknown>;
  }>;
}

export type GHLSyncResult = {
  success: boolean;
  contactId?: string;
  error?: string;
};

export type GHLTag =
  | "webinar-registered"
  | "assessment-completed"
  | "challenge-purchased"
  | "friend-code-redeemed"
  | "journal-subscriber"
  | "community-member"
  | "challenge-completed"
  | "cart-abandoned"
  | "subscription-canceled"
  | "subscription-past-due"
  | "lead-exit-intent"
  | "lead-landing-page";

// ============================================================================
// Client (lazy initialization pattern from lib/stripe.ts)
// ============================================================================

const GHL_BASE_URL = "https://rest.gohighlevel.com/v1";

function getApiKey(): string {
  const key = process.env.GHL_API_KEY;
  if (!key) {
    throw new Error("GHL_API_KEY is not configured");
  }
  return key;
}

async function ghlFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${GHL_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`GHL API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// Contact Operations
// ============================================================================

/**
 * Look up a GHL contact by email. Returns null if not found.
 */
export async function lookupContactByEmail(
  email: string
): Promise<GHLContactResponse["contact"] | null> {
  try {
    const data = await ghlFetch<GHLLookupResponse>(
      `/contacts/lookup?email=${encodeURIComponent(email)}`
    );
    return data.contacts?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a new contact in GHL.
 */
export async function createContact(contact: GHLContact): Promise<GHLSyncResult> {
  try {
    const data = await ghlFetch<GHLContactResponse>("/contacts/", {
      method: "POST",
      body: JSON.stringify(contact),
    });
    return { success: true, contactId: data.contact.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] Create contact error:", message);
    return { success: false, error: message };
  }
}

/**
 * Update an existing GHL contact.
 */
export async function updateContact(
  contactId: string,
  updates: Partial<GHLContact>
): Promise<GHLSyncResult> {
  try {
    await ghlFetch<GHLContactResponse>(`/contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return { success: true, contactId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] Update contact error:", message);
    return { success: false, error: message };
  }
}

/**
 * Create or update a GHL contact (upsert by email).
 * This is the primary sync function used throughout the app.
 */
export async function createOrUpdateGHLContact(contact: GHLContact): Promise<GHLSyncResult> {
  try {
    const existing = await lookupContactByEmail(contact.email);

    if (existing) {
      return updateContact(existing.id, contact);
    } else {
      return createContact(contact);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] createOrUpdate error:", message);
    return { success: false, error: message };
  }
}

/**
 * Add tags to a GHL contact.
 */
export async function addTagsToContact(contactId: string, tags: GHLTag[]): Promise<GHLSyncResult> {
  try {
    await ghlFetch(`/contacts/${contactId}/tags/`, {
      method: "POST",
      body: JSON.stringify({ tags }),
    });
    return { success: true, contactId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] Add tags error:", message);
    return { success: false, error: message };
  }
}

/**
 * Remove tags from a GHL contact.
 */
export async function removeTagsFromContact(
  contactId: string,
  tags: GHLTag[]
): Promise<GHLSyncResult> {
  try {
    await ghlFetch(`/contacts/${contactId}/tags/`, {
      method: "DELETE",
      body: JSON.stringify({ tags }),
    });
    return { success: true, contactId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] Remove tags error:", message);
    return { success: false, error: message };
  }
}

/**
 * Add a note to a GHL contact.
 */
export async function addNoteToContact(contactId: string, body: string): Promise<GHLSyncResult> {
  try {
    await ghlFetch(`/contacts/${contactId}/notes/`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    return { success: true, contactId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ghlService] Add note error:", message);
    return { success: false, error: message };
  }
}

// ============================================================================
// High-Level Sync Functions (called from API routes)
// ============================================================================

/**
 * Sync a webinar registration to GHL.
 * Called non-blocking from /api/webinar/register.
 */
export async function syncWebinarRegistration(params: {
  email: string;
  firstName?: string;
  webinarTitle?: string;
  source?: string;
}): Promise<GHLSyncResult> {
  const result = await createOrUpdateGHLContact({
    email: params.email,
    firstName: params.firstName,
    source: params.source || "webinar_registration",
    tags: ["webinar-registered"],
    customField: {
      last_webinar_title: params.webinarTitle || "",
      webinar_registered_at: new Date().toISOString(),
    },
  });

  if (result.success && result.contactId) {
    await addTagsToContact(result.contactId, ["webinar-registered"]).catch(() => {});
  }

  return result;
}

/**
 * Sync an assessment completion to GHL.
 * Called non-blocking from /api/assessment/submit.
 */
export async function syncAssessmentCompletion(params: {
  email: string;
  firstName?: string;
  totalScore: number;
  lowestPillar: string;
  interpretation: string;
}): Promise<GHLSyncResult> {
  const result = await createOrUpdateGHLContact({
    email: params.email,
    firstName: params.firstName,
    tags: ["assessment-completed"],
    customField: {
      assessment_score: String(params.totalScore),
      assessment_lowest_pillar: params.lowestPillar,
      assessment_interpretation: params.interpretation,
      assessment_completed_at: new Date().toISOString(),
    },
  });

  if (result.success && result.contactId) {
    await addTagsToContact(result.contactId, ["assessment-completed"]).catch(() => {});
  }

  return result;
}

/**
 * Sync a purchase to GHL.
 * Called non-blocking from Stripe webhook handler.
 */
export async function syncPurchaseCompleted(params: {
  email: string;
  firstName?: string;
  productName: string;
  amount: string;
}): Promise<GHLSyncResult> {
  const result = await createOrUpdateGHLContact({
    email: params.email,
    firstName: params.firstName,
    tags: ["challenge-purchased"],
    customField: {
      purchase_product: params.productName,
      purchase_amount: params.amount,
      purchase_date: new Date().toISOString(),
    },
  });

  if (result.success && result.contactId) {
    await addTagsToContact(result.contactId, ["challenge-purchased"]).catch(() => {});
    // Remove cart-abandoned tag if present
    await removeTagsFromContact(result.contactId, ["cart-abandoned"]).catch(() => {});
  }

  return result;
}

/**
 * Sync a lead capture (email capture / exit intent).
 * Called non-blocking from /api/landing/email-capture.
 */
export async function syncLeadCapture(params: {
  email: string;
  source: string;
}): Promise<GHLSyncResult> {
  const tag: GHLTag = params.source === "exit_intent" ? "lead-exit-intent" : "lead-landing-page";

  return createOrUpdateGHLContact({
    email: params.email,
    source: params.source,
    tags: [tag],
    customField: {
      lead_source: params.source,
      lead_captured_at: new Date().toISOString(),
    },
  });
}

/**
 * Sync cart abandonment to GHL.
 * Called non-blocking from Stripe webhook (checkout.session.expired).
 */
export async function syncCartAbandoned(params: {
  email: string;
  firstName?: string;
}): Promise<GHLSyncResult> {
  const result = await createOrUpdateGHLContact({
    email: params.email,
    firstName: params.firstName,
    tags: ["cart-abandoned"],
    customField: {
      cart_abandoned_at: new Date().toISOString(),
    },
  });

  if (result.success && result.contactId) {
    await addTagsToContact(result.contactId, ["cart-abandoned"]).catch(() => {});
  }

  return result;
}
