# GYNERGY — Funnel Strategy & Email Sequences

## Complete Funnel Map

```
                    ┌─────────────────────┐
                    │   TRAFFIC SOURCES    │
                    │  (Ads, Social, SEO)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
    ┌─────────────┐  ┌────────────────┐  ┌──────────────┐
    │ /assessment  │  │  /webinar      │  │  / (landing)  │
    │ Free Quiz    │  │  Free Training │  │  Sales Page   │
    │ 23 questions │  │  Registration  │  │  $997 offer   │
    └──────┬──────┘  └───────┬────────┘  └──────┬───────┘
           │                 │                   │
     Email Report      Conf Email +         Exit Intent
     + Drip (2)        Drip (3)              Popup
           │                 │                   │
           └────────┬────────┘                   │
                    ↓                            │
             ┌─────────────┐                     │
             │  Live Event  │                    │
             │  (100ms)     │                    │
             └──────┬──────┘                     │
                    └──────────┬─────────────────┘
                               ↓
                    ┌─────────────────────┐
                    │   STRIPE CHECKOUT    │
                    │   $997 one-time      │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │  /payment/success    │
                    │  + 2 Friend Codes    │
                    │  + Onboarding Drip   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼──────────────┐
              ↓                ↓              ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Journal     │  │  Community   │  │  Friend Code │
    │  (core app)  │  │  (retention) │  │  (viral loop)│
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Three Funnels

### Funnel A: Assessment → Webinar → Purchase

1. Traffic lands on `/assessment`
2. User completes 23-question Five Pillar Assessment
3. Submits email → receives personalized HTML report email
4. Enrolled in **Assessment Drip** (2 emails over 4 days)
5. CTA drives to webinar or landing page
6. User registers for `/webinar` (free live training)
7. Confirmation email with calendar invite sent
8. Enrolled in **Webinar Drip** (3 emails: pre-assignment, objection handling, reminder)
9. Attends live webinar (100ms) or receives follow-up email
10. CTA drives to landing page → Stripe checkout → purchase

### Funnel B: Direct Landing → Purchase

1. Traffic lands on `/` (main sales page)
2. Full long-form page: Hero → Problem → Pillars → Timeline → Proof → VSL → Pricing → FAQ
3. Exit intent popup captures email if they try to leave
4. Sticky mobile CTA follows on scroll
5. CTA → Stripe checkout → purchase

### Funnel C: Friend Code Viral Loop

1. Purchaser receives 2 friend codes on success page
2. Shares via native share or copy-to-clipboard
3. Friend visits `/pricing?code=FRIEND-XXXXXX`
4. Validates + redeems code (must authenticate)
5. Gets full challenge access for free
6. Both receive email notifications

---

## Landing Page Sections (in order)

| Section              | Purpose                       | Key Element                                     |
| -------------------- | ----------------------------- | ----------------------------------------------- |
| HeroSection          | Headline + CTA + social proof | "45-Day Awakening Challenge" + next cohort date |
| ProblemSection       | Identify the pain             | Integration Multiplier math (9×8×3×7×2)         |
| FivePillarsSection   | Introduce framework           | 5 pillar cards with descriptions                |
| QualificationSection | Self-select audience          | "This is for you if..." / "Not for you if..."   |
| TimelineSection      | Show the 45-day journey       | Week-by-week breakdown                          |
| SocialProofSection   | Build trust                   | 6 testimonials with specific results            |
| VSLSection           | Video sales letter            | iframe embed (YouTube/Vimeo)                    |
| WhatsIncludedSection | Justify value                 | Curriculum breakdown                            |
| PricingSection       | Convert                       | $4,294 value → $997 with trust indicators       |
| BringAFriendSection  | Accountability Trio           | Group completion research + friend code         |
| GrandPrizeSection    | Additional incentive          | $21,500 LVL 5 LIFE membership                   |
| GuaranteeSection     | Remove risk                   | "The Garin-Tee" — 45-day refund                 |
| FinalCTASection      | Last push                     | Mortality math + final CTA                      |
| FAQSection           | Handle objections             | 11 questions with answers                       |
| ExitIntentPopup      | Capture abandoners            | Email capture on mouse exit                     |
| StickyMobileCTA      | Mobile conversion             | Floating price + CTA button                     |

---

## Webinar Page Sections (in order)

| Section                  | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| WebinarHeroSection       | Headline + video + registration form + countdown |
| WebinarLearnSection      | 3 takeaways (template, score, equation)          |
| WebinarValueStackSection | 4 value items with badges                        |
| WebinarProofSection      | Featured quote + 5 testimonials                  |
| WebinarBonusSection      | Instant Five Pillar Assessment bonus             |
| WebinarRegisterSection   | Registration form + scarcity + countdown         |
| WebinarFinalCTASection   | Objection busters + final form + guarantee       |

---

## Email Sequences (All That Exist)

### 1. Webinar Registration Drip (3 emails)

| #   | Timing                 | Subject                                          | Purpose                     |
| --- | ---------------------- | ------------------------------------------------ | --------------------------- |
| 1   | 24h after registration | "Your pre-webinar assignment"                    | Drive assessment completion |
| 2   | 72h after              | "The #1 reason men don't show up"                | Objection handling          |
| 3   | 120h after             | "Quick reminder: {{webinar_title}} is coming up" | Final attendance push       |

### 2. Assessment Completion Drip (2 emails)

| #   | Timing    | Subject                                            | Purpose                      |
| --- | --------- | -------------------------------------------------- | ---------------------------- |
| 1   | 48h after | "Your {{lowest_pillar}} score is holding you back" | Pain point + challenge CTA   |
| 2   | 96h after | "What men who scored {{score}} did next"           | Social proof + challenge CTA |

### 3. Purchase Completion Drip (3 emails)

| #   | Timing          | Subject                                  | Purpose                                          |
| --- | --------------- | ---------------------------------------- | ------------------------------------------------ |
| 1   | 24h after       | "Day 0: How to get the most out of this" | Onboarding (alarm, tell someone, read Date Zero) |
| 2   | 72h after       | "Your first 3 days matter most"          | Normalize awkwardness, build habit               |
| 3   | 168h (7d) after | "Week 1 check-in: How are you feeling?"  | Celebrate + metrics check + look ahead           |

### 4. Transactional Emails

| Trigger               | Email                          | Details                                       |
| --------------------- | ------------------------------ | --------------------------------------------- |
| New signup (OAuth)    | Welcome email                  | Sent via auth callback                        |
| Purchase confirmed    | Confirmation email             | Product name, amount, friend codes            |
| Friend code redeemed  | Notification to creator        | "{Name} just joined using your code!"         |
| Webinar registered    | Confirmation + calendar invite | ICS + Google Cal links                        |
| Webinar 24h/1h before | Reminder emails                | Different copy for assessment complete vs not |
| Webinar post-event    | Follow-up (attended vs missed) | Different paths + CTAs                        |
| Assessment completed  | Personalized report email      | Full HTML with scores, patterns, insights     |

### 5. Email Tracking

- Open tracking: 1x1 transparent pixel
- Click tracking: Base64-encoded URL redirects with UTM parameters
- Unique email IDs per send

---

## Conversion Optimization Elements

| Element                | Component             | Status                                          |
| ---------------------- | --------------------- | ----------------------------------------------- |
| Exit intent popup      | `ExitIntentPopup.tsx` | Built — captures email on mouse exit            |
| Sticky mobile CTA      | `StickyMobileCTA.tsx` | Built — floating price + button                 |
| Countdown timer        | `CountdownTimer.tsx`  | Built — configurable target date                |
| Scarcity messaging     | Landing + Webinar     | 15 seats / 100 seats displayed                  |
| Trust indicators       | PricingSection        | Secure checkout, 14-day guarantee, Stripe badge |
| Confetti celebration   | PaymentSuccessClient  | Built — on purchase completion                  |
| Real-time seat counter | Webinar page          | Polls /api/webinar/seats every 30s              |

---

## Assessment as Lead Gen

The Five Pillar Assessment (23 questions, ~12 min) serves as:

1. **Lead qualification** — Captures email, revenue tier, readiness level
2. **Self-confrontation** — Makes the pain tangible with a specific score
3. **Open loop** — "The number will sit in your chest until we meet"
4. **Personalization** — Drip emails reference their specific lowest pillar and score
5. **Segmentation** — Lead score = Revenue × Readiness × Gap severity (max 180)

**Post-assessment flow:** Submit → personalized report email → enrolled in assessment drip → CTA to webinar or challenge

---

## Gaps / Missing Pieces (Identified in Audit)

| Missing                         | Impact                                                    |
| ------------------------------- | --------------------------------------------------------- |
| Upsell page (post-purchase)     | No revenue expansion after $997                           |
| Downsell page                   | No fallback offer for checkout abandoners                 |
| Webinar replay page             | Missed attendees have no catch-up path                    |
| Cart abandonment emails         | No recovery for started-but-not-completed Stripe sessions |
| Journal subscription sales page | No dedicated pitch for $39.95/mo product                  |
| Win-back / re-engagement emails | No retention for inactive users                           |
| Milestone celebration emails    | No automated Day 7/14/21/30/45 celebrations               |
| Referral reminder emails        | No prompt to share friend codes after purchase            |
| Community activation emails     | No onboarding when community access is granted            |
| Blog / SEO content              | No organic search funnel                                  |
