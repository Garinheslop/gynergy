# Garin's Developer Tracker

> **Purpose**: Personal tracking file for Garin. Claude Code reads this to understand current work, recent changes, and pending tasks. This file is ONLY modified during Garin's sessions.
> **Last Updated**: 2026-02-28

---

## Current Session Status

| Field                     | Value                                                   |
| ------------------------- | ------------------------------------------------------- |
| **Status**                | Active                                                  |
| **Last Active**           | 2026-02-28                                              |
| **Current Branch**        | feature/garin-billing-hardening                         |
| **Current Focus**         | Strategy: gynergy.com integration spec + SWOT analysis  |
| **Expected Next Session** | Code: Begin building provision endpoint + pillar rename |

### Status Legend

- **Active** - Currently working
- **Paused** - Temporarily away, will return
- **Inactive** - Session ended

---

## Quick Context for Claude

### What I Am Currently Working On

gynergy.com ↔ gynergy.app integration — canonical spec finalized, both teams approved. Now executing the build queue.

**Canonical Spec:** `scripts/strategy/gynergy-integration-response-FINAL.md`

### Immediate Next Steps (Integration Build Queue — May 2026 Target)

#### Sprint 1: Mid-March (Foundation)

1. Build `POST /api/onboarding/provision` endpoint (staging mock)
2. Build `POST /api/referral-credit/redeemed` endpoint
3. Pillar rename across entire codebase: Growth → Mindset, Purpose → Legacy
4. Add `gender` field to `users` table + gender-neutral UI language audit
5. Create Facilitator role for Matthew Zuraw
6. Exchange API keys with gynergy.com team (secure channel)

#### Sprint 2: End of March (Credits + Drips)

7. Remove friend code system (15+ files) — replace with referral credit display
8. Build referral credit dashboard card (share link, copy, native share)
9. Build 3-email credit sharing drip campaign
10. Add `metadata.source = "portal"` to all create-checkout sessions

#### Sprint 3: April (Curriculum + Bridge)

11. Curriculum restructure: weekly pillar rotation → journey phases
12. Post-program "Choose Your Path" routing (LVL 5 LIFE / Fit & Feminine)
13. Bridge Month (Days 46-75): lighter daily practice, maintenance badges, preview content
14. Day 66 "Habit Milestone" badge

#### Sprint 4: Early May (Integration Testing)

15. End-to-end integration testing with gynergy.com team
16. Gender-neutral audit of all user-facing copy

#### Backlog (Not May Launch)

- GYNERGY.AI standalone product ($49-$197/mo)
- DGA #44 copy-paste error fix
- "95%" ghost statistic removal from landing page
- Add female testimonials

### Blockers/Questions

- Waiting on gynergy.com: LVL 5 LIFE / Fit & Feminine checkout URLs (April deliverable from them)
- Waiting on gynergy.com: Exact Stripe Price IDs for acquisition products (to verify shared account)

---

## Recent Session Log

### Session: 2026-02-28 - Strategy: gynergy.com Integration Spec + SWOT

| Field             | Value                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| **Duration**      | ~3 hours (continued across context windows)                                |
| **Branch**        | feature/garin-billing-hardening (strategy work on main)                    |
| **Focus**         | Full SWOT of 45DA program, gynergy.com cross-team integration spec         |
| **Deliverable**   | `scripts/strategy/gynergy-integration-response-FINAL.md` — canonical spec  |
| **Key Decisions** | Option D handoff, dual-sales architecture, referral credits, pillar rename |

### Session: 2026-02-19 - Hotfix: Site Errors & Auth Fix

| Field           | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| **Duration**    | ~2 hours (continued across context window)                          |
| **Branch**      | main                                                                |
| **Focus**       | Password reset PKCE, settings page infinite loop, community share   |
| **Commits**     | `b34921c`, `8ff9974`, `4fbc2dc` (+ `bca839e`, `3f2e619`, `4e99628`) |
| **Session Doc** | `docs/sessions/2026-02/SESSION-2026-02-19-GARIN-HOTFIX-ERRORS.md`   |

### Session: 2026-02-18 - Automation Engine, Email Drips, Gamification Wiring

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **Duration**    | ~2 hours (continued across context window)                            |
| **Branch**      | main                                                                  |
| **Focus**       | 3-phase plan: gamification wiring, email drips, automation engine     |
| **Commits**     | `ea05b63`, `cab9ff4`, `58aaaf0`                                       |
| **Session Doc** | `docs/sessions/2026-02/SESSION-2026-02-17-GARIN-AUTOMATION-ENGINE.md` |

