# Multi-Chat Coordination Protocol

> **Purpose**: Safely run multiple Claude Code chats simultaneously on the same codebase.
> **Last Updated**: 2026-02-14

---

## The Golden Rule

**ONE CHAT = ONE BRANCH**

Every Claude Code chat session MUST work on its own dedicated branch. Never have two chats modifying files on the same branch.

---

## Before Starting a New Chat

1. Decide what this chat will focus on
2. Create a dedicated branch: `feature/[developer]-[focus]-[date]`
3. Run `/start` in the chat
4. Register the chat in CHAT-REGISTRY.md

## During Work

- Commit frequently (every 15-30 minutes)
- Push after every commit
- Update CHAT-REGISTRY.md if scope changes

## Before Closing Any Chat

1. Run `/end` in the chat
2. Ensure PR is created or changes are stashed
3. Update CHAT-REGISTRY.md

---

## File Ownership Rules

| File Category | Ownership    | Multi-Chat Rule                  |
| ------------- | ------------ | -------------------------------- |
| Feature code  | Single chat  | Only one chat modifies           |
| Shared types  | Coordinate   | Notify other chats via registry  |
| Config files  | Main chat    | Merge to main first              |
| Tests         | Feature chat | Match feature ownership          |
| Documentation | Any          | Non-blocking, merge conflicts OK |
| Tracker files | Main only    | Never on feature branches        |

---

## Recovery Protocols

### Multiple Chats Modified Same File

1. Check CHAT-REGISTRY.md for ownership
2. Stash changes from non-owning chat
3. Let owning chat commit first
4. Other chat rebases and resolves

### Uncommitted Changes from Unknown Chat

1. `git stash push -m "unknown-chat-rescue-$(date +%Y%m%d)"`
2. Add entry to Chat Registry "Pending Rescue" section
3. Query each chat to identify owner

---

**Protocol Owner**: Claude Code
**Enforcement**: Automated via /start, /sync, /end commands
