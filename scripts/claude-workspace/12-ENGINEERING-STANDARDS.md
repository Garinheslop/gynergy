# GYNERGY — Engineering Standards & Developer Workflow

## Three Commandments

1. **NEVER ASSUME** — Always read a file before modifying it. Always check git status before committing. Always verify env vars from actual files.
2. **VERIFY EVERYTHING** — Every claim backed by evidence: file contents, git state, API responses, database queries.
3. **EVIDENCE-BASED COMPLETION** — Never say "fixed" without: tested the flow, verified the fix, created evidence, followed Definition of Done.

---

## Decision Matrix

| Confidence | Threshold    | Action                               |
| ---------- | ------------ | ------------------------------------ |
| HIGH       | 90%+ certain | Proceed, document decision           |
| MEDIUM     | 60-90%       | Verify one more source, then proceed |
| LOW        | <60%         | STOP. Ask user or read more files    |

### Ask or Proceed?

```
Is the change reversible in <5 minutes?
  YES → Does it affect auth/payments/data?
    YES → ASK FIRST
    NO → PROCEED
  NO → Is there explicit instruction?
    YES → PROCEED with caution
    NO → ASK FIRST
```

### Always ASK Before

- Deleting >50 lines from any file
- Changing auth/authorization logic (middleware.ts)
- Modifying payment flows or financial logic
- Multiple valid approaches with no clear winner
- Any action affecting production data
- Modifying critical files

---

## Critical File Safeguards

These files require extra protection — read entirely before modifying, check deletion count, test all affected functionality:

| File                                        | Why Critical                                        |
| ------------------------------------------- | --------------------------------------------------- |
| `middleware.ts`                             | All route protection, auth flow, entitlements check |
| `next.config.js`                            | Build config, security headers, PWA                 |
| `app/api/payments/webhook/route.ts`         | Revenue processing, entitlements                    |
| `app/api/payments/create-checkout/route.ts` | Payment initiation                                  |
| `app/api/auth/route.ts`                     | Authentication                                      |
| `.env.*`                                    | All service credentials                             |
| `app/api/admin/*`                           | Admin access, user management                       |

---

## Git Conventions

### Commit Format

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

### Safety Rules

- NEVER `git push --force`
- NEVER `git reset --hard` without approval
- NEVER `git rebase` on shared branches
- ALWAYS `git status` before changes
- ALWAYS `git add [specific-files]` (never `git add .`)

### Tracker File Rule (CRITICAL)

`.claude/*.md` tracker files MUST commit to `main`, NEVER to feature branches. If committed to a feature branch, they become orphaned after PR merge and collaboration breaks.

---

## Session Types

Not all sessions are equal. Declare at `/start` — determines branch, commit cadence, and risk profile.

| Type         | Branch Required? | Commit Cadence | Risk     | Example                              |
| ------------ | ---------------- | -------------- | -------- | ------------------------------------ |
| **Code**     | YES (`feature/`) | Every 30 min   | High     | Features, bugs, refactoring          |
| **Content**  | NO (main)        | End of session | Low      | Scripts, copy, knowledge files, docs |
| **Strategy** | NO (main)        | End of session | Low      | Planning, audits, research           |
| **Hotfix**   | YES (`hotfix/`)  | After each fix | Critical | Production bugs, payment issues      |

---

## Multi-Developer Workflow

### Team

| Person  | Role      | Branch Pattern          |
| ------- | --------- | ----------------------- |
| Garin   | Developer | `feature/garin-[topic]` |
| Bill Ke | Developer | `feature/bill-[topic]`  |

### Conflict Prevention

1. Never work on same file simultaneously
2. Branch isolation for significant changes
3. Small, focused commits — push hourly (Code sessions)
4. Check ACTIVE-WORK.md before conflicting work
5. Stash protocol: `git stash push -u -m "WIP: description - [DEVELOPER]"`

### Session Flow

```
/start → Identify dev + session type → Read trackers → Check conflicts → Begin work
  ↓
/sync (Code: hourly, Content/Strategy: optional) → Commit → Push → Update registry
  ↓
/end → Commit remaining → Create PR (Code only) → Update trackers on main
```

### Multi-Chat Coordination

- **Golden Rule:** ONE CHAT = ONE BRANCH (Code sessions), ONE CHAT = ONE FOCUS (Content/Strategy)
- Chat ID format: `chat-[G/B]-[focus-keyword]-[MMDD]`
- Register in CHAT-REGISTRY.md before starting
- Deregister when closing

### Chat Registry Hygiene

- Active with last sync >24h → auto-mark Stale
- Stale >7 days → move to Closed (Abandoned)
- Closed >30 days → remove from registry
- Cleanup runs at every `/start`

---

## Debug Protocol (4-Phase)

### Phase 1: INVESTIGATE

