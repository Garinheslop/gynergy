# GYNERGY — Project Overview

## What Is Gynergy

Gynergy is a **45-Day Awakening Challenge** for high-achieving men ($1M+ revenue) who have achieved external success but feel internally empty. It combines daily journaling, live coaching calls, AI-powered coaching characters, community engagement, and a gamification system into a structured 45-day transformation program built on the **Five Pillars of Integrated Power** framework.

**URL:** https://gynergy.app
**Deployment:** Vercel

---

## The Five Pillars Framework

The core intellectual property. Life is a **multiplicative equation**, not additive:

```
Wealth × Health × Relationships × Growth × Purpose = Life Quality
```

When one pillar is low (e.g., a 2 in Purpose), it **collapses the value** of everything else — even if Wealth is a 9. Integration multiplies. Fragmentation destroys.

| Pillar            | Focus                           | Core Question                                      |
| ----------------- | ------------------------------- | -------------------------------------------------- |
| **Wealth**        | Revenue, Savings, Freedom       | Are you free, or does your success own you?        |
| **Health**        | Energy, Fitness, Longevity      | Do you have energy, or running on fumes?           |
| **Relationships** | Partner, Family, Community      | Are your people close, or drifting?                |
| **Growth**        | Leadership, Learning, Evolution | Are you still challenged, or coasting?             |
| **Purpose**       | Service, Meaning, Legacy        | Does your success mean something, or is it hollow? |

---

## Team

| Person           | Role                | Focus                                  |
| ---------------- | ------------------- | -------------------------------------- |
| **Garin Heslop** | Founder / Developer | Full-stack, product, content, coaching |
| **Bill Ke**      | Developer           | Full-stack                             |

---

## Tech Stack

| Technology           | Version | Purpose                                   |
| -------------------- | ------- | ----------------------------------------- |
| **Next.js**          | 14.1.0  | React framework (App Router)              |
| **React**            | 18.2.0  | UI library                                |
| **TypeScript**       | 5.3.0   | Type-safe JavaScript                      |
| **Supabase**         | 2.x     | Database (PostgreSQL), Auth, Storage, RLS |
| **Redux Toolkit**    | 2.5.1   | Client-side state management              |
| **Redux Persist**    | 6.0.0   | Persist state to localStorage             |
| **Tailwind CSS**     | 4.0.6   | Styling (v4 with @theme directive)        |
| **Stripe**           | 20.3.0  | Payment processing                        |
| **Resend**           | 6.9.1   | Transactional email delivery              |
| **100ms**            | 0.11.1  | Live video/webinar (HLS streaming)        |
| **Anthropic Claude** | 0.72.1  | AI coaching characters                    |
| **OpenAI**           | 4.83.0  | Vision API (journal image processing)     |
| **Recharts**         | 3.7.0   | Admin dashboard charts                    |
| **Zod**              | 3.24.2  | Runtime type validation                   |
| **next-pwa**         | 5.6.0   | Progressive Web App support               |
| **Vitest**           | 1.3.0   | Unit testing                              |
| **Playwright**       | 1.42.0  | E2E testing                               |
| **Storybook**        | 10.2.6  | Component development                     |
| **Husky**            | 9.0.0   | Git hooks (lint-staged)                   |
| **Drizzle ORM**      | 0.45.1  | Database schema management                |

---

## Products & Revenue

| Product                        | Price      | Type         | Purpose                                      |
| ------------------------------ | ---------- | ------------ | -------------------------------------------- |
| **45-Day Awakening Challenge** | $997       | One-time     | Core product (includes 2 friend codes)       |
| **Digital Journal Monthly**    | $39.95/mo  | Subscription | Post-challenge ongoing practice              |
| **Digital Journal Annual**     | $399/yr    | Subscription | Annual commitment (saves ~$80)               |
| **LVL 5 LIFE Membership**      | $21,500/yr | Grand Prize  | Elite mastermind (awarded to top challenger) |

---

## Key Metrics (from landing page)

- 3 cohorts completed
- 500+ men transformed
- 497+ days of Garin's personal daily practice
- 92% report feeling "present" again after completing
- 15 seats per cohort (intimate group size)
- 2 friend codes per purchase (viral loop)

---

## Project Structure

```
/app                    # Next.js App Router pages & API routes
  /api                  # 28+ API route groups
  /admin                # Admin dashboard (protected)
  /community            # Community hub
  /courses              # Course player & editor
  /[bookSlug]           # Journal dashboard (dynamic)
  /webinar              # Webinar landing page
  /assessment           # Five Pillar Assessment
  /login                # Authentication
  /payment/success      # Post-purchase thank you

/modules                # 21 feature modules
  /landing              # Marketing pages + sections + data
  /journal              # Journal UI components
  /community            # Community components
  /gamification         # Badges, celebrations, leaderboard
  /payment              # Pricing, friend codes, subscriptions
  /ai                   # AI chat interface
  /video                # 100ms video rooms
  /admin                # Admin dashboard components
  /courses              # Course player components
  /layouts              # Navbar, default layout

/lib                    # Shared utilities
  /ai                   # AI character config, providers
  /email                # Email templates, drip campaigns
  /supabase-client.ts   # Browser Supabase client
  /supabase-server.ts   # Server Supabase client
  /stripe.ts            # Stripe integration
  /hooks                # Custom React hooks
  /utils                # Utilities (date, search, validation)

/store                  # Redux store
  /modules              # 14+ feature slices
  /middleware            # API + reset middleware
  /configureStore.ts    # Store setup with persist

/resources/types        # 25 TypeScript type definition files
/supabase/schema        # SQL schema files (60+ tables)
/scripts                # VSL scripts, workspace files
```

---

## Cron Jobs (Vercel)

| Schedule     | Endpoint                         | Purpose                         |
| ------------ | -------------------------------- | ------------------------------- |
| Every hour   | `/api/cron/webinar-reminders`    | Send webinar reminder emails    |
| Every 15 min | `/api/cron/email-drips`          | Process drip campaign sequences |
| Every 5 min  | `/api/cron/automation-processor` | Run automation rules engine     |

---

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_CHALLENGE_PRICE_ID` / `NEXT_PUBLIC_STRIPE_JOURNAL_PRICE_ID` / `NEXT_PUBLIC_STRIPE_JOURNAL_ANNUAL_PRICE_ID`
- `HMS_ACCESS_KEY` / `HMS_SECRET` / `HMS_TEMPLATE_ID` / `NEXT_PUBLIC_100MS_APP_ID`
- `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
