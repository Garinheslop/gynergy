# GYNERGY — Utilities, Custom Hooks, Testing & PWA

## Shared Utilities (`lib/utils/`)

### API Response (`api-response.ts`)

Standardized error codes and response helpers used by all API routes:

- **Error codes:** INVALID_REQUEST, VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, INTERNAL_ERROR, SERVICE_UNAVAILABLE, DATABASE_ERROR, EXTERNAL_SERVICE_ERROR
- **Helpers:** `apiError()`, `apiSuccess()`, `withErrorHandling()`

### Rate Limiting (`rate-limit.ts`)

- Upstash Redis + Ratelimit (token bucket algorithm)
- Applied to AI chat, community posts, encouragements

### Validation (`validate.ts`)

- Email, URL, phone validators
- Custom validation rules for forms

### Sanitization (`sanitize.ts`)

- DOMPurify integration for HTML input sanitization
- Applied to community posts, comments, journal entries

### Caching (`cache.ts`)

- Client-side cache with configurable TTL
- Server-side caching patterns for expensive queries

### Retry Logic (`retry.ts`)

- Exponential backoff implementation
- Configurable retry counts for API calls and webhooks

### Image Processing

- `ImageCompressor.ts` — Browser-based image compression
- `imageCrop.ts` — Image cropping utilities
- `image.ts` — Image helper functions

### Feature Flags (`featureFlags.ts`)

Comprehensive feature flag system:

- Percentage rollouts (0-100%)
- User targeting with operators (equals, contains, startsWith, regex, before/after)
- A/B testing variants with weights
- User overrides for testing
- Persistent localStorage storage
- Common keys: DARK_MODE, NEW_NAVIGATION, BETA_FEATURES, AI_CHAT, VIDEO_CALLS, GAMIFICATION, DEBUG_MODE

### Date & Calendar

- `date.ts` — date-fns + dayjs integration, streak calculations
- `calendar.ts` — Calendar operations, ICS generation, Google Cal links

### Other Utilities

| File            | Purpose                                             |
| --------------- | --------------------------------------------------- |
| `analytics.ts`  | Event tracking, user interaction logging            |
| `export.ts`     | CSV/PDF export functionality                        |
| `ocr.ts`        | OpenAI Vision API for journal image text extraction |
| `number.ts`     | Number formatting                                   |
| `search.ts`     | Full-text search helpers                            |
| `style.ts`      | CSS/Tailwind utility functions                      |
| `haptic.ts`     | Mobile haptic feedback                              |
| `apiHandler.ts` | API request wrapper                                 |

---

## Custom Hooks (`lib/hooks/`)

### Core State Hooks

| Hook                | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `useAsync`          | Generic async operation state (loading/error/data) |
| `useForm`           | Form state management with validation              |
| `useFormValidation` | Standalone validation logic                        |
| `useDebounce`       | Debounced value updates                            |
| `useLocalStorage`   | Persistent state in localStorage                   |
| `useUrlState`       | State synced to URL query params                   |
| `usePersistence`    | Generic persistence layer                          |

### UI/UX Hooks

| Hook                   | Purpose                                |
| ---------------------- | -------------------------------------- |
| `useAnimation`         | requestAnimationFrame management       |
| `useMediaQuery`        | Responsive design breakpoint detection |
| `useKeyboard`          | Keyboard event handling                |
| `useKeyboardShortcuts` | Global keyboard shortcut registration  |
| `useFocusTrap`         | Modal/dialog focus containment         |
| `useClipboard`         | Clipboard read/write operations        |

### Domain-Specific Hooks

| Hook                       | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `useNetworkStatus`         | Online/offline detection for PWA                   |
| `usePerformance`           | Performance metric collection                      |
| `useOfflineQueuePersisted` | Queue API calls while offline, replay on reconnect |
| `useJournalAutoSave`       | Auto-save journal entries (debounced)              |
| `useBadgeNotifications`    | Badge unlock celebration triggers                  |
| `useCommunityCallState`    | Video call room state management                   |

---

## Testing Infrastructure

### Unit Testing — Vitest

**Config:** `vitest.config.ts`

- **Environment:** jsdom
- **Setup:** `__tests__/setup.tsx`
- **Timeout:** 10s (tests), 10s (hooks)
- **Path aliases:** Match app structure (@/, @components, @modules, etc.)

**Coverage Targets (Current):**
| Metric | Target |
|--------|--------|
| Statements | 40% |
| Branches | 35% |
| Functions | 40% |
| Lines | 40% |

_(Target will increase to 80% as tests are added)_

**Test Setup Mocks (`__tests__/setup.tsx`):**

