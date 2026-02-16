"use client";

import { cn } from "@lib/utils/style";

import { PROBLEM_CONTENT } from "../../data/content";
import { SectionWrapper, SectionLabel, SectionTitle } from "../shared";

export default function ProblemSection() {
  const { multiplierExample } = PROBLEM_CONTENT;

  return (
    <SectionWrapper id="problem">
      <SectionLabel>The Diagnosis</SectionLabel>

      <SectionTitle>
        {PROBLEM_CONTENT.headline}
        <br />
        <span className="text-lp-gold-light">{PROBLEM_CONTENT.subheadline}</span>
      </SectionTitle>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Left: Text */}
        <div>
          {PROBLEM_CONTENT.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={cn(
                "font-oswald text-lp-gray text-base leading-relaxed font-extralight",
                i < PROBLEM_CONTENT.paragraphs.length - 1 && "mb-5"
              )}
            >
              {i === 2 ? (
                <>
                  {paragraph.split("Corner office. Hollow heart.")[0]}
                  <strong className="text-lp-white font-medium">
                    Corner office. Hollow heart.
                  </strong>
                  {paragraph.split("Corner office. Hollow heart.")[1]}
                </>
              ) : (
                paragraph
              )}
            </p>
          ))}
        </div>

        {/* Right: Integration Multiplier */}
        <div className="bg-lp-card border-lp-border border p-6 lg:p-8">
          <h3 className="font-oswald text-lp-gold mb-6 text-xs font-normal tracking-[0.3em] uppercase">
            The Integration Multiplier
          </h3>

          {/* Bars */}
          <div className="mb-6 flex flex-col gap-3">
            {multiplierExample.scores.map(({ pillar, score, isLow }) => (
              <div key={pillar} className="flex items-center gap-3">
                <span className="font-oswald text-lp-white min-w-[120px] text-xs font-normal tracking-wider uppercase">
                  {pillar}
                </span>
                <div
                  className={cn(
                    "relative h-6 rounded-sm transition-all duration-600",
                    isLow
                      ? "from-lp-danger-dark to-lp-danger-light bg-gradient-to-r"
                      : "from-lp-gold to-lp-gold-light bg-gradient-to-r"
                  )}
                  style={{ width: `${score * 10}%` }}
                >
                  <span
                    className={cn(
                      "font-bebas text-lp-white absolute top-1/2 right-2 -translate-y-1/2 text-base",
                      isLow && "text-lp-danger"
                    )}
                  >
                    {score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Equation */}
          <div className="font-bebas text-lp-muted mb-4 text-lg tracking-wide">
            {multiplierExample.scores.map(({ score, isLow }, i) => (
              <span key={i}>
                <span className={isLow ? "text-lp-danger" : "text-lp-gold-light"}>{score}</span>
                {i < multiplierExample.scores.length - 1 && " × "}
              </span>
            ))}
            {" = "}
            <span className="text-lp-danger">fractured</span>
          </div>

          {/* Insight */}
          <div className="border-lp-border border-t pt-5">
            <p className="font-oswald text-lp-gray text-sm leading-relaxed font-extralight">
              That &ldquo;3&rdquo; in relationships and &ldquo;2&rdquo; in purpose aren&apos;t just
              weaknesses — they&apos;re{" "}
              <strong className="text-lp-white font-medium">
                dividing everything else by a fraction.
              </strong>{" "}
              Your 9 in wealth means nothing when your purpose is a 2. Integration multiplies.
              Fragmentation destroys.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
