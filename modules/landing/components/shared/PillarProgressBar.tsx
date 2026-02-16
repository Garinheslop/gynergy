"use client";

import { cn } from "@lib/utils/style";

import type { PriorityPillar } from "../../data/assessment-v3-content";

// ============================================
// PROFESSIONAL SVG ICONS
// ============================================

function WealthIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function HealthIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function RelationshipsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GrowthIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

function PurposeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function DreamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function RealityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function PillarsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function TruthIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ============================================
// ICON COMPONENTS MAP
// ============================================

const PILLAR_ICONS: Record<PriorityPillar, React.FC<{ className?: string }>> = {
  wealth: WealthIcon,
  health: HealthIcon,
  relationships: RelationshipsIcon,
  growth: GrowthIcon,
  purpose: PurposeIcon,
};

const SECTION_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: DreamIcon,
  2: RealityIcon,
  3: PillarsIcon,
  4: TruthIcon,
};

// ============================================
// DATA
// ============================================

interface PillarProgressBarProps {
  currentSection: 1 | 2 | 3 | 4;
  currentPillar?: PriorityPillar;
  questionInSection: number;
  className?: string;
}

const PILLARS: Array<{ id: PriorityPillar; name: string }> = [
  { id: "wealth", name: "Wealth" },
  { id: "health", name: "Health" },
  { id: "relationships", name: "Relationships" },
  { id: "growth", name: "Growth" },
  { id: "purpose", name: "Purpose" },
];

const SECTIONS = [
  { id: 1, name: "Dream" },
  { id: 2, name: "Reality" },
  { id: 3, name: "Pillars" },
  { id: 4, name: "Truth" },
];

// ============================================
// COMPONENT
// ============================================

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

            const IconComponent = PILLAR_ICONS[pillar.id];

            return (
              <div key={pillar.id} className="flex flex-1 flex-col items-center">
                {/* Pillar icon and name */}
                <div
                  className={cn(
                    "flex flex-col items-center transition-all duration-300",
                    isCurrent && "scale-110"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-5 w-5 transition-all duration-300 sm:h-6 sm:w-6",
                      isCompleted && "text-lp-gold",
                      isCurrent && "text-lp-gold-light",
                      isUpcoming && "text-lp-muted opacity-40"
                    )}
                  />
                  <span
                    className={cn(
                      "font-oswald mt-1.5 text-[10px] tracking-wider uppercase transition-colors duration-300 sm:text-xs",
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

          const IconComponent = SECTION_ICONS[section.id];

          return (
            <div key={section.id} className="flex flex-1 flex-col items-center">
              {/* Section icon and name */}
              <div
                className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  isCurrent && "scale-110"
                )}
              >
                <IconComponent
                  className={cn(
                    "h-5 w-5 transition-all duration-300 sm:h-6 sm:w-6",
                    isCompleted && "text-lp-gold",
                    isCurrent && "text-lp-gold-light",
                    isUpcoming && "text-lp-muted opacity-40"
                  )}
                />
                <span
                  className={cn(
                    "font-oswald mt-1.5 text-[10px] tracking-wider uppercase transition-colors duration-300 sm:text-xs",
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
