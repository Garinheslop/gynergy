# Debug Protocol: INVESTIGATE --> VERIFY --> FIX --> PROVE

> **Purpose**: Prevent false "fixed" claims. Every bug fix must follow this four-phase process.

---

## The Problem This Solves

Pattern of failure:

1. See error -> Guess cause -> Fix guess -> Claim "fixed"
2. User reports still broken
3. Repeat

---

## Phase 1: INVESTIGATE (Before Any Code Changes)

### Rule 1: Reproduce The EXACT User Experience

- [ ] Click through the actual UI flow (do not just test the API)
- [ ] Screenshot or record the exact error
- [ ] Note the EXACT sequence of actions that triggers it

### Rule 2: Capture The Complete Error Chain

```
User sees:     [error message]
    |
Browser logs:  [console error]
    |
Server logs:   [API error]
    |
External:      [third-party error]
    |
Root cause:    [actual cause]
```

### Rule 3: Verify External Resources FIRST

Before assuming anything exists: log into the dashboard and check. Pull and inspect actual env var values (not just whether they exist).

### Rule 4: Identify ALL Contributing Factors

Do not stop at the first issue found. There may be multiple problems.

---

## Phase 2: VERIFY (Before Writing Any Code)

### Rule 5: Prove You Understand The Root Cause

Write down in plain English:

- What the user sees
- What is actually failing
- Why it is failing
- Evidence supporting this conclusion

### Rule 6: Test The Theory Without Changing Production

Use curl, query databases directly, check external dashboards. Prove the theory before implementing a fix.

---

## Phase 3: FIX (Implement The Solution)

### Rule 7: Fix Data Before Fixing Code

Order of operations:

1. Fix/create external resources
2. Fix environment variables
3. Fix configuration
4. Fix code (only if needed after the above)

### Rule 8: Fix All Issues, Not Just The First One

### Rule 9: Document What You Changed And Why

---

## Phase 4: PROVE (Before Claiming "Fixed")

### Rule 10: Test At The Integration Layer

Do not just test that your code works. Test that external services accept your requests.

### Rule 11: Verify The Complete Request Path

Trace from user action to external service and back.

### Rule 12: Pull And Inspect Actual Runtime Values

### Rule 13: Create Evidence Of The Fix

- Screenshot of working user flow
- Log output showing successful calls
- Test results

### Rule 14: Test ALL Affected Paths

If there are three paths that could be impacted, test all three.

---

## Before Saying "Fixed" Checklist

### Investigation Complete

- [ ] Reproduced exact user experience
- [ ] Captured complete error chain
- [ ] Verified external resources exist/correct
- [ ] Identified ALL contributing factors

### Verification Complete

- [ ] Proved understanding of root cause with evidence
- [ ] Tested theory without changing production

### Fix Complete

- [ ] Fixed external resources first
- [ ] Fixed environment variables
- [ ] Fixed code (if needed)
- [ ] Addressed ALL issues (not just first one)
- [ ] Documented all changes

### Proof Complete

- [ ] Tested at integration layer
- [ ] Verified complete request path
- [ ] Created evidence (screenshots/logs)
- [ ] Tested ALL affected code paths

### Only After ALL Checkboxes

- [ ] NOW you can say "Fixed"

---

## Red Flags: When To Stop And Investigate More

| Red Flag                   | Action                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| "I think this will fix it" | You are guessing. Go back to Phase 1.                                  |
| "The deployment succeeded" | Deployment success is not the same as problem fixed. Go to Phase 4.    |
| "The health check passes"  | Infrastructure working is not the same as integration working.         |
| "I fixed the code"         | Did you fix the data? External resources? Environment variables?       |
| "It works locally"         | Local is not production. Pull production env vars and test with those. |
| "I tested one path"        | Test ALL affected paths.                                               |

---

## Communication Protocol

### Do Not Say:

- "Fixed!"
- "Should work now"
- "Deployed the fix"

### Do Say:

- "I have identified the root cause: [specific issue with evidence]"
- "I have made these changes: [list with verification]"
- "I have tested: [specific tests with results]"
- "Ready for you to test: [specific steps to verify]"

---

**This Document Is Our Contract.**
When "fixed" is claimed, it means all four phases are complete with evidence.
