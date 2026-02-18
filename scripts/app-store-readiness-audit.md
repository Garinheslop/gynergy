# Gynergy App Store Readiness Audit

> **Date**: 2026-02-17
> **Auditor**: Claude (Strategy Session with Garin)
> **Scope**: Full codebase audit for Apple App Store + Google Play Store readiness
> **Current State**: Next.js 14 PWA deployed on Vercel (web only)

---

## Executive Summary

Gynergy has a **production-quality PWA** with excellent fundamentals (manifest, service worker, icons, caching, offline indicators, install prompt). However, getting into the App Stores requires more than wrapping the web app — especially for Apple.

**The recommended approach:**

| Platform            | Method                                    | Effort | Timeline  |
| ------------------- | ----------------------------------------- | ------ | --------- |
| **Google Play**     | TWA (Trusted Web Activity) via Bubblewrap | Low    | 1-2 weeks |
| **Apple App Store** | Capacitor wrapper + native features       | Medium | 4-8 weeks |

**The biggest win:** Thanks to the May 2025 Epic v. Apple ruling, **US apps can link to external web checkout with zero Apple commission**. Gynergy can keep its existing Stripe payments and avoid the 30% Apple tax entirely for US users.

---

## Part 1: What's Already in Great Shape

### PWA Foundation (Score: 9/10)

| Component         | Status   | Details                                                    |
| ----------------- | -------- | ---------------------------------------------------------- |
| Web App Manifest  | Complete | Name, icons, shortcuts, screenshots, categories            |
| Service Worker    | Complete | next-pwa v5.6.0, Workbox 6.5.4, comprehensive caching      |
| App Icons         | Complete | 8 sizes (72-512px), all maskable, shortcut icons           |
| Meta Tags         | Complete | Viewport, theme-color, apple-web-app-capable, OG tags      |
| Install Prompt    | Complete | iOS instructions + Android native prompt, 7-day dismiss    |
| Offline Indicator | Complete | OfflineBanner, SyncStatusIndicator, ConnectionQuality      |
| E2E PWA Tests     | Complete | Manifest, SW, icons, responsive viewport, cache validation |

### Authentication (Score: 8/10)

| Component          | Status   | Details                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| Route Protection   | Complete | Middleware-based, public/protected/challenge/admin tiers |
| Login Methods      | Complete | Google OAuth, email/password, email OTP                  |
| Session Management | Complete | Cookie-based, auto-refresh, Supabase SSR                 |
| Admin RBAC         | Complete | Role-based admin access in middleware                    |
| Security Headers   | Partial  | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

### Payment System (Score: 8/10)

| Component         | Status   | Details                                                       |
| ----------------- | -------- | ------------------------------------------------------------- |
| Stripe Checkout   | Complete | Hosted checkout (redirect), not embedded Elements             |
| Webhook Handler   | Complete | Event deduplication, dead letter queue, error handling        |
| Subscription Mgmt | Complete | Cancel, resume, billing history, invoice PDFs                 |
| Entitlements      | Complete | Auto-updated via DB triggers, challenge + journal + community |
| Friend Codes      | Complete | Auto-generated (2 per purchase), 90-day expiry, redeemable    |
| Upsell Flow       | Complete | Post-challenge upsell to annual journal ($399/yr)             |

### UI/UX (Score: 7.8/10)

| Component         | Status    | Details                                                        |
| ----------------- | --------- | -------------------------------------------------------------- |
| Responsive Design | Good      | Tailwind CSS 4.x, custom theme with 150+ CSS variables         |
| Mobile Navigation | Good      | Bottom drawer (app-like), hamburger trigger                    |
| Loading States    | Excellent | Branded loading, skeleton screens, 11 admin loading pages      |
| Error Handling    | Good      | Global + admin error boundaries, 404 page                      |
| Accessibility     | Good      | ARIA attributes, focus rings, keyboard nav, 44px touch targets |
| Safe Area Insets  | Present   | iPhone notch handling in navbar + community                    |

