# Critical File Safeguards

> **Purpose**: Prevent catastrophic changes to critical files. Read by ALL AI agents before making changes.
> **Last Updated**: 2026-02-14

---

## CRITICAL FILES -- REQUIRE SPECIAL HANDLING

### `middleware.ts` - Authentication & Routing Gateway

**Why Critical**: Controls authentication for the entire Gynergy application. Defines public routes, protected routes, challenge access, and admin access. One wrong change breaks all protected routes.

**Protected Patterns**:

- PUBLIC_FILE_PATTERNS - PWA/static file bypasses
- CHALLENGE_PROTECTED_PATTERNS - Paid content routes
- publicRoutes array - Unauthenticated access
- Admin check logic - Role-based access

### `next.config.js` - Build Configuration

**Why Critical**: Controls how the application builds and deploys to Vercel. Wrong config breaks builds completely.

### `app/api/payments/webhook/route.ts` - Stripe Webhook Handler

**Why Critical**: Processes Stripe payment events. Incorrect changes can cause:

- Failed payment processing
- Lost revenue
- Broken entitlements
- Data inconsistency

### `app/api/payments/create-checkout/route.ts` - Payment Creation

**Why Critical**: Creates Stripe checkout sessions. Errors here mean users cannot purchase.

### `app/api/auth/route.ts` - Authentication Route

**Why Critical**: Handles auth callbacks and session management.

### `.env.local` / `.env.production` - Environment Variables

**Why Critical**: Contains all secrets and configuration. Wrong env vars can:

- Disable payment processing
- Break authentication
- Cause API failures
- Mix production/test keys

### `app/api/admin/*` - Admin Routes

**Why Critical**: Elevated access routes. Security vulnerabilities here expose entire system.

---

## Required Checks Before Changing Any Critical File

```bash
# 1. Read the entire file first
cat [file]

# 2. Check deletion count
git diff [file] | grep "^-" | wc -l
# If > 50 deletions --> STOP and get approval

# 3. Test ALL affected functionality after changes
```

---

## AI Agent Instructions

### Before Changing Critical Files

STOP and complete this checklist:

- [ ] I have read the entire file
- [ ] I understand WHY each line I am deleting exists
- [ ] I have checked git blame for deleted code
- [ ] I have searched the codebase for references
- [ ] I have tested the specific functionality affected
- [ ] I have a rollback plan if this breaks production
- [ ] I have gotten explicit user approval for large changes (>50 lines)

If ANY checkbox is unchecked: DO NOT PROCEED

---

## Emergency Response Protocol

If user reports "X is broken" where X worked before:

1. Check git history: `git log --oneline --since="3 days ago"`
2. Test the actual endpoint/page
3. Analyze the breaking commit: `git show <commit-hash> --stat`
4. If deletions > 100: REVERT FIRST, understand later
5. If deletions < 100: Analyze each deleted line

---

## File-Specific Testing Requirements

| File                     | Required Tests After Change                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| middleware.ts            | Test all public routes, protected routes, admin routes, challenge routes |
| webhook/route.ts         | Test with Stripe CLI: `stripe trigger payment_intent.succeeded`          |
| create-checkout/route.ts | Complete checkout flow in test mode                                      |
| auth/route.ts            | Full login/logout flow                                                   |
| .env.\*                  | Verify all services connect properly                                     |

---

**Last Updated**: 2026-02-14
**Review**: After any production incident or when adding new critical files
