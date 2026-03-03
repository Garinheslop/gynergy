# GYNERGY.APP ↔ GYNERGY.COM INTEGRATION SPEC — FINAL CONSOLIDATED

**From:** gynergy.app Engineering (Garin)
**To:** gynergy.com Engineering Team
**Date:** 2026-02-28
**Status:** FINAL — CANONICAL SPEC. Approved by both teams 2026-02-28.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Handoff Architecture (Option D)](#2-handoff-architecture-option-d)
3. [Provision API Contract](#3-provision-api-contract)
4. [Referral Credit System](#4-referral-credit-system)
5. [Call & Session Scheduling](#5-call--session-scheduling)
6. [ARIA AI Coaching](#6-aria-ai-coaching)
7. [Post-Program Bridge (Days 46-75)](#7-post-program-bridge-days-46-75)
8. [Dual-Sales Architecture](#8-dual-sales-architecture)
9. [Agreed Guardrails](#9-agreed-guardrails)
10. [Open Items Requiring Answers](#10-open-items-requiring-answers)
11. [Timeline](#11-timeline)

---

## 1. ARCHITECTURE OVERVIEW

### Ownership Boundaries

| Domain                                                 | gynergy.com Owns                                        | gynergy.app Owns                                     |
| ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------- |
| **Discovery → Purchase**                               | Landing pages, Life Audit, ads, funnels, first checkout | —                                                    |
| **Program Delivery**                                   | —                                                       | Journal, AI coaching, gamification, calls, community |
| **First Purchase** (45DA, Retreat, Bundle)             | Checkout + provisioning                                 | Receives via provision API                           |
| **Referral Credits**                                   | Generation + validation + redemption                    | Display + drip campaigns + redeemed webhook          |
| **Expansion Sales** (subscriptions, upgrades, upsells) | Can sell from marketing pages                           | In-app contextual conversion                         |
| **Price Control**                                      | Creates Stripe Price objects                            | Consumes same Price IDs                              |
| **Attribution**                                        | `metadata.source = "marketing"`                         | `metadata.source = "portal"`                         |

### Canonical Pillar Names

**Health · Relationships · Wealth · Mindset · Legacy**

(Previously in our codebase: "Growth" → now "Mindset", "Purpose" → now "Legacy")

### Curriculum Phases (NOT weekly pillar rotation)

1. Shadow Work
2. Self-Forgiveness
3. Awakening
4. Vision & Goals
5. Action Through Gratitude

### Auth Architecture

- **gynergy.com:** Clerk
- **gynergy.app:** Supabase Auth (OTP/magic link, cookie-based SSR)
- **Bridge:** Option D provision API with one-time magic link token

No shared auth. No Clerk migration. Supabase Auth is load-bearing for our entire RLS security model across 20+ tables.

---

## 2. HANDOFF ARCHITECTURE (Option D)

**Confirmed by both sides: Option D — API call from gynergy.com to gynergy.app with magic link.**

### The Exact Flow

```
PURCHASE ON GYNERGY.COM
│
├─ 1. User completes Stripe checkout on gynergy.com
├─ 2. Your Stripe webhook fires
├─ 3. Your handler calls our provisioning API:
│
│     POST https://app.gynergy.com/api/onboarding/provision
│     Headers: { "x-api-key": "[shared secret]" }
│     Body: { see Section 3 below }
│
├─ 4. Our API responds:
│     {
│       "success": true,
│       "memberId": "uuid",
│       "onboardingUrl": "https://app.gynergy.com/welcome?token=abc123xyz",
│       "tokenExpiresAt": "2026-03-01T01:00:00Z"
│     }
│
├─ 5. You redirect user to the onboardingUrl
│     (or embed as primary CTA on your success page)
│
└─ 6. User arrives at gynergy.app/welcome:
       → Auto-authenticated via one-time token
       → Personalized welcome based on assessment data
       → Brief onboarding (timezone, photo optional, confirm name)
       → Redirected to /date-zero-gratitude (program begins)
```

### What Happens Inside Our Provisioning Endpoint

1. **Check if user exists** (by email) — if returning, update; if new, create
2. **Create Supabase auth user** via admin API
3. **Create users table record** with name, gender, phone
4. **Store assessment data** in `external_assessment` table (map your 0-100 scale)
5. **Create purchase record** linked to Stripe session ID
6. **Grant entitlements** (`has_challenge_access = true`)
7. **Store referral credit data** for display (you generate, we display)
8. **Enroll in cohort** (current or next active)
9. **Generate one-time magic link token** (expires 1 hour)
10. **Enroll in drip campaigns** (onboarding, credit sharing reminders)
11. **Return onboarding URL**

### Error Handling

| Scenario                              | Our Response                                              | Your Action                                         |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Duplicate email (already has account) | `200` — update purchase, return onboarding URL            | Redirect as normal                                  |
| Invalid product                       | `400` — `{ error: "unknown_product" }`                    | Show error, contact support                         |
| Stripe session already processed      | `409` — `{ error: "already_provisioned", onboardingUrl }` | Redirect to existing URL                            |
| Our API down                          | `500`                                                     | Show "account being set up" message, retry via cron |

### Resilience: Belt and Suspenders

If our API is temporarily unavailable:

- You queue the provision request and retry
- You show user: "Your account is being set up. Check your email for access within 15 minutes."
- We ALSO listen for `checkout.session.completed` on the shared Stripe account as backup — if your API call fails, our webhook catches it and provisions from Stripe metadata
- **Primary:** API call. **Backup:** Webhook. No user falls through the cracks.

---

## 3. PROVISION API CONTRACT

### Request

```
POST https://app.gynergy.com/api/onboarding/provision
Headers: { "x-api-key": "[shared secret]" }
Content-Type: application/json
```

### Payload

```json
{
  "email": "user@example.com",
  "firstName": "Marcus",
  "lastName": "Thompson",
  "phone": "+1234567890",
  "gender": "male",

  "assessment": {
    "pillarScores": {
      "health": 72,
      "relationships": 45,
      "wealth": 88,
      "mindset": 31,
      "legacy": 56
    },
    "ascensionLevel": 2,
    "qualificationTier": "gold",
    "leveragePoint": {
      "pillar": "mindset",
      "description": "Limiting beliefs about identity"
    },
    "maslow": {
      "primaryLevel": "success",
      "ceiling": "significance",
      "growthEdge": "identity-vs-role"
    }
  },

  "purchase": {
    "product": "45-day-awakening",
    "stripeSessionId": "cs_live_xxx",
    "stripeCustomerId": "cus_xxx",
    "amountCents": 99700,
    "purchaseDate": "2026-03-01T00:00:00Z",
    "includesRetreat": false
  },

  "referralCredit": {
    "slug": "A3B7K2",
    "shareUrl": "https://gynergy.com/gift/A3B7K2",
    "options": [
      {
        "creditType": "awakening",
        "creditAmountCents": 50000,
        "friendPaysCents": 49700
      },
      {
        "creditType": "journal",
        "creditAmountCents": 10000,
        "friendPaysCents": 9700
      }
    ]
  },

  "giftData": null,

  "utm": {
    "source": "podcast",
    "medium": "organic",
    "campaign": "ep-32"
  }
}
```

### Response

```json
{
  "success": true,
  "memberId": "uuid",
  "onboardingUrl": "https://app.gynergy.com/welcome?token=abc123xyz",
  "tokenExpiresAt": "2026-03-01T01:00:00Z"
}
```

### Data Mapping

| Your Field           | Our Storage                              | Notes                                                                                     |
| -------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| pillarScores (0-100) | `external_assessment` table              | Stored as-is. Our internal Day 1/Day 45 assessment uses 1-10 scale — different instrument |
| ascensionLevel (1-5) | `external_assessment.ascension_level`    | Display in member profile                                                                 |
| qualificationTier    | `external_assessment.qualification_tier` | Facilitator prep context                                                                  |
| gender               | `users.gender`                           | New field. Used for narrative personalization + post-program routing                      |
| leveragePoint        | `external_assessment.leverage_point`     | Passed to ARIA as coaching context                                                        |
| referralCredit       | `referral_credits` table                 | Display + drip campaigns only. You own generation/validation/redemption                   |

### Products That Trigger Provisioning

| Product                           | Triggers Provision? | Notes                           |
| --------------------------------- | ------------------- | ------------------------------- |
| 45-Day Awakening ($997)           | YES                 | Full challenge access           |
| Awakening + Retreat ($1,997)      | YES                 | Challenge access + retreat flag |
| 45DA Gift (credit redemption)     | YES                 | Same access, lower price        |
| Date Zero Journal Digital ($47)   | NO                  | No portal access                |
| Date Zero Journal Physical ($197) | NO                  | No portal access                |

---

## 4. REFERRAL CREDIT SYSTEM

### Ownership Model (Corrected)

**gynergy.com generates, validates, and redeems credits. gynergy.app displays and runs drip campaigns.**

This is the correct split — you own checkout, you own the credit logic. We don't need to touch credit validation.

### What We Receive and Store

From the provision payload, we store:

- `slug` — random referral identifier (privacy-safe, no PII in URL; creator name shown on landing page after click)
- `shareUrl` — the full URL they share with friends (points to gynergy.com, format: `gynergy.com/gift/{slug}`)
- `options` — credit tiers available (awakening $500, journal $100)

### What We Display in gynergy.app

After onboarding, members see in their dashboard:

- "Share your transformation" card with their unique link
- Copy button + native share (SMS, email, social)
- Personal message composer (optional)
- Status of any credits shared (pending/redeemed) — via webhook from you

### Drip Campaign (We Run)

| Step | Timing | Subject                                     | Core Message                                                  |
| ---- | ------ | ------------------------------------------- | ------------------------------------------------------------- |
| 1    | Day 3  | "Someone needs to hear from you"            | You have a $500 credit. Think of one person. Share it today.  |
| 2    | Day 14 | "Your transformation is working. Share it." | You're [X] days in. Your mood has [improved]. Who needs this? |
| 3    | Day 30 | "Your credit is waiting"                    | People who share finish stronger. Don't let this go to waste. |

### Redeemed Webhook (You → Us)

When a friend redeems a credit on gynergy.com, you call:

```
POST https://app.gynergy.com/api/referral-credit/redeemed
Headers: { "x-api-key": "[shared secret]" }
Body: {
  "creatorMemberId": "uuid",
  "redeemerEmail": "friend@example.com",
  "redeemerFirstName": "Alex",
  "creditType": "awakening",
  "redeemedAt": "2026-03-15T14:00:00Z"
}
```

We then:

- Update credit status in our display
- Email creator: "[Alex] just joined using your credit!"
- Link both accounts for cohort pairing

### Credit Scope (Agreed)

**Referral credits apply ONLY to acquisition products on gynergy.com:**

- First 45DA purchase
- First journal purchase

**Credits do NOT apply to expansion products in gynergy.app:**

- Subscriptions, upgrades, retreat add-ons, GYNERGY.AI

This keeps credit logic entirely on your side. Clean.

---

## 5. CALL & SESSION SCHEDULING

**We own this inside gynergy.app. Our 100ms integration is fully built.**

Capabilities: room creation, auth tokens, recording, RSVP, participant management, quality tracking.

### Facilitator Model

| Role            | Person        | Portal Access           | Capabilities                                                    |
| --------------- | ------------- | ----------------------- | --------------------------------------------------------------- |
| **Facilitator** | Matthew Zuraw | New role (we'll create) | Schedule calls, host rooms, view cohort data, manage recordings |
| **Founder**     | Garin & Yesi  | Existing admin          | Join any call as co-host, access all cohorts                    |
| **Member**      | Participants  | Standard user           | Join calls, RSVP, view recordings, submit questions             |

### Call Structure

| Call                      | Type          | Host                                | Frequency   |
| ------------------------- | ------------- | ----------------------------------- | ----------- |
| 2 private coaching calls  | `one_on_one`  | Matthew                             | Weeks 1 & 5 |
| 6 group coaching sessions | `cohort_call` | Matthew (Garin/Yesi join key calls) | Weekly      |

### Scheduling

- Matthew schedules via facilitator dashboard in gynergy.app
- ICS calendar invites sent via email
- RSVP tracking built into portal
- Recordings auto-saved, available to cohort members

### Confirmed: No GHL for Calls

Calls managed entirely within gynergy.app. No GHL calendaring integration needed for scheduling.

---

## 6. ARIA AI COACHING

**ARIA lives in gynergy.app. It's the brand name for our AI coaching system.**

### Architecture

| External (gynergy.com)              | Internal (gynergy.app)  | Reality                          |
| ----------------------------------- | ----------------------- | -------------------------------- |
| "ARIA AI Companion"                 | AI Coaching System      | ARIA is the brand                |
| "24/7 personalized guidance"        | Yesi & Garin characters | Two personality modes            |
| GYNERGY.AI ($49-$197/mo standalone) | Future Phase 2          | Same tech, different access tier |

### How It Works

Members see "ARIA" as their coach. Under the hood, two modes:

- **Yesi mode** (nurturing) — activated when mood declining, early journey, or struggling
- **Garin mode** (strategic) — activated when streaks break, mid-journey, needs accountability

System auto-suggests based on user state. Members can also choose.

### Context ARIA Receives

- Name, gender, day in journey, cohort
- Recent journal entries (last 3-5)
- Mood trend (improving/stable/declining)
- Streak data, badges earned
- **Life Audit data from gynergy.com** (leverage point, ascension level) — deeper context from Day 0

### GYNERGY.AI Standalone ($49/$99/$197/mo)

NOT a launch blocker. Phase 2 after core handoff is working. Requires:

- Auth flow without challenge purchase
- Tiered feature gating
- Separate onboarding (no journal, no cohort)

---

## 7. POST-PROGRAM BRIDGE (Days 46-75)

### Why 75 Days

66 days is the evidence-based average for habit automaticity (Lally et al., 2010). The Bridge Month ensures members don't hit a cliff at Day 45 and gives habits time to solidify.

### Phase 1: Integration (Days 46-66) — Free for All Graduates

| Element        | Details                                                       |
| -------------- | ------------------------------------------------------------- |
| Daily practice | Lighter — 5 min morning reflection only (no evening required) |
| ARIA AI        | Continues, shifts to "maintenance" coaching style             |
| Weekly call    | 30-min group check-in with Matthew (informal)                 |
| Gamification   | Streak maintenance badges                                     |
| Content        | Preview of LVL 5 LIFE (men) or Fit & Feminine (women)         |

### Phase 2: Choose Your Path (Days 67-75)

| Element                    | Details                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| Facilitator recommendation | Based on journey data, Matthew recommends next step                       |
| Free trial                 | 1 month free of LVL 5 LIFE Community ($97/mo) or Fit & Feminine ($127/mo) |
| UI                         | "Choose Your Path" screen with both options, gender-highlighted           |
| Celebration                | Day 66 = "Habit Milestone" badge                                          |

### Post-Program Subscription Checkout

**Interim approach (confirmed by gynergy.com):** Our "Choose Your Path" UI shows CTA links that point to gynergy.com checkout pages for LVL 5 LIFE and Fit & Feminine, pre-filled with member ID and email.

**Future approach (TBD):** Once expansion products have Stripe Price IDs, we can create checkout sessions in-app using the dual-sales architecture.

---

## 8. DUAL-SALES ARCHITECTURE

### The Principle

**gynergy.com owns acquisition (strangers → first purchase). gynergy.app owns expansion (members → upgrades, subscriptions, upsells).**

Both create Stripe checkout sessions on the same account. Metadata separates attribution cleanly.

**Confirmed by gynergy.com: "We agree. The data is real, the architecture is clean."**

### Why In-App Expansion Matters

| Data Point                                                        | Source                    |
| ----------------------------------------------------------------- | ------------------------- |
| Expansion costs **$0.27** per $1 ARR vs **$1.13** for acquisition | Bessemer Venture Partners |
| In-app upsell converts **8-20%** vs 3-10% for acquisition         | Monetizely                |
| Checkout redirect increases abandonment up to **40%**             | Baymard Institute         |
| Mature SaaS gets **58-67%** of ARR growth from expansion          | SaaS Capital              |

### Metadata Pattern

```
gynergy.com checkout sessions:
  metadata.source = "marketing"
  metadata.platform = "gynergy.com"

gynergy.app checkout sessions:
  metadata.source = "portal"
  metadata.platform = "gynergy.app"
```

Same Stripe account. Same Price IDs. Same webhook handler differentiates on `metadata.source`.

### In-App Sales Scenarios (gynergy.app)

| Scenario            | Trigger                   | Product                   | Why In-App                            |
| ------------------- | ------------------------- | ------------------------- | ------------------------------------- |
| Day 45 Subscription | Challenge completion      | Journal Monthly/Annual    | Peak emotional moment                 |
| Loyalty Rate        | Day 75 (Bridge Month end) | Founding Member $19.97/mo | Drip-triggered, expires if they leave |
| Annual Upgrade      | Active monthly subscriber | Annual $399/yr            | Only relevant to active subscribers   |
| Retreat Add-On      | Mid-challenge milestone   | Retreat Bundle $1,997     | Contextual after breakthrough         |
| GYNERGY.AI          | Post-challenge            | AI Coaching $49-$197/mo   | Upsell to users who loved ARIA        |

### Commitments

**gynergy.app commits to:**

- Using the **same Stripe Price IDs** gynergy.com creates (no shadow prices)
- Never creating checkout sessions for **first-time 45DA purchases** from cold traffic
- Tagging every portal transaction with `metadata.source = "portal"`
- Sharing revenue reporting via shared Stripe dashboard

**gynergy.com retains:**

- Full ownership of acquisition funnels
- Price control (creates all Stripe Price objects)
- Attribution clarity (metadata separation)

---

## 9. AGREED GUARDRAILS

### Guardrail 1: Single Source of Truth for Prices

**Stripe is the price authority.** Both platforms reference the same Price IDs.

- gynergy.com creates and maintains all Stripe Price objects
- Neither platform hardcodes prices as source of truth — Stripe is canonical
- If a price changes, it's changed ONCE in Stripe, reflected everywhere
- Short term: gynergy.com creates Prices, shares IDs. Long term: both pull from Stripe Price objects

### Guardrail 2: Product Catalog Alignment

Expansion products currently in gynergy.app but not in gynergy.com's catalog:

| Product              | Price     | Status                                        |
| -------------------- | --------- | --------------------------------------------- |
| Journal Monthly      | $39.95/mo | Exists in our Stripe, needs shared visibility |
| Journal Annual       | $399/yr   | Exists in our Stripe, needs shared visibility |
| Founding Member Rate | $19.97/mo | Exists in our Stripe, needs shared visibility |

**Agreed approach:** Stripe is the product registry. Both platforms query Stripe for product/price objects. Individual `products.ts` files become convenience layers, not canonical sources.

### Guardrail 3: Credit Scope

**Referral credits apply ONLY to acquisition products (first 45DA, first journal) on gynergy.com.**

Expansion sales (subscriptions, upgrades, retreat add-ons) in gynergy.app do NOT use credits. This keeps credit logic entirely on gynergy.com's side — they generate, validate, and redeem. We never touch credit validation logic.

---

## 10. OPEN ITEMS REQUIRING ANSWERS

### From gynergy.com → gynergy.app

**Q1: Expansion product Price IDs — who creates them?**

The Journal Monthly ($39.95), Journal Annual ($399), and Founding Member Rate ($19.97) are expansion-only products that never appear on gynergy.com marketing pages. We currently have these as Stripe Prices.

**Our answer:** Since gynergy.com is canonical for Stripe Prices (Guardrail 1), we have two options:

- **Option A:** You create these Prices in Stripe and share IDs. We migrate to yours.
- **Option B:** You adopt our existing Price IDs for these expansion products (since you don't sell them).

**Our recommendation: Option B** — these are portal-only products. We share the existing Price IDs with you for reporting visibility. You don't need to recreate them. This saves time and avoids migration risk.

**RESOLVED:** gynergy.com confirmed Option B. We keep our existing Stripe Prices for expansion products and share IDs for reporting visibility.

### From gynergy.app → gynergy.com

**Q2: Staging provision endpoint**

We will deliver a staging endpoint for testing. ETA: Mid-March.

**Q3: Shared API key**

We need to exchange API keys for the provision endpoint and redeemed webhook. Propose: shared via secure channel (1Password vault or encrypted exchange), rotated quarterly.

**Q4: LVL 5 LIFE / Fit & Feminine checkout routing**

When our "Choose Your Path" UI sends a member to your checkout, what URL format do you need? We can pass:

- `email` (pre-fill)
- `memberId` (link accounts)
- `gender` (route to correct program)
- `utm_source=portal` (attribution)

**RESOLVED:** gynergy.com confirms dedicated checkout pages are an April deliverable. Expected format:

```
gynergy.com/checkout/lvl5-community?email={email}&ref={memberId}&utm_source=portal
gynergy.com/checkout/fit-feminine?email={email}&ref={memberId}&utm_source=portal
```

Exact URLs confirmed when built in April.

**Q5: Retreat management**

Confirmed: retreat is email/GHL only for now. No portal content needed. If a purchase includes retreat (`includesRetreat: true`), we store the flag but don't build retreat-specific UI.

---

## 11. TIMELINE

### What We Commit To Before May 2026

| Deliverable                                         | Effort  | ETA          |
| --------------------------------------------------- | ------- | ------------ |
| `POST /api/onboarding/provision` endpoint (staging) | 1 week  | Mid-March    |
| `POST /api/referral-credit/redeemed` endpoint       | 3 days  | Mid-March    |
| Pillar rename (Growth → Mindset, Purpose → Legacy)  | 1 week  | Mid-March    |
| `gender` field + gender-neutral UI language         | 1 week  | Mid-March    |
| Facilitator role + Matthew's access                 | 3 days  | Mid-March    |
| Referral credit display (replacing friend codes)    | 2 weeks | End of March |
| Credit sharing drip campaigns (3-email sequence)    | 1 week  | End of March |
| Curriculum restructure (journey phases)             | 2 weeks | April        |
| Post-program "Choose Your Path" routing             | 1 week  | April        |
| Bridge Month (Days 46-75)                           | 2 weeks | Late April   |
| Integration testing with gynergy.com                | 1 week  | Early May    |

**Total: ~10 weeks of work. Fits within May delivery.**

### Joint Integration Schedule

| Week              | gynergy.app                                                | gynergy.com                   | Joint                                |
| ----------------- | ---------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| **Mar 3-14**      | Build provision endpoint + gender field + facilitator role | Build API caller in webhook   | Exchange API keys, finalize contract |
| **Mar 17-28**     | Build credit display + drip campaigns                      | Build redeemed webhook caller | Test provision flow end-to-end       |
| **Mar 31-Apr 11** | Curriculum restructure + pillar rename                     | Update marketing copy         | —                                    |
| **Apr 14-25**     | Bridge Month + Choose Your Path                            | Build LVL 5 / F&F routing     | Test post-program handoff            |
| **Apr 28-May 9**  | Integration testing, gender-neutral audit                  | Integration testing           | Full end-to-end with real Stripe     |
| **May 12**        | **Launch ready**                                           | **Launch ready**              | **Go live**                          |

### NOT in Scope for May

- GYNERGY.AI standalone product ($49-$197/mo)
- Corporate/enterprise licensing
- Facilitator certification program

---

## SUMMARY

This document represents the agreed-upon integration architecture between gynergy.com and gynergy.app. Both sides have confirmed:

1. **Option D handoff** — API provision with magic link
2. **Referral credits** — gynergy.com generates/validates/redeems, gynergy.app displays/drips
3. **Dual-sales architecture** — acquisition (gynergy.com) + expansion (gynergy.app)
4. **Three guardrails** — Stripe as price authority, shared product catalog, credits for acquisition only
5. **May 2026 timeline** — 10 weeks of parallel development

**We are all one. Let's ship this.**
