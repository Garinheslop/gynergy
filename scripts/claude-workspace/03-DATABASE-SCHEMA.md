# GYNERGY — Database Schema

## Overview

PostgreSQL via Supabase. 60+ tables across 14 domains. Row Level Security (RLS) enabled on all tables.

---

## Core Tables

### Users & Auth

- **`users`** — id, supabase_id (FK auth.users), first_name, last_name, email, profile_image, is_anonymous, welcome_email_sent
- **`user_roles`** — id, user_id, role (admin/user)

### Books & Sessions (Programs)

- **`books`** — id, admin_id, slug (UNIQUE), name, duration_days, point configs per activity type
- **`book_sessions`** — id, book_id, duration_days, start_date, end_date (cohort instances)
- **`book_milestones`** — id, book_id, order, name, start_point, end_point (Day 9, 18, 27, 36, 45)
- **`session_enrollments`** — user_id, book_id, session_id + completion/streak tracking per activity type. UNIQUE(session_id, user_id)

### Journaling

- **`journals`** — session_id, book_id, user_id, entry_date, journal_type (morning/evening/weekly), mood_score, all entry fields, is_completed. UNIQUE(session_id, user_id, entry_date, journal_type)
- **`journal_entries`** — journal_id, content[], entry_type (affirmation/gratitude/excitement/dream)
- **`user_visions`** — user_id, session_id, vision_type (highest-self/mantra/creed/discovery), structured fields
- **`action_logs`** — DGA (Daily Gratitude Actions) + weekly challenge tracking with images
- **`meditations`** — user_id, session_id, reflection, entry_date
- **`journey`** — Life vision mapping across 16 life areas (romantic, family, career, financial, etc.)

### Cohorts

- **`cohorts`** — name, slug, session_id, start_date, end_date, max_members, is_active
- **`cohort_memberships`** — cohort_id, user_id, role (admin/moderator/member). UNIQUE(cohort_id, user_id)

---

## Payments & Monetization

- **`purchases`** — user_id (nullable), stripe_checkout_session_id (UNIQUE), stripe_payment_intent_id (UNIQUE), purchase_type (challenge/challenge_friend_code), amount_cents (99700), status (pending/completed/failed/refunded). **Trigger:** On completed → creates 2 friend codes + grants access.
- **`friend_codes`** — code (UNIQUE, format "FRIEND-XXXXXX"), creator_id, purchase_id, used_by_id, used_at, is_active, expires_at (90 days default). **RPC:** `redeem_friend_code(p_code, p_user_id)` — atomic validation + redemption.
- **`subscriptions`** — user_id, stripe_subscription_id (UNIQUE), status (active/past_due/canceled/unpaid/trialing), amount_cents, interval (month/year), current_period_start/end, cancel_at_period_end, trial_start/end. **Trigger:** Updates journal access on status change.
- **`user_entitlements`** — user_id (UNIQUE), has_challenge_access, challenge_access_type (purchased/friend_code), has_journal_access, journal_subscription_id, has_community_access (granted at Day 45)
- **`webhook_events`** — stripe_event_id (UNIQUE), event_type, status (processing/processed/failed), payload, error_message, attempts. Auto-cleanup: processed events > 30 days.

---

## Gamification

- **`badges`** — key (UNIQUE), name, description, icon, category (consistency/completion/speed/social/milestone/special), rarity (common→legendary), unlock_condition (JSONB), points_reward. 35+ pre-loaded badges.
- **`user_badges`** — user_id, badge_id, session_id, unlocked_at, is_showcased (max 3), is_new. UNIQUE(user_id, badge_id, session_id)
- **`multiplier_configs`** — name, multiplier_type, condition (JSONB), multiplier_value (1.0–2.0x), bonus_points. Streak-based: 7-day = 1.2x, 30-day = 2.0x.
- **`points_transactions`** — user_id, session_id, activity_type, base_points, multiplier, bonus_points, final_points, source_id, source_type, metadata

**Base Points:** morning_journal=10, evening_journal=10, weekly_journal=25, dga=15, vision=20

---

## Community

- **`community_posts`** — user_id, cohort_id, post_type (win/reflection/milestone/encouragement/question/celebration), title, content, media_urls[], visibility (private/cohort/public), reaction_count, comment_count, share_count, linked_journal_id, linked_badge_id
- **`post_comments`** — post_id, user_id, parent_comment_id (threaded), content, reaction_count
- **`post_reactions`** — post_id, user_id, reaction_type (cheer/fire/heart/celebrate/inspire/support). UNIQUE(post_id, user_id)
- **`profile_settings`** — user_id, bio, location, timezone, visibility toggles, notification preferences
- **`referral_codes`** — user_id (UNIQUE), code (UNIQUE, format "NAME-XXXX"), uses_count, total_points_earned
- **`referrals`** — referrer_id, referred_id, status (pending/converted/expired), points_awarded. UNIQUE(referred_id)
- **`referral_milestones`** — name, referrals_required, points_bonus, badge_id, reward_description

