# Gynergy Implementation Execution Checklist

## Master Reference Document

**Last Updated:** 2026-02-01
**Total Phases:** 7 | **Estimated Duration:** 11 weeks

---

## EXECUTION ORDER OPTIMIZATION

### Dependency Graph
```
Phase 0 (DONE) ─────────────────────────────────────────────────────────┐
    │                                                                    │
    ▼                                                                    │
Phase 0.5 (DONE) ───────────────────────────────────────────────────────┤
    │                                                                    │
    ├──────────────────┬─────────────────┬──────────────────────────────┤
    │                  │                 │                              │
    ▼                  ▼                 ▼                              │
Phase 1           Phase 2           Phase 3                            │
(Gamification)    (AI Chars)        (100ms Video)                      │
    │                  │                 │                              │
    │                  │                 │                              │
    └──────────────────┴─────────────────┘                              │
                       │                                                │
                       ▼                                                │
                  Phase 4                                               │
            (Cohort & Community)                                        │
                       │                                                │
                       ▼                                                │
                  Phase 5                                               │
          (Social Sharing & Notifications)                              │
                       │                                                │
                       ▼                                                │
                  Phase 6                                               │
              (Apple-Level Polish)                                      │
                       │                                                │
                       ▼                                                │
                   LAUNCH                                               │
```

### Parallelization Opportunities
- **Phases 1, 2, 3 can run in parallel** (no dependencies between them)
- Within each phase, backend and frontend can often be parallelized
- Database migrations must complete before API development

---

## PHASE 0: CRITICAL BLOCKERS ✅ COMPLETE

### Status: DONE (2026-02-01)

| Task | Status | File(s) | Notes |
|------|--------|---------|-------|
| Popup system refactor | ✅ | `contexts/UsePopup.tsx` | Added celebration queue |
| Redux-persist migration v1 | ✅ | `store/configureStore.ts` | Version bumped to 1 |
| Gamification schema | ✅ | `supabse/schema/gamification.sql` | 30 badges seeded |
| Cohort schema | ✅ | `supabse/schema/cohort.sql` | RLS policies added |
| Social schema | ✅ | `supabse/schema/social.sql` | Activity triggers added |
| Sharing schema | ✅ | `supabse/schema/sharing.sql` | Auto token generation |
| Notifications schema | ✅ | `supabse/schema/notifications.sql` | Badge triggers added |

---

## PHASE 0.5: DOCUMENTATION & CI/CD ✅ COMPLETE

### Status: DONE (2026-02-01)

| Task | Status | File(s) | Notes |
|------|--------|---------|-------|
| Docs folder structure | ✅ | `docs/**` | All folders created |
| README.md | ✅ | `docs/README.md` | Documentation hub |
| ARCHITECTURE.md | ✅ | `docs/ARCHITECTURE.md` | System design |
| CONTRIBUTING.md | ✅ | `docs/CONTRIBUTING.md` | Dev guidelines |
| GitHub Actions CI | ✅ | `.github/workflows/ci.yml` | 7-stage pipeline |
| ESLint config | ✅ | `.eslintrc.json` | TypeScript + import order |
| Prettier config | ✅ | `.prettierrc.json` | Tailwind plugin |
| Vitest setup | ✅ | `vitest.config.ts` | jsdom, coverage |
| Playwright setup | ✅ | `playwright.config.ts` | Multi-browser |
| Husky pre-commit | ✅ | `.husky/pre-commit` | lint-staged |
| Sample tests | ✅ | `__tests__/**` | 9 passing tests |

---

## PHASE 1: GAMIFICATION FOUNDATION

### Priority: HIGH | Dependencies: Phase 0 | Duration: ~2 weeks

### Pre-Flight Checklist
- [ ] Run SQL migrations in Supabase dashboard
- [ ] Verify badges table has 30 rows seeded
- [ ] Verify multiplier_configs has 6 rows
- [ ] Test RLS policies manually in Supabase

### 1.1 Database & Backend

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 1.1.1 | Run gamification.sql migration | Supabase Dashboard | Manual | **DO FIRST** |
| 1.1.2 | Create badge service | `lib/services/badgeService.ts` | Unit | Core unlock logic |
| 1.1.3 | Create points service | `lib/services/pointsService.ts` | Unit | Multiplier calc |
| 1.1.4 | Create gamification API types | `lib/types/gamification.ts` | - | TypeScript interfaces |
| 1.1.5 | Create gamification API route | `app/api/gamification/[requestType]/route.ts` | Integration | GET/POST handlers |
| 1.1.6 | Add badge check trigger | `lib/services/badgeService.ts` | Unit | Call after journal save |

