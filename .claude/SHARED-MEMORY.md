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

| Date       | Decision                                 | Rationale                                                | Made By |
| ---------- | ---------------------------------------- | -------------------------------------------------------- | ------- |
| 2026-02-14 | Created engineering protocol system      | Standardize quality and collaboration                    | Setup   |
| 2026-02-14 | Feature branch workflow                  | Prevent conflicts between developers                     | Setup   |
| 2026-02-17 | Session type classification added        | Code/Content/Strategy/Hotfix need different rules        | Garin   |
| 2026-02-17 | Knowledge base maintenance protocol      | 13 workspace files need update triggers to prevent drift | Garin   |
| 2026-02-17 | Redux persist migration rules documented | Prevent silent state corruption when adding slices       | Garin   |
| 2026-02-17 | Chat registry hygiene rules              | Auto-cleanup stale >24h, abandoned >7d, removed >30d     | Garin   |

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

## Session Types (Added 2026-02-17)

| Type     | Branch          | Commit Cadence | Use When                       |
| -------- | --------------- | -------------- | ------------------------------ |
| Code     | feature/ branch | Every 30 min   | Building features, fixing bugs |
| Content  | main            | End of session | Scripts, copy, knowledge files |
| Strategy | main            | End of session | Planning, audits, research     |
| Hotfix   | hotfix/ branch  | After each fix | Production issues              |

## Claude.ai Workspace Knowledge Base

13 files at `scripts/claude-workspace/` (01 through 13) contain complete project context for the Claude.ai Gynergy workspace. Update the relevant file when making significant changes to the codebase.

---

## Import Instructions

When starting a new session, Claude should read this file to restore shared context.

---

**File Owner**: Shared (Garin and Bill)
**Git Tracked**: Yes
**Sync Frequency**: After significant context updates