---

## Part 2: Critical Gaps (Must Fix Before Submission)

### P0 — App Store Blockers

These will cause **immediate rejection** if not addressed:

#### 1. Privacy Policy Page — MISSING

**Apple Guideline 5.1.1**: Apps must have a publicly accessible privacy policy.

- No `/privacy` route exists
- No `/terms` route exists
- Required by both Apple AND Google
- Must disclose: Supabase auth data, AI chat data (Anthropic), journal entries, community posts, Stripe payment data, 100ms video data

**Action**: Create `/privacy` and `/terms` pages with full data disclosure.

#### 2. AI Data Disclosure — MISSING

**Apple Guidelines (Nov 2025 update)**: Apps using third-party AI models that receive personal data must:

- Explicitly name the AI provider (Anthropic/Claude)
- Get explicit user consent before sending data to AI
- Explain what data is shared and how it's used

**Action**: Add AI consent flow before first chat with Yesi (the AI coach).

#### 3. Community Moderation Tools — INCOMPLETE

**Apple Guideline 1.2**: Apps with user-generated content MUST include:

- "Report" button on all user content
- "Block" button for other users
- Content removal mechanism
- Community guidelines visible in-app

**Action**: Verify Report/Block exist on all community content types (posts, comments, profiles).

#### 4. Content Security Policy — MISSING

No CSP headers configured anywhere. Required for security review.

**Action**: Add CSP to `next.config.js` headers.

#### 5. Apple's Age Rating Questionnaire

New age rating system took effect July 2025. Questionnaire deadline was January 31, 2026.

**Action**: Complete ASAP if not already done. Gynergy will likely rate **13+** (wellness content, AI chatbot, UGC).

---

### P1 — High Priority (Fix Before Launch)

#### 6. `userScalable: false` in Viewport

**File**: `app/layout.tsx:19`

Apple's Human Interface Guidelines require users to be able to zoom. This can cause rejection.

**Action**: Change to `userScalable: true` or remove the property entirely.

#### 7. Dev Test User Hardcoded in Client Code

**File**: `lib/supabase-client.ts` (lines 5-24)

A development test user is defined in the client-side Supabase file. Security risk.

**Action**: Remove before any production/store deployment.

#### 8. Rate Limiting Not Integrated

Rate limiting infrastructure exists (`lib/rate-limit.ts`) with Redis support, but it's NOT wired into auth routes (login, signup, password reset).

**Action**: Integrate `checkStrictRateLimit()` into auth endpoints.

#### 9. Refund Webhook Not Handled

Stripe `charge.refunded` events are not processed. Refunds via Stripe dashboard won't automatically revoke access.

**Action**: Add `charge.refunded` handler to webhook route that revokes entitlements.

#### 10. No Apple Sign-In

**Apple Guideline 4.8**: If you offer third-party login (Google), you MUST also offer Sign in with Apple.

**Action**: Add Apple OAuth provider to Supabase + login page.

---

### P2 — Important (Should Have for Launch)

| #   | Gap                             | Details                                        | Action                                          |
| --- | ------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| 11  | No CSRF protection              | Email auth forms lack CSRF tokens              | Add CSRF token generation                       |
| 12  | Image optimization disabled     | `unoptimized={true}` in custom Image component | Enable Next.js image optimization               |
| 13  | No route-level error boundaries | Only global + admin error.tsx                  | Add error.tsx to /community, /courses, /webinar |
| 14  | No session timeout              | No inactivity-based session expiry             | Add 30-min inactivity timeout                   |
| 15  | Missing iOS splash screens      | No apple-launch-image assets                   | Generate via PWA asset generators               |
| 16  | ESLint disabled in builds       | `eslint: { ignoreDuringBuilds: true }`         | Fix lint errors, re-enable                      |
| 17  | No bottom tab navigation        | Mobile uses drawer, not iOS-standard tabs      | Consider adding for app-like feel               |

