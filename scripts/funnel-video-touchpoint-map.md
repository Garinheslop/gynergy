# VIDEO TOUCHPOINT MAP — GYNERGY MEMBER PORTAL

## Master Document — Every Video Across Every Funnel

**Version:** 1.0.0
**Created:** 2026-02-17
**Author:** Garin Heslop / Production Team
**Status:** PRE-PRODUCTION

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Production Standards](#2-production-standards)
3. [Master Video Inventory](#3-master-video-inventory)
4. [Shot Lists](#4-shot-lists-for-each-video)
5. [Production Schedule](#5-production-schedule)
6. [Technical Integration](#6-technical-integration-notes)
7. [Email Video Strategy](#7-email-video-strategy)
8. [Appendix: Asset Naming Convention](#8-appendix-asset-naming-convention)

---

## 1. EXECUTIVE SUMMARY

This document maps **every video touchpoint** across the Gynergy platform — from first contact through post-purchase retention. The inventory identifies **28 distinct videos** organized across 7 funnel stages. Videos are prioritized into three tiers:

- **P1 (Launch Blockers):** 5 videos that must exist before any funnel goes live
- **P2 (Week 1):** 9 videos needed within the first week of launch
- **P3 (Month 1):** 14 videos that complete the ecosystem within the first month

**Total estimated production time:** 4 shoot days (grouped by setup/location)
**Total finished runtime:** ~62 minutes of unique content + 90-minute webinar recording

---

## 2. PRODUCTION STANDARDS

All videos follow the standard established by the V2 VSL script (`scripts/webinar-vsl-script-v2.md`).

### Technical Specifications

| Spec          | Standard                                                        |
| ------------- | --------------------------------------------------------------- |
| Resolution    | 3840x2160 (4K) — downscale to 1080p for delivery                |
| Frame rate    | 24fps (cinematic) or 30fps (conversational)                     |
| Aspect ratio  | 16:9 (primary), 9:16 (social cuts), 1:1 (email thumbnails)      |
| Color grade   | Warm, slightly desaturated. Not polished corporate. Real.       |
| Audio         | Lav mic or quality shotgun. -16 LUFS integrated loudness        |
| Codec         | H.264 for web, ProRes for archive                               |
| Bitrate       | 8-12 Mbps for 1080p delivery                                    |
| Captions      | Burned-in for all landing/email videos (80%+ views start muted) |
| Caption style | Bold, centered, 2-3 words at a time for key phrases             |
| Jump cuts     | Use second camera angle to hide edits. Zero visible jump cuts   |

### Performance Standards

| Element  | Standard                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| Delivery | Conversational, NOT teleprompter-perfect                                      |
| Tone     | Direct, not guru. Peer-to-peer. Mathematical, not emotional                   |
| Setting  | Clean, intentional — home office, not studio                                  |
| Wardrobe | Casual but sharp. No suit. Not corporate                                      |
| Camera   | Eye-level, close. This is a conversation, not a presentation                  |
| Lighting | Natural or warm. Nothing clinical                                             |
| Music    | None during vulnerable moments. Optional low ambient pad under proof sections |

### Brand Voice in Video

**Words We Use:** Present, Integration, Practice, Brotherhood, Framework, Tool, Template, Score, Number
**Words We Avoid:** Mindful, Balance, Ritual, Tribe, System, Resource, Depressed, Journey

---

## 3. MASTER VIDEO INVENTORY

### FUNNEL A: WEBINAR FUNNEL

_Assessment → Webinar Registration → Live Webinar → Purchase_

| #   | Video ID      | Video Name                   | Type                  | Purpose                                     | Runtime | Platform           | Plays On                              | Priority |
| --- | ------------- | ---------------------------- | --------------------- | ------------------------------------------- | ------- | ------------------ | ------------------------------------- | -------- |
| 01  | WEB-VSL-01    | Webinar Landing VSL          | VSL (talking head)    | Convert visitors to webinar registrants     | 4:20    | YouTube/Vimeo      | `/webinar` — `WebinarVideo` component | **P1**   |
| 02  | WEB-REPLAY-01 | Webinar Replay Recording     | Live recording        | Catch missed attendees, drive to purchase   | 90:00   | Bunny Stream (HLS) | `/webinar/replay/[slug]`              | **P2**   |
| 03  | WEB-FOLLOW-01 | Webinar Follow-Up (Missed)   | VSL (short)           | Re-engage no-shows with key moments         | 2:30    | YouTube (unlisted) | Email thumbnail link                  | **P2**   |
| 04  | WEB-FOLLOW-02 | Webinar Follow-Up (Attended) | Testimonial highlight | Reinforce for attendees who didn't purchase | 1:30    | YouTube (unlisted) | Email thumbnail link                  | **P2**   |

**Status:** Script for WEB-VSL-01 complete (`scripts/webinar-vsl-script-v2.md`). All others need scripts.

---

### FUNNEL B: DIRECT SALES FUNNEL

_Landing Page (/) → Stripe Checkout → Upsell → Thank You → Dashboard_

| #   | Video ID       | Video Name                   | Type               | Purpose                                  | Runtime     | Platform        | Plays On                       | Priority |
| --- | -------------- | ---------------------------- | ------------------ | ---------------------------------------- | ----------- | --------------- | ------------------------------ | -------- |
| 05  | LP-VSL-01      | Landing Page VSL             | VSL (talking head) | Convert visitors to $997 purchase        | 6:00        | YouTube/Vimeo   | `/` — `VSLSection` component   | **P1**   |
| 06  | LP-HERO-01     | Hero Section Background Loop | Ambient (no audio) | Create atmosphere on landing page        | 0:15 (loop) | Self-hosted MP4 | `/` — `HeroSection` background | **P3**   |
| 07  | LP-TESTI-01    | Testimonial Supercut         | Compilation        | Social proof below the fold              | 2:00        | YouTube/Vimeo   | `/` — `SocialProofSection`     | **P2**   |
| 08  | LP-DOWNSELL-01 | Downsell Page VSL            | VSL (empathetic)   | Convert checkout abandoners to $39.95/mo | 3:00        | YouTube/Vimeo   | `/checkout/recovery`           | **P2**   |

---

### FUNNEL C: FRIEND CODE VIRAL LOOP

_Purchase → Get Codes → Share → Friend Redeems_

| #   | Video ID      | Video Name                 | Type        | Purpose                           | Runtime | Platform           | Plays On                         | Priority |
| --- | ------------- | -------------------------- | ----------- | --------------------------------- | ------- | ------------------ | -------------------------------- | -------- |
| 09  | FC-SHARE-01   | "Why I'm Sending You This" | Micro-video | Make friend code sharing personal | 0:45    | YouTube (unlisted) | Shared via link with friend code | **P2**   |
| 10  | FC-WELCOME-01 | Friend Code Welcome        | Explainer   | Orient friend code redeemers      | 1:30    | YouTube (unlisted) | After friend code redemption     | **P3**   |

---

### FUNNEL D: POST-PURCHASE ONBOARDING

_Payment Success → Dashboard → Daily Journals → Community → Courses_

| #   | Video ID         | Video Name                     | Type                            | Purpose                                 | Runtime | Platform           | Plays On                                | Priority |
| --- | ---------------- | ------------------------------ | ------------------------------- | --------------------------------------- | ------- | ------------------ | --------------------------------------- | -------- |
| 11  | ON-WELCOME-01    | Welcome / Day Zero Orientation | Explainer + Garin               | Orient new purchasers, build excitement | 3:00    | Bunny Stream (HLS) | `/payment/success` — new video section  | **P1**   |
| 12  | ON-JOURNAL-01    | "How to Journal" Tutorial      | Screen recording + talking head | Teach the journaling practice           | 4:00    | Bunny Stream (HLS) | Dashboard first-login overlay           | **P1**   |
| 13  | ON-COMMUNITY-01  | Community Welcome/Tour         | Screen recording + Garin        | Activate community engagement           | 2:00    | Bunny Stream (HLS) | Community page first-visit overlay      | **P3**   |
| 14  | ON-ASSESSMENT-01 | "Understanding Your Score"     | Explainer                       | Contextualize Five Pillar score         | 2:00    | YouTube (unlisted) | `/assessment` results page / email link | **P3**   |

---

### FUNNEL E: RETENTION & ENGAGEMENT

_Milestones, Streaks, Win-back_

| #   | Video ID       | Video Name               | Type           | Purpose                         | Runtime | Platform           | Plays On             | Priority |
| --- | -------------- | ------------------------ | -------------- | ------------------------------- | ------- | ------------------ | -------------------- | -------- |
| 15  | RET-DAY7-01    | Day 7 Milestone          | Celebration    | Celebrate Week 1 completion     | 0:45    | YouTube (unlisted) | Email thumbnail link | **P2**   |
| 16  | RET-DAY14-01   | Day 14 Milestone         | Celebration    | Celebrate Week 2 — "the shift"  | 0:45    | YouTube (unlisted) | Email thumbnail link | **P3**   |
| 17  | RET-DAY21-01   | Day 21 Milestone         | Celebration    | 3 weeks — habit formation       | 0:45    | YouTube (unlisted) | Email thumbnail link | **P3**   |
| 18  | RET-DAY30-01   | Day 30 Milestone         | Celebration    | 1 month — proof of change       | 0:45    | YouTube (unlisted) | Email thumbnail link | **P3**   |
| 19  | RET-DAY45-01   | Day 45 Completion        | Celebration    | Major celebration + what's next | 1:30    | Bunny Stream (HLS) | Dashboard + email    | **P2**   |
| 20  | RET-WINBACK-01 | Win-back / Re-engagement | VSL (personal) | Bring back inactive users       | 1:30    | YouTube (unlisted) | Email thumbnail link | **P3**   |
| 21  | RET-STREAK-01  | Streak Encouragement     | Micro-video    | Motivate during streak risk     | 0:30    | YouTube (unlisted) | Email thumbnail link | **P3**   |

---

### FUNNEL F: UPSELL & EXPANSION

_Post-Purchase Monetization_

| #   | Video ID       | Video Name               | Type            | Purpose                              | Runtime | Platform           | Plays On                     | Priority |
| --- | -------------- | ------------------------ | --------------- | ------------------------------------ | ------- | ------------------ | ---------------------------- | -------- |
| 22  | UP-JOURNAL-01  | Journal Subscription VSL | VSL (soft sell) | Pitch $39.95/mo journal subscription | 3:00    | YouTube/Vimeo      | `/journal` (new sales page)  | **P2**   |
| 23  | UP-UPSELL-01   | Post-Purchase Upsell     | VSL (value-add) | Pitch premium offering after $997    | 2:30    | YouTube/Vimeo      | `/payment/upsell` (new page) | **P2**   |
| 24  | UP-REFERRAL-01 | Referral Reminder        | Micro-video     | Prompt sharing of friend codes       | 0:45    | YouTube (unlisted) | Email thumbnail link         | **P3**   |

---

### FUNNEL G: SEO / ORGANIC CONTENT

| #   | Video ID          | Video Name                             | Type         | Purpose                              | Runtime        | Platform               | Plays On                | Priority |
| --- | ----------------- | -------------------------------------- | ------------ | ------------------------------------ | -------------- | ---------------------- | ----------------------- | -------- |
| 25  | SEO-PILLAR-01     | "What is the Five Pillar Framework?"   | Educational  | Organic discovery, brand authority   | 5:00           | YouTube (public)       | YouTube + `/blog` embed | **P3**   |
| 26  | SEO-EMPTY-01      | "Why Successful Men Feel Empty"        | Educational  | Organic discovery, problem awareness | 5:00           | YouTube (public)       | YouTube + `/blog` embed | **P3**   |
| 27  | SEO-MULTIPLIER-01 | "The Integration Multiplier Explained" | Educational  | Framework teaching, brand authority  | 4:00           | YouTube (public)       | YouTube + `/blog` embed | **P3**   |
| 28  | SEO-SHORTS-01-05  | Short-form Clips (5 videos)            | Reels/Shorts | Social distribution, top-of-funnel   | 0:30-1:00 each | YouTube Shorts / Reels | Social platforms        | **P3**   |

---

## 4. SHOT LISTS FOR EACH VIDEO

---

### VIDEO 01: WEB-VSL-01 — Webinar Landing VSL

**SCRIPT EXISTS:** `scripts/webinar-vsl-script-v2.md`
**Runtime:** 4:20 | **Talent:** Garin solo | **Priority:** P1

#### Scene Breakdown

| Time      | Scene          | Visual                                                                               | Audio                     | Overlay                                                             |
| --------- | -------------- | ------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------- |
| 0:00-0:30 | Cold Open      | Close-up of hand writing "19/50" on dark surface. Camera pulls back to reveal Garin. | Voice only. No music.     | Text: "My score."                                                   |
| 0:30-1:15 | The Scene      | Single take, steady eye contact. Home office setting. Unbroken.                      | Voice only.               | "Winning everywhere measurable. Gone from everywhere that matters." |
| 1:15-2:05 | The Multiplier | Tighter cuts, teaching pacing. Second camera angle for coverage.                     | Voice only.               | Pillars appear 1x1. "9 x 7 x 3 x 8 x 2 = Fractured"                 |
| 2:05-2:40 | The Promise    | Hold up fingers (1, 2, 3). Medium shot.                                              | Voice only.               | None                                                                |
| 2:40-3:20 | The Proof      | Slight zooms on testimonial overlays. Return tighter for "Present" line.             | Optional low ambient pad. | Testimonial cards: James K., Chris B., Andrew M.                    |
| 3:20-3:55 | CTA + Scarcity | Lean forward. Unbroken eye contact.                                                  | Subtle swell under.       | None                                                                |
| 3:55-4:20 | Close          | SINGLE UNBROKEN TAKE. No cuts. Steady eye contact.                                   | Subtle swell.             | End card: "March 3 · 5:30 PM PST · 100 Seats · Save My Seat"        |

**Setup:**

- Camera A: Eye-level, close (primary)
- Camera B: Slight offset (edit coverage)
- Small whiteboard or dark surface within arm's reach
- 4K capture, deliver 1080p
- Burned-in captions required
- Thumbnail: Close-up of "19/50" on dark surface

---

### VIDEO 05: LP-VSL-01 — Landing Page VSL

**Runtime:** 6:00 | **Talent:** Garin solo | **Priority:** P1

Direct-sales equivalent of WEB-VSL-01 but with purchase CTA instead of webinar registration. Longer to carry more weight — no webinar gate.

#### Scene Breakdown

| Time      | Scene              | Key Lines / Messaging Beats                                                                                                                                                | Visual Direction                                              |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 0:00-0:30 | Cold Open          | "19/50" pattern interrupt. Extend: "That number changed everything for me. Today I'll tell you how it can change everything for you."                                      | Same whiteboard/dark surface as WEB-VSL-01                    |
| 0:30-1:15 | The Scene          | Tuesday dinner. Wife: "Where are you?" "I was right there. But I wasn't anywhere."                                                                                         | Single take. Unbroken eye contact. Close framing.             |
| 1:15-2:15 | The Multiplier     | Five Pillars math. "Close a $2M deal, come home to silence." "Integration multiplies. Fragmentation destroys."                                                             | Text overlays: pillars, equation. Second camera for coverage. |
| 2:15-3:00 | The Solution       | "I spent 3 years building a system. Not a concept. A daily practice." Introduce 45-Day Challenge: morning journal, evening reflection, weekly calls, brotherhood.          | Slightly wider shot — "bigger picture" energy.                |
| 3:00-3:45 | The Proof          | 3 testimonials with specific results. 92% stat. "Not motivated. Not hyped. Present."                                                                                       | Testimonial cards overlay. Return tighter on "Present."       |
| 3:45-4:30 | What You Get       | Value stack: Journal ($297), 8 Live Calls ($2,000), Brotherhood ($500), Assessment x2 ($500), Friend Code ($997). "Total value: $4,294. Your investment: $997."            | Text overlay of value stack with prices.                      |
| 4:30-5:15 | Objection Handling | "If you're thinking 'another coaching program'..." Address: time (10 min/day), transparency, "I've tried coaching."                                                        | Direct eye contact. No overlays — let words carry.            |
| 5:15-6:00 | Close              | "If you don't have 10 minutes a day to fix 15 years of feeling empty... that's the exact problem we're solving." Emotional callback. "Your score is waiting. Scroll down." | Single unbroken take. Slow zoom in. End card with CTA.        |

**Setup:** Same as WEB-VSL-01. Same camera positions. Shoot back-to-back.

---

### VIDEO 08: LP-DOWNSELL-01 — Downsell Page VSL

**Runtime:** 3:00 | **Talent:** Garin solo | **Priority:** P2

For checkout abandoners. Tone shifts from authority to empathy. NOT high-pressure — understanding and offering a lower-commitment entry.

#### Scene Breakdown

| Time      | Scene           | Key Lines                                                                                                                                                                                                              | Visual                                              |
| --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 0:00-0:25 | Acknowledgment  | "I know the checkout page can feel like a big decision. $997 is not a small number. And I respect that you're thinking it through."                                                                                    | Closer framing than usual. Softer lighting.         |
| 0:25-1:00 | The Question    | "Let me ask you something. When you were on that page, was it the money that stopped you? Or was it something else?" Pause. "Most men tell me it's not the money. It's the voice that says 'This won't be different.'" | Hold the pause. Let it land.                        |
| 1:00-1:45 | The Alternative | "Here's what I want to offer you. Start with just the journal. $39.95 a month. Try the daily practice. See what 30 days of showing up for yourself actually does. No calls. No community. Just you and the work."      | Text overlay: "$39.95/month — The Daily Practice"   |
| 1:45-2:30 | Why It Works    | "After 2-3 weeks, you'll know. You'll either realize this isn't for you — cancel anytime, zero guilt. Or you'll feel the shift, and you'll want the full experience."                                                  | Calm, confident. Not pushing.                       |
| 2:30-3:00 | Close           | "The only wrong move is going back to doing nothing. You clicked for a reason. Honor that."                                                                                                                            | End card: "Start the Daily Practice — $39.95/month" |

---

### VIDEO 09: FC-SHARE-01 — "Why I'm Sending You This" Shareable

**Runtime:** 0:45 | **Talent:** Garin solo | **Priority:** P2

Video purchasers share alongside their friend code. Addressed to the **friend**, not the purchaser.

#### Scene Breakdown

| Time      | Scene      | Key Lines                                                                                                                                                                           | Visual                                      |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 0:00-0:10 | Hook       | "Hey — someone who cares about you just sent you a gift worth $997. That's not hyperbole. Let me explain."                                                                          | Direct to camera. Close.                    |
| 0:10-0:30 | What It Is | "It's a 45-day challenge that helps men who've built everything reclaim what actually matters. 10 minutes a day. A structured practice. And a brotherhood that won't let you quit." | Medium shot.                                |
| 0:30-0:45 | CTA        | "The person who sent this to you is already doing it. They want you in the room. Use the code. Show up. It costs you nothing except 10 minutes a day."                              | End card: "Redeem Your Code at gynergy.app" |

---

### VIDEO 10: FC-WELCOME-01 — Friend Code Welcome

**Runtime:** 1:30 | **Talent:** Garin solo | **Priority:** P3

Orientation for friend code redeemers on what they just got.

#### Scene Breakdown

| Time      | Scene           | Key Lines                                                                                                                                                                            | Visual                         |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 0:00-0:15 | Welcome         | "Welcome. Whoever sent you that code believes in you. Let me tell you what you just got."                                                                                            | Warm, welcoming energy. Close. |
| 0:15-0:50 | What's Included | Walk through: 45-day challenge, morning journal, evening reflection, weekly calls, brotherhood, assessment. "Everything the people who paid $997 get. Same access. Same experience." | Text overlay of each item.     |
| 0:50-1:15 | How to Start    | "Step 1: Set your alarm 10 minutes earlier. Step 2: Open the Date Zero page tonight. Step 3: Show up tomorrow morning."                                                              | Hold up fingers 1, 2, 3.       |
| 1:15-1:30 | Close           | "The person who sent you this made a choice. Make yours."                                                                                                                            | Steady eye contact.            |

---

### VIDEO 11: ON-WELCOME-01 — Welcome / Day Zero Orientation

**Runtime:** 3:00 | **Talent:** Garin solo | **Priority:** P1

First thing a new purchaser sees after buying. Plays on payment success page. Must feel warm, celebratory, and actionable.

#### Scene Breakdown

| Time      | Scene           | Key Lines                                                                                                                                                                                                     | Visual                                           |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 0:00-0:20 | Celebration     | "You did it. You made the decision. And I'm not going to waste your time congratulating you — I'm going to get you started."                                                                                  | Slight smile. Warmer than VSL energy.            |
| 0:20-0:50 | Orientation     | "Right now, you have access to your Date Zero page. That's your starting point. Read it tonight."                                                                                                             | Quick screen overlay showing Date Zero page.     |
| 0:50-1:30 | The Three Steps | "Three things before Day 1: One — set your alarm 10 minutes earlier. Two — text one person and tell them you started. Three — open the Date Zero page and read it end to end."                                | Hold up fingers. Text overlay for each step.     |
| 1:30-2:15 | Friend Codes    | "You also got 2 friend codes. Each one is a $997 gift. Send one to someone who needs it. Men who do this with a friend are 95% more likely to complete. This isn't a nice-to-have — it's a force multiplier." | Text overlay: "2 Friend Codes — $997 value each" |
| 2:15-3:00 | Close           | "I'll see you in the morning. When you open that journal tomorrow, you'll feel something different. That's the beginning. Welcome to the room."                                                               | Warm close. Steady eye contact.                  |

---

### VIDEO 12: ON-JOURNAL-01 — "How to Journal" Tutorial

**Runtime:** 4:00 | **Talent:** Garin + screen recording | **Priority:** P1

Teaches the actual journaling practice. Critical for activation and reducing Day 1 drop-off.

#### Scene Breakdown

| Time      | Scene           | Key Lines                                                                                                                                                 | Visual                                 |
| --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 0:00-0:30 | Frame It        | "This is the practice that changed my life. 497 days and counting. Let me show you exactly how it works."                                                 | Talking head, close.                   |
| 0:30-1:15 | Morning Journal | Walk through: Mood score, captured essence, mantra, 3 affirmations, 3 gratitudes, 3 excitements. "Don't overthink it. First thoughts. Honest. 5 minutes." | Screen recording of morning journal UI |
| 1:15-2:00 | Evening Journal | Walk through: Mood score, insight + impact, success of the day, changes for tomorrow, dream magic, freeflow.                                              | Screen recording of evening journal UI |
| 2:00-2:30 | DGA             | "This is the part most men skip — and it's the part that matters most. Actually DO something kind today. Then write about it."                            | Screen recording of DGA interface      |
| 2:30-3:15 | Tips            | "Biggest mistake: trying to write a novel. Short is fine. Honest is better. The streak matters more than the length."                                     | Back to talking head. Conversational.  |
| 3:15-4:00 | Close           | "Tomorrow morning. 10 minutes earlier. Open the app. Start typing. That's it. Don't make it complicated. Make it consistent."                             | Warm close.                            |

**Additional setup needed:** Screen recording rig (laptop with app open, screen capture software).

---

### VIDEO 13: ON-COMMUNITY-01 — Community Welcome/Tour

**Runtime:** 2:00 | **Talent:** Garin + screen recording | **Priority:** P3

#### Scene Breakdown

| Time      | Scene   | Key Lines                                                                                                                                                    | Visual                             |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 0:00-0:15 | Welcome | "Welcome to the brotherhood. Let me show you around."                                                                                                        | Talking head, warm.                |
| 0:15-0:50 | Tour    | Walk through community feed, member profiles, post creation. "First thing: introduce yourself. Don't write a novel. Name, what you do, and why you're here." | Screen recording of community page |
| 0:50-1:20 | Calls   | "Every week, there are community calls. Show up to at least one. Hearing other men talk about this stuff is the thing that makes it real."                   | Screen recording of call schedule  |
| 1:20-2:00 | Close   | "This isn't social media. This is a room full of men who are done pretending. Be honest. Be present. That's all we ask."                                     | Back to talking head.              |

---

### VIDEO 14: ON-ASSESSMENT-01 — "Understanding Your Score"

**Runtime:** 2:00 | **Talent:** Garin solo | **Priority:** P3

#### Scene Breakdown

| Time      | Scene      | Key Lines                                                                                                                                                                                | Visual                                          |
| --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 0:00-0:15 | Hook       | "You just got a number. Let me tell you what it actually means."                                                                                                                         | Direct to camera.                               |
| 0:15-0:50 | The Math   | "50 is the highest possible score. Most men who take this land between 18 and 28. The national average for high achievers? 24." Explain why low scores in one pillar collapse the total. | Text overlay: score range visualization         |
| 0:50-1:30 | What To Do | "Your lowest pillar is the one to focus on first. Not because it's broken — because when it comes up, everything else multiplies."                                                       | Text overlay highlighting lowest pillar concept |
| 1:30-2:00 | CTA        | "Now you know where you stand. The question is what you do with that information."                                                                                                       | Steady eye contact.                             |

---

### VIDEOS 15-19: Milestone Celebration Videos

**Runtime:** 0:45 each (Day 45 = 1:30) | **Talent:** Garin solo

All follow the same template structure but escalate in emotional weight.

#### Template Structure

| Beat           | Duration | Content                                               |
| -------------- | -------- | ----------------------------------------------------- |
| Acknowledgment | 0:10     | "Day [X]. You showed up [X] times."                   |
| What Changed   | 0:20     | Specific insight about what happens at this milestone |
| What's Next    | 0:15     | Brief preview of next phase + encouragement           |

#### VIDEO 15: RET-DAY7-01 — Day 7 (P2)

| Beat           | Lines                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Acknowledgment | "7 days. Most men never make it past day 3. You did."                     |
| What Changed   | "Your brain is starting to notice different things. That's the rewiring." |
| What's Next    | "Week 2 is where it stops feeling forced and starts feeling natural."     |

#### VIDEO 16: RET-DAY14-01 — Day 14 (P3)

| Beat           | Lines                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Acknowledgment | "14 days. You've passed the point where most habits die."                    |
| What Changed   | "By now, your mornings feel different. That's not placebo. That's practice." |
| What's Next    | "The next 2 weeks are where other people start noticing."                    |

#### VIDEO 17: RET-DAY21-01 — Day 21 (P3)

| Beat           | Lines                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Acknowledgment | "21 days. This is where the science says the habit locks in."                     |
| What Changed   | "Your lowest pillar has already started to shift. Check your entries from Day 1." |
| What's Next    | "15 more days. You're closer to the end than the beginning."                      |

#### VIDEO 18: RET-DAY30-01 — Day 30 (P3)

| Beat           | Lines                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Acknowledgment | "30 days. You've done what 90% of men who started this year couldn't do." |
| What Changed   | "Someone in your life has noticed. Even if they haven't said it."         |
| What's Next    | "15 days to go. The finish line is in sight. Don't coast."                |

#### VIDEO 19: RET-DAY45-01 — Day 45 Completion (P2) — Extended 1:30

| Time      | Beat           | Lines                                                                                                                                     |
| --------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:15 | Acknowledgment | "45 days. You did it. Every single one."                                                                                                  |
| 0:15-0:45 | What Changed   | "You are now in the 92%. The men who report feeling present again. Not motivated. Not hyped. Present."                                    |
| 0:45-1:10 | What's Next    | Introduce: retake assessment (see how score changed), community access, journal subscription. "The challenge ends. The practice doesn't." |
| 1:10-1:30 | Close          | "This is who you are now."                                                                                                                |

---

### VIDEO 20: RET-WINBACK-01 — Win-back / Re-engagement

**Runtime:** 1:30 | **Talent:** Garin solo | **Priority:** P3

For inactive users (7+ days without journal entry). Tone: zero guilt, zero pressure.

#### Scene Breakdown

| Time      | Scene          | Key Lines                                                                                                                                                              | Visual                                           |
| --------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 0:00-0:15 | Acknowledgment | "Hey. It's been a few days. That's okay. I'm not here to guilt you."                                                                                                   | Close, personal, slight warmth.                  |
| 0:15-0:45 | The Pattern    | "Here's what I know about the gap. The longer it gets, the harder it feels to come back. Your brain starts building a story: 'I failed.' You didn't fail. You paused." | Direct.                                          |
| 0:45-1:10 | The Reframe    | "There is no perfect streak. There's just showing up again. The men who transform aren't the ones who never missed a day. They're the ones who came back."             | Text overlay: "The men who transform came back." |
| 1:10-1:30 | CTA            | "Open the app. One entry. That's it. The streak resets. You don't."                                                                                                    | End card: "Open Your Journal"                    |

---

### VIDEO 21: RET-STREAK-01 — Streak Encouragement

**Runtime:** 0:30 | **Talent:** Garin solo | **Priority:** P3

Quick motivational nudge sent when streak is at risk (1 missed day).

| Time      | Lines                                                                          | Visual                                       |
| --------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| 0:00-0:10 | "Quick check. You haven't opened the journal today."                           | Close, direct.                               |
| 0:10-0:20 | "It takes 5 minutes. Shorter than this video. You already know what to write." | Slight smile.                                |
| 0:20-0:30 | "Don't let today be the day you quit."                                         | Steady eye contact. End card: "Open Journal" |

---

### VIDEO 22: UP-JOURNAL-01 — Journal Subscription VSL

**Runtime:** 3:00 | **Talent:** Garin solo | **Priority:** P2

For the dedicated journal subscription sales page. Targets: challenge completers + organic visitors.

#### Scene Breakdown

| Time      | Scene        | Key Lines                                                                                                                                                                                            | Visual                                            |
| --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 0:00-0:30 | The Question | "What happens after Day 45? Most programs end. The habit dies. Three months later you're back to empty."                                                                                             | Direct, serious.                                  |
| 0:30-1:15 | The Data     | "The men who sustained their transformation had one thing in common: they kept the daily practice. Not the calls. Not the community. The practice. The 10 minutes every morning."                    | Text overlay: sustained practice statistics       |
| 1:15-2:00 | The Offer    | "The journal subscription gives you exactly that. Same daily practice, ongoing. Morning, evening, DGA. Your streak continues. Your score keeps climbing. $39.95 a month. Less than a dollar a day."  | Text overlay: "$39.95/month"                      |
| 2:00-2:30 | Objection    | "If you're thinking 'I can just do it in a notebook' — you can. But the accountability, the tracking, the AI coaching, the streak that watches you — that's what keeps men from quitting on Week 3." | No overlay — let words work                       |
| 2:30-3:00 | Close        | "You didn't do 45 days to go back to nothing. Keep the practice. Keep the progress."                                                                                                                 | End card: "Continue Your Practice — $39.95/month" |

---

### VIDEO 23: UP-UPSELL-01 — Post-Purchase Upsell

**Runtime:** 2:30 | **Talent:** Garin solo | **Priority:** P2

Plays on upsell page after $997 purchase. Must feel natural, not predatory.

#### Scene Breakdown

| Time      | Scene       | Key Lines                                                                                                                                          | Visual                                   |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 0:00-0:20 | Context     | "One more thing before you get started." Casual, not salesy.                                                                                       | Same setup as welcome video. Continuity. |
| 0:20-1:00 | The Upgrade | Present the annual journal bundle ($399/yr — save $80 vs monthly). "Men who lock in the annual practice from Day 1 complete at a 40% higher rate." | Offer details overlay                    |
| 1:00-1:45 | Why Now     | "I'm offering this now because Day 1 decisions compound. The men who commit fully from the start don't negotiate with themselves later."           | Direct.                                  |
| 1:45-2:10 | No Pressure | "If this isn't for you, skip it. You already have everything you need with the challenge. I'll never mention it again."                            | Decline button acknowledgment. Honest.   |
| 2:10-2:30 | CTA         | "But if you want to go deeper — one click."                                                                                                        | End card with offer + CTA                |

---

### VIDEO 24: UP-REFERRAL-01 — Referral Reminder

**Runtime:** 0:45 | **Talent:** Garin solo | **Priority:** P3

Sent in referral reminder emails to nudge friend code sharing.

| Time      | Lines                                                                                                                                                                        | Visual                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0:00-0:10 | "Quick reminder: you have friend codes that are sitting unused."                                                                                                             | Direct to camera.                   |
| 0:10-0:30 | "Each one is worth $997. That's not marketing — it's real access to the full challenge. Think of one person in your life who's built everything but doesn't feel any of it." | Close, personal.                    |
| 0:30-0:45 | "Send the code. They'll thank you. And you'll have someone to do this with."                                                                                                 | End card: "Share Your Friend Codes" |

---

### VIDEOS 25-27: SEO / Educational Content

**Runtime:** 4-5 min each | **Talent:** Garin solo | **Priority:** P3

Public YouTube videos for organic discovery. Teach the framework without selling. Soft CTA to assessment.

#### Common Structure

| Beat      | Duration | Content                                 |
| --------- | -------- | --------------------------------------- |
| Hook      | 0:15     | Pattern-interrupt question or statement |
| Problem   | 0:45     | Name the pain the audience feels        |
| Framework | 2:00     | Teach the concept with real examples    |
| Proof     | 0:45     | Brief testimonials or data              |
| CTA       | 0:15     | "Take the free Five Pillar Assessment"  |

#### VIDEO 25: SEO-PILLAR-01 — "What is the Five Pillar Framework?"

| Beat      | Content                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| Hook      | "What if the five areas of your life don't add up — they multiply?"                     |
| Problem   | The one-dimensional success trap. Men optimize for wealth and neglect everything else.  |
| Framework | Teach all 5 pillars: Wealth, Health, Relationships, Growth, Purpose. How they interact. |
| Proof     | "497 days of practice. 500+ men. 92% report feeling present again."                     |
| CTA       | "Take the free Five Pillar Assessment at gynergy.app/assessment"                        |

#### VIDEO 26: SEO-EMPTY-01 — "Why Successful Men Feel Empty"

| Beat      | Content                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Hook      | "You built everything. You feel nothing. Here's why."                                                      |
| Problem   | The Golden Cage — external success, internal emptiness. "You can't feel the wins anymore."                 |
| Framework | The Emptiness Equation: What you've built minus what you feel, divided by how long you've ignored the gap. |
| Proof     | James K. testimony: "$12M company, couldn't look his wife in the eye."                                     |
| CTA       | "Your score is waiting. gynergy.app/assessment"                                                            |

#### VIDEO 27: SEO-MULTIPLIER-01 — "The Integration Multiplier Explained"

| Beat      | Content                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| Hook      | "9 x 8 x 3 x 7 x 2. This equation explains your entire life."                           |
| Problem   | Why improving one area while ignoring others leads to collapse.                         |
| Framework | Deep dive on multiplication vs. addition. Real-world: "$2M deal + silent dinner table." |
| Proof     | Andrew M.: "Score 23 → 41 in 45 days. Not perfect. But alive."                          |
| CTA       | "Find your number. gynergy.app/assessment"                                              |

---

### VIDEO 28: SEO-SHORTS-01-05 — Short-form Clips

**Runtime:** 0:30-1:00 each | **Priority:** P3

Cut from existing footage. 5 clips:

1. **"19/50"** — The cold open moment from WEB-VSL-01 (works silent)
2. **"Winning everywhere..."** — The identification beat from any VSL
3. **The multiplication equation** — Animation from SEO-MULTIPLIER-01
4. **"Not motivated. Not hyped. Present."** — Testimonial beat
5. **"If you don't have 90 minutes..."** — Close from WEB-VSL-01

**Specs:** 9:16 for Reels/Shorts, 1:1 for feed posts. Burned-in captions. Native upload to each platform.

---

## 5. PRODUCTION SCHEDULE

### Shoot Day 1: "The Core VSLs" (P1)

**Setup:** Home office. Dark backdrop. Two cameras. Whiteboard/dark surface.
**Talent:** Garin solo
**Duration:** Half day (4-5 hours)

| Order | Video                        | Runtime | Notes                      |
| ----- | ---------------------------- | ------- | -------------------------- |
| 1     | WEB-VSL-01 (Webinar VSL)     | 4:20    | 3 takes. Script exists.    |
| 2     | LP-VSL-01 (Landing Page VSL) | 6:00    | Same setup. Longer.        |
| 3     | ON-WELCOME-01 (Day Zero)     | 3:00    | Warmer energy. Same setup. |

**Raw capture:** ~45 min | **Setup changes:** 0

---

### Shoot Day 2: "Onboarding & Downsell" (P1/P2)

**Setup A (first half):** Home office + screen recording rig
**Setup B (second half):** Home office only

| Order | Video                               | Runtime | Notes                          |
| ----- | ----------------------------------- | ------- | ------------------------------ |
| 1     | ON-JOURNAL-01 (How to Journal)      | 4:00    | Screen recording of journal UI |
| 2     | ON-COMMUNITY-01 (Community Tour)    | 2:00    | Screen recording of community  |
| 3     | LP-DOWNSELL-01 (Downsell VSL)       | 3:00    | Empathetic energy shift        |
| 4     | UP-UPSELL-01 (Post-Purchase Upsell) | 2:30    | Natural, not pushy             |
| 5     | FC-SHARE-01 (Friend Code Share)     | 0:45    | Quick, direct                  |

**Raw capture:** ~40 min | **Setup changes:** 1 (screen recording)

---

### Shoot Day 3: "Retention & Milestones" (P2/P3)

**Setup:** Home office. Slightly warmer lighting for celebration feel.

| Order | Video                              | Runtime | Notes                     |
| ----- | ---------------------------------- | ------- | ------------------------- |
| 1     | RET-DAY7-01 (Day 7)                | 0:45    | Batch all milestones      |
| 2     | RET-DAY14-01 (Day 14)              | 0:45    |                           |
| 3     | RET-DAY21-01 (Day 21)              | 0:45    |                           |
| 4     | RET-DAY30-01 (Day 30)              | 0:45    |                           |
| 5     | RET-DAY45-01 (Day 45)              | 1:30    | More energy. Celebration. |
| 6     | RET-WINBACK-01 (Win-back)          | 1:30    | Gentle, understanding     |
| 7     | RET-STREAK-01 (Streak)             | 0:30    | Quick encouragement       |
| 8     | UP-JOURNAL-01 (Journal VSL)        | 3:00    | Soft sell energy          |
| 9     | UP-REFERRAL-01 (Referral)          | 0:45    | Casual, friendly          |
| 10    | WEB-FOLLOW-01 (Missed Follow-up)   | 2:30    | Post-webinar energy       |
| 11    | WEB-FOLLOW-02 (Attended Follow-up) | 1:30    | Reinforce + push          |

**Raw capture:** ~50 min | **Setup changes:** 0

---

### Shoot Day 4: "Educational & SEO" (P3)

**Setup:** Home office + whiteboard for teaching segments.

| Order | Video                                       | Runtime | Notes                        |
| ----- | ------------------------------------------- | ------- | ---------------------------- |
| 1     | SEO-PILLAR-01 (Five Pillar Framework)       | 5:00    | Teaching energy. Whiteboard. |
| 2     | SEO-EMPTY-01 (Why Men Feel Empty)           | 5:00    | More vulnerable.             |
| 3     | SEO-MULTIPLIER-01 (Integration Multiplier)  | 4:00    | Mathematical/analytical.     |
| 4     | ON-ASSESSMENT-01 (Understanding Your Score) | 2:00    | Contextual, helpful.         |
| 5     | FC-WELCOME-01 (Friend Code Welcome)         | 1:30    | Warm orientation.            |

**Raw capture:** ~55 min | **Setup changes:** 1 (whiteboard)

---

### Post-Production Timeline

| Phase               | Duration                    | Deliverables          |
| ------------------- | --------------------------- | --------------------- |
| Rough cuts (P1)     | 3 days after Shoot Day 1    | 5 videos review-ready |
| Caption burn-in     | 1 day per batch             | All videos captioned  |
| Final delivery (P1) | 1 week after shoot          | 5 videos uploaded     |
| Rough cuts (P2)     | 5 days after Shoot Days 2-3 | 9 videos review-ready |
| Final delivery (P2) | 2 weeks after shoot         | 9 videos uploaded     |
| Final delivery (P3) | 4 weeks after shoot         | 14 videos uploaded    |
| Short-form cuts     | Ongoing after raw exists    | 5 clips per week      |

---

## 6. TECHNICAL INTEGRATION NOTES

### Component Mapping

| Video           | Component                               | Configuration                                                                                           |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| WEB-VSL-01      | `WebinarVideo.tsx`                      | Set `videoId` in `WEBINAR_HERO_CONTENT` at `modules/landing/data/webinar-content.ts` (currently `null`) |
| LP-VSL-01       | `VSLSection.tsx`                        | Pass `videoUrl` prop with embed URL                                                                     |
| LP-DOWNSELL-01  | `WebinarVideo.tsx`                      | New page `/checkout/recovery` — pass videoId prop                                                       |
| ON-WELCOME-01   | New embed on `PaymentSuccessClient.tsx` | Add WebinarVideo to success page                                                                        |
| ON-JOURNAL-01   | `VideoPlayer.tsx` (HLS)                 | Upload to Bunny Stream → get streamUrl                                                                  |
| ON-COMMUNITY-01 | `VideoPlayer.tsx` (HLS)                 | Upload to Bunny Stream → first-visit overlay                                                            |
| WEB-REPLAY-01   | `VideoPlayer.tsx` (HLS)                 | New page `/webinar/replay/[slug]`                                                                       |
| UP-JOURNAL-01   | `WebinarVideo.tsx`                      | New page `/journal`                                                                                     |
| UP-UPSELL-01    | `WebinarVideo.tsx`                      | New page `/payment/upsell`                                                                              |
| Course videos   | `VideoPlayer.tsx`                       | Existing — per-lesson `streamUrl`                                                                       |
| Email videos    | Static thumbnail + link                 | No component needed                                                                                     |
| SEO videos      | YouTube native                          | No platform component                                                                                   |
| LP-HERO-01      | New: `HeroBackgroundVideo`              | HTML `<video>` with autoplay, muted, loop                                                               |

### New Components Needed (3)

**1. `VideoOverlay`** — First-visit overlay that shows a video on top of a page (for ON-JOURNAL-01, ON-COMMUNITY-01). Checks localStorage for "seen" state. Dismissible.

**2. `HeroBackgroundVideo`** — Background video loop for landing page hero. `<video autoplay muted loop playsinline>`. Muted, no controls, CSS-positioned behind content.

**3. `videoThumbnailBlock()`** — Email HTML helper function (not a React component). Generates the HTML block for video thumbnails in emails.

### How to Plug In a Video

**For Bunny Stream (HLS) hosted videos:**

1. Upload via Bunny Stream API (`lib/services/bunny-stream.ts`)
2. Wait for transcoding (`status === 4`)
3. Get stream URL: `https://{CDN_HOST}/{videoId}/playlist.m3u8`
4. Pass `streamUrl` to `VideoPlayer` component

**For YouTube/Vimeo hosted videos:**

1. Upload to platform (unlisted or public)
2. Get video ID (e.g., `dQw4w9WgXcQ`)
3. Set in content data file or pass as prop to `WebinarVideo`

---

## 7. EMAIL VIDEO STRATEGY

### Core Principle

Video cannot be embedded in email. Every email "video" is a **static thumbnail image** with a play button overlay that links to the hosted video.

### Thumbnail Specifications

| Type            | Dimensions | Max Size | Frame Rate  | Use When                                  |
| --------------- | ---------- | -------- | ----------- | ----------------------------------------- |
| Static          | 600x338px  | <100KB   | N/A         | Standard email videos                     |
| Animated GIF    | 600x338px  | <500KB   | 15fps, 3-5s | High-priority conversion emails           |
| Text-over-image | 600x338px  | <100KB   | N/A         | When thumbnail isn't visually interesting |

### Email-to-Video Mapping

| Email               | Video           | Thumbnail Type                          | Link Destination          |
| ------------------- | --------------- | --------------------------------------- | ------------------------- |
| Cart abandonment #1 | LP-DOWNSELL-01  | GIF: Garin speaking, 3 seconds          | `/checkout/recovery`      |
| Cart abandonment #2 | LP-VSL-01       | Static: "19/50" + play button           | `/` with autoplay         |
| Day 7 milestone     | RET-DAY7-01     | Static: "DAY 7" large text + play       | YouTube unlisted          |
| Day 14 milestone    | RET-DAY14-01    | Static: "DAY 14" large text + play      | YouTube unlisted          |
| Day 21 milestone    | RET-DAY21-01    | Static: "DAY 21" large text + play      | YouTube unlisted          |
| Day 30 milestone    | RET-DAY30-01    | Static: "DAY 30" large text + play      | YouTube unlisted          |
| Day 45 completion   | RET-DAY45-01    | GIF: Celebration, 3 seconds             | Dashboard with overlay    |
| Win-back            | RET-WINBACK-01  | Static: Garin + "We saved your spot"    | YouTube unlisted          |
| Referral reminder   | UP-REFERRAL-01  | Static: "Your codes are waiting" + play | YouTube unlisted          |
| Webinar missed      | WEB-FOLLOW-01   | GIF: Key webinar moment, 3 seconds      | `/webinar/replay/[slug]`  |
| Webinar attended    | WEB-FOLLOW-02   | Static: Testimonial card + play         | YouTube unlisted          |
| Journal pitch       | UP-JOURNAL-01   | Static: "After Day 45?" + play          | `/journal`                |
| Community welcome   | ON-COMMUNITY-01 | Static: Community screenshot + play     | `/community` with overlay |

### Email HTML Template Block

```html
<!-- Video Thumbnail Block -->
<div style="text-align: center; margin: 24px 0;">
  <a href="{videoUrl}" target="_blank" style="display: inline-block; position: relative;">
    <img
      src="{thumbnailUrl}"
      alt="{altText}"
      width="600"
      height="338"
      style="max-width: 100%; border-radius: 8px; border: 1px solid #2a2a4e;"
    />
  </a>
</div>
```

### Thumbnail Generation Process

1. Extract frame at most compelling moment (during post-production)
2. Add subtle dark gradient vignette (matches brand)
3. Overlay centered play button (60x60px, semi-transparent white circle + triangle)
4. For GIFs: export 3-5 second clip, 15fps, 600px wide
5. Save as PNG (<100KB) or GIF (<500KB)

---

## 8. APPENDIX: ASSET NAMING CONVENTION

### Video File Naming

```
{FUNNEL}-{TYPE}-{SEQ}-{VERSION}.{ext}
```

**Examples:**

- `WEB-VSL-01-v1.mp4` — Webinar VSL, first video, version 1
- `LP-VSL-01-v2.mp4` — Landing Page VSL, version 2
- `RET-DAY7-01-v1.mp4` — Retention Day 7, version 1
- `SEO-PILLAR-01-v1.mp4` — SEO Pillar video, version 1

### Funnel Prefixes

| Prefix | Funnel                      |
| ------ | --------------------------- |
| WEB    | Webinar funnel              |
| LP     | Landing page / direct sales |
| FC     | Friend code viral loop      |
| ON     | Onboarding / post-purchase  |
| RET    | Retention / engagement      |
| UP     | Upsell / expansion          |
| SEO    | Organic / SEO content       |

### Thumbnail Naming

```
{VIDEO-ID}-thumb-{TYPE}.{ext}
```

**Examples:**

- `WEB-VSL-01-thumb-static.png`
- `WEB-VSL-01-thumb-gif.gif`
- `RET-DAY7-01-thumb-static.png`

### Platform-Specific Exports

```
{VIDEO-ID}-{PLATFORM}-{ASPECT}.{ext}
```

**Examples:**

- `WEB-VSL-01-youtube-16x9.mp4`
- `WEB-VSL-01-reels-9x16.mp4`
- `WEB-VSL-01-feed-1x1.mp4`

---

## PRIORITY SUMMARY

### P1 — Launch Blockers (5 videos)

| #   | Video                              | Runtime | Notes                       |
| --- | ---------------------------------- | ------- | --------------------------- |
| 1   | WEB-VSL-01 — Webinar Landing VSL   | 4:20    | Script complete             |
| 2   | LP-VSL-01 — Landing Page VSL       | 6:00    | Script in this doc          |
| 3   | ON-WELCOME-01 — Day Zero Welcome   | 3:00    | Script in this doc          |
| 4   | ON-JOURNAL-01 — How to Journal     | 4:00    | Script in this doc          |
| 5   | LP-TESTI-01 — Testimonial Supercut | 2:00    | Requires testimonial shoots |

### P2 — Week 1 (9 videos)

| #   | Video                              | Runtime                |
| --- | ---------------------------------- | ---------------------- |
| 6   | WEB-REPLAY-01 — Webinar Replay     | 90:00 (live recording) |
| 7   | WEB-FOLLOW-01 — Missed Follow-up   | 2:30                   |
| 8   | WEB-FOLLOW-02 — Attended Follow-up | 1:30                   |
| 9   | LP-DOWNSELL-01 — Downsell VSL      | 3:00                   |
| 10  | FC-SHARE-01 — Friend Code Share    | 0:45                   |
| 11  | RET-DAY7-01 — Day 7 Milestone      | 0:45                   |
| 12  | RET-DAY45-01 — Day 45 Completion   | 1:30                   |
| 13  | UP-JOURNAL-01 — Journal VSL        | 3:00                   |
| 14  | UP-UPSELL-01 — Upsell Video        | 2:30                   |

### P3 — Month 1 (14 videos)

| #     | Video                              | Runtime          |
| ----- | ---------------------------------- | ---------------- |
| 15-18 | RET-DAY14/21/30 + STREAK           | 0:45 each + 0:30 |
| 19    | RET-WINBACK-01 — Win-back          | 1:30             |
| 20    | UP-REFERRAL-01 — Referral Reminder | 0:45             |
| 21    | ON-COMMUNITY-01 — Community Tour   | 2:00             |
| 22    | ON-ASSESSMENT-01 — Score Explainer | 2:00             |
| 23    | FC-WELCOME-01 — Friend Welcome     | 1:30             |
| 24    | LP-HERO-01 — Hero Loop             | 0:15             |
| 25-27 | SEO Content (3 videos)             | 14:00 total      |
| 28    | Short-form clips (5 cuts)          | 2:30-5:00 total  |

---

**Total: 28 videos | 4 shoot days | ~62 min finished content + 90 min recording**

---

**END OF VIDEO TOUCHPOINT MAP**
