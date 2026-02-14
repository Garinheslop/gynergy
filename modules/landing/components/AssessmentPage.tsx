"use client";

import { useState, useCallback, useEffect } from "react";

import { cn } from "@lib/utils/style";

import { CTAButton } from "./shared";
import {
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_CONTENT,
  getInterpretation,
  generateCalendarInvite,
} from "../data/assessment-content";
import { WEBINAR_HERO_CONTENT } from "../data/webinar-content";
import type { PillarName } from "../types";

// SVG Icons
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

type AssessmentState = "intro" | "questions" | "results";

interface PillarScores {
  Wealth: number;
  Health: number;
  Relationships: number;
  Growth: number;
  Purpose: number;
}

const STORAGE_KEY = "gynergy_assessment_result";

export default function AssessmentPage() {
  const [state, setState] = useState<AssessmentState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<PillarScores>({
    Wealth: 5,
    Health: 5,
    Relationships: 5,
    Growth: 5,
    Purpose: 5,
  });
  const [hasExistingResult, setHasExistingResult] = useState(false);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  // Check for existing result on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const result = JSON.parse(stored);
        if (result.totalScore) {
          setHasExistingResult(true);
          setExistingScore(result.totalScore);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, []);

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const interpretation = getInterpretation(totalScore);

  const handleSliderChange = useCallback((pillar: PillarName, value: number) => {
    setScores((prev) => ({ ...prev, [pillar]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Save result to localStorage
      const result = {
        pillarScores: scores,
        totalScore,
        interpretation: interpretation?.interpretation,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      setState("results");
    }
  }, [currentQuestion, scores, totalScore, interpretation]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleStartAssessment = useCallback(() => {
    setState("questions");
    setCurrentQuestion(0);
    // Reset scores for retake
    setScores({
      Wealth: 5,
      Health: 5,
      Relationships: 5,
      Growth: 5,
      Purpose: 5,
    });
  }, []);

  const handleDownloadCalendar = useCallback(() => {
    const icsContent = generateCalendarInvite(
      WEBINAR_HERO_CONTENT.eventDate,
      WEBINAR_HERO_CONTENT.eventTitle
    );
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gynergy-webinar.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(() => {
    const shareText = ASSESSMENT_CONTENT.shareText.replace("{score}", String(totalScore));
    const shareUrl = `${globalThis.location.origin}/assessment`;

    if (navigator.share) {
      navigator.share({
        title: ASSESSMENT_CONTENT.title,
        text: shareText,
        url: shareUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Link copied to clipboard!");
    }
  }, [totalScore]);

  const currentQ = ASSESSMENT_QUESTIONS[currentQuestion];

  return (
    <div
      className={cn(
        "text-lp-white font-oswald",
        "relative min-h-screen",
        "flex flex-col items-center justify-center",
        "px-6 py-12"
      )}
      style={{
        background: `
          radial-gradient(ellipse 50% 42% at 50% 45%, rgba(184,148,62,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 100% 100% at 50% 50%, #0D0C0A 0%, #050505 80%)
        `,
      }}
    >
      {/* Corner Accents */}
      <div className="absolute top-5 left-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 left-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
      </div>
      <div className="absolute top-5 right-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute top-0 right-0 h-full w-px bg-gradient-to-b to-transparent" />
        <div className="from-lp-gold/30 absolute top-0 right-0 h-px w-full bg-gradient-to-l to-transparent" />
      </div>
      <div className="absolute bottom-5 left-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute bottom-0 left-0 h-full w-px bg-gradient-to-t to-transparent" />
        <div className="from-lp-gold/30 absolute bottom-0 left-0 h-px w-full bg-gradient-to-r to-transparent" />
      </div>
      <div className="absolute right-5 bottom-5 h-12 w-12">
        <div className="from-lp-gold/30 absolute right-0 bottom-0 h-full w-px bg-gradient-to-t to-transparent" />
        <div className="from-lp-gold/30 absolute right-0 bottom-0 h-px w-full bg-gradient-to-l to-transparent" />
      </div>

      {/* Intro State */}
      {state === "intro" && (
        <div className="relative z-10 max-w-[500px] text-center">
          {/* Brand */}
          <div className="font-oswald text-lp-gold mb-1 text-sm font-normal tracking-[0.5em] uppercase">
            G Y N E R G Y
          </div>
          <div className="font-oswald text-lp-gold/40 mb-6 text-2xl font-extralight">&infin;</div>

          <h1 className="font-bebas text-lp-white mb-4 text-4xl md:text-5xl">
            {ASSESSMENT_CONTENT.title}
          </h1>

          <p className="font-oswald text-lp-gray mb-8 text-lg font-extralight">
            {ASSESSMENT_CONTENT.subtitle}
          </p>

          {hasExistingResult && existingScore !== null ? (
            <div className="bg-lp-card border-lp-border mb-8 border p-6">
              <p className="font-oswald text-lp-muted mb-2 text-sm">
                You&apos;ve already taken this assessment.
              </p>
              <p className="font-bebas text-lp-gold-light text-4xl">
                Your Score: {existingScore}/50
              </p>
              <p className="font-oswald text-lp-gray mt-2 text-sm font-extralight">
                {getInterpretation(existingScore)?.message}
              </p>
            </div>
          ) : null}

          <CTAButton onClick={handleStartAssessment} variant="primary" size="large">
            {hasExistingResult ? "Retake Assessment" : "Start Assessment"}
          </CTAButton>

          <p className="font-oswald text-lp-muted mt-6 text-xs font-extralight">
            {ASSESSMENT_CONTENT.instruction}
          </p>
        </div>
      )}

      {/* Questions State */}
      {state === "questions" && currentQ && (
        <div className="relative z-10 w-full max-w-[600px]">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-oswald text-lp-muted text-sm font-extralight">
                Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
              </span>
              <span className="font-oswald text-lp-gold text-sm">{currentQ.pillar}</span>
            </div>
            <div className="bg-lp-border h-1 w-full overflow-hidden">
              <div
                className="bg-lp-gold h-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-lp-card border-lp-border mb-8 border p-6 md:p-8">
            <h2 className="font-oswald text-lp-white mb-8 text-lg leading-relaxed font-light md:text-xl">
              {currentQ.question}
            </h2>

            {/* Slider */}
            <div className="mb-6">
              <label htmlFor={`pillar-slider-${currentQ.pillar}`} className="sr-only">
                Rate your {currentQ.pillar} from 1 to 10
              </label>
              <input
                id={`pillar-slider-${currentQ.pillar}`}
                type="range"
                min="1"
                max="10"
                value={scores[currentQ.pillar]}
                onChange={(e) => handleSliderChange(currentQ.pillar, parseInt(e.target.value))}
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={scores[currentQ.pillar]}
                aria-valuetext={`${scores[currentQ.pillar]} out of 10`}
                className={cn(
                  "h-2 w-full cursor-pointer appearance-none rounded-lg",
                  "bg-lp-border",
                  "focus:ring-lp-gold/50 focus:ring-offset-lp-dark focus:ring-2 focus:ring-offset-2 focus:outline-none",
                  "[&::-webkit-slider-thumb]:appearance-none",
                  "[&::-webkit-slider-thumb]:w-6",
                  "[&::-webkit-slider-thumb]:h-6",
                  "[&::-webkit-slider-thumb]:rounded-full",
                  "[&::-webkit-slider-thumb]:bg-lp-gold",
                  "[&::-webkit-slider-thumb]:cursor-pointer",
                  "[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(184,148,62,0.5)]",
                  "[&::-webkit-slider-thumb]:transition-transform",
                  "[&::-webkit-slider-thumb]:hover:scale-110",
                  "[&::-moz-range-thumb]:w-6",
                  "[&::-moz-range-thumb]:h-6",
                  "[&::-moz-range-thumb]:rounded-full",
                  "[&::-moz-range-thumb]:bg-lp-gold",
                  "[&::-moz-range-thumb]:border-0",
                  "[&::-moz-range-thumb]:cursor-pointer"
                )}
              />
              <div className="mt-3 flex justify-between">
                <span className="font-oswald text-lp-muted text-xs font-extralight">
                  {currentQ.lowLabel}
                </span>
                <span className="font-bebas text-lp-gold-light text-3xl">
                  {scores[currentQ.pillar]}
                </span>
                <span className="font-oswald text-lp-muted text-xs font-extralight">
                  {currentQ.highLabel}
                </span>
              </div>
            </div>

            {/* Scale reference */}
            <div className="flex justify-between px-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "font-oswald text-xs",
                    scores[currentQ.pillar] === i + 1 ? "text-lp-gold" : "text-lp-muted/50"
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Running Score */}
          <div className="mb-8 text-center">
            <span className="font-oswald text-lp-muted text-sm font-extralight">
              Running Total:{" "}
            </span>
            <span className="font-bebas text-lp-gold text-xl">{totalScore}/50</span>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={cn(
                "flex-1 py-3",
                "font-oswald text-sm font-medium tracking-wider uppercase",
                "border-lp-border border",
                "text-lp-gray",
                "transition-colors",
                currentQuestion === 0
                  ? "cursor-not-allowed opacity-30"
                  : "hover:border-lp-gold hover:text-lp-white"
              )}
            >
              Previous
            </button>
            <CTAButton onClick={handleNext} variant="primary" className="flex-1">
              {currentQuestion === ASSESSMENT_QUESTIONS.length - 1 ? "See Results" : "Next"}
            </CTAButton>
          </div>
        </div>
      )}

      {/* Results State */}
      {state === "results" && (
        <div className="relative z-10 max-w-[600px] text-center">
          {/* Score */}
          <div className="mb-6">
            <p className="font-oswald text-lp-muted mb-2 text-sm font-extralight tracking-wider uppercase">
              Your Five Pillar Score
            </p>
            <p
              className="font-bebas text-lp-gold-light text-7xl md:text-8xl"
              style={{ textShadow: "0 0 40px rgba(212,168,67,0.3)" }}
            >
              {totalScore}
              <span className="text-lp-white/30 text-4xl">/50</span>
            </p>
          </div>

          {/* Lowest Pillar Callout */}
          {(() => {
            const entries = Object.entries(scores);
            const lowestPillar = entries.reduce((a, b) => (a[1] < b[1] ? a : b), entries[0]);
            const lowestScore = lowestPillar[1];
            if (lowestScore <= 6) {
              return (
                <div className="mb-6 inline-block border border-red-500/30 bg-red-500/10 px-4 py-2">
                  <p className="font-oswald text-sm font-light">
                    <span className="text-red-400">Your {lowestPillar[0]} is bleeding.</span>
                    <span className="text-lp-gray"> Score: {lowestScore}/10</span>
                  </p>
                </div>
              );
            }
            return null;
          })()}

          {/* Interpretation */}
          <div
            className={cn(
              "bg-lp-card mb-6 border p-6",
              interpretation?.interpretation === "elite" && "border-lp-gold/50",
              interpretation?.interpretation === "gap" && "border-lp-gold/30",
              interpretation?.interpretation === "critical" && "border-red-500/30"
            )}
          >
            <p className="font-oswald text-lp-white text-base leading-relaxed font-light md:text-lg">
              {interpretation?.message}
            </p>
          </div>

          {/* Pillar Breakdown */}
          <div className="bg-lp-card border-lp-border mb-6 border p-6">
            <h3 className="font-oswald text-lp-muted mb-4 text-xs font-extralight tracking-wider uppercase">
              Pillar Breakdown
            </h3>
            <div className="space-y-3">
              {ASSESSMENT_QUESTIONS.map((q) => {
                const isLowest = scores[q.pillar] === Math.min(...Object.values(scores));
                return (
                  <div key={q.pillar} className="flex items-center gap-4">
                    <span
                      className={cn(
                        "font-oswald w-28 text-left text-sm",
                        isLowest && scores[q.pillar] <= 6 ? "text-red-400" : "text-lp-gray"
                      )}
                    >
                      {q.pillar}
                      {isLowest && scores[q.pillar] <= 6 && " ←"}
                    </span>
                    <div className="bg-lp-border relative h-2 flex-1 overflow-hidden">
                      <div
                        className={cn(
                          "absolute top-0 left-0 h-full transition-all",
                          scores[q.pillar] >= 7 && "bg-lp-gold",
                          scores[q.pillar] >= 4 && scores[q.pillar] < 7 && "bg-lp-gold/60",
                          scores[q.pillar] < 4 && "bg-red-500/60"
                        )}
                        style={{ width: `${scores[q.pillar] * 10}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "font-bebas w-6 text-right text-lg",
                        isLowest && scores[q.pillar] <= 6 ? "text-red-400" : "text-lp-gold"
                      )}
                    >
                      {scores[q.pillar]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent CTA Box */}
          <div className="bg-lp-gold/10 border-lp-gold/30 mb-6 border p-6">
            <p className="font-bebas text-lp-gold-light text-2xl">{totalScore}/50</p>
            <p className="font-oswald text-lp-white mt-2 text-base font-light">
              {ASSESSMENT_CONTENT.completionCTA}
            </p>
            <p className="font-oswald text-lp-muted mt-1 text-xs font-extralight">
              The training will show you exactly what to fix first.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <CTAButton
              onClick={handleDownloadCalendar}
              variant="primary"
              size="default"
              arrowIcon={false}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Add to Calendar
            </CTAButton>
            <CTAButton onClick={handleShare} variant="secondary" size="default" arrowIcon={false}>
              <ShareIcon className="mr-2 h-4 w-4" />
              Share with a Friend
            </CTAButton>
          </div>

          {/* Back to webinar link */}
          <a
            href="/webinar"
            className="font-oswald text-lp-muted hover:text-lp-white mt-8 inline-block text-sm font-extralight underline"
          >
            Back to Webinar Page
          </a>
        </div>
      )}
    </div>
  );
}
