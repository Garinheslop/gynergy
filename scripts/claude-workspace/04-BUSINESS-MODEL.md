# GYNERGY — Business Model & Pricing

## Revenue Streams

### 1. Primary: 45-Day Awakening Challenge ($997)

- **Price:** $997 one-time via Stripe checkout
- **Stripe Mode:** `payment` (not subscription)
- **Includes:** Full value stack + 2 friend codes (viral loop)
- **Cohort Size:** 15 seats per cohort (monthly start)
- **Friend Codes:** Each purchase generates 2 codes (Accountability Trio model)
  - Format: `FRIEND-XXXXXX`
  - Expires: 90 days
  - Redeemer gets full challenge access for free
  - Creator notified when code is redeemed

### 2. Recurring: Digital Journal Subscription

- **Monthly:** $39.95/mo (Stripe recurring)
- **Annual:** $399/yr (saves ~$80 vs monthly)
- **Purpose:** Post-challenge ongoing journaling practice
- **Access:** Grants `has_journal_access` in entitlements
- **Management:** Cancel at period end (soft) or immediately (hard), resume before period end

### 3. Grand Prize: LVL 5 LIFE Membership

- **Value:** $21,500/year
- **Awarded to:** Top challenger each cohort
- **Scoring:** 25% journal completion + 25% pillar improvement + 20% DGA + 15% engagement + 15% peer nominations

---

## Value Stack (Landing Page Pricing Justification)

| Item                                                                                | Claimed Value |
| ----------------------------------------------------------------------------------- | ------------- |
| Date Zero Gratitude Journal (45 days of structured daily practice)                  | $297          |
| 8 Live Coaching Calls (weekly, pillar-mapped, hot seat coaching)                    | $2,000        |
| Brotherhood Community (private group, daily accountability)                         | $500          |
| Five Pillar Assessment x2 (Day 1 baseline + Day 45 reassessment)                    | $500          |
| 1 Free Friend Code (Accountability Duo — research: 95% higher completion in groups) | $997          |
| **Total Claimed Value**                                                             | **$4,294**    |
| **Strikethrough Price**                                                             | ~~$3,297~~    |
| **Actual Price**                                                                    | **$997**      |

**Early Bird Bonus:** First 10 enrollees get 1:1 strategy call with Garin ($500 value)

---

## Payment Flow

```
User clicks CTA on landing page
→ POST /api/payments/create-checkout
  → Creates Stripe Checkout Session ($997, payment mode)
  → Returns checkoutUrl
→ User redirected to Stripe hosted checkout
→ Completes payment
→ Stripe fires webhook: checkout.session.completed
→ POST /api/payments/webhook handles:
  1. Deduplication check (webhook_events table)
  2. Create purchase record (amount_cents: 99700)
  3. DB trigger fires: creates 2 friend codes + grants challenge access
  4. Send purchase confirmation email
  5. Enroll in post-purchase drip campaign
  6. Cancel any webinar nurture drips
→ User redirected to /payment/success?session_id={SESSION_ID}
→ Success page polls /api/payments/entitlements for friend codes
→ Displays confetti + 2 friend codes for sharing + onboarding steps
```

---

## Friend Code Redemption Flow

```
Existing purchaser shares code → Friend visits /pricing?code=FRIEND-XXXXXX
→ FriendCodeInput validates in real-time (PUT /api/payments/friend-code)
→ Checks: exists, active, not used, not expired, not creator's own
→ Friend authenticates (must have account)
→ Redeems code (POST /api/payments/friend-code)
→ RPC: redeem_friend_code() atomically marks used + grants access
→ Email to creator: "{Name} just joined using your code!"
→ Email to redeemer: Purchase confirmation
→ Friend gets full challenge access (type: friend_code)
```

---

## Entitlements Model

| Field                   | Type                        | Granted When                               |
| ----------------------- | --------------------------- | ------------------------------------------ |
| `has_challenge_access`  | boolean                     | Purchase completed OR friend code redeemed |
| `challenge_access_type` | 'purchased' / 'friend_code' | At grant time                              |
| `has_journal_access`    | boolean                     | Active journal subscription                |
| `has_community_access`  | boolean                     | Day 45 challenge completion                |

---

## Stripe Webhook Events Handled

| Event                           | Action                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `checkout.session.completed`    | Process purchase, create codes, grant access, send emails |
| `invoice.paid`                  | Activate subscription, grant journal access               |
| `invoice.payment_failed`        | Mark subscription `past_due`                              |
| `customer.subscription.updated` | Sync subscription status                                  |
| `customer.subscription.deleted` | Mark `canceled`, revoke journal access                    |

**Safety:** Event deduplication via `webhook_events` table. Dead letter queue for failed events. Always returns 200 to Stripe.

---

## Admin Revenue Dashboard

Tracks in real-time:

- Total lifetime revenue
- Monthly revenue + MRR + ARR
- Daily revenue + daily change %
- Refund total, count, rate
- Challenge purchases (count + revenue)
- Friend code redemptions (count + conversion rate)
- Active subscriptions (count + revenue)
- Revenue trend by day/week
- Recent 10 purchases with timestamps

---

## Target Audience

**Primary Avatar:**

- Male, 35-55 years old
- $1M+ annual revenue (business owners, executives, PE, tech founders)
- Externally successful, internally empty
- Have tried therapy/coaching/self-help without lasting change
- Can commit $997 and 10 min/day for 45 days

**Qualification (from landing page):**

- FOR: Achieved financial success but feel a gap. Tried coaching, still searching. Want structured accountability.
- NOT FOR: Quick fix seekers. Think growth is "soft." Need convincing life could be better. Can't commit 10 min daily.

---

## The Mortality Math (Urgency Framework)

Used on landing page to create perspective:

- Total remaining hours to ~60: 700,000
- Hours remaining at 40: 350,000
- 45-day challenge: 0.3% of remaining life
- "How many of your remaining hours will you waste being successful and empty?"
