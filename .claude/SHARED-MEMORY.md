# Shared Memory Export

> **Purpose**: Shared context between Garin's and Bill's Claude Code sessions.
> This file is git-tracked so all developers have the same AI context.
> **Last Updated**: 2026-02-14

---

## Project Context

### Gynergy Member Portal

- **Type**: Wellness/coaching platform for women's health
- **Stack**: Next.js 13, TypeScript, Supabase, Redux Toolkit, 100ms, Stripe, Anthropic AI
- **Deployment**: Vercel
- **Quality Standard**: Excellence only, zero runtime errors

### Developers

| Name    | Tracker                  | Focus      |
| ------- | ------------------------ | ---------- |
| Garin   | .claude/GARIN-TRACKER.md | Full-stack |
| Bill Ke | .claude/BILL-TRACKER.md  | Full-stack |

---

## Key Decisions Log

| Date       | Decision                            | Rationale                             | Made By |
| ---------- | ----------------------------------- | ------------------------------------- | ------- |
| 2026-02-14 | Created engineering protocol system | Standardize quality and collaboration | Setup   |
| 2026-02-14 | Feature branch workflow             | Prevent conflicts between developers  | Setup   |

---

## Architecture Notes

### Authentication Flow

- Supabase Auth with SSR client
- Middleware handles route protection (see middleware.ts)
- User entitlements stored in `user_entitlements` table
- Admin access via `user_roles` table

### Payment Flow

- Stripe integration for checkout
- Webhook handler at `/api/payments/webhook`
- Friend codes and subscriptions supported

### Critical Paths

1. Auth: middleware.ts -> Supabase -> user_entitlements
2. Payments: create-checkout -> Stripe -> webhook -> entitlements
3. Webinar: 100ms integration for live streaming

---

## Import Instructions

When starting a new session, Claude should read this file to restore shared context.

---

**File Owner**: Shared (Garin and Bill)
**Git Tracked**: Yes
**Sync Frequency**: After significant context updates