---

## Webinars & Video

- **`webinars`** — title, slug, hms_room_id, hms_room_code, hls_stream_url, status (draft/scheduled/live/ended), max_attendees, replay_available, chat_enabled, qa_enabled
- **`webinar_registrations`** — email, first_name, webinar_date, source, utm params, assessment data, reminder_sent. UNIQUE(email, webinar_date)
- **`webinar_attendance`** — webinar_id, user_id, email, joined_at, left_at, watch_duration_seconds, attended_live, watched_replay, converted_to_challenge
- **`webinar_qa`** — webinar_id, question, status (pending/approved/answered), answer_text, upvotes
- **`webinar_chat`** — webinar_id, message, is_host_message, is_pinned
- **`video_rooms`** — room_id (100ms ID), room_type (cohort_call/one_on_one/community_checkin/accountability_pod), title, host_id, scheduled times, status, recording settings
- **`video_room_participants`** — room_id, user_id, role, rsvp_status, joined_at, left_at, duration_seconds

---

## Assessments

- **`assessment_results`** — email, first_name, revenue_tier, prior_coaching, external_rating, 2am_thought, sacrifice data, five pillar scores (1-10 each), total_score (computed 5-50), interpretation (elite/gap/critical), lead_score (computed), readiness, priority_pillar, UTM tracking, conversion flags, time_to_complete

**Views:**

- `assessment_funnel_metrics` — Daily completion rates
- `high_priority_leads` — lead_score >= 25, not converted
- `assessment_score_distribution` — Score interpretation breakdown

---

## Email Drips & Automation

- **`drip_campaigns`** — name, trigger_event (webinar_registered/assessment_completed/purchase_completed), status
- **`drip_emails`** — campaign_id, sequence_order, delay_hours, subject, template_key. UNIQUE(campaign_id, sequence_order)
- **`drip_enrollments`** — campaign_id, email, user_id, current_step, status (active/completed/cancelled). UNIQUE(campaign_id, email)
- **`automation_events`** — event_type, user_id, email, payload (JSONB), processed flag
- **`automation_rules`** — trigger_event, conditions (JSONB), actions (JSONB array), priority

---

## Content & Courses

- **`content_items`** — title, content_type (video/document/audio/image), video_id (Bunny Stream), stream_url (HLS), storage_path, duration_seconds, transcript, visibility
- **`courses`** — title, description, thumbnail_url, is_published, difficulty_level, estimated_duration_minutes
- **`course_modules`** — course_id, title, sort_order, unlock_after_module_id
- **`course_lessons`** — module_id, content_id, title, sort_order, is_preview, is_required
- **`course_enrollments`** — course_id, user_id, status (active/completed/paused), progress_percent, completed_lessons_count. UNIQUE(course_id, user_id)
- **`user_content_progress`** — user_id, content_id, progress_percent, last_position_seconds (resume), is_completed, total_watch_time_seconds
- **`course_quizzes`** — lesson_id, passing_score (default 70), max_attempts, time_limit_minutes
- **`quiz_questions`** — quiz_id, question_text, question_type (multiple_choice/true_false/short_answer/multi_select)
- **`quiz_attempts`** — user_id, quiz_id, score, percentage, passed, attempt_number
- **`course_certificates`** — user_id, course_id, certificate_number (UNIQUE), pdf_url

---

## RLS Patterns

1. **Users CRUD own records:** `auth.uid() = user_id`
2. **Service role full access:** `FOR ALL TO service_role USING (true)`
3. **Cohort-based visibility:** Checks cohort_memberships for shared content
4. **Admin-only operations:** Verified via user_roles join
5. **Public read, auth write:** For shared content like badges, quotes

---

## Key Functions & Triggers

| Function                                  | Purpose                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `generate_friend_code()`                  | Creates "FRIEND-XXXXXX" format codes                             |
| `create_friend_code_for_purchase()`       | TRIGGER: On purchase completed → creates 2 codes + grants access |
| `redeem_friend_code(code, user_id)`       | Atomic code validation + redemption + access grant               |
| `grant_challenge_access(user_id, type)`   | Upserts user_entitlements row                                    |
| `calculate_quiz_score(attempt_id)`        | Returns score, percentage, passed status                         |
| `get_user_upcoming_rooms(user_id, limit)` | Upcoming video rooms for user                                    |
| `generate_referral_code(user_id)`         | Creates "NAME-XXXX" referral codes                               |
| `sync_confirmed_at()`                     | TRIGGER: Keeps auth.users.confirmed_at in sync                   |
