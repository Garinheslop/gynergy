# GYNERGY — Feature Deep Dive

## 1. Journaling System (Core Product)

### Daily Practice

- **Morning Journal** (5-7 min): Mood score, captured essence, mantra, 3 affirmations, 3 gratitudes, 3 excitements
- **Evening Journal** (5 min): Mood score, insight + impact rating, success of the day, changes for tomorrow, dream magic, freeflow
- **Weekly Reflection**: Wins, challenges, lessons learned
- **Daily Gratitude Action (DGA)**: Note, reflection, obstacles, gratitude list, optional drawing/upload

### Vision System

4 vision types per user per session:

- **Highest Self** — Name, abilities, purpose, traits, symbols
- **Mantra** — Personal mantra creation
- **Creed** — Personal code/creed
- **Discovery** — Extended reflection with qualities, achievements, importance

### Life Journey Mapping

16 life areas with structured fields (situation, vision, why, strategy):

- Romantic, Family, Quality of Life, Spiritual, Health/Fitness, Personal Development, Career/Calling, Financial

### Points for Journaling

- Morning: 10 pts, Evening: 10 pts, Weekly: 25 pts, DGA: 15 pts, Vision: 20 pts
- Multiplied by streak multiplier (1.0x base → 2.0x at 30+ days)

---

## 2. Gamification System

### Badges (35+ Pre-loaded)

**Categories:** Consistency, Completion, Speed, Social, Milestone, Special
**Rarities:** Common, Uncommon, Rare, Epic, Legendary

**Badge Unlock Conditions (11 types):**

- **Streak** — X consecutive days of activity (morning, evening, gratitude, all, weekly)
- **First** — First completion of any activity
- **Combo** — Multiple activities completed in same day
- **Time** — Activity during specific hours (e.g., before 7am = Early Bird)
- **Share** — Share X posts to community
- **Encourage** — Send X encouragements to other members
- **Milestone** — Reach specific day in journey (Day 7, 14, 21, 30, 45)
- **Comeback** — Return after N days absence
- **Weekend** — Complete activities on full weekend
- **Mood** — Sustained mood improvement over time
- **Complete/Graduate** — Finish the 45-day challenge

### Points Multipliers

| Streak Range            | Multiplier       |
| ----------------------- | ---------------- |
| 1-6 days                | 1.0x (base)      |
| 7-13 days               | 1.2x             |
| 14-29 days              | 1.5x             |
| 30+ days                | 2.0x             |
| Perfect Week bonus      | +50 bonus points |
| Early Bird (before 8am) | +5 bonus points  |

### Celebrations

Priority queue system for popup celebrations:

- Badge earned (shows badge animation)
- Milestone reached (day count)
- Streak achieved (consecutive days)
- Points milestone
- Level up

### Leaderboard

- Filters: Daily, Weekly, Monthly, Full Session
- Timezone-aware date calculations
- RPC-based ranking for performance
- Top users displayed with rank, avatar, points, streak

---

## 3. AI Coaching System

### Two Characters

**YESI — Nurturing Transformation Coach**

- Energy: Nurturing feminine
- Voice: Warm, encouraging, celebratory
- Focus: Emotional support, gratitude deepening, self-compassion, mindfulness
- Style: "I see you, and I'm so proud of the work you're doing."
- Communication: 2-4 paragraphs, ends with thoughtful question

**GARIN — Strategic Accountability Coach**

- Energy: Grounded masculine
- Voice: Direct, motivating, analytical, purposeful
- Focus: Goal-setting, accountability, consistency, habit formation, performance
- Style: "Let's look at the data — your streaks tell a story."
- Communication: 2-3 paragraphs, ends with clear challenge/question

### Context System

AI characters receive personalized context including:

- User profile and stats
- Recent journal entries (last 3-5)
- Recent DGA completions
- Badge history
- Mood trend (improving/stable/declining)
- Relationship stage (introduction → building → established → deep)

**Token Budget:** 4,000 total (1,500 messages + 800 journals + 500 profile + 400 badges + 200 mood + 600 system)

### Rate Limits

- 10 messages/minute
- 60 messages/hour
- 200 messages/day

### Features

- Streaming responses (Server-Sent Events)
- Conversation history per character
- Session rating + feedback
- Export conversations (JSON, Markdown, Text)
- Character suggestion based on user state

---

## 4. Community System

### Feed

- **Post Types:** Win, Reflection, Milestone, Encouragement, Question, Celebration
- **Visibility:** Private (user only), Cohort (members only), Public (everyone)
- **Features:** Media upload (4 files, 5MB each), linked journal/badge, cursor pagination
- **Moderation:** is_approved flag, report system, admin moderation queue

