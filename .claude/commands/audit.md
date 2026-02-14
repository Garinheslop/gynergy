# Platform Audit Protocol

Execute a comprehensive, evidence-based audit of the Gynergy platform.

**CRITICAL RULES**:

- NO ASSUMPTIONS - Read actual files, run actual checks
- NO BS - If something is broken or missing, say so directly
- EVIDENCE REQUIRED - Every claim needs a file path or command output
- COMPLETION = SHIPPED - "90% done" means 0% shipped value

---

## Step 0: Establish Baseline

```bash
git log --oneline -10
git status
npx tsc --noEmit
npm run build
```

Report: branch, uncommitted changes, type errors, build status.

---

## Step 1: Domain-by-Domain Deep Audit

### Infrastructure

- [ ] Authentication (middleware.ts, Supabase auth)
- [ ] Database (Supabase tables, migrations)
- [ ] Security (env vars, API protection)
- [ ] External Integrations (Stripe, 100ms, Anthropic)

### Core Features

- [ ] User Authentication & Onboarding
- [ ] Journal System
- [ ] Meditation/Book Content
- [ ] Community Features
- [ ] Gamification/Leaderboard
- [ ] Admin Dashboard
- [ ] Payment/Subscriptions
- [ ] Webinar/Live Video

### Platform-Wide

- [ ] Testing Coverage (Vitest, Playwright)
- [ ] Documentation
- [ ] Performance
- [ ] Accessibility

For EACH domain, verify:

- [ ] Code exists at claimed location
- [ ] Feature actually works (not just scaffolded)
- [ ] Tests exist and pass
- [ ] No critical TODOs or FIXMEs
- [ ] Error handling exists
- [ ] Loading states present (if UI)

---

## Step 2: Generate Completion Matrix

| Domain    | Claimed % | Verified % | Blocker | Ship-Ready? |
| --------- | --------- | ---------- | ------- | ----------- |
| Auth      | X%        | Y%         | [issue] | Yes/No      |
| Payments  | X%        | Y%         | [issue] | Yes/No      |
| Journal   | X%        | Y%         | [issue] | Yes/No      |
| Community | X%        | Y%         | [issue] | Yes/No      |
| Webinar   | X%        | Y%         | [issue] | Yes/No      |
| Admin     | X%        | Y%         | [issue] | Yes/No      |

---

## Step 3: Critical Path to Shippable

### P0 - Cannot Ship Without (Blocking)

1. [Specific task with file paths]

### P1 - Ship But Degraded (High Priority)

1. [Specific task with file paths]

### P2 - Nice to Have

1. [Specific task with file paths]

---

## Step 4: Honest Summary

Answer directly:

1. Can we ship this to users today? [Yes/No + why]
2. What is the number one thing that would embarrass us?
3. What would a user complain about first?
4. What breaks under load?
5. What is the biggest gap between vision and reality?

---

## Step 5: Effort Estimation

For each P0 blocker: files to modify, dependencies, risk level.

---

## Output

Save audit results to `.claude/audits/AUDIT-YYYY-MM-DD.md`

```bash
mkdir -p .claude/audits
```

---

**Audit Protocol v1.0**
