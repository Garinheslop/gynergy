# GYNERGY — Five Pillar Assessment Deep Dive

## Overview

The Five Pillar Self-Assessment is the primary lead generation tool. Three versions exist:

| Version       | Questions | Duration | Purpose                                   |
| ------------- | --------- | -------- | ----------------------------------------- |
| V1 (Quick)    | 5         | 2 min    | Rapid score on webinar page               |
| V2 (Detailed) | 16        | 8 min    | Full emotional + pillar breakdown         |
| V3 (Premium)  | 23        | 12 min   | Maximum personalization + pattern reveals |

**Current active version: V3** (at `/assessment`)

---

## V3 Assessment Structure (23 Questions)

### Section 1: The Dream (3 Questions)

1. **Vision Goal** — What do you actually want?
   - Financial freedom, Time sovereignty, Deeper relationships, Health & vitality, Meaningful impact, Inner peace
2. **Driving Motivation** — What's underneath?
   - Escaping, Proving something, Family legacy, Personal transformation, Making a difference, Finding myself
3. **Success Definition** — How will you know?
   - Number in bank, Schedule freedom, Fully present with family, Health, People helped, Inner fulfillment

### Section 2: The Reality (3 Questions)

4. **External Rating** — How would strangers rate your life? (1-10 slider)
5. **Revenue Tier** — Business revenue ($250K → $10M+)
6. **Prior Coaching** — Investment in personal development (Never → $15K+)

### Section 3: Five Pillars (15 Questions — 3 per Pillar)

**Wealth:** 7. Freedom slider (1-10): "Do you FEEL free?" 8. Wealth relationship: Slave → Anxious → Never enough → Comfortable → Genuinely free 9. Work-life: Work is life → Balancing → Business owns me → Boundaries → Integrated flow

**Health:** 10. Vitality slider (1-10): "Gift or burden?" 11. Energy: Exhausted → Caffeine → Afternoon crash → Inconsistent → Steady 12. Body connection: Disconnected → Pain only → Ignore → Learning → Fully connected

**Relationships:** 13. Depth slider (1-10): "Do they SEE the real you?" 14. Presence: Physically there → Distracted → Rare moments → Improving → Fully present 15. Vulnerability: Never → Surface → Few people → Learning → Openly authentic

**Growth:** 16. Aliveness slider (1-10): "Are you challenged?" 17. Challenge level: Coasting → Busy → Wrong direction → Intentionally growing → At edge 18. Learning: No time → Consuming not applying → Sporadic → Consistent → Always

**Purpose:** 19. Clarity slider (1-10): "What remains beyond achievements?" 20. Legacy: Never thought → Scared → Unclear → Emerging → Crystal clear 21. Impact: Money only → Secondary → Want more → Making difference → Deeply meaningful

### Section 4: Hidden Self (2 Questions)

22. **2am Thought** — The fear you'd never admit:
    - "Was all this worth it?"
    - "I don't know who I am outside of work"
    - "My family would be better off with my money than me"
    - "I'm terrified of what happens when I slow down"
    - "I'm performing success I don't even want"
23. **Readiness** — Willingness to change:
    - Just curious → Scared but aware → Ready to explore → Ready to invest → Desperate

---

## Scoring

### Total Score

Sum of 5 slider questions: wealth_freedom + health_vitality + relationships_depth + growth_aliveness + purpose_clarity

**Score range: 5-50**

### Interpretation

| Range | Label        | Meaning                                                       |
| ----- | ------------ | ------------------------------------------------------------- |
| 40-50 | **Elite**    | Top 8% — Come to deepen and mentor others                     |
| 25-39 | **Gap**      | One or two pillars silently sabotaging the others             |
| 0-24  | **Critical** | Multiple pillars in crisis — fastest transformation potential |

### Lead Score

`Revenue tier (1-6) × Readiness (1-10) × Gap severity (1-3)`

- **Max:** 180
- **High priority:** >= 25 and not yet converted

---

## Dynamic Pattern Reveals

The V3 assessment generates 6-8 pattern insights based on answer combinations:

| Pattern                    | Trigger                                        | Insight                                                      |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **The Time Paradox**       | Want time sovereignty BUT work is life         | You want freedom but can't stop building the cage            |
| **The Intimacy Block**     | Want deeper relationships BUT never vulnerable | The wall you built to succeed is the wall keeping people out |
| **The Provider Trap**      | Family is motivation BUT physically absent     | You're building FOR them while being absent FROM them        |
| **The Golden Cage**        | $5M+ revenue BUT low growth aliveness          | You've built a beautiful prison                              |
| **The Fulfillment Gap**    | Define success as fulfillment BUT low purpose  | You know the answer but haven't lived it yet                 |
| **The Disconnection Loop** | Exhausted AND disconnected from body           | You've outsourced your body's signals to your calendar       |
| **The Performance Trap**   | Success = numbers BUT feel fraudulent          | The scoreboard says winning, the mirror says otherwise       |
| **The Identity Crisis**    | Lost self + seeking transformation             | The man who built everything needs to meet the man inside    |

---

## Readiness-Based CTA Responses

| Level            | Label     | Message                                                          | CTA Text                       | Urgency |
| ---------------- | --------- | ---------------------------------------------------------------- | ------------------------------ | ------- |
| Just curious     | Curious   | "Curiosity is the crack in the armor..."                         | Save Your Seat (No Obligation) | Soft    |
| Scared but aware | Scared    | "Fear is the doorway. Every transformed man felt this."          | Face It — Save Your Seat       | Medium  |
| Ready to explore | Explorer  | "You want to see the path first."                                | See the Path — Register Free   | Medium  |
| Ready to invest  | Ready     | "You're not shopping — you're ready to move."                    | Register for Training          | Strong  |
| Desperate        | Desperate | "Something has to give. Men from desperation transform fastest." | I Need This — Register Now     | Strong  |

---

## Priority Pillar Insights

When user selects which pillar to fix first:

| Pillar            | Insight                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Wealth**        | Restructure your relationship to what you've built. Freedom = space for relationships, energy for health, foundation for purpose. |
| **Health**        | Everything runs on energy. Your body is the foundation the other pillars stand on.                                                |
| **Relationships** | Connection is the multiplier. When people truly SEE you, everything changes.                                                      |
| **Growth**        | New challenge wakes everything up. Being interesting again deepens relationships, returns purpose.                                |
| **Purpose**       | Meaning changes grind into mission. Purpose deepens relationships, improves health, connects to something larger.                 |

---

## Post-Assessment Flow

1. User submits assessment → POST `/api/assessment/submit`
2. Scores calculated (total, interpretation, lead score, lowest pillar)
3. Personalized HTML report email sent (full pillar breakdown, pattern reveals, readiness response)
4. User enrolled in Assessment Completion drip campaign
5. User redirected to CTA (webinar registration or challenge purchase)
6. Admin can see: funnel metrics, high-priority leads, score distribution via assessment_results views

---

## Assessment Report Email Contents

The personalized report includes:

- Large score display (e.g., "27/50")
- Interpretation label with context
- Contrast section (if external rating high but score low)
- 2am thought reflection (mirrors their answer back with insight)
- Time since presence section (with hours context)
- Sacrifices they selected
- Body tension locations
- V3 pattern reveals (from dynamic analysis)
- Individual pillar scores with visual progress bars
- The multiplier equation with THEIR numbers
- Priority pillar insight
- Readiness-based closing CTA
- P.S. with specific body tension guidance

**Email tracking:** Open pixel + click tracking on all CTAs
**Design:** Dark theme, teal accent (#7dd3c0), gold for assessment reports (#b8943e)