- Browser APIs: ResizeObserver, IntersectionObserver, matchMedia
- Next.js: useRouter, usePathname, useSearchParams, useParams, next/image
- Testing Library: React Testing Library + jest-axe (accessibility)
- Factory system with ID counter reset per test
- Supabase mock store reset per test

### E2E Testing — Playwright

**Config:** `playwright.config.ts`

- **Test directory:** `__tests__/e2e/`
- **CI mode:** 1 worker, 2 retries
- **Dev mode:** Parallel workers, 0 retries
- **Screenshots:** On failure only
- **Videos:** On first retry
- **Reports:** HTML (`playwright-report/`)

**Browsers Tested:**
| Browser | Type |
|---------|------|
| Chrome | Desktop |
| Firefox | Desktop |
| Safari | Desktop |
| Pixel 5 | Mobile |
| iPhone 12 | Mobile |

**Test Files:**

- `authenticated-audit.spec.ts` — Admin audit flows
- `login-flow.spec.ts` — Login flow
- `public-pages.spec.ts` — Public page accessibility
- `pwa.spec.ts` — PWA installation and features

**Auto-starts** `npm run dev` at `http://localhost:3000` for tests.

---

## PWA (Progressive Web App)

### Manifest (`public/manifest.json`)

- **Name:** "Gynergy - 45 Day Transformation"
- **Display:** standalone (full-screen app experience)
- **Theme:** Indigo (#6366f1)
- **Categories:** lifestyle, health, productivity
- **Icons:** 72x72 through 512x512 with maskable support

### App Shortcuts (Home Screen)

| Shortcut        | URL                |
| --------------- | ------------------ |
| Morning Journal | `/journal/morning` |
| Evening Journal | `/journal/evening` |
| Chat with Yesi  | `/chat/yesi`       |

### Service Worker (`public/sw.js`)

Workbox-powered with these caching strategies:

| Resource                               | Strategy             | TTL         |
| -------------------------------------- | -------------------- | ----------- |
| Google Fonts                           | CacheFirst           | 1 year      |
| Static assets (fonts, images, JS, CSS) | StaleWhileRevalidate | 24h         |
| Next.js images                         | StaleWhileRevalidate | 24h         |
| API routes                             | NetworkFirst         | 10s timeout |
| All other requests                     | NetworkFirst         | 10s timeout |

### Offline Capabilities

- **Offline queue:** `useOfflineQueuePersisted` hook queues API calls while offline
- **Storage:** `localStorage` key `gynergy_offline_queue`
- **Replay:** Automatically replays queued operations on reconnect
- **Max retries:** Configurable (default 3)
- **Network monitoring:** `useNetworkStatus` hook + `OfflineIndicator` component

### PWA Config (`next.config.js`)

- Disabled in dev (no service worker noise)
- Enabled in production (full manifest + SW registration)
- Skip waiting: Immediately activates new service worker
- Clients claim: Takes control of all pages immediately

---

## State Management (Redux Toolkit)

### Persistence Strategy

- **Storage:** localStorage via redux-persist with SSR-safe wrapper
- **Migration system:** Version-based (currently v1)

### Persisted Slices (survive page refresh)

| Slice        | Blacklisted Fields                     |
| ------------ | -------------------------------------- |
| books        | loading, lastFetched                   |
| enrollments  | current, loading, lastFetched          |
| journals     | current, loading, lastFetched          |
| leaderboard  | current, loading, lastFetched          |
| visions      | fetched, loading                       |
| histories    | lastFetched, current, fetched, loading |
| gamification | loading flags, operations              |
| ai           | loading, streaming flags               |

### Non-Persisted Slices (reset on page refresh)

books, journals, visions, leaderboards, enrollments, actions, quotes, meditations, histories, gamification, cohort, notifications, payment

### Middleware

- Redux Toolkit defaults (serializableCheck disabled for dates)
- `resetDataMiddleware` for data reset operations
- Custom `api` middleware

---

## Known Issues & Tech Debt

| Issue                  | Location                                      | Impact                                           |
| ---------------------- | --------------------------------------------- | ------------------------------------------------ |
| Input accessibility    | `modules/common/components/Input`             | Label not properly associated with input element |
| ESLint errors ignored  | `next.config.js` (`ignoreDuringBuilds: true`) | Pre-existing lint errors bypass build            |
| iOS Safari PWA         | Untested                                      | Unknown PWA behavior on iOS                      |
| Android Chrome PWA     | Untested                                      | Unknown PWA behavior on Android                  |
| Lighthouse PWA audit   | Not run                                       | Target >90 score                                 |
| 10+ participant calls  | Untested                                      | Unknown 100ms behavior at scale                  |
| Mobile browser testing | Incomplete                                    | Safari/Chrome mobile edge cases                  |