#### Badge Service Implementation Notes
```typescript
// Key functions needed:
checkAndAwardBadges(userId, sessionId, activityType)
calculateStreakBadges(streakData)
calculateCompletionBadges(completionData)
calculateSpeedBadges(timestamp, activityType)
calculateMilestoneBadges(milestone)

// Must handle:
- Timezone-aware streak calculation
- Prevent duplicate badge awards
- Queue celebration events
```

#### Points Service Implementation Notes
```typescript
// Key functions needed:
calculatePoints(activity, streak, hasCombo, isEarly)
getActiveMultiplier(streak)
logPointsTransaction(userId, sessionId, activity, points)

// Multiplier tiers:
// 7-13 days: 1.2x
// 14-29 days: 1.5x
// 30+ days: 2.0x
```

### 1.2 Redux Store

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 1.2.1 | Create gamification types | `store/modules/gamification/types.ts` | - | State interfaces |
| 1.2.2 | Create gamification reducers | `store/modules/gamification/reducers.ts` | Unit | Slice definition |
| 1.2.3 | Create gamification actions | `store/modules/gamification/actions.ts` | Unit | Thunks |
| 1.2.4 | Create gamification selectors | `store/modules/gamification/selectors.ts` | Unit | Memoized |
| 1.2.5 | Add to root reducer | `store/reducer.ts` | - | Import & combine |
| 1.2.6 | Add persist config | `store/reducer.ts` | - | Blacklist loading |

### 1.3 UI Components

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 1.3.1 | Create BadgeCard component | `modules/gamification/components/BadgeCard.tsx` | Unit | 3 sizes |
| 1.3.2 | Create BadgeGrid component | `modules/gamification/components/BadgeGrid.tsx` | Unit | Filter by category |
| 1.3.3 | Create PointsDisplay component | `modules/gamification/components/PointsDisplay.tsx` | Unit | Animated counter |
| 1.3.4 | Create StreakDisplay component | `modules/gamification/components/StreakDisplay.tsx` | Unit | Fire animation |
| 1.3.5 | Create MultiplierBadge component | `modules/gamification/components/MultiplierBadge.tsx` | Unit | Shows 1.2x, etc |
| 1.3.6 | Create BadgeUnlockPopup component | `modules/gamification/components/BadgeUnlockPopup.tsx` | Unit | Uses confetti |

### 1.4 Integration

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 1.4.1 | Add real-time badge subscription | `contexts/UseRealtimeData.tsx` | Integration | user_badges channel |
| 1.4.2 | Integrate with journal completion | `modules/journal/hooks/useJournalSubmit.ts` | Integration | Call badge check |
| 1.4.3 | Add badges to progress page | `app/[book]/page.tsx` | E2E | New section |
| 1.4.4 | Add celebration queue consumer | `app/layout.tsx` or provider | E2E | Show popups |

### 1.5 Verification Checklist
- [ ] All 30 badges can be unlocked (test each unlock condition)
- [ ] Multipliers apply correctly at 7, 14, 30 day thresholds
- [ ] Points transactions are logged correctly
- [ ] Real-time updates work when badge is earned
- [ ] Celebration popup shows with confetti
- [ ] Badge grid displays correctly (earned vs locked)
- [ ] Unit test coverage > 80% for services
- [ ] Build passes with no type errors

---

## PHASE 2: AI CHARACTERS (YESI & GARIN)

### Priority: HIGH | Dependencies: Phase 0 | Duration: ~2 weeks

### Pre-Flight Checklist
- [ ] Obtain OpenAI API key (GPT-4o access)
- [ ] Obtain Anthropic API key (Claude 3.5 Sonnet)
- [ ] Add keys to `.env.local`
- [ ] Run ai-characters.sql migration in Supabase

### 2.1 Database & Configuration

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.1.1 | Create AI characters schema | `supabse/schema/ai-characters.sql` | Manual | 4 tables |
| 2.1.2 | Run migration | Supabase Dashboard | Manual | **DO FIRST** |
| 2.1.3 | Seed Yesi character | Supabase Dashboard | Manual | Insert row |
| 2.1.4 | Seed Garin character | Supabase Dashboard | Manual | Insert row |
| 2.1.5 | Create character config | `lib/ai/character-config.ts` | Unit | Personas, prompts |

