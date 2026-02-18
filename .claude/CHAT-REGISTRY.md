# Claude Code Chat Registry

> **Purpose**: Track all active Claude Code chat sessions working on this codebase.
> **Last Updated**: 2026-02-14

---

## Active Chats

| Chat ID             | Developer | Branch | Focus                          | Type    | Status | Files Owned | Last Sync  |
| ------------------- | --------- | ------ | ------------------------------ | ------- | ------ | ----------- | ---------- |
| chat-G-funnels-0217 | Garin     | main   | Funnel scripts & landing pages | Content | Active | scripts/    | 2026-02-17 |

---

## Recently Closed Chats

| Chat ID               | Developer | Branch | Focus              | Closed     | Reason     |
| --------------------- | --------- | ------ | ------------------ | ---------- | ---------- |
| chat-G-community-0217 | Garin     | main   | Community section  | 2026-02-17 | Stale >24h |
| chat-G-phase1-0217    | Garin     | main   | 10/10 Plan Phase 1 | 2026-02-17 | Stale >24h |

---

## Chat Naming Convention

Format: `chat-[Developer Initial]-[focus-keyword]-[MMDD]`

Examples:

- `chat-G-auth-0215` - Garin's auth chat, Feb 15
- `chat-B-api-0215` - Bill's API chat, Feb 15

---

## Emergency Recovery

If you find uncommitted changes and do not know which chat:

1. Run `git stash push -m "rescue-$(date +%Y%m%d-%H%M)"`
2. Add entry to "Pending Rescue" section
3. Run rescue prompt in each chat to identify owner
4. Apply stash to correct branch

### Pending Rescue

(none)

---

**Registry Maintainer**: Active Claude Code chats
**Update Frequency**: Every /start, /sync, /end
