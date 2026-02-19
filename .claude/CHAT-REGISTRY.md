# Claude Code Chat Registry

> **Purpose**: Track all active Claude Code chat sessions working on this codebase.
> **Last Updated**: 2026-02-19

---

## Active Chats

| Chat ID | Developer | Branch | Focus | Type | Status | Files Owned | Last Sync |
| ------- | --------- | ------ | ----- | ---- | ------ | ----------- | --------- |
| (none)  | -         | -      | -     | -    | -      | -           | -         |

---

## Recently Closed Chats

| Chat ID               | Developer | Branch | Focus                                    | Closed     | Reason    | Final Commit |
| --------------------- | --------- | ------ | ---------------------------------------- | ---------- | --------- | ------------ |
| chat-G-fixerrors-0219 | Garin     | main   | Hotfix: auth, settings, community share  | 2026-02-19 | Completed | `4fbc2dc`    |
| chat-G-automate-0218  | Garin     | main   | Automation engine + drips + gamification | 2026-02-18 | Completed | `58aaaf0`    |
| chat-G-ds-phase3-0217 | Garin     | main   | Design System Phase 3 cleanup            | 2026-02-17 | Completed | `81f7075`    |
| chat-G-email-0217     | Garin     | main   | Email system production wiring           | 2026-02-17 | Completed | `d768bdc`    |
| chat-G-appstore-0217  | Garin     | main   | Phase 4 TypeScript & Redux               | 2026-02-17 | Completed | `fabb952`    |

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
