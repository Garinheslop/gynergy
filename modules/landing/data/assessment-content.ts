import type { AssessmentQuestion, AssessmentInterpretation, AssessmentContent } from "../types";

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    pillar: "Wealth",
    question:
      "Is your money creating freedom, or has your success become an obligation that owns you?",
    lowLabel: "Trapped by success",
    highLabel: "True freedom",
  },
  {
    pillar: "Health",
    question:
      "Do you have real energy and vitality, or are you running on caffeine, willpower, and fumes?",
    lowLabel: "Running on fumes",
    highLabel: "Peak vitality",
  },
  {
    pillar: "Relationships",
    question:
      "Are the people closest to you getting closer, or are you drifting apart while pretending everything's fine?",
    lowLabel: "Drifting apart",
    highLabel: "Growing closer",
  },
  {
    pillar: "Growth",
    question:
      "Are you still being challenged and growing as a man, or have you plateaued and started coasting?",
    lowLabel: "Coasting",
    highLabel: "Actively growing",
  },
  {
    pillar: "Purpose",
    question: "Does your success mean something beyond your bank account, or is it hollow?",
    lowLabel: "Hollow success",
    highLabel: "Deep meaning",
  },
];

export const ASSESSMENT_INTERPRETATIONS: AssessmentInterpretation[] = [
  {
    range: [40, 50],
    interpretation: "elite",
    message:
      "You're in the top 8%. Most men never hit this. Come to the training to mentor others — and go even deeper.",
  },
  {
    range: [25, 39],
    interpretation: "gap",
    message:
      "You're in 'The Gap.' One or two pillars are silently sabotaging the others. Men who score here often guess wrong about which pillar is bleeding. The training will show you exactly where to focus first.",
  },
  {
    range: [0, 24],
    interpretation: "critical",
    message:
      "You need to be in that room. This isn't a suggestion — it's a necessity. Men who score below 25 typically have 3+ pillars in crisis. The good news: they also see the fastest transformation.",
  },
];

export const ASSESSMENT_CONTENT: AssessmentContent = {
  title: "Five Pillar Self-Assessment",
  subtitle: "5 questions. 2 minutes. The number will haunt you.",
  instruction: "Rate each area of your life from 1-10. Be honest.",
  completionCTA: "Write this number down. Bring it to the webinar.",
  shareText: "I just discovered why I've been feeling empty. My score: {score}/50. What's yours?",
};

/**
 * Get the interpretation for a given score
 */
export function getInterpretation(score: number): AssessmentInterpretation | undefined {
  return ASSESSMENT_INTERPRETATIONS.find(
    (interp) => score >= interp.range[0] && score <= interp.range[1]
  );
}

/**
 * Generate an .ics calendar file content for the webinar
 */
export function generateCalendarInvite(eventDate: Date, eventTitle: string): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startDate = new Date(eventDate);
  const endDate = new Date(eventDate.getTime() + 90 * 60 * 1000); // 90 minutes

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GYNERGY//Webinar//EN
BEGIN:VEVENT
UID:${Date.now()}@gynergy.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${eventTitle}
DESCRIPTION:Free Live Training: The 5 Pillars of Integrated Power with Garin Heslop. Bring your Five Pillar Assessment score!
URL:https://gynergy.app/webinar
END:VEVENT
END:VCALENDAR`;
}
