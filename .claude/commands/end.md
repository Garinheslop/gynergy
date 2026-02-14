# Session End Protocol

Execute this protocol COMPLETELY before ending the session.

---

## Step 0: Branch State Validation

```bash
git branch --show-current
git fetch origin
```

### If on a feature branch:

Check if PR was merged. If yes:

1. Do NOT update trackers on this branch
2. Switch to main: `git checkout main && git pull origin main`
3. Delete local feature branch
4. Continue with Step 1 ON MAIN

If PR was NOT merged:

1. Commit and push feature work
2. Create PR (Step 2)
3. Continue with tracker updates on main

### If on main:

Continue with Step 1, skip Step 2.

---

## Step 1: Final Commit Check

```bash
git status
```

If uncommitted feature work exists: stage, commit, push.
Note: Tracker files should NOT be committed here -- they go to main in Step 7.

---

## Step 2: Create PR and Clean Up (Feature Branch Only)

### 2a. Push feature branch

### 2b. Create PR with full details (title, summary, changes, testing)

### 2c. Merge the PR (or leave open for review, depending on team preference)

### 2d. Switch to main and pull

### 2e. Delete local feature branch

### 2f. Handle merge failures (keep PR open, report to developer)

---

## Step 3: Ensure on Main for Tracker Updates

```bash
git branch --show-current   # Must be: main
git pull origin main
```

---

## Step 4: Create Session Documentation (MANDATORY)

Create: `docs/sessions/YYYY-MM/SESSION-YYYY-MM-DD-DEVELOPER-TOPIC.md`

Include: all files changed, commits, key decisions, handoff notes, pending tasks.

---

## Step 5: Update Developer Tracker

Update `.claude/[DEVELOPER]-TRACKER.md`:

- Status: Inactive
- Last Active: today
- Current Branch: main
- Add session log entry
- Clear file locks
- Add handoff notes
- Mark completed tasks

---

## Step 6: Update Active Work Dashboard

Update `.claude/ACTIVE-WORK.md`:

- Status: Inactive
- Update timeline
- Clear file locks
- Verify date consistency across all tracker files

---

## Step 7: Commit Tracker Updates TO MAIN

```bash
git add .claude/*.md docs/sessions/
git commit -m "docs(session): end session - [topic summary]"
git push origin main
```

CRITICAL: This push MUST be to `origin main`, not a feature branch.

---

## Step 7b: Update Recent Changes Log

Append new entry to `.claude/RECENT-CHANGES.md` at the TOP.

---

## Step 7c: Export Shared Memory (If Needed)

If significant decisions or context were created this session, update `.claude/SHARED-MEMORY.md`.

---

## Step 8: Deregister Chat

Update `.claude/CHAT-REGISTRY.md`: move entry to "Recently Closed" with final commit hash.

---

## Step 9: Confirm Session End

Report:

- Chat ID
- Number of commits and files changed
- PR status (if applicable)
- Tracker updates committed to main
- Session doc location
- Handoff notes for next session

---

**Session is now complete. Context is preserved on main for next session.**