- Reproduce exact user experience
- Capture complete error chain (User → Browser → Server → External → Root cause)
- Verify external resources FIRST (Supabase, Stripe, 100ms dashboards)
- Identify ALL contributing factors

### Phase 2: VERIFY

- Prove understanding in plain English
- Test theory without changing production

### Phase 3: FIX

- Fix order: External resources → Env vars → Config → Code
- Fix ALL issues, not just the first one
- Document changes

### Phase 4: PROVE

- Test at integration layer
- Verify complete request path
- Create evidence (screenshots, logs, tests)
- Test ALL affected paths

### Red Flag Phrases (Never Say)

- "Fixed!" → Instead: "Verified [specific thing] works because [evidence]"
- "Should work now" → Instead: "Tested [flow] and confirmed [result]"
- "Deployed the fix" → Instead: "Deployed and verified [endpoint] returns [expected]"

---

## Quality Gates

### Pre-Commit

- Type check passes
- Lint passes
- File read verification (read before modify)
- Minimal changes only
- No secrets in code

### Pre-Push

- Descriptive commit message (conventional format)
- Debug code removed
- Up to date with origin
- Tests passing

### Pre-Deployment

- Build succeeds
- Env vars present in Vercel
- Critical paths tested
- Critical files reviewed

### Post-Deployment

- Health checks return 200
- No new errors in Vercel logs
- Critical paths working
- Monitoring clean

---

## Definition of Done

Every completed task must pass:

1. **INVESTIGATE** — Reproduced issue, captured error chain, verified external resources, identified all factors
2. **VERIFY** — Proved understanding with evidence, tested theory without code changes
3. **FIX** — Fixed externals before code, fixed all issues, documented changes
4. **PROVE** — Tested integration layer, verified request path, created evidence, tested all paths

### Quality Checks

- [ ] Tests pass
- [ ] Type-check passes
- [ ] Lint passes
- [ ] No secrets committed
- [ ] Build succeeds

---

## API Middleware Pattern

All API routes follow this standardized pattern:

```typescript
// Standardized response format
{ success: true, data, meta }           // Success
{ error: { message, code, details } }   // Error

// Error codes
INVALID_REQUEST, VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN,
NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR,
SERVICE_UNAVAILABLE, DATABASE_ERROR, EXTERNAL_SERVICE_ERROR

// Helpers
apiError(code, message, details?)
apiSuccess(data, meta?)
withErrorHandling(handler)  // Wrapper for consistent error handling
```

---

## Scope Control

### Scope Creep Detection

If during implementation you discover additional files, improvements, or edge cases not in the original request:

1. Complete the original request first
2. List discoveries separately
3. Ask: "I noticed [X]. Should I address now or create a follow-up?"

### The 80/20 Rule

- Ship the core, iterate on the rest
- Working > Elegant (never sacrifice correctness)
- Perfect is the enemy of done
- Each PR should do ONE thing well

---

## Redux Persist Migration Rules

**Location:** `store/configureStore.ts` — Current version: `1`

The Redux store uses versioned migrations. Breaking this silently corrupts user state for every returning visitor.

### When Adding a New Redux Slice:

1. Add the slice to `store/reducer.ts`
2. Add to `persistConfig.blacklist` (if transient) OR create its own persist config (if persistent)
3. **INCREMENT `persistConfig.version`**
4. **ADD a migration function** in the `migrations` object that initializes default state
5. Test with fresh localStorage AND with old localStorage

### What Breaks If You Skip Steps 3-4:

- Existing users' persisted state won't include the new slice
- `autoMergeLevel2` may partially merge → undefined field errors
- No migration runs → default state never set
- **Result:** Silent runtime errors for every returning user

---

## Knowledge Base Maintenance

13 workspace knowledge files exist at `scripts/claude-workspace/`. These drift as the codebase evolves.

### Update Triggers

| Change                 | Update File                     |
| ---------------------- | ------------------------------- |
| New database table     | `03-DATABASE-SCHEMA.md`         |
| New API endpoint       | `08-API-REFERENCE.md`           |
| New feature            | `07-FEATURES.md`                |
| Auth/middleware change | `02-ARCHITECTURE.md`            |
| Payment flow change    | `04-BUSINESS-MODEL.md`          |
| New integration        | `11-INTEGRATIONS.md`            |
| New utility/hook       | `13-UTILITIES-HOOKS-TESTING.md` |
| UI/design change       | `10-UI-DESIGN-SYSTEM.md`        |

### Rules

- Edit only the affected section — don't rewrite entire files
- Verify from source code — no assumptions
- Monthly staleness check: diff knowledge files vs codebase

---

## Emergency Escalation

| Severity | Description                             | Response Time |
| -------- | --------------------------------------- | ------------- |
| P0       | Production down, payments failing       | Immediate     |
| P1       | Major feature broken, data issue        | <1 hour       |
| P2       | Minor feature broken, workaround exists | <4 hours      |
| P3       | Low impact, cosmetic                    | Next session  |