### Session: 2026-02-17 - Design System Phase 3 Final Cleanup

| Field           | Value                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| **Duration**    | ~60 minutes (continuation session)                                       |
| **Branch**      | main                                                                     |
| **Focus**       | Final token cleanup, ARIA accessibility fixes, spacing standardization   |
| **Commits**     | `85ede72`, `8ce10af`, `81f7075`, `37ee4b2`                               |
| **Session Doc** | `docs/sessions/2026-02/SESSION-2026-02-17-GARIN-DESIGN-SYSTEM-PHASE3.md` |

### Session: 2026-02-17 - Email Notification System

| Field           | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| **Duration**    | ~1 hour                                                          |
| **Branch**      | main                                                             |
| **Focus**       | Email system wiring, DB migration, Vercel env vars, streak cron  |
| **Commits**     | `35575aa`, `fddd8a2`, `d768bdc`                                  |
| **Session Doc** | `docs/sessions/2026-02/SESSION-2026-02-17-GARIN-EMAIL-SYSTEM.md` |

### Session: 2026-02-17 - Phase 4 TypeScript Polish

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **Duration**    | ~45 minutes                                                           |
| **Branch**      | main                                                                  |
| **Focus**       | Phase 4 - TypeScript cleanup, centralized Redux types                 |
| **Commits**     | `fb4ef3f`, `fabb952`                                                  |
| **Session Doc** | `docs/sessions/2026-02/SESSION-2026-02-17-GARIN-PHASE4-TYPESCRIPT.md` |

### Session: 2026-02-14 - Protocol Setup

| Field        | Value                               |
| ------------ | ----------------------------------- |
| **Duration** | Initial setup                       |
| **Branch**   | main                                |
| **Focus**    | Engineering protocol system created |

---

## My Active Tasks

### In Progress

- [ ] gynergy.com integration build — Sprint 1 (provision endpoint, pillar rename, gender field, facilitator role)

### Queued

- [ ] Sprint 2: Remove friend codes, build referral credit display + drip campaigns
- [ ] Sprint 3: Curriculum restructure, Bridge Month, Choose Your Path
- [ ] Sprint 4: Integration testing with gynergy.com

### Recently Completed

- [x] Strategy: Full SWOT analysis of 45-Day Awakening Challenge (science-backed, 12-item evidence scorecard)
- [x] Strategy: gynergy.com integration spec — canonical document approved by both teams
- [x] Strategy: Dual-sales architecture argument — data-backed, gynergy.com confirmed

- [x] Fix: Password reset PKCE code exchange (route through /auth/callback)
- [x] Fix: Settings page infinite retry loop (added error checks to useEffects)
- [x] Fix: Community share endpoint missing (created /api/community/share)
- [x] Fix: 5 API 500/400 errors (badges, events, notifications, quotes, actions)
- [x] Fix: Reset reducer setting enrollment to boolean instead of null
- [x] Fix: Books API 500→404 + session fallback
- [x] Phase 1: Gamification hook wired into journals + actions APIs
- [x] Phase 2: Email drip system (3 campaigns, 8 templates, cron processor, DB deployed)
- [x] Phase 3: Automation engine (event bus, rules, cron processor, DB deployed)

---

## Files I Am Currently Modifying

> **Important**: Bill should avoid modifying these files during concurrent work.

| File Path | Purpose | Since |
| --------- | ------- | ----- |
| (none)    | -       | -     |

---

## Handoff to Bill

### Things Bill Should Know

- **MAJOR**: gynergy.com integration spec finalized — see `scripts/strategy/gynergy-integration-response-FINAL.md`
- **Pillar rename coming**: Growth → Mindset, Purpose → Legacy (will touch many files)
- **Friend codes being removed**: Replaced by referral credit system (gynergy.com owns generation)
- **New endpoints coming**: `/api/onboarding/provision` and `/api/referral-credit/redeemed`
- **Dual-sales architecture**: gynergy.app retains direct Stripe checkout for expansion sales
- Password reset was broken due to PKCE flow — now routes through /auth/callback
- Settings page had infinite API retry loop that froze the browser — now checks for errors
- Service worker files (sw.js, workbox) are modified but uncommitted — review needed

---

## Preferences & Notes

### Standing Instructions for Claude

- [Add specific instructions for Garin's sessions]

---

**File Owner**: Garin
**Modified By**: Claude Code (during Garin's sessions only)
**Git Tracked**: Yes - all changes versioned