#### Character Config Notes
```typescript
// Yesi: Nurturing Coach
- Warm, empathetic, intuitive, celebratory
- Focus: emotional support, gratitude deepening, celebration
- Voice: "I see you, and I'm so proud..."

// Garin: Strategic Coach
- Direct, analytical, action-oriented, challenging
- Focus: goal-setting, accountability, consistency
- Voice: "Let's look at the data..."
```

### 2.2 Context Manager

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.2.1 | Create context types | `lib/ai/types.ts` | - | UserContext interface |
| 2.2.2 | Create context builder | `lib/ai/context-manager.ts` | Unit | Fetch user data |
| 2.2.3 | Implement token budgeting | `lib/ai/context-manager.ts` | Unit | Max 4000 tokens |
| 2.2.4 | Add journal context | `lib/ai/context-manager.ts` | Unit | Recent entries |
| 2.2.5 | Add badge context | `lib/ai/context-manager.ts` | Unit | Recent unlocks |
| 2.2.6 | Add streak context | `lib/ai/context-manager.ts` | Unit | Current streaks |
| 2.2.7 | Add mood trend detection | `lib/ai/context-manager.ts` | Unit | Improving/stable/declining |

#### Context Token Budget
```
Total: 4000 tokens
- Recent messages: 1500 (last 10)
- User profile: 500 (name, day, streaks)
- Recent journals: 800 (highlights only)
- Badges: 400 (recent + total)
- Mood trend: 200
- System overhead: 600
```

### 2.3 AI Provider Layer

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.3.1 | Create AI provider interface | `lib/ai/provider.ts` | Unit | Abstract interface |
| 2.3.2 | Implement OpenAI provider | `lib/ai/providers/openai.ts` | Integration | GPT-4o |
| 2.3.3 | Implement Anthropic provider | `lib/ai/providers/anthropic.ts` | Integration | Claude 3.5 |
| 2.3.4 | Implement fallback logic | `lib/ai/provider.ts` | Unit | OpenAI → Anthropic |
| 2.3.5 | Add rate limiting | `lib/ai/rate-limiter.ts` | Unit | 10 req/min/user |

### 2.4 API Routes

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.4.1 | Create chat route | `app/api/ai/chat/route.ts` | Integration | POST handler |
| 2.4.2 | Create streaming route | `app/api/ai/chat-stream/route.ts` | Integration | SSE |
| 2.4.3 | Create context route | `app/api/ai/context/route.ts` | Integration | GET user context |
| 2.4.4 | Create session route | `app/api/ai/session/route.ts` | Integration | Session management |

#### Chat API Flow
```
1. Authenticate user
2. Parse request (message, characterKey)
3. Build user context (context-manager)
4. Select character persona
5. Construct system prompt
6. Call AI provider (with fallback)
7. Stream response
8. Save conversation to DB
9. Update user context
```

### 2.5 UI Components

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.5.1 | Create CharacterAvatar | `modules/ai/components/CharacterAvatar.tsx` | Unit | Animated |
| 2.5.2 | Create ChatMessage | `modules/ai/components/ChatMessage.tsx` | Unit | User/assistant |
| 2.5.3 | Create ChatInput | `modules/ai/components/ChatInput.tsx` | Unit | With suggestions |
| 2.5.4 | Create ChatHistory | `modules/ai/components/ChatHistory.tsx` | Unit | Scrollable |
| 2.5.5 | Create CharacterSelector | `modules/ai/components/CharacterSelector.tsx` | Unit | Switch Yesi/Garin |
| 2.5.6 | Create ChatInterface | `modules/ai/components/ChatInterface.tsx` | Integration | Full chat UI |
| 2.5.7 | Create FloatingChatButton | `modules/ai/components/FloatingChatButton.tsx` | Unit | Bottom-right |

### 2.6 Integration

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 2.6.1 | Add chat button to layout | `app/layout.tsx` | E2E | Always visible |
| 2.6.2 | Add chat to progress page | `app/[book]/page.tsx` | E2E | Contextual |
| 2.6.3 | Integrate with journal context | Throughout | E2E | Pass recent entries |

### 2.7 Verification Checklist
- [ ] Yesi responds with warm, empathetic tone
- [ ] Garin responds with direct, analytical tone
- [ ] Context includes user's recent journals
- [ ] Context includes badge unlocks
- [ ] Streaming works smoothly
- [ ] Fallback to Anthropic works if OpenAI fails
- [ ] Conversations are saved to database
- [ ] Rate limiting prevents abuse
- [ ] Character switching works correctly
- [ ] Mobile UI is responsive

