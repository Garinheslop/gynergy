# SESSION HANDOFF PROTOCOL

> Structured format for passing context between sessions.
> Ensures continuity and prevents lost work.

---

## When To Use

- End of every session (via `/end` command)
- Before any break >30 minutes
- When switching between major features
- When handing off to the other developer (Garin <-> Bill)
- When context window is getting full

---

## Quick Handoff Template

```markdown
## Session Handoff: [YYYY-MM-DD]

### Completed This Session

- [x] [Task 1]
- [x] [Task 2]

### In Progress

- [ ] [Current task] -- [X]% complete
  - Last action: [what you just did]
  - Next action: [what to do next]

### Blocked (if any)

- [Blocker description]

### Files Modified

- `path/to/file1` -- [what changed]

### Critical Context

> [Anything the next session MUST know]

### Suggested First Action

1. [Specific first step for next session]
```

---

## Full Handoff Template

```markdown
## Session Handoff: [YYYY-MM-DD] - [Developer]

### Summary

[1-2 sentence summary of what was accomplished]

### Tasks Completed

| Task     | Files Changed      | Commit |
| -------- | ------------------ | ------ |
| [Task 1] | file1.ts, file2.ts | abc123 |
| [Task 2] | file3.ts           | def456 |

### Work In Progress

**Task**: [Current task name]
**Progress**: [X]%
**Last Action**: [What you just did]
**Next Steps**:

1. [Step 1]
2. [Step 2]

**Context Needed**:

- [Important context for continuation]

### Blockers

| Blocker | Impact           | Workaround |
| ------- | ---------------- | ---------- |
| [Issue] | [What it blocks] | [If any]   |

### Decisions Made

| Decision   | Rationale | Reversible? |
| ---------- | --------- | ----------- |
| [Decision] | [Why]     | Yes/No      |

### Files Changed This Session

| File         | Change Type | Notes          |
| ------------ | ----------- | -------------- |
| path/to/file | Modified    | [What changed] |

### Tests Status

- [ ] Unit tests passing
- [ ] Type check passing
- [ ] Lint passing
- [ ] E2E tests passing

### Dependencies/Follow-ups

- [ ] [Follow-up task 1]
- [ ] [Follow-up task 2]

### Critical Context for Next Session

> [Important information that MUST be known]

### Recommended Next Actions

1. [First thing to do]
2. [Second thing to do]
```

---

## Handoff Checklist

- [ ] All work committed and pushed
- [ ] Tracker file updated (on `main`)
- [ ] Handoff notes written
- [ ] No uncommitted critical files
- [ ] Build still passes
- [ ] Any blockers documented

---

## Receiving a Handoff

When starting a session after someone else worked:

1. Read the handoff notes (in tracker file)
2. Verify git state: `git fetch && git status`
3. Check last commits: `git log --oneline -5`
4. Confirm branch: `git branch --show-current`
5. Read any modified files before continuing work
6. Run build to confirm state: `npm run build`

---

## Developer-Specific Handoffs

### Garin -> Bill Handoff

Update `.claude/GARIN-TRACKER.md` section "Handoff to Bill"

### Bill -> Garin Handoff

Update `.claude/BILL-TRACKER.md` section "Handoff to Garin"

---

**A good handoff saves 30+ minutes at the start of the next session.**
