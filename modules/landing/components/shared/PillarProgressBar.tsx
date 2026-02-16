"use client";

import { cn } from "@lib/utils/style";

import type { PriorityPillar } from "../../data/assessment-v3-content";

interface PillarProgressBarProps {
  currentSection: 1 | 2 | 3 | 4;
  currentPillar?: PriorityPillar;
  questionInSection: number; // 1-indexed position within the section
  className?: string;
}

const PILLARS: Array<{
  id: PriorityPillar;
  name: string;
  icon: string;
}> = [
  { id: "wealth", name: "Wealth", icon: "💰" },
  { id: "health", name: "Health", icon: "❤️" },
  { id: "relationships", name: "Relationships", icon: "👥" },
  { id: "growth", name: "Growth", icon: "🌱" },
  { id: "purpose", name: "Purpose", icon: "🎯" },
];

const SECTIONS = [
  { id: 1, name: "Dream", icon: "✨" },
  { id: 2, name: "Reality", icon: "📍" },
  { id: 3, name: "Pillars", icon: "🏛️" },
  { id: 4, name: "Truth", icon: "🌙" },
];

export default function PillarProgressBar({
  currentSection,
  currentPillar,
  questionInSection,
  className,
}: PillarProgressBarProps) {
  // For section 3, show pillar progress
  if (currentSection === 3 && currentPillar) {
    const currentPillarIndex = PILLARS.findIndex((p) => p.id === currentPillar);

    return (
      <div className={cn("w-full", className)}>
        {/* Section indicator */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="font-oswald text-lp-muted text-xs tracking-wider uppercase">
            Section 3 of 4
          </span>
          <span className="text-lp-gold">•</span>
          <span className="font-oswald text-lp-gold text-xs tracking-wider uppercase">
            Five Pillars
          </span>
        </div>

        {/* Pillar progress bar */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {PILLARS.map((pillar, index) => {
            const isCompleted = index < currentPillarIndex;
            const isCurrent = index === currentPillarIndex;
            const isUpcoming = index > currentPillarIndex;

            // Calculate progress within current pillar (3 questions each)
            let pillarProgress = 0;
            if (isCompleted) pillarProgress = 100;
            else if (isCurrent) pillarProgress = ((questionInSection - 1) / 3) * 100;

            return (
              <div key={pillar.id} className="flex flex-1 flex-col items-center">
                {/* Pillar icon and name */}
                <div
                  className={cn(
                    "flex flex-col items-center transition-all duration-300",
                    isCurrent && "scale-110"
                  )}
                >
                  <span
                    className={cn(
                      "text-lg transition-opacity duration-300 sm:text-xl",
                      isUpcoming && "opacity-40"
                    )}
                    role="img"
                    aria-label={pillar.name}
                  >
                    {pillar.icon}
                  </span>
                  <span
                    className={cn(
                      "font-oswald mt-1 text-[10px] tracking-wider uppercase transition-colors duration-300 sm:text-xs",
                      isCompleted && "text-lp-gold",
                      isCurrent && "text-lp-white font-medium",
                      isUpcoming && "text-lp-muted"
                    )}
                  >
                    {pillar.name}
                  </span>
                </div>

                {/* Progress bar for this pillar */}
                <div
                  className={cn(
                    "mt-2 h-1 w-full overflow-hidden rounded-full",
                    isUpcoming ? "bg-lp-border/50" : "bg-lp-border"
                  )}
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out",
                      isCompleted && "bg-lp-gold",
                      isCurrent && "from-lp-gold to-lp-gold-light bg-gradient-to-r"
                    )}
                    style={{ width: `${pillarProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Current pillar detail */}
        <div className="mt-4 text-center">
          <span className="font-oswald text-lp-muted text-xs">
            Question {questionInSection} of 3 in{" "}
          </span>
          <span className="font-oswald text-lp-gold text-xs font-medium">
            {PILLARS[currentPillarIndex]?.name}
          </span>
        </div>
      </div>
    );
  }

  // For other sections, show section progress
  return (
    <div className={cn("w-full", className)}>
      {/* Section progress bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {SECTIONS.map((section) => {
          const isCompleted = section.id < currentSection;
          const isCurrent = section.id === currentSection;
          const isUpcoming = section.id > currentSection;

          return (
            <div key={section.id} className="flex flex-1 flex-col items-center">
              {/* Section icon and name */}
              <div
                className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  isCurrent && "scale-110"
                )}
              >
                <span
                  className={cn(
                    "text-lg transition-opacity duration-300 sm:text-xl",
                    isUpcoming && "opacity-40"
                  )}
                  role="img"
                  aria-label={section.name}
                >
                  {section.icon}
                </span>
                <span
                  className={cn(
                    "font-oswald mt-1 text-[10px] tracking-wider uppercase transition-colors duration-300 sm:text-xs",
                    isCompleted && "text-lp-gold",
                    isCurrent && "text-lp-white font-medium",
                    isUpcoming && "text-lp-muted"
                  )}
                >
                  {section.name}
                </span>
              </div>

              {/* Progress indicator */}
              <div
                className={cn(
                  "mt-2 h-1 w-full overflow-hidden rounded-full",
                  isUpcoming ? "bg-lp-border/50" : "bg-lp-border"
                )}
              >
                <div
                  className={cn(
                    "h-full transition-all duration-500 ease-out",
                    isCompleted && "bg-lp-gold w-full",
                    isCurrent && "from-lp-gold to-lp-gold-light bg-gradient-to-r"
                  )}
                  style={{
                    width: isCurrent
                      ? `${(questionInSection / getSectionQuestionCount(currentSection)) * 100}%`
                      : isCompleted
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Current section detail */}
      <div className="mt-4 text-center">
        <span className="font-oswald text-lp-gold text-xs font-medium">
          {SECTIONS[currentSection - 1]?.name}
        </span>
        <span className="font-oswald text-lp-muted text-xs">
          {" "}
          • Question {questionInSection} of {getSectionQuestionCount(currentSection)}
        </span>
      </div>
    </div>
  );
}

function getSectionQuestionCount(section: number): number {
  switch (section) {
    case 1:
      return 3; // The Dream
    case 2:
      return 3; // The Reality
    case 3:
      return 15; // Five Pillars (3 × 5)
    case 4:
      return 2; // Hidden Self
    default:
      return 1;
  }
}
