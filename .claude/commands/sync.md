# Mid-Session Sync Protocol

Use this to sync changes mid-session. Keeps work safe and other developers informed.

---

## Step 0: Multi-Chat State Capture

Verify you are on the correct branch for this chat:

```bash
git branch --show-current
```

Check CHAT-REGISTRY.md: is this chat still registered? Has another chat claimed your files?

---

## Important: Tracker Commits

Tracker files should only be committed to main. During mid-session sync on a feature branch:

- DO commit and push your feature work
- DO NOT commit tracker changes to the feature branch
- Tracker commits happen at `/end` time on main

---

## Step 1: Check Current State

```bash
git branch --show-current
git status
git diff --stat
```

## Step 2: Separate Feature Work from Tracker Updates

Identify which files are feature work vs tracker files.

## Step 3: Commit Feature Work Only

Stage feature files only (not `.claude/*.md`). Use conventional commit format.

```bash
git add [specific-feature-files]
git commit -m "type(scope): description"
```

## Step 4: Push to Remote

```bash
git push origin <current-branch>
```

## Step 5: Check for Remote Changes

```bash
git fetch origin
git status
```

## Step 6: Optional Main Sync Check (Feature Branch Only)

Check if main has new commits:

```bash
git log HEAD..origin/main --oneline
```

Show what changed. Detect potential conflicts. Ask whether to merge main into feature branch.

## Step 7: Update Chat Registry

Update Last Sync timestamp in CHAT-REGISTRY.md.

## Step 8: Confirm Sync

Report:

- Chat ID
- Files committed
- Branch
- Push status
- Main sync status

---

**Resume work after sync completes.**
