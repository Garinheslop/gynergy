# Session Start Protocol

Execute this protocol COMPLETELY before doing ANY other work.

## Step 0: Multi-Chat Coordination

### 0a. Generate Chat ID

Create unique identifier: `chat-[G/B]-[focus-keyword]-[MMDD]`

- G = Garin
- B = Bill

### 0b. Check Chat Registry

Read `.claude/CHAT-REGISTRY.md`:

- Are there other chats currently active?
- Is there uncommitted work from other chats?
- Will your work overlap with any registered chat?

### 0c. Branch Assignment

If starting new work: create dedicated branch and register in CHAT-REGISTRY.md
If resuming existing work: switch to registered branch and pull latest

### 0d. Register This Chat

Add entry to `.claude/CHAT-REGISTRY.md`

### 0e. Check Recent Changes

Read `.claude/RECENT-CHANGES.md`. Report what changed since last session.

### 0f. Load Shared Memory

Read `.claude/SHARED-MEMORY.md` to restore shared context.

---

## Step 1: Developer Identification

Ask: "Which developer am I working with? (Garin or Bill)"
WAIT for response. Do NOT proceed until identified.

## Step 2: Git Sync Check

```bash
git fetch origin
git status
git branch --show-current
git log --oneline -5
```

If uncommitted changes: ask whether to commit, stash, or discard.
If behind remote: `git pull origin main`

## Step 3: Check Active Work Dashboard

Read `.claude/ACTIVE-WORK.md`:

- Is the other developer currently active?
- If yes: WARN about potential conflicts
- Check for stale status (Active for >24 hours = likely forgot to run /end)

### Stale Status Detection

If a developer shows Active but "Since" date is >24 hours ago, ask:

1. Mark them as Inactive (recommended)
2. Leave as-is and proceed with caution
3. Wait and check with them first

### File Conflict Detection (if other dev is Active)

1. Read their tracker to see files they are modifying
2. Ask current developer what they will work on
3. Compare lists and warn if overlap detected

## Step 4: Read Developer Tracker

Read `.claude/[DEVELOPER]-TRACKER.md` (GARIN-TRACKER.md or BILL-TRACKER.md) and report:

- Last session focus
- Pending tasks
- Any handoff notes

## Step 5: Update Status to Active

Update tracker and ACTIVE-WORK.md:

- Status: Active
- Branch: current branch
- Focus: user's stated focus (ask if not provided)

## Step 6: Confirm Ready

Say: "Session started for [Developer] on branch [branch]. Ready to work on [focus]. I will commit frequently and update your tracker throughout this session."

---

**After completing this protocol, proceed with the user's request.**
