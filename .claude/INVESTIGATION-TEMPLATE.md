# Investigation Template

Use this template for every bug investigation. Fill it out BEFORE making any code changes.

---

## Issue Report

**Date**: [Date]
**Reported By**: [User/System]
**Priority**: [P0/P1/P2/P3]
**User's Description**: [exact description]
**User's Error Message**: [exact error]

---

## Phase 1: INVESTIGATE

### Step 1: Reproduce Exact User Experience

- [ ] Clicked through actual UI flow
- [ ] Noted exact sequence of actions
- [ ] Can reproduce: Yes / No

**Reproduction Steps**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshot/Recording**: [link or description]

### Step 2: Capture Complete Error Chain

```
User sees:
    |
Browser logs:
    |
Server logs:
    |
External:
    |
Root cause:
```

### Step 3: Verify External Resources

- [ ] Checked Supabase dashboard
- [ ] Checked Stripe dashboard (if payment-related)
- [ ] Checked 100ms dashboard (if video-related)
- [ ] Verified env vars are correct

**External Resource Status**:
| Resource | Status | Notes |
|----------|--------|-------|
| Supabase | OK/Issue | |
| Stripe | OK/Issue | |
| 100ms | OK/Issue | |
| Vercel | OK/Issue | |

### Step 4: Identify All Contributing Factors

1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

---

## Phase 2: VERIFY

### Root Cause Analysis

**What the user sees**:
[description]

**What is actually failing**:
[description]

**Why it is failing**:
[description]

**Evidence**:

- [Evidence 1]
- [Evidence 2]

### Theory Test (Without Code Changes)

- [ ] Tested theory with curl/direct query
- [ ] Result confirms theory: Yes / No

---

## Phase 3: FIX

### Fix Plan

**Order of Operations**:

1. [ ] Fix external resources: [what]
2. [ ] Fix environment variables: [what]
3. [ ] Fix configuration: [what]
4. [ ] Fix code: [what]

### Changes Made

| File   | Change   | Reason   |
| ------ | -------- | -------- |
| [file] | [change] | [reason] |

---

## Phase 4: PROVE

### Integration Testing

- [ ] Tested at integration layer (real APIs)
- [ ] Verified complete request path
- [ ] Pulled and inspected runtime values

### Evidence Created

- [ ] Screenshot of working flow
- [ ] Log output showing success
- [ ] Test case added

### All Affected Paths Tested

| Path     | Tested | Result    |
| -------- | ------ | --------- |
| [path 1] | Yes/No | Pass/Fail |
| [path 2] | Yes/No | Pass/Fail |
| [path 3] | Yes/No | Pass/Fail |

---

## Conclusion

**Root Cause**: [one sentence]

**Fix Applied**: [one sentence]

**Verification**: [evidence summary]

**Follow-up Actions**:

- [ ] [Action 1]
- [ ] [Action 2]

---

**Investigation Completed By**: [Developer]
**Date**: [Date]
**Time to Resolution**: [Duration]
