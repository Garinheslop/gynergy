# Collaboration Protocol - Multi-Developer Workflow

> **Purpose**: Prevent Garin and Bill from overriding each other's changes when working on different computers. Ensures seamless collaboration with Claude Code across multiple sessions.
> **Last Updated**: 2026-02-14

---

## 1. Session Startup Checklist

MANDATORY: Complete these steps at the START of every Claude Code session.

1. Identify yourself (tell Claude who you are: Garin or Bill)
2. Check `.claude/ACTIVE-WORK.md` for active developers
3. Pull latest changes: `git fetch origin && git pull origin main`
4. Check for uncommitted changes from other developers
5. Review recent session documentation
6. Update active work indicator

---

## 2. Developer Profiles

| Developer | Primary Focus          | Preferred Branch Naming |
| --------- | ---------------------- | ----------------------- |
| Garin     | Full-stack development | feature/garin-[topic]   |
| Bill Ke   | Full-stack development | feature/bill-[topic]    |

---

## 3. Active Work Rules

1. Before starting: Check if other developer is active
2. If conflict detected: Contact the other developer or work on a different branch
3. When ending session: Update status to Inactive
4. Never force-push or override active work

---

## 4. Sync Protocol

### Before ANY Work

```bash
git fetch origin
git status
git pull origin main
```

### After ANY Significant Work

```bash
git add <specific-files>
git commit -m "type(scope): description"
git push origin <branch-name>
```

### Sync Frequency

| Activity               | Sync Requirement         |
| ---------------------- | ------------------------ |
| Starting session       | Pull immediately         |
| Every 30 minutes       | Check for remote changes |
| After each feature     | Commit + Push            |
| Before switching tasks | Commit current work      |
| Ending session         | Push all commits         |

---

## 5. Session Documentation

### Location

All session documentation: `docs/sessions/YYYY-MM/`

### Naming Convention

`SESSION-YYYY-MM-DD-DEVELOPER-TOPIC.md`

### Required Sections

- Metadata (developer, date, branch, duration)
- Summary
- Changes Made (files created/modified/deleted)
- Git Commits
- Tasks Completed / Remaining
- Issues Encountered
- Handoff Notes

---

## 6. Conflict Prevention Rules

### Rule 1: Never Work on Same File Simultaneously

If both Garin and Bill need the same file: communicate first. One completes and pushes, then the other pulls and modifies.

### Rule 2: Branch Isolation

For significant changes, create a feature branch: `feature/[developer]-[topic]`

### Rule 3: Commit Granularity

Small, focused commits. Push frequently (at least hourly when active).

### Rule 4: Communication Channels

Before starting potentially conflicting work: check `.claude/ACTIVE-WORK.md`

### Rule 5: Stash Protocol

```bash
git stash push -u -m "WIP: description - [GARIN/BILL]"
```

### Rule 6: Tracker Files MUST Go to Main

CRITICAL: Tracker files (`.claude/*.md`) are shared state and must ALWAYS be committed to `main`, never to feature branches. If committed to a feature branch that later gets deleted, those tracker updates become orphaned and lost.

---

## 7. Emergency Procedures

### Merge Conflict Resolution

```bash
git status                          # See conflicted files
# Resolve manually, then:
git add <resolved-files>
git commit -m "merge: resolve conflicts"
```

### Accidental Override Recovery

```bash
git reflog                          # Find the commit before override
git checkout <commit-hash> -- <file-path>  # Recover specific file
```

---

**Maintained by**: Claude Code
**Review Frequency**: After any collaboration issues