---

## Part 3: App Store Submission Strategy

### Payment Strategy (Critical — Saves Thousands)

**DO NOT implement Apple IAP or Google Play Billing as primary payment.**

Thanks to the May 2025 Epic v. Apple ruling:

| Market            | Apple (iOS)                                                                      | Google (Android)                                                               |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **US**            | Use StoreKit External Purchase Link → your Stripe checkout. **Zero commission.** | Use Stripe directly. Google not currently assessing fees on alt billing in US. |
| **International** | May need IAP option (30% cut). Price 30% higher via IAP.                         | Google Play Billing generally required outside US.                             |

**Recommended approach**: Keep Stripe as single source of truth. Add StoreKit External Purchase Link entitlement for iOS. Direct all payment through your existing web checkout.

### Technical Approach

#### Google Play — TWA (1-2 Weeks)

1. Verify Lighthouse PWA score ≥80
2. Publish `/.well-known/assetlinks.json` on gynergy.app
3. Generate TWA package with Bubblewrap CLI
4. Sign AAB with release keystore
5. Upload to Google Play Console
6. Complete store listing + Data Safety form

**No code changes needed.** Your existing PWA is the app.

#### Apple App Store — Capacitor (4-8 Weeks)

Apple **will reject** a simple WebView wrapper (Guideline 4.2 — Minimum Functionality). You need real native features.

**Required native integrations:**

| Feature                | Capacitor Plugin                      | Why Required                          |
| ---------------------- | ------------------------------------- | ------------------------------------- |
| Push Notifications     | @capacitor/push-notifications (APNs)  | Apple rejects web-only push           |
| Sign in with Apple     | @capacitor/sign-in-with-apple         | Required when offering Google OAuth   |
| Biometric Auth         | @nicklason/capacitor-native-biometric | Face ID/Touch ID for returning users  |
| Offline Support        | Already have SW + indicators          | Must not show blank screen offline    |
| StoreKit External Link | capacitor-storekit-external-link      | Zero-commission web checkout redirect |

**Build process:**

1. Install Capacitor, configure for static export
2. Add native plugins (push, biometrics, Apple Sign-In)
3. Set up Xcode project with proper capabilities
4. Integrate APNs for push notifications (replace web push)
5. Add StoreKit External Purchase Link entitlement
6. TestFlight beta testing
7. Submit for review

**Important**: Your Next.js API routes stay on Vercel. Capacitor only wraps the client-side code. The app loads from the server like a hybrid.

---

## Part 4: Legal & Compliance Checklist

### Required Before Either Store Submission

- [ ] **Privacy Policy** page at `/privacy` (publicly accessible URL)
- [ ] **Terms of Service** page at `/terms`
- [ ] **AI Data Disclosure** — name Anthropic, get consent before first AI chat
- [ ] **Community Guidelines** — visible in-app
- [ ] **Report/Block** buttons on all UGC (posts, comments, profiles)
- [ ] **Subscription Terms** — clear auto-renewal disclosure, easy cancellation

### Apple-Specific

- [ ] **App Privacy Labels** — complete in App Store Connect
- [ ] **Age Rating Questionnaire** — complete (wellness, AI, UGC = likely 13+)
- [ ] **Sign in with Apple** — required alongside Google OAuth
- [ ] **Apple Developer Account** ($99/year) — enroll now if not done
- [ ] **StoreKit External Purchase Link Entitlement (US)**

### Google-Specific

- [ ] **Data Safety Form** — complete in Google Play Console
- [ ] **Google Play Developer Account** ($25 one-time) — enroll now
- [ ] **Alternative Billing Enrollment** — deadline was Jan 28, 2026
- [ ] **Digital Asset Links** — `/.well-known/assetlinks.json`

### US State Laws (2026)

