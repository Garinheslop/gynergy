# GYNERGY — Architecture & Routing

## Route Architecture

### Public Routes (No Auth Required)

| Route                  | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `/`                    | Main sales landing page (45-Day Awakening Challenge) |
| `/assessment`          | Five Pillar Self-Assessment (23 questions, lead gen) |
| `/webinar`             | Free live training registration page                 |
| `/(marketing)/pricing` | Redirects to `/`                                     |
| `/login`               | Authentication (magic link via Supabase)             |
| `/auth/callback`       | OAuth callback handler                               |
| `/auth/reset-password` | Password reset                                       |
| `/payment/success`     | Post-purchase confirmation + friend codes            |

### Protected Routes (Auth Required)

| Route                            | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `/[bookSlug]`                    | Journal dashboard for a book/program             |
| `/[bookSlug]/journal/[pageType]` | Journal editor or viewer                         |
| `/[bookSlug]/history`            | Past journal entries                             |
| `/[bookSlug]/settings`           | Book-level settings                              |
| `/community`                     | Community hub (feed, members, events, referrals) |
| `/community/member/[id]`         | Member profile page                              |
| `/community/post/[id]`           | Post detail with comments                        |
| `/community/call/[roomId]`       | Live 100ms video call room                       |
| `/library`                       | Content library (video, audio, documents)        |
| `/courses`                       | Course listing + enrollment                      |
| `/courses/[courseId]`            | Course player (lessons, quizzes, progress)       |
| `/courses/[courseId]/edit`       | Course editor (admin)                            |
| `/video/[roomId]`                | Generic video room                               |

### Admin Routes (Admin Role Required)

| Route                 | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `/admin`              | Dashboard (metrics, charts, activity, alerts) |
| `/admin/users`        | User management + CSV export                  |
| `/admin/payments`     | Revenue analytics (MRR, ARR, refunds)         |
| `/admin/gamification` | Badge, points, rewards management             |
| `/admin/community`    | Content moderation queue                      |
| `/admin/content`      | Challenge content management                  |
| `/admin/courses`      | Course administration                         |
| `/admin/analytics`    | Deep engagement analytics                     |
| `/admin/assessment`   | Assessment funnel analytics                   |
| `/admin/webinar`      | Webinar registration/attendance analytics     |
| `/admin/audit`        | System audit logs                             |
| `/admin/system`       | System health + configuration                 |
| `/admin/settings`     | Admin preferences                             |

---

## Middleware (middleware.ts)

**Authentication Flow:**

1. Bypass static files (anything with file extension)
2. Bypass PWA assets (manifest, sw.js, icons)
3. Bypass public routes (/, /login, /auth, /assessment, /webinar, /pricing, /payment/success)
4. For all other routes: Verify Supabase session via `getUser()`
5. No session → redirect to `/login?redirect={path}`
6. Challenge-protected routes (`/date-zero-gratitude/*`, `/video/*`): Verify `user_entitlements.has_challenge_access`
7. Admin routes (`/admin/*`): Verify `user_roles.role = 'admin'`

---

## Provider Architecture

```
RootLayout (app/layout.tsx)
└── <Providers>
    └── <StoreProvider>          (Redux + Persist)
        └── <AppContextProvider>  (Combines 3 React contexts)
            ├── SessionContext     (Supabase auth session)
            ├── PopupContext       (Modal/popup state)
            └── RealtimeDataContext (Real-time subscriptions)
            └── <AnalyticsProvider> (Event tracking)
                └── {children}
                └── <InstallPrompt>  (PWA install banner)
    └── <Navbar />
    └── <DefaultLayout>{children}</DefaultLayout>
    └── <CelebrationRenderer />  (Badge/milestone celebrations)
    └── <OfflineBanner />        (PWA offline indicator)
```

---

## Redux Store Structure

14 persisted slices with selective blacklisting:

| Module           | Key State                                   | Persist Strategy                       |
| ---------------- | ------------------------------------------- | -------------------------------------- |
| **profile**      | current user + stats                        | Blacklist loading/fetching             |
| **enrollment**   | current session, streak data                | Blacklist current, loading             |
| **journal**      | entries, current day state                  | Blacklist current, loading             |
| **gamification** | badges, points, multipliers, celebrations   | Blacklist all loading + operations     |
| **community**    | posts, comments, members, referrals, events | Blacklist all loading + creation flags |
| **payment**      | entitlements, friend codes, subscription    | Blacklist loading, redeem states       |
| **ai**           | characters, chat messages, history          | Blacklist loading, streaming           |
| **video**        | rooms, connection state                     | Blacklist loading, connection          |
| **book**         | book sessions                               | Blacklist loading                      |
| **leaderboard**  | rankings                                    | Blacklist loading                      |
| **history**      | user activity                               | Blacklist loading                      |
| **visions**      | user visions                                | Blacklist loading                      |
| **quote**        | daily quote                                 | Minimal                                |
| **global**       | toasts, UI state                            | Minimal                                |

**Middleware Stack:**

1. Default Redux middleware (serializableCheck disabled)
2. `resetDataMiddleware` — Handles logout/reset state cleanup
3. `apiMiddleware` — Intercepts `apiCallBegan` actions, makes fetch requests, dispatches success/error

---

## API Middleware Pattern

All Redux async operations follow this flow:

```
Component → dispatch(apiCallBegan({
  url: "/api/...",
  method: "GET|POST|PUT|DELETE",
  data: {...},
  onStart: "slice/requestStarted",
  onSuccess: "slice/dataReceived",
  onError: "slice/requestFailed"
}))
→ API Middleware intercepts
→ fetch("/api/...")
→ Success: dispatch(onSuccess(response))
→ Error: dispatch(onError(error)) + toast
```

---

## Path Aliases (tsconfig.json)

| Alias           | Maps To                         |
| --------------- | ------------------------------- |
| `@components/*` | `./modules/common/components/*` |
| `@configs/*`    | `./configs/*`                   |
| `@contexts/*`   | `./contexts/*`                  |
| `@resources/*`  | `./resources/*`                 |
| `@lib/*`        | `./lib/*`                       |
| `@modules/*`    | `./modules/*`                   |
| `@public/*`     | `./public/*`                    |
| `@store/*`      | `./store/*`                     |
| `@styles/*`     | `./styles/*`                    |
| `@tests/*`      | `./__tests__/*`                 |

---

## Security Headers (next.config.js)

All routes include:

- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## PWA Configuration

- Service worker with Workbox caching strategies
- Google Fonts: CacheFirst (1 year)
- Static fonts: StaleWhileRevalidate (1 week)
- Images: StaleWhileRevalidate (24 hours)
- Next.js data: StaleWhileRevalidate (24 hours)
- API calls: NetworkFirst (10s timeout, 24 hour cache)
- Everything else: NetworkFirst (10s timeout)
