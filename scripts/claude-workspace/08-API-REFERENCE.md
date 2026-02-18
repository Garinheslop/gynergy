# GYNERGY — API Reference

## Overview

67+ API endpoints organized by domain. All routes at `/app/api/`. Auth via Supabase session cookies. Admin routes verify `user_roles.role = 'admin'`.

---

## Payments & Subscriptions

| Method | Endpoint                        | Purpose                                                                                                |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| POST   | `/api/payments/create-checkout` | Create Stripe checkout session ($997 challenge, $39.95/mo journal, $399/yr journal)                    |
| POST   | `/api/payments/webhook`         | Stripe webhook handler (checkout.session.completed, invoice.paid/failed, subscription.updated/deleted) |
| GET    | `/api/payments/subscription`    | Fetch subscription details + billing history                                                           |
| DELETE | `/api/payments/subscription`    | Cancel subscription (soft: at period end, hard: immediate)                                             |
| PUT    | `/api/payments/subscription`    | Resume cancelled subscription                                                                          |
| GET    | `/api/payments/entitlements`    | Fetch user access (challenge, journal, community) + friend codes                                       |
| GET    | `/api/payments/friend-code`     | List user's created friend codes                                                                       |
| POST   | `/api/payments/friend-code`     | Redeem a friend code (atomic RPC)                                                                      |
| PUT    | `/api/payments/friend-code`     | Validate code without redeeming (for UI feedback)                                                      |
| DELETE | `/api/payments/friend-code`     | Revoke an unused code                                                                                  |

## Email & Notifications

| Method | Endpoint           | Purpose                                                                                 |
| ------ | ------------------ | --------------------------------------------------------------------------------------- |
| POST   | `/api/email/send`  | Send transactional email (welcome, purchase confirmation, streak reminder, friend code) |
| GET    | `/api/email/track` | Email open/click tracking (pixel + redirect)                                            |

## Community

| Method          | Endpoint                      | Purpose                                                        |
| --------------- | ----------------------------- | -------------------------------------------------------------- |
| GET             | `/api/community/feed`         | Fetch posts (cursor pagination, type filter, visibility rules) |
| POST            | `/api/community/feed`         | Create post (awards 10 points for "win" type)                  |
| PATCH           | `/api/community/feed`         | Edit own post                                                  |
| DELETE          | `/api/community/feed`         | Delete own post                                                |
| GET/POST/DELETE | `/api/community/comments`     | Fetch/create/delete comments (threaded)                        |
| GET/POST/DELETE | `/api/community/reactions`    | Toggle reactions on posts                                      |
| POST            | `/api/community/encourage`    | Send encouragement (rate-limited: 3/day per recipient)         |
| GET             | `/api/community/members`      | List cohort members with stats                                 |
| GET             | `/api/community/members/[id]` | Individual member profile                                      |
| GET/POST        | `/api/community/referrals`    | Manage referral codes                                          |
| GET             | `/api/community/stats`        | Community aggregate stats                                      |
| GET/POST        | `/api/community/events`       | Community events (calls, webinars)                             |
| POST            | `/api/community/media`        | Upload media (max 4 files, 5MB each, JPEG/PNG/GIF/WebP)        |
| POST            | `/api/community/report`       | Report inappropriate content                                   |

## AI Coaching

| Method | Endpoint                      | Purpose                                    |
| ------ | ----------------------------- | ------------------------------------------ |
| GET    | `/api/ai/characters`          | List available AI characters               |
| GET    | `/api/ai/character`           | Get single character details               |
| POST   | `/api/ai/chat`                | Send message, get response (non-streaming) |
| POST   | `/api/ai/chat-stream`         | Streaming chat via Server-Sent Events      |
| GET    | `/api/ai/history`             | Fetch conversation history                 |
| GET    | `/api/ai/user-context`        | Get user's AI profile/memory               |
| GET    | `/api/ai/suggest`             | Get suggested character for user           |
| POST   | `/api/ai/end-session`         | End current chat session                   |
| POST   | `/api/ai/rate-session`        | Rate + feedback on session                 |
| POST   | `/api/ai/export-conversation` | Export as JSON/Markdown/Text               |

## Journaling & Actions

| Method   | Endpoint                         | Purpose                                     |
| -------- | -------------------------------- | ------------------------------------------- |
| GET      | `/api/journals/[requestType]`    | Fetch journal entries (by session, by date) |
| POST     | `/api/journals/[requestType]`    | Create/update journal entry (with images)   |
| GET/POST | `/api/actions/[requestType]`     | Manage daily actions and weekly challenges  |
| PUT      | `/api/actions/[requestType]`     | Reset actions                               |
| GET/POST | `/api/visions/[requestType]`     | User vision board CRUD                      |
| GET/POST | `/api/meditations/[requestType]` | Meditation session logging                  |
| GET/POST | `/api/quotes/[requestType]`      | Daily quote management                      |

## Books & Enrollment

| Method   | Endpoint                               | Purpose                                  |
| -------- | -------------------------------------- | ---------------------------------------- |
| GET      | `/api/books/user-current-book-session` | Get user's current book session          |
| GET      | `/api/books/latest-book-sessions`      | Get latest sessions                      |
| POST     | `/api/books/book-enrollment`           | Enroll user in book session              |
| PUT      | `/api/books/reset-user-book-session`   | Reset session (deletes all related data) |
| GET/POST | `/api/enrollment/[requestType]`        | Enrollment management                    |

## Gamification