---

## PHASE 3: 100MS VIDEO INTEGRATION

### Priority: MEDIUM | Dependencies: Phase 0 | Duration: ~2 weeks

### Pre-Flight Checklist
- [ ] Create 100ms account at https://dashboard.100ms.live
- [ ] Create a template for video rooms
- [ ] Obtain APP_ID, ACCESS_KEY, SECRET
- [ ] Add keys to `.env.local`
- [ ] Run video-calls.sql migration

### 3.1 Database & Backend

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 3.1.1 | Create video schema | `supabse/schema/video-calls.sql` | Manual | 3 tables |
| 3.1.2 | Run migration | Supabase Dashboard | Manual | **DO FIRST** |
| 3.1.3 | Create 100ms service | `lib/services/100ms.ts` | Integration | SDK wrapper |
| 3.1.4 | Create video types | `lib/types/video.ts` | - | TypeScript interfaces |

#### 100ms Service Functions
```typescript
createRoom(name, templateId, region)
generateAuthToken(roomId, peerId, role, userId)
endRoom(roomId, lock)
getActiveRooms()
getRoomDetails(roomId)
```

### 3.2 API Routes

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 3.2.1 | Create room route | `app/api/video/create-room/route.ts` | Integration | POST |
| 3.2.2 | Create join route | `app/api/video/join-room/route.ts` | Integration | POST, returns token |
| 3.2.3 | Create end route | `app/api/video/end-room/route.ts` | Integration | POST |
| 3.2.4 | Create list route | `app/api/video/rooms/route.ts` | Integration | GET |
| 3.2.5 | Create RSVP route | `app/api/video/rsvp/route.ts` | Integration | POST |

### 3.3 UI Components

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 3.3.1 | Install 100ms SDK | `package.json` | - | @100mslive/react-sdk |
| 3.3.2 | Create VideoRoom | `modules/video/components/VideoRoom.tsx` | Integration | HMSRoomProvider |
| 3.3.3 | Create VideoGrid | `modules/video/components/VideoGrid.tsx` | Unit | Peer tiles |
| 3.3.4 | Create VideoControls | `modules/video/components/VideoControls.tsx` | Unit | Mute/camera/leave |
| 3.3.5 | Create VideoScheduler | `modules/video/components/VideoScheduler.tsx` | Unit | Date/time picker |
| 3.3.6 | Create VideoRoomCard | `modules/video/components/VideoRoomCard.tsx` | Unit | Preview card |
| 3.3.7 | Create JoinCallButton | `modules/video/components/JoinCallButton.tsx` | Unit | Quick join |
| 3.3.8 | Create ParticipantList | `modules/video/components/ParticipantList.tsx` | Unit | Show attendees |

### 3.4 Pages

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 3.4.1 | Create video room page | `app/video/[roomId]/page.tsx` | E2E | Full room view |
| 3.4.2 | Create schedule page | `app/video/schedule/page.tsx` | E2E | Create new calls |
| 3.4.3 | Create calls list page | `app/video/page.tsx` | E2E | Upcoming calls |

### 3.5 Verification Checklist
- [ ] Can create a new video room
- [ ] Can join room with auth token
- [ ] Video and audio work correctly
- [ ] Mute/unmute controls work
- [ ] Camera on/off works
- [ ] Screen share works (if enabled)
- [ ] Can leave room cleanly
- [ ] Can end room as host
- [ ] Room status updates in DB
- [ ] Works on mobile browsers

---

## PHASE 4: COHORT & COMMUNITY

### Priority: MEDIUM | Dependencies: Phases 1-3 | Duration: ~1.5 weeks

### Pre-Flight Checklist
- [ ] Cohort and social schemas already migrated (Phase 0)
- [ ] Verify RLS policies work correctly
- [ ] Plan cohort structure for beta launch

### 4.1 Backend

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 4.1.1 | Create cohort service | `lib/services/cohortService.ts` | Unit | CRUD operations |
| 4.1.2 | Create cohort API | `app/api/cohorts/[requestType]/route.ts` | Integration | All endpoints |
| 4.1.3 | Create activity service | `lib/services/activityService.ts` | Unit | Feed logic |
| 4.1.4 | Create activity API | `app/api/activity/[requestType]/route.ts` | Integration | Feed endpoints |
| 4.1.5 | Create messaging service | `lib/services/messagingService.ts` | Unit | DM logic |

