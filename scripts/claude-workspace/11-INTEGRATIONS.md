# GYNERGY — Third-Party Service Integrations

## Supabase (Database + Auth + Storage)

**Role:** Core backend — PostgreSQL database, user authentication, file storage, Row Level Security

| Env Var                         | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Database URL (client-side)                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-side, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Admin key (server-side only, bypasses RLS)  |

### Auth Flow

- SSR client via `@supabase/ssr` for server-side auth
- Cookie-based session persistence
- OAuth support (Google, etc.)
- OTP passwordless login via `/api/auth`
- Middleware validates session on every protected route

### Storage

- Used for file uploads (journal images, community media, avatars)
- Upload via `/api/upload` endpoint
- Max 5MB per file, JPEG/PNG/GIF/WebP

---

## Stripe (Payments)

**Role:** Payment processing — one-time charges, subscriptions, webhooks

| Env Var                                      | Purpose                      |
| -------------------------------------------- | ---------------------------- |
| `STRIPE_SECRET_KEY`                          | Server-side API key          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`         | Client-side key              |
| `STRIPE_WEBHOOK_SECRET`                      | Webhook signature validation |
| `NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID`      | $997 challenge price         |
| `NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID`        | $39.95/mo journal price      |
| `NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID` | $399/yr journal price        |

### Products

| Product                    | Type         | Price     |
| -------------------------- | ------------ | --------- |
| 45-Day Awakening Challenge | One-time     | $997      |
| Journal (Monthly)          | Subscription | $39.95/mo |
| Journal (Annual)           | Subscription | $399/yr   |

### Webhook Events Handled

- `checkout.session.completed` → Grant entitlements, generate friend codes
- `invoice.paid` → Renew subscription access
- `invoice.payment_failed` → Flag payment issue
- `customer.subscription.updated` → Update subscription state
- `customer.subscription.deleted` → Revoke access

### Safety

- Webhook deduplication via `webhook_events` table (idempotency keys)
- Dead letter queue for failed webhook processing
- Soft cancellation (at period end) vs hard cancellation (immediate)

---

## 100ms (Live Video)

**Role:** Real-time video calls, live webinars, HLS streaming

| Env Var                    | Purpose                    |
| -------------------------- | -------------------------- |
| `HMS_ACCESS_KEY`           | Server-side access key     |
| `HMS_SECRET`               | JWT signing secret         |
| `HMS_TEMPLATE_ID`          | Room template ID           |
| `NEXT_PUBLIC_100MS_APP_ID` | Client-side app identifier |

### Service Layer (`lib/services/100ms.ts`)

- **Management Tokens:** JWT with 24h expiry for server-side API calls
- **Auth Tokens:** Client-side tokens scoped to room + user + role
- **Role Mapping:** host/co-host → 100ms roles; participant → guest

### Capabilities

| Feature         | Implementation                                |
| --------------- | --------------------------------------------- |
| Create rooms    | Template-based with region/recording settings |
| Join rooms      | Auth token generation per user per role       |
| Recording       | Start/stop/fetch recordings                   |
| Peer management | Get active peers, remove peers                |
| Room lifecycle  | End rooms, lock rooms                         |

### Room Types

| Type               | Max Participants | Recording |
| ------------------ | ---------------- | --------- |
| Cohort Call        | 20               | Yes       |
| One-on-One         | 2                | Optional  |
| Community Checkin  | 10               | No        |
| Accountability Pod | 5                | No        |

---

## Resend (Email)

**Role:** Transactional email delivery

| Env Var          | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `RESEND_API_KEY` | API authentication                                   |
| `EMAIL_FROM`     | Sender address (e.g., "Gynergy <hello@gynergy.com>") |
| `EMAIL_REPLY_TO` | Reply-to address                                     |

### Email Types

- Welcome email (post-signup)
- Purchase confirmation (with friend codes)
- Assessment report (full HTML with scores/patterns)
- Webinar confirmation (with calendar invite)
- Webinar reminders (24h/1h before)
- Drip campaign emails (via `dripService.ts`)
- Friend code notifications
- Streak reminders

### Drip Campaign System (`lib/services/dripService.ts`)

- Campaigns stored in `drip_campaigns` table
- User enrollment in `drip_enrollments` table
- Processing via Vercel cron (`/api/cron/email-drips` every 15 min)
- Email templates with variable substitution (score, pillar, name, etc.)

---

## Anthropic AI (AI Coaching)

**Role:** AI-powered coaching characters (Yesi and Garin)

| Env Var             | Purpose            |
| ------------------- | ------------------ |
| `ANTHROPIC_API_KEY` | API authentication |

### SDK

- `@anthropic-ai/sdk` v0.72.1
- Streaming responses via Server-Sent Events

### Characters

| Character | Role                 | Voice                          |
| --------- | -------------------- | ------------------------------ |
| Yesi      | Nurturing coach      | Warm, encouraging, celebratory |
| Garin     | Accountability coach | Direct, motivating, analytical |

### Context Window (4,000 tokens)

| Allocation | Tokens |
| ---------- | ------ |
| Messages   | 1,500  |
| Journals   | 800    |
| Profile    | 500    |
| Badges     | 400    |
| Mood       | 200    |
| System     | 600    |

---

## OpenAI (Vision / OCR)

**Role:** Image text extraction for journal photos

| Env Var          | Purpose            |
| ---------------- | ------------------ |
| `OPENAI_API_KEY` | API authentication |

- **Use:** `lib/utils/ocr.ts` — processes uploaded journal images via GPT-4 Vision
- **Endpoint:** `/api/ocr`

---

## Bunny Stream (Video Hosting)

**Role:** Video content hosting for content library (HLS streaming)

- **Service:** `lib/services/bunny-stream.ts`
- **Use:** Content library videos — not live streaming (that's 100ms)
- **Content items** have `videoId` and `streamUrl` fields pointing to Bunny CDN

---

## Vercel (Hosting & Deployment)

**Role:** Production hosting, serverless functions, cron jobs

### Cron Jobs

| Schedule     | Endpoint                         | Purpose                      |
| ------------ | -------------------------------- | ---------------------------- |
| Hourly       | `/api/cron/webinar-reminders`    | Send webinar reminder emails |
| Every 15 min | `/api/cron/email-drips`          | Process drip campaign queue  |
| Every 5 min  | `/api/cron/automation-processor` | Run automation rules engine  |

### Security

- `CRON_SECRET` env var validates cron requests
- Security headers configured in `next.config.js`

---

## Complete Environment Variables

```
# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 100ms Video
HMS_ACCESS_KEY=
HMS_SECRET=
HMS_TEMPLATE_ID=
NEXT_PUBLIC_100MS_APP_ID=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID=
NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID=
NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID=

# Email
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
NEXT_PUBLIC_APP_URL=

# Cron Security
CRON_SECRET=
```
