# QUALITY GATES

> Mandatory checkpoints before commits, deployments, and releases.
> No shortcuts. Every gate must pass.

---

## PRE-COMMIT GATES

```bash
# 1. Verify you read the file before modifying (mental check)
# 2. Check git state
git status && git branch --show-current
# 3. Type check
npm run type-check
# 4. Lint check
npm run lint
# 5. Review your changes
git diff --staged
```

| Gate           | Requirement            | Action if Failed   |
| -------------- | ---------------------- | ------------------ |
| Type check     | 0 errors               | Fix all errors     |
| Lint           | 0 warnings             | Fix all warnings   |
| File read      | Read before modify     | Go back, read file |
| Minimal change | Only necessary changes | Remove extras      |
| No secrets     | No API keys in code    | Remove immediately |

---

## PRE-PUSH GATES

| Gate           | Requirement                     | Action if Failed   |
| -------------- | ------------------------------- | ------------------ |
| Commit message | Descriptive, follows convention | Amend commit       |
| Debug code     | None in production code         | Remove before push |
| Up to date     | No conflicts with origin        | Merge/rebase first |
| Tests          | All passing                     | Fix failing tests  |

---

## PRE-DEPLOYMENT GATES

| Gate           | Requirement                         | Action if Failed |
| -------------- | ----------------------------------- | ---------------- |
| Build          | Completes without errors            | Fix build errors |
| Env vars       | All required vars present in Vercel | Add missing vars |
| Critical paths | All tested and working              | Fix broken paths |
| Critical files | Reviewed and approved               | Get approval     |

---

## CRITICAL FILE CHANGE GATES

Protected Files:

- middleware.ts
- app/api/payments/webhook/route.ts
- app/api/payments/create-checkout/route.ts
- app/api/auth/route.ts
- next.config.js
- .env.\*
- app/api/admin/\*

| Gate               | Requirement                 | Action if Failed   |
| ------------------ | --------------------------- | ------------------ |
| File read          | Read entire file            | Read it            |
| Deletion count     | <50 lines OR approved       | Get approval       |
| Pattern check      | Critical patterns preserved | Do not remove them |
| Route/path testing | All affected routes tested  | Test them          |

---

## POST-DEPLOYMENT GATES

| Gate           | Requirement             | Action if Failed        |
| -------------- | ----------------------- | ----------------------- |
| Health checks  | All return 200          | Investigate immediately |
| Error logs     | No new errors in Vercel | Fix or rollback         |
| Critical paths | All working             | Fix or rollback         |
| Monitoring     | No anomalies for 15 min | Investigate anomalies   |

---

## TRACKER FILE GATES

| Gate          | Requirement            | Action if Failed    |
| ------------- | ---------------------- | ------------------- |
| Branch        | Must be `main`         | Switch to main      |
| Pull          | Up to date with origin | Pull first          |
| Commit target | Only tracker files     | Do not include code |
| Push          | Immediate push         | Push right away     |

---

## EMERGENCY ROLLBACK

| Symptom                          | Action                 |
| -------------------------------- | ---------------------- |
| 500 errors on critical paths     | Rollback immediately   |
| Auth completely broken           | Rollback immediately   |
| Payments/financial logic failing | Rollback immediately   |
| Data corruption                  | Rollback + investigate |
| Performance degradation >50%     | Consider rollback      |

### Vercel Rollback

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "..." -> "Promote to Production"

---

**Quality gates exist to protect users and the product. Never skip them.**