### 4.2 Redux Store

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 4.2.1 | Create cohort module | `store/modules/cohort/` | Unit | Full module |
| 4.2.2 | Create activity module | `store/modules/activity/` | Unit | Feed state |

### 4.3 UI Components

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 4.3.1 | Create CohortSelector | `modules/community/components/CohortSelector.tsx` | Unit | Dropdown |
| 4.3.2 | Create CohortCard | `modules/community/components/CohortCard.tsx` | Unit | Preview |
| 4.3.3 | Create ActivityFeed | `modules/community/components/ActivityFeed.tsx` | Unit | Event list |
| 4.3.4 | Create ActivityItem | `modules/community/components/ActivityItem.tsx` | Unit | Single event |
| 4.3.5 | Create ReactionBar | `modules/community/components/ReactionBar.tsx` | Unit | Emoji reactions |
| 4.3.6 | Create EncouragementButton | `modules/community/components/EncouragementButton.tsx` | Unit | Quick cheers |
| 4.3.7 | Create MemberList | `modules/community/components/MemberList.tsx` | Unit | Cohort members |

### 4.4 Integration

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 4.4.1 | Add cohort filter to leaderboard | `modules/leaderboard/` | Integration | Filter by cohort |
| 4.4.2 | Add real-time activity subscription | `contexts/UseRealtimeData.tsx` | Integration | activity_events |
| 4.4.3 | Add community page | `app/community/page.tsx` | E2E | Feed + members |

### 4.5 Verification Checklist
- [ ] Can create and join cohorts
- [ ] Activity feed shows cohort events
- [ ] Reactions work and update in real-time
- [ ] Encouragements send and receive
- [ ] Leaderboard filters by cohort
- [ ] Member list displays correctly

---

## PHASE 5: SOCIAL SHARING & NOTIFICATIONS

### Priority: MEDIUM | Dependencies: Phase 4 | Duration: ~1.5 weeks

### Pre-Flight Checklist
- [ ] Generate VAPID keys for push notifications
- [ ] Add to `.env.local`
- [ ] Sharing and notifications schemas already migrated

### 5.1 Social Sharing

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 5.1.1 | Create share service | `lib/services/shareService.ts` | Unit | Card generation |
| 5.1.2 | Create share API | `app/api/share/[requestType]/route.ts` | Integration | Endpoints |
| 5.1.3 | Create ShareCardGenerator | `modules/community/components/ShareCardGenerator.tsx` | Unit | Canvas-based |
| 5.1.4 | Create SharePopup | `modules/community/components/SharePopup.tsx` | Unit | Platform selector |
| 5.1.5 | Integrate with Web Share API | `lib/utils/share.ts` | Unit | Native sharing |
| 5.1.6 | Add share button to DGA completion | `modules/journal/components/` | Integration | Post-save |

### 5.2 Push Notifications

| # | Task | File(s) | Tests | Notes |
|---|------|---------|-------|-------|
| 5.2.1 | Create service worker | `public/sw.js` | Manual | Push handler |
| 5.2.2 | Create notification service | `lib/services/notificationService.ts` | Unit | web-push |
| 5.2.3 | Create push API | `app/api/notifications/` | Integration | Send/register |
| 5.2.4 | Create NotificationBell | `modules/notifications/components/NotificationBell.tsx` | Unit | In-app center |
| 5.2.5 | Create NotificationCard | `modules/notifications/components/NotificationCard.tsx` | Unit | Single item |
| 5.2.6 | Create NotificationPreferences | `modules/notifications/components/NotificationPreferences.tsx` | Unit | Settings |
| 5.2.7 | Add to navbar | `modules/layouts/Navbar.tsx` | Integration | Bell icon |

### 5.3 Verification Checklist
- [ ] Share cards generate correctly
- [ ] Web Share API works on mobile
- [ ] Fallback download works on desktop
- [ ] Push notification permission request works
- [ ] Push notifications deliver correctly
- [ ] In-app notification center shows history
- [ ] Notification preferences save correctly
- [ ] Unread count badge displays

---

## PHASE 6: APPLE-LEVEL POLISH

### Priority: HIGH | Dependencies: All previous | Duration: ~1.5 weeks

### 6.1 Animation Refinements

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 6.1.1 | Add button press animations | Components | 100-150ms, cubic-bezier |
| 6.1.2 | Add page transitions | `app/layout.tsx` | 300-500ms |
| 6.1.3 | Add card hover effects | Components | Spring animation |
| 6.1.4 | Add skeleton loaders | Components | 1500ms shimmer |
| 6.1.5 | Add celebration animations | Gamification | Confetti, particle |
| 6.1.6 | Support prefers-reduced-motion | Throughout | CSS media query |