| Method | Endpoint                              | Purpose                                             |
| ------ | ------------------------------------- | --------------------------------------------------- |
| GET    | `/api/gamification/all-badges`        | All badge definitions                               |
| GET    | `/api/gamification/user-badges`       | User's earned badges (by session)                   |
| GET    | `/api/gamification/new-badges`        | Unseen badges                                       |
| GET    | `/api/gamification/multipliers`       | Point multiplier configs                            |
| GET    | `/api/gamification/active-multiplier` | User's current multiplier + streak                  |
| GET    | `/api/gamification/points-history`    | Last 50 point transactions                          |
| GET    | `/api/gamification/total-points`      | Sum of all user points                              |
| POST   | `/api/gamification/mark-seen`         | Mark badge as viewed                                |
| POST   | `/api/gamification/toggle-showcase`   | Pin/unpin badge on profile (max 3)                  |
| POST   | `/api/gamification/check-badges`      | Check + award badges after activity                 |
| GET    | `/api/leaderboard/[requestType]`      | Leaderboard rankings (daily/weekly/monthly/session) |

## Content & Courses

| Method          | Endpoint                       | Purpose                             |
| --------------- | ------------------------------ | ----------------------------------- |
| GET/POST/DELETE | `/api/content/[requestType]`   | Content library CRUD                |
| GET             | `/api/content/list-courses`    | Course listings                     |
| GET             | `/api/content/get-course`      | Course details with modules/lessons |
| POST            | `/api/content/create-course`   | Create new course                   |
| POST            | `/api/content/add-module`      | Add module to course                |
| POST            | `/api/content/add-lesson`      | Add lesson to module                |
| POST            | `/api/content/update-progress` | Update content progress             |
| GET/POST        | `/api/courses/quiz`            | Quiz management + submission        |

## Video & Webinar

| Method   | Endpoint                   | Purpose                                                |
| -------- | -------------------------- | ------------------------------------------------------ |
| GET/POST | `/api/video/[requestType]` | Video room management (100ms)                          |
| POST     | `/api/webinar/register`    | Register for webinar (email capture + drip enrollment) |
| POST     | `/api/webinar/join`        | Join live webinar (generate 100ms token)               |
| GET/POST | `/api/webinar/live`        | Live webinar info + stream data                        |
| GET/POST | `/api/webinar/chat`        | Webinar live chat                                      |
| GET/POST | `/api/webinar/qa`          | Webinar Q&A                                            |
| GET      | `/api/webinar/seats`       | Available seat count                                   |

## Assessment

| Method | Endpoint                     | Purpose                                                        |
| ------ | ---------------------------- | -------------------------------------------------------------- |
| POST   | `/api/assessment/submit`     | Submit assessment (V2/V3), send report email, enroll in drip   |
| POST   | `/api/analytics/beacon`      | Analytics beacon (assessment abandonment, errors, conversions) |
| POST   | `/api/landing/email-capture` | Exit intent email capture → landing_leads table                |

## Admin

| Method   | Endpoint                          | Purpose                                                     |
| -------- | --------------------------------- | ----------------------------------------------------------- |
| GET      | `/api/admin/stats`                | Dashboard summary (users, revenue, MRR, ARR, engagement)    |
| GET      | `/api/admin/analytics`            | Deep analytics (DAU, completion funnel, streaks, levels)    |
| GET      | `/api/admin/payments`             | Revenue analytics (daily, weekly, refunds, friend codes)    |
| GET      | `/api/admin/trends`               | User growth + revenue trends                                |
| GET/POST | `/api/admin/users`                | User management (list, filter, grant/revoke access)         |
| GET/POST | `/api/admin/users/[id]`           | Individual user actions (suspend, grant, reset, add points) |
| GET/POST | `/api/admin/gamification`         | Badge/points/rewards management                             |
| GET/POST | `/api/admin/community`            | Moderation queue management                                 |
| GET/POST | `/api/admin/content`              | Challenge content CRUD                                      |
| GET      | `/api/admin/assessment-analytics` | Assessment funnel metrics                                   |
| GET      | `/api/admin/webinar-analytics`    | Webinar registration/attendance analytics                   |
| GET/POST | `/api/admin/audit-logs`           | Audit trail (filterable by action, category, date)          |
| GET      | `/api/admin/activity`             | Recent platform activity feed                               |
| GET      | `/api/admin/alerts`               | System alerts (revenue drops, churn, moderation)            |
| GET      | `/api/admin/system`               | System health check                                         |
| GET/POST | `/api/admin/settings`             | Admin preferences                                           |
| GET      | `/api/admin/insights`             | AI-generated platform insights                              |
| POST     | `/api/admin/aria/stream`          | Admin AI assistant (streaming)                              |
| GET/POST | `/api/admin/setup-admins`         | One-time admin role setup                                   |

## Cron & Automation

| Method | Endpoint                         | Purpose                                    |
| ------ | -------------------------------- | ------------------------------------------ |
| GET    | `/api/cron/webinar-reminders`    | Send scheduled webinar reminders (hourly)  |
| GET    | `/api/cron/email-drips`          | Process drip campaign queue (every 15 min) |
| GET    | `/api/cron/automation-processor` | Run automation rules engine (every 5 min)  |

## Utility

| Method          | Endpoint                     | Purpose                                 |
| --------------- | ---------------------------- | --------------------------------------- |
| POST            | `/api/auth`                  | Send OTP for passwordless login         |
| GET             | `/api/health`                | System health check                     |
| POST            | `/api/ocr`                   | Optical character recognition           |
| POST            | `/api/upload`                | Generic file upload to Supabase Storage |
| GET/POST        | `/api/user/profile`          | User profile management                 |
| GET/POST/DELETE | `/api/users/[requestType]`   | General user operations                 |
| GET/POST        | `/api/history/[requestType]` | User activity history                   |
| GET             | `/api/development`           | Development utilities                   |
