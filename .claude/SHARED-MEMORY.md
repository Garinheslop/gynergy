# Shared Memory Export

> **Purpose**: Shared context between Garin's and Bill's Claude Code sessions.
> This file is git-tracked so all developers have the same AI context.
> **Last Updated**: 2026-02-28

---

## Project Context

### Gynergy Member Portal

- **Type**: Wellness/coaching platform for men AND women (co-ed cohorts, gender-specific backend programs)
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

| Date       | Decision                                       | Rationale                                                         | Made By |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 2026-02-14 | Created engineering protocol system            | Standardize quality and collaboration                             | Setup   |
| 2026-02-14 | Feature branch workflow                        | Prevent conflicts between developers                              | Setup   |
| 2026-02-17 | Session type classification added              | Code/Content/Strategy/Hotfix need different rules                 | Garin   |
| 2026-02-17 | Knowledge base maintenance protocol            | 13 workspace files need update triggers to prevent drift          | Garin   |
| 2026-02-17 | Redux persist migration rules documented       | Prevent silent state corruption when adding slices                | Garin   |
| 2026-02-17 | Chat registry hygiene rules                    | Auto-cleanup stale >24h, abandoned >7d, removed >30d              | Garin   |
| 2026-02-17 | 10/10 Completion Plan DONE                     | All 4 phases shipped: payments, gamification, courses, TypeScript | Garin   |
| 2026-02-17 | Centralized Redux types at store/types.ts      | Single import for RootState, AppDispatch, 17 slice types          | Garin   |
| 2026-02-28 | gynergy.com integration spec finalized         | Option D handoff, dual-sales, referral credits, May 2026 target   | Garin   |
| 2026-02-28 | Pillar rename: Growth→Mindset, Purpose→Legacy  | Canonical: Health, Relationships, Wealth, Mindset, Legacy         | Garin   |
| 2026-02-28 | Dual-sales architecture confirmed              | gynergy.com=acquisition, gynergy.app=expansion, metadata split    | Garin   |
| 2026-02-28 | Friend codes → referral credits                | gynergy.com generates/validates/redeems, we display + drip        | Garin   |
| 2026-02-28 | Platform is co-ed (men AND women)              | LVL 5 LIFE (men) + Fit & Feminine (women) as backend programs     | Garin   |
| 2026-02-28 | Curriculum: journey phases not pillar rotation | Shadow Work→Self-Forgiveness→Awakening→Vision→Action              | Garin   |

---

## Architecture Notes

### Authentication Flow

- Supabase Auth with SSR client
- Middleware handles route protection (see middleware.ts)
- User entitlements stored in `user_entitlements` table
- Admin access via `user_roles` table

### Payment Flow

- Stripe integration for checkout (shared account with gynergy.com)
- Webhook handler at `/api/payments/webhook`
- **Dual-sales**: gynergy.com creates sessions with `metadata.source="marketing"`, gynergy.app with `metadata.source="portal"`
- Referral credits replace friend codes (gynergy.com owns credit lifecycle, we display + drip)
- Subscriptions: monthly $39.95, annual $399, founding member $19.97

### Cross-Platform Integration (gynergy.com ↔ gynergy.app)

- **Canonical Spec**: `scripts/strategy/gynergy-integration-response-FINAL.md`
- **Handoff**: Option D — gynergy.com calls `POST /api/onboarding/provision` after Stripe checkout, returns magic link
- **Auth**: gynergy.com uses Clerk, gynergy.app uses Supabase Auth. No shared auth. Bridge via magic link token.
- **Referral Credits**: gynergy.com generates/validates/redeems. We receive via provision payload, display + run drip campaigns.
- **Redeemed Webhook**: gynergy.com calls `POST /api/referral-credit/redeemed` when a friend uses a credit
- **Pillar Names**: Health · Relationships · Wealth · Mindset · Legacy (canonical)
- **Curriculum**: Shadow Work → Self-Forgiveness → Awakening → Vision & Goals → Action Through Gratitude
- **Facilitator**: Matthew Zuraw leads cohorts. Garin/Yesi on milestone calls only.
- **ARIA**: Brand name for AI coaching. Yesi (nurturing) + Garin (accountability) modes.
- **Bridge Month**: Days 46-75. Free for graduates. Day 66 = Habit Milestone badge.
- **Post-Program**: "Choose Your Path" → LVL 5 LIFE (men) or Fit & Feminine (women)
- **Target**: May 12, 2026 launch

### Critical Paths

1. Auth: middleware.ts -> Supabase -> user_entitlements
2. Payments: create-checkout -> Stripe -> webhook -> entitlements
3. Provision: gynergy.com webhook -> our /api/onboarding/provision -> magic link -> onboarding
4. Webinar: 100ms integration for live streaming

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