### Reactions (6 types, custom SVG — no emoji)

| Type      | Color  | Label      |
| --------- | ------ | ---------- |
| Cheer     | Amber  | Nice!      |
| Fire      | Red    | On fire!   |
| Heart     | Pink   | Love this! |
| Celebrate | Purple | Celebrate! |
| Inspire   | Cyan   | Inspiring! |
| Support   | Green  | Support!   |

### Comments

- Threaded replies (parent_comment_id)
- Reactions on comments (heart/support only)
- Points awarded for first post of day

### Member Profiles

- Avatar, name, bio, location
- Streak, points, level, badge count
- Badge showcase (up to 3 pinned badges)
- Recent posts
- "Send Encouragement" button (rate-limited: 3/day to same user)

### Referral System

- Each user gets a referral code (format: NAME-XXXX)
- 100 points per successful referral
- Referral milestones with bonus badges
- Track: total referrals, conversions, points earned

### Community Events

- Calendar of upcoming calls (video_rooms)
- RSVP system (pending/accepted/declined/maybe)
- State machine: live_now → ending_soon → starting_soon → today → upcoming
- Adaptive polling intervals (30s when live, 10min for future events)

---

## 5. Video Calls (100ms Integration)

### Room Types

| Type               | Purpose              | Max Participants | Recording |
| ------------------ | -------------------- | ---------------- | --------- |
| Cohort Call        | Weekly coaching call | 20               | Yes       |
| One-on-One         | Private coaching     | 2                | Optional  |
| Community Checkin  | Group check-in       | 10               | No        |
| Accountability Pod | Small group          | 5                | No        |

### Features

- Pre-join screen (room info, participant count, RSVP count)
- Live call state management
- Calendar export (ICS + Google Cal)
- Host/co-host/participant roles
- Call notes (public + private)
- Invitation system
- Room templates for recurring meetings

---

## 6. Content Library & Courses

### Content Library

- **Types:** Video (Bunny Stream HLS), Document, Audio, Image
- **Features:** Grid/list view, type filtering, search, sort, bookmarks, progress tracking
- **Player:** Video player with resume position, audio player, PDF viewer, image viewer
- **Admin:** Upload modal, content management

### Courses

- **Structure:** Course → Modules → Lessons (each lesson links to a content_item)
- **Features:** Enrollment, progress tracking (% complete), lesson completion, auto-advance
- **Quizzes:** Per-lesson quizzes with multiple question types, passing score, max attempts, time limits
- **Certificates:** Auto-generated on course completion with unique certificate number

### Admin Course Editor

- Create/edit courses, modules, lessons
- Content picker to assign library items to lessons
- Publish/unpublish courses
- Module sort ordering

---

## 7. Webinar System

### Registration Flow

1. User enters name + email on `/webinar`
2. Honeypot check (bot detection)
3. Store in webinar_registrations
4. Send confirmation email with calendar invite
5. Enroll in webinar drip campaign
6. Redirect to `/assessment` (instant bonus)

### Live Webinar

- 100ms HLS streaming
- Live chat (messages, pinning, moderation)
- Q&A system (submit, upvote, answer, pin)
- Attendance tracking (join time, duration, engagement metrics)
- Real-time seat counter (polls every 30s)

### Post-Webinar

- Follow-up emails (different for attended vs missed)
- Conversion tracking (registered → attended → converted to challenge)
- Admin analytics: registration trend, attendance rates, engagement scores

---

## 8. Admin Dashboard

### Overview Page

- Real-time stats (5-min refresh): Total users, MRR, active users, completion rate
- User growth chart (area) + Revenue trend (bar)
- Sales breakdown: Challenge, friend codes, subscriptions, refunds
- Recent activity feed + System alerts

### Management Pages

- **Users:** Table with filtering, detail panel, grant/revoke access, suspend, CSV export
- **Payments:** Revenue analytics, MRR/ARR, refund tracking, purchase history
- **Gamification:** Badge management, point rules, rewards catalog, leaderboard preview
- **Community:** Moderation queue (pending/approved/rejected/escalated)
- **Content:** Challenge content management (days, videos, quotes, meditations)
- **Analytics:** DAU, journal activity, completion funnel (Day 1→7→14→21→30→45), streak distribution
- **Assessment:** Assessment funnel analytics (views→starts→completes→emails→CTAs)
- **Webinar:** Registration/attendance/engagement analytics, email performance
- **Audit:** Full audit trail with IP tracking, action types, resource changes
- **System:** Database health, API status, environment checks

### AI Admin Assistant (Aria)

- Context-aware AI with platform metrics
- GPT-4 powered (falls back to mock)
- Admin-only access
