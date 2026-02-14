# DEFINITION OF DONE

> Complete this checklist before claiming any work is "fixed" or "done".
> No shortcuts. Every checkbox must be verified.

---

## Phase 1: INVESTIGATE (Before Code Changes)

- [ ] Reproduced exact user experience
- [ ] Captured complete error chain (user -> browser -> server -> external -> root cause)
- [ ] Verified external resources exist and are correct
- [ ] Identified ALL contributing factors (not just the first one)

## Phase 2: VERIFY (Prove Understanding)

- [ ] Wrote root cause analysis (what is broken, why, evidence)
- [ ] Tested theory without changing production
- [ ] Confirmed assumptions are correct (every "I think" replaced with "I verified")

## Phase 3: FIX (Make Changes)

- [ ] Fixed external resources first
- [ ] Fixed environment variables
- [ ] Fixed code (if needed)
- [ ] Addressed ALL issues (not just the first one)

## Phase 4: PROVE (Create Evidence)

- [ ] Tested at integration layer (real APIs, not mocks)
- [ ] Verified complete request path
- [ ] Pulled and inspected runtime values
- [ ] Created evidence (screenshot, log, test case)
- [ ] Tested ALL affected code paths

---

## Quality Gates

### Before Commit

- [ ] All tests pass (`npm run test`)
- [ ] No type errors (`npm run type-check`)
- [ ] No lint warnings (`npm run lint`)
- [ ] Changes are minimal

### Before Push

- [ ] Commit message is descriptive (conventional commits)
- [ ] No secrets in code
- [ ] No debug code left in

### Before Claiming Done

- [ ] This entire checklist complete
- [ ] Evidence created and documented
- [ ] User flow tested end-to-end

---

## Red Flags

| Statement                  | Reality Check                                           |
| -------------------------- | ------------------------------------------------------- |
| "I think this will fix it" | You are guessing. Investigate more.                     |
| "The deployment succeeded" | Deployment is not the same as solution. Test the flow.  |
| "It works locally"         | Local is not production. Test in preview.               |
| "The API returns 200"      | Your 200 is not the same as external service accepting. |
| "It should be fine now"    | "Should" = assumption. Prove it.                        |

---

**The Standard**: Only claim "done" when you can prove it.
