# Gynergy Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router)                                        │
│  ├── Pages & Layouts                                            │
│  ├── React Components (modules/)                                │
│  ├── Redux Store (store/)                                       │
│  └── Contexts (contexts/)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (app/api/)                                  │
│  ├── /api/journals/* - Journal CRUD                             │
│  ├── /api/gamification/* - Badges, points                       │
│  ├── /api/ai/* - Character chat                                 │
│  ├── /api/video/* - 100ms integration                          │
│  └── /api/cohorts/* - Cohort management                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  lib/services/                                                  │
│  ├── badgeService.ts - Badge unlock logic                       │
│  ├── pointsService.ts - Points calculation                      │
│  ├── 100ms.ts - Video room management                          │
│  └── aiProvider.ts - OpenAI/Anthropic integration              │
│                                                                 │
│  lib/ai/                                                        │
│  ├── character-config.ts - Yesi & Garin personas               │
│  └── context-manager.ts - User context for AI                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                          │
│  ├── users, user_profiles                                       │
│  ├── books, book_sessions, session_enrollments                  │
│  ├── journals, journal_entries, action_logs                     │
│  ├── badges, user_badges, points_transactions                   │
│  ├── cohorts, cohort_memberships                               │
│  ├── ai_characters, ai_conversations, ai_user_context          │
│  ├── video_rooms, video_room_participants                      │
│  └── activity_events, notifications                            │
│                                                                 │
│  Supabase Realtime (WebSocket)                                  │
│  └── Live updates for badges, activities, messages             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  ├── OpenAI GPT-4o (primary AI)                                │
│  ├── Anthropic Claude (fallback AI)                            │
│  ├── 100ms (video calls)                                       │
│  ├── Supabase Storage (images)                                 │
│  └── Web Push API (notifications)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
gynergy/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── ai/              # AI chat endpoints
│   │   ├── gamification/    # Badge & points endpoints
│   │   ├── journals/        # Journal CRUD
│   │   ├── video/           # 100ms integration
│   │   └── ...
│   ├── (auth)/              # Auth pages
│   └── [book]/              # Dynamic book routes
│
├── contexts/                 # React contexts
│   ├── UsePopup.tsx         # Popup/celebration queue
│   ├── UseRealtimeData.tsx  # Supabase realtime
│   └── ...
│
├── lib/                      # Core libraries
│   ├── ai/                  # AI character system
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
│
├── modules/                  # Feature modules
│   ├── ai/                  # AI chat components
│   ├── common/              # Shared components
│   ├── gamification/        # Badge/points UI
│   ├── journal/             # Journaling components
│   ├── leaderboard/         # Leaderboard
│   ├── notifications/       # Notification center
│   └── video/               # Video call components
│
├── store/                    # Redux store
│   ├── modules/             # Feature reducers
│   ├── configureStore.ts    # Store configuration
│   └── reducer.ts           # Root reducer
│
├── styles/                   # Global styles
├── supabse/                  # Database schemas
│   └── schema/              # SQL migration files
│
├── docs/                     # Documentation
├── __tests__/               # Test files
└── .github/                 # GitHub workflows
```

## Data Flow

### Journal Entry Flow
```
User Input → JournalForm → Redux Action → API Route → Supabase
                                              │
                                              ▼
                                      Badge Check Service
                                              │
                                              ▼
                                      Points Calculation
                                              │
                                              ▼
                                      Realtime Broadcast
                                              │
                                              ▼
                               Celebration Queue (if badge earned)
```

### AI Chat Flow
```
User Message → CharacterChat → API Route → Context Manager
                                               │
                                               ▼
                                    Build User Context
                                    (journals, badges, streaks)
                                               │
                                               ▼
                                    Select Character Persona
                                               │
                                               ▼
                                    Call AI Provider
                                    (OpenAI → Anthropic fallback)
                                               │
                                               ▼
                                    Stream Response to UI
                                               │
                                               ▼
                                    Save to ai_conversations
```

### Video Call Flow
```
Schedule Call → API Route → 100ms Create Room → Store in DB
                                                    │
                                                    ▼
Join Call → API Route → 100ms Auth Token → HMSRoomProvider
                                               │
                                               ▼
                                    Video Grid + Controls
                                               │
                                               ▼
Leave/End → Update participant records → Realtime broadcast
```

## Authentication Flow

```
1. User visits protected route
2. Middleware checks Supabase session
3. If no session → Redirect to /login
4. If session → Check session_enrollments for active enrollment
5. If no enrollment → Redirect to enrollment flow
6. If enrolled → Allow access to route
```

## State Management

### Redux Store Structure
```typescript
{
  global: { ... },           // App-wide state
  books: { ... },            // Book data
  enrollments: { ... },      // User enrollments
  journals: { ... },         // Journal entries
  visions: { ... },          // Vision boards
  leaderboard: { ... },      // Leaderboard data
  gamification: {            // NEW
    badges: { all, unlocked, loading },
    multipliers: { current, loading },
    pendingCelebrations: []
  },
  cohort: {                  // NEW
    current, list, members, loading
  },
  notifications: {           // NEW
    preferences, items, unreadCount
  }
}
```

### Persistence Strategy
- Root state: Redux Persist with localStorage
- Individual modules: Separate persist configs with blacklists
- Migration system: Versioned with `createMigrate`

## Security

### Row Level Security (RLS)
All Supabase tables have RLS enabled:
- Users can only access their own data
- Cohort members can view shared cohort data
- Public badges readable by all

### API Security
- All API routes verify Supabase auth
- Rate limiting on AI endpoints
- Input validation with Zod schemas

## Performance Considerations

### Caching
- Redux persist for offline-capable state
- Supabase query caching
- AI context caching (5-minute TTL)

### Optimization
- Dynamic imports for heavy components
- Image optimization via Next.js
- Incremental static regeneration for public pages

## Monitoring & Observability

### Recommended Setup
- Error tracking: Sentry
- Performance: Vercel Analytics
- Logs: Vercel Logs
- Uptime: Supabase Health Checks