### 6.2 Accessibility

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 6.2.1 | Add aria-labels to icon buttons | Throughout | VoiceOver support |
| 6.2.2 | Fix touch targets (44x44pt min) | Buttons | Apple HIG |
| 6.2.3 | Verify color contrast (4.5:1) | Throughout | WCAG 2.1 |
| 6.2.4 | Add keyboard navigation | Throughout | Tab order |
| 6.2.5 | Add focus indicators | Throughout | Visible focus |

### 6.3 Performance

| # | Task | File(s) | Notes |
|---|------|---------|-------|
| 6.3.1 | Audit bundle size | Build | Target < 200KB |
| 6.3.2 | Add dynamic imports | Heavy components | Code splitting |
| 6.3.3 | Optimize images | Throughout | Next.js Image |
| 6.3.4 | Add loading states | Pages | Skeleton/spinner |
| 6.3.5 | Optimize API calls | Throughout | Dedupe, cache |

### 6.4 Final Testing

| # | Task | Notes |
|---|------|-------|
| 6.4.1 | Full E2E test suite | All flows |
| 6.4.2 | Cross-browser testing | Chrome, Safari, Firefox |
| 6.4.3 | Mobile testing | iOS Safari, Android Chrome |
| 6.4.4 | Performance testing | Lighthouse > 90 |
| 6.4.5 | Accessibility testing | axe-core |

### 6.5 Final Verification Checklist
- [ ] All animations feel smooth and natural
- [ ] All touch targets are 44x44pt minimum
- [ ] Color contrast passes WCAG 2.1
- [ ] VoiceOver reads all elements correctly
- [ ] Keyboard navigation works throughout
- [ ] Lighthouse performance > 90
- [ ] Lighthouse accessibility > 90
- [ ] No console errors in production
- [ ] All E2E tests pass
- [ ] Mobile experience is polished

---

## ENVIRONMENT VARIABLES REFERENCE

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Characters (Phase 2)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# 100ms Video (Phase 3)
NEXT_PUBLIC_100MS_APP_ID=
HMS_ACCESS_KEY=
HMS_SECRET=
HMS_TEMPLATE_ID=

# Push Notifications (Phase 5)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Optional
CODECOV_TOKEN=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

---

## DEPENDENCIES TO INSTALL

```bash
# Phase 2: AI Characters
npm install openai @anthropic-ai/sdk

# Phase 3: Video
npm install @100mslive/react-sdk @100mslive/server-sdk

# Phase 5: Notifications
npm install web-push

# Phase 6: Animations
npm install framer-motion
```

---

## RISK AREAS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI rate limits | AI chat unavailable | Anthropic fallback |
| 100ms service outage | Video calls fail | Show clear error message |
| Large bundle size | Slow load times | Dynamic imports, code splitting |
| RLS policy bugs | Data leaks | Thorough testing in Supabase |
| Mobile Safari quirks | Broken features | Test early and often |
| Push notification blocks | Low engagement | In-app fallback notifications |

---

## QUICK REFERENCE COMMANDS

```bash
# Development
npm run dev                  # Start dev server
npm run build               # Production build
npm run type-check          # TypeScript check
npm run lint                # ESLint
npm run format              # Prettier

# Testing
npm run test                # All tests
npm run test:unit           # Unit tests
npm run test:e2e            # E2E tests
npm run test:coverage       # With coverage

# Database
# Run SQL in Supabase Dashboard > SQL Editor
```

---

## NOTES FOR IMPLEMENTATION

### General Patterns
1. Always create types/interfaces first
2. Write service layer before API routes
3. Write unit tests alongside code
4. Use existing component patterns from `/modules/common/`
5. Follow Redux patterns from existing modules

### AI Character Notes
- Keep system prompts under 1000 tokens
- Always include user name in greeting
- Reference recent journal entries specifically
- Celebrate badge unlocks when relevant

### Video Notes
- Test on actual mobile devices, not just simulators
- Handle network disconnections gracefully
- Provide clear feedback during connection

### Performance Notes
- Lazy load heavy components
- Use React.memo for list items
- Debounce search/filter inputs
- Cache API responses where appropriate

---

**This document is the single source of truth for implementation.**
**Update checkboxes as tasks complete.**
**Add notes when discovering gotchas.**