- [ ] **Texas App Store Accountability Act** — effective Jan 1, 2026
- [ ] **Utah** — effective May 2026
- [ ] **Louisiana** — effective July 2026
- [ ] These require age-appropriate experiences and parental approval mechanisms

---

## Part 5: Recommended Timeline

### Phase 1: Legal & Compliance (Week 1-2)

- Create `/privacy` and `/terms` pages
- Add AI consent flow
- Verify community moderation tools (Report/Block)
- Fix `userScalable: false`
- Remove dev test user from client code
- Enroll in Apple Developer Program + Google Play Console

### Phase 2: Google Play Launch (Week 2-3)

- Run Lighthouse audit, fix any PWA score issues
- Set up Digital Asset Links
- Generate TWA with Bubblewrap
- Complete Google Play listing + Data Safety form
- Submit for review → **Live in ~3 days**

### Phase 3: iOS Preparation (Week 3-6)

- Install Capacitor, configure static export
- Implement native push notifications (APNs)
- Add Sign in with Apple
- Add biometric authentication
- Apply for StoreKit External Purchase Link entitlement
- Build and test via TestFlight

### Phase 4: Apple Submission (Week 6-8)

- Complete App Privacy Labels
- Complete age rating questionnaire
- Prepare screenshots for all device sizes
- Submit for review
- Budget 1-2 rejection cycles (health/wellness apps get extra scrutiny)

---

## Part 6: Cost Analysis

| Item                                             | Cost       | Frequency              |
| ------------------------------------------------ | ---------- | ---------------------- |
| Apple Developer Account                          | $99        | Annual                 |
| Google Play Developer Account                    | $25        | One-time               |
| Capacitor (open source)                          | $0         | -                      |
| Bubblewrap (open source)                         | $0         | -                      |
| Apple IAP Commission (US)                        | **$0**     | External purchase link |
| Google Billing Commission (US)                   | **$0**     | Alternative billing    |
| Apple IAP Commission (International)             | 15-30%     | Per transaction        |
| Development effort (Capacitor + native features) | 80-120 hrs | One-time               |

**Total upfront: ~$124 + development time**
**Ongoing savings vs IAP: ~$0 commission on US transactions** (vs 30% otherwise)

---

## Appendix: Current Codebase File Map

### Payment Files

- `app/api/payments/create-checkout/route.ts` — Stripe checkout session creation
- `app/api/payments/webhook/route.ts` — Webhook handler (6 event types)
- `app/api/payments/subscription/route.ts` — Cancel/resume/billing history
- `app/api/payments/entitlements/route.ts` — User access retrieval
- `app/api/payments/friend-code/route.ts` — Friend code CRUD
- `lib/stripe.ts` — Stripe client + helper functions

### PWA Files

- `public/manifest.json` — Web app manifest
- `public/sw.js` — Service worker (generated by next-pwa)
- `public/icons/` — 8 maskable icons + 3 shortcut icons
- `modules/pwa/InstallPrompt.tsx` — Install prompt (iOS + Android)
- `modules/common/components/OfflineIndicator.tsx` — Offline UI

### Auth Files

- `middleware.ts` — Route protection (public/protected/challenge/admin)
- `lib/supabase-server.ts` — Server-side Supabase client
- `lib/supabase-client.ts` — Browser Supabase client
- `app/login/LoginClient.tsx` — Login UI (Google + email)
- `contexts/UseSession.tsx` — Session context + lifecycle

### Security Files

- `lib/rate-limit.ts` — Rate limiting (defined, not integrated)
- `lib/utils/sanitize.ts` — Input sanitization
- `lib/utils/apiHandler.ts` — API wrapper with auth + error handling

---

**Bottom Line**: Gynergy is 70% ready for app stores. The PWA foundation is solid. The main work is legal compliance (privacy/terms), Apple-specific requirements (Sign in with Apple, native features via Capacitor), and payment strategy (external purchase links to avoid the 30% tax). Google Play can happen in 1-2 weeks. Apple in 4-8 weeks.
