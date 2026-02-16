"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import { cn } from "@lib/utils/style";

import { CTAButton } from "./shared";
import {
  ASSESSMENT_V2_QUESTIONS,
  ASSESSMENT_V2_CONTENT,
  SCORE_INTERPRETATIONS,
  BODY_TENSION_MEANINGS,
  TWO_AM_MEANINGS,
  LAST_PRESENT_MEANINGS,
  READINESS_RESPONSES,
  PRIORITY_INSIGHTS,
  REVENUE_DISPLAY,
  ACHIEVEMENT_DISPLAY,
  SACRIFICE_DISPLAY,
  calculateTotalScore,
  getInterpretation,
  getLowestPillar,
  calculateLeadScore,
  type AssessmentAnswers,
  type AssessmentQuestion,
  type Interpretation,
} from "../data/assessment-v2-content";
import { WEBINAR_HERO_CONTENT } from "../data/webinar-content";
import { generateCalendarInvite } from "../data/assessment-content";

// ============================================
// TYPES
// ============================================

type AssessmentState = "intro" | "questions" | "email_capture" | "results";

// ============================================
// ICONS
// ============================================

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ============================================
// QUESTION COMPONENTS
// ============================================

interface QuestionProps {
  question: AssessmentQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

function SingleChoiceQuestion({ question, value, onChange }: QuestionProps) {
  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "w-full text-left p-4 border transition-all",
            "hover:border-lp-gold/50",
            value === option.value
              ? "border-lp-gold bg-lp-gold/10"
              : "border-lp-border bg-lp-card"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5",
                "flex items-center justify-center",
                value === option.value ? "border-lp-gold bg-lp-gold" : "border-lp-border"
              )}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-lp-dark" />
              )}
            </div>
            <div>
              <p className="font-oswald text-lp-white text-base font-light">
                {option.label}
              </p>
              {option.description && (
                <p className="font-oswald text-lp-muted text-sm font-extralight mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function MultiSelectQuestion({ question, value, onChange }: QuestionProps) {
  const selectedValues = (value as string[]) || [];
  const maxSelections = question.maxSelections || 99;

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else if (selectedValues.length < maxSelections) {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const isDisabled = !isSelected && selectedValues.length >= maxSelections;

        return (
          <button
            key={option.value}
            onClick={() => !isDisabled && toggleOption(option.value)}
            disabled={isDisabled}
            className={cn(
              "w-full text-left p-4 border transition-all",
              isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-lp-gold/50",
              isSelected ? "border-lp-gold bg-lp-gold/10" : "border-lp-border bg-lp-card"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-5 h-5 border-2 flex-shrink-0 mt-0.5",
                  "flex items-center justify-center",
                  isSelected ? "border-lp-gold bg-lp-gold" : "border-lp-border"
                )}
              >
                {isSelected && <CheckIcon className="w-3 h-3 text-lp-dark" />}
              </div>
              <div>
                <p className="font-oswald text-lp-white text-base font-light">
                  {option.label}
                </p>
                {option.description && (
                  <p className="font-oswald text-lp-muted text-sm font-extralight mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {maxSelections < 99 && (
        <p className="font-oswald text-lp-muted text-xs font-extralight text-center mt-2">
          {selectedValues.length}/{maxSelections} selected
        </p>
      )}
    </div>
  );
}

function SliderQuestion({ question, value, onChange }: QuestionProps) {
  const config = question.sliderConfig!;
  const currentValue = (value as number) || 5;

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          value={currentValue}
          onChange={(e) => onChange(parseInt(e.target.value))}
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
            "[&::-moz-range-thumb]:w-6",
            "[&::-moz-range-thumb]:h-6",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-lp-gold",
            "[&::-moz-range-thumb]:border-0"
          )}
        />

        {/* Labels */}
        <div className="flex justify-between mt-3">
          <span className="font-oswald text-lp-muted text-xs font-extralight max-w-[30%]">
            {config.lowLabel}
          </span>
          <span
            className="font-bebas text-lp-gold-light text-4xl"
            style={{ textShadow: "0 0 20px rgba(212,168,67,0.3)" }}
          >
            {currentValue}
          </span>
          <span className="font-oswald text-lp-muted text-xs font-extralight max-w-[30%] text-right">
            {config.highLabel}
          </span>
        </div>
      </div>

      {/* Scale reference */}
      <div className="flex justify-between px-1">
        {Array.from({ length: config.max - config.min + 1 }, (_, i) => {
          const num = config.min + i;
          return (
            <span
              key={num}
              className={cn(
                "font-oswald text-xs",
                currentValue === num ? "text-lp-gold" : "text-lp-muted/50"
              )}
            >
              {num}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const STORAGE_KEY = "gynergy_assessment_v2";

export default function AssessmentPageV2() {
  const [state, setState] = useState<AssessmentState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.answers) setAnswers(data.answers);
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
          setState("questions");
        }
      } catch {
        // Invalid data
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (state === "questions") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, currentQuestionIndex })
      );
    }
  }, [answers, currentQuestionIndex, state]);

  const currentQuestion = ASSESSMENT_V2_QUESTIONS[currentQuestionIndex];
  const totalQuestions = ASSESSMENT_V2_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Computed values for results
  const totalScore = useMemo(() => calculateTotalScore(answers), [answers]);
  const interpretation = useMemo(() => getInterpretation(totalScore), [totalScore]);
  const lowestPillar = useMemo(() => getLowestPillar(answers), [answers]);
  const leadScore = useMemo(() => calculateLeadScore(answers), [answers]);

  const getCurrentAnswer = useCallback(() => {
    return answers[currentQuestion?.id as keyof AssessmentAnswers];
  }, [answers, currentQuestion]);

  const setCurrentAnswer = useCallback(
    (value: unknown) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion]
  );

  const canProceed = useCallback(() => {
    const answer = getCurrentAnswer();
    if (!currentQuestion) return false;

    switch (currentQuestion.type) {
      case "single_choice":
        return answer !== undefined && answer !== null;
      case "multi_select":
        return Array.isArray(answer) && answer.length > 0;
      case "slider":
        return answer !== undefined;
      default:
        return true;
    }
  }, [currentQuestion, getCurrentAnswer]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Assessment complete, go to email capture
      setState("email_capture");
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleStartAssessment = useCallback(() => {
    setState("questions");
    setCurrentQuestionIndex(0);
  }, []);

  const handleSubmitEmail = useCallback(async () => {
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);

    try {
      const completedAt = new Date().toISOString();
      const timeToComplete = Math.round((Date.now() - startTime) / 1000);

      // Save to API
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          email: email.toLowerCase().trim(),
          first_name: firstName.trim() || null,
          completed_at: completedAt,
          time_to_complete_seconds: timeToComplete,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Save to localStorage for results page
      localStorage.setItem(
        `${STORAGE_KEY}_result`,
        JSON.stringify({
          answers,
          email,
          firstName,
          totalScore,
          interpretation,
          completedAt,
        })
      );

      setState("results");
    } catch (error) {
      console.error("Assessment submission error:", error);
      // Still show results even if API fails
      setState("results");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, firstName, answers, startTime, totalScore, interpretation]);

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

  // Get current phase info
  const currentPhase = currentQuestion?.phase || "A";
  const phaseInfo = ASSESSMENT_V2_CONTENT.phases[currentPhase];

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

      {/* ============================================ */}
      {/* INTRO STATE */}
      {/* ============================================ */}
      {state === "intro" && (
        <div className="relative z-10 max-w-[500px] text-center">
          <div className="font-oswald text-lp-gold mb-1 text-sm font-normal tracking-[0.5em] uppercase">
            G Y N E R G Y
          </div>
          <div className="font-oswald text-lp-gold/40 mb-6 text-2xl font-extralight">
            &infin;
          </div>

          <h1 className="font-bebas text-lp-white mb-4 text-4xl md:text-5xl">
            {ASSESSMENT_V2_CONTENT.title}
          </h1>

          <p className="font-oswald text-lp-gray mb-8 text-lg font-extralight">
            {ASSESSMENT_V2_CONTENT.subtitle}
          </p>

          <div className="bg-lp-card border-lp-border mb-8 border p-6 text-left">
            <p className="font-oswald text-lp-muted text-sm font-extralight mb-4">
              What you&apos;ll discover:
            </p>
            <ul className="space-y-2">
              <li className="font-oswald text-lp-white text-sm font-light flex items-start gap-2">
                <span className="text-lp-gold">→</span> Your Five Pillar Score (and what
                it means)
              </li>
              <li className="font-oswald text-lp-white text-sm font-light flex items-start gap-2">
                <span className="text-lp-gold">→</span> Which pillar is silently bleeding
              </li>
              <li className="font-oswald text-lp-white text-sm font-light flex items-start gap-2">
                <span className="text-lp-gold">→</span> Personalized insights you
                won&apos;t expect
              </li>
            </ul>
          </div>

          <CTAButton onClick={handleStartAssessment} variant="primary" size="large">
            Begin Assessment
          </CTAButton>

          <p className="font-oswald text-lp-muted mt-6 text-xs font-extralight">
            {ASSESSMENT_V2_CONTENT.instruction}
          </p>
        </div>
      )}

      {/* ============================================ */}
      {/* QUESTIONS STATE */}
      {/* ============================================ */}
      {state === "questions" && currentQuestion && (
        <div className="relative z-10 w-full max-w-[600px]">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-oswald text-lp-muted text-sm font-extralight">
                {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="font-oswald text-lp-gold text-sm">
                {phaseInfo.name}
              </span>
            </div>
            <div className="bg-lp-border h-1 w-full overflow-hidden">
              <div
                className="bg-lp-gold h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-lp-card border-lp-border mb-6 border p-6 md:p-8">
            <h2 className="font-oswald text-lp-white mb-2 text-lg leading-relaxed font-light md:text-xl">
              {currentQuestion.question}
            </h2>
            {currentQuestion.subtext && (
              <p className="font-oswald text-lp-muted mb-6 text-sm font-extralight">
                {currentQuestion.subtext}
              </p>
            )}

            {/* Render appropriate question type */}
            {currentQuestion.type === "single_choice" && (
              <SingleChoiceQuestion
                question={currentQuestion}
                value={getCurrentAnswer()}
                onChange={setCurrentAnswer}
              />
            )}
            {currentQuestion.type === "multi_select" && (
              <MultiSelectQuestion
                question={currentQuestion}
                value={getCurrentAnswer()}
                onChange={setCurrentAnswer}
              />
            )}
            {currentQuestion.type === "slider" && (
              <SliderQuestion
                question={currentQuestion}
                value={getCurrentAnswer()}
                onChange={setCurrentAnswer}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={cn(
                "flex-1 py-3",
                "font-oswald text-sm font-medium tracking-wider uppercase",
                "border-lp-border border",
                "text-lp-gray",
                "transition-colors",
                currentQuestionIndex === 0
                  ? "cursor-not-allowed opacity-30"
                  : "hover:border-lp-gold hover:text-lp-white"
              )}
            >
              Previous
            </button>
            <CTAButton
              onClick={handleNext}
              variant="primary"
              className="flex-1"
              disabled={!canProceed()}
            >
              {currentQuestionIndex === totalQuestions - 1 ? "See Results" : "Next"}
            </CTAButton>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* EMAIL CAPTURE STATE */}
      {/* ============================================ */}
      {state === "email_capture" && (
        <div className="relative z-10 max-w-[500px] text-center">
          <div className="font-bebas text-lp-gold-light mb-4 text-6xl">
            {totalScore}
            <span className="text-lp-white/30 text-3xl">/50</span>
          </div>

          <p className="font-oswald text-lp-white mb-2 text-xl font-light">
            Your assessment is complete.
          </p>
          <p className="font-oswald text-lp-muted mb-8 text-sm font-extralight">
            Enter your email to see your personalized results and receive your full
            report.
          </p>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="First name (optional)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={cn(
                "w-full px-4 py-3",
                "bg-lp-card border-lp-border border",
                "font-oswald text-lp-white text-base font-light",
                "placeholder:text-lp-muted/50",
                "focus:border-lp-gold focus:outline-none"
              )}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3",
                "bg-lp-card border-lp-border border",
                "font-oswald text-lp-white text-base font-light",
                "placeholder:text-lp-muted/50",
                "focus:border-lp-gold focus:outline-none"
              )}
            />
          </div>

          <CTAButton
            onClick={handleSubmitEmail}
            variant="primary"
            size="large"
            disabled={!email || !email.includes("@") || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Processing..." : "See My Results"}
          </CTAButton>

          <p className="font-oswald text-lp-muted mt-4 text-xs font-extralight">
            You&apos;ll also receive your full personalized report via email.
          </p>
        </div>
      )}

      {/* ============================================ */}
      {/* RESULTS STATE */}
      {/* ============================================ */}
      {state === "results" && (
        <div className="relative z-10 w-full max-w-[700px]">
          {/* Score Header */}
          <div className="text-center mb-8">
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

          {/* Interpretation */}
          <div
            className={cn(
              "bg-lp-card mb-6 border p-6 text-center",
              interpretation === "elite" && "border-lp-gold/50",
              interpretation === "gap" && "border-lp-gold/30",
              interpretation === "critical" && "border-red-500/30"
            )}
          >
            <p className="font-bebas text-lp-gold text-2xl mb-2">
              {SCORE_INTERPRETATIONS[interpretation].headline}
            </p>
            <p className="font-oswald text-lp-white text-base leading-relaxed font-light">
              {SCORE_INTERPRETATIONS[interpretation].message}
            </p>
          </div>

          {/* The Contrast */}
          {answers.external_rating && answers.external_rating >= 7 && totalScore < 35 && (
            <div className="bg-lp-card border-lp-border mb-6 border p-6">
              <p className="font-oswald text-lp-gray text-sm leading-relaxed font-light">
                A stranger would rate your life{" "}
                <span className="text-lp-gold font-medium">{answers.external_rating}/10</span>.
                <br />
                But you know the truth is{" "}
                <span className="text-lp-gold font-medium">{totalScore}/50</span>.
                <br />
                <span className="text-lp-muted italic">That gap is what we fix.</span>
              </p>
            </div>
          )}

          {/* 2am Thought Insight */}
          {answers.two_am_thought && answers.two_am_thought !== "other" && (
            <div className="bg-lp-card border-lp-border mb-6 border p-6">
              <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase mb-3">
                At 2am, you&apos;ve been asking yourself:
              </p>
              <p className="font-oswald text-lp-white text-lg font-light italic mb-3">
                &ldquo;{TWO_AM_MEANINGS[answers.two_am_thought].thought}&rdquo;
              </p>
              <p className="font-oswald text-lp-gray text-sm font-extralight leading-relaxed">
                {TWO_AM_MEANINGS[answers.two_am_thought].insight}
              </p>
            </div>
          )}

          {/* Last Present Insight */}
          {answers.last_present && answers.last_present !== "last_week" && (
            <div className="bg-lp-card border-lp-border mb-6 border p-6">
              <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase mb-3">
                Time Since You Felt Present
              </p>
              <p className="font-bebas text-lp-gold-light text-3xl mb-2">
                {LAST_PRESENT_MEANINGS[answers.last_present].hoursSince}
              </p>
              <p className="font-oswald text-lp-gray text-sm font-extralight leading-relaxed">
                {LAST_PRESENT_MEANINGS[answers.last_present].insight}
              </p>
            </div>
          )}

          {/* Body Tension Insight */}
          {answers.body_tension && answers.body_tension !== "relaxed" && (
            <div className="bg-lp-card border-lp-border mb-6 border p-6">
              <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase mb-3">
                Your Body Has Been Keeping Score
              </p>
              <p className="font-oswald text-lp-white text-base font-light mb-2">
                Tension in your {BODY_TENSION_MEANINGS[answers.body_tension].location}:{" "}
                <span className="text-lp-gold">
                  {BODY_TENSION_MEANINGS[answers.body_tension].meaning}
                </span>
              </p>
              <p className="font-oswald text-lp-gray text-sm font-extralight leading-relaxed">
                {BODY_TENSION_MEANINGS[answers.body_tension].insight}
              </p>
            </div>
          )}

          {/* Pillar Breakdown */}
          <div className="bg-lp-card border-lp-border mb-6 border p-6">
            <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase mb-4">
              The Multiplier Equation
            </p>
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              {["wealth", "health", "relationships", "growth", "purpose"].map(
                (pillar, index) => {
                  const score =
                    answers[`${pillar}_score` as keyof AssessmentAnswers] as number;
                  const isLowest = lowestPillar?.pillar === pillar;
                  return (
                    <span key={pillar}>
                      <span
                        className={cn(
                          "font-bebas text-2xl",
                          isLowest && score <= 5 ? "text-red-400" : "text-lp-gold"
                        )}
                      >
                        {score || "?"}
                      </span>
                      {index < 4 && (
                        <span className="font-oswald text-lp-muted mx-1">×</span>
                      )}
                    </span>
                  );
                }
              )}
              <span className="font-oswald text-lp-muted mx-2">=</span>
              <span
                className={cn(
                  "font-bebas text-2xl",
                  interpretation === "critical"
                    ? "text-red-400"
                    : interpretation === "gap"
                    ? "text-lp-gold/70"
                    : "text-lp-gold"
                )}
              >
                {interpretation === "critical"
                  ? "Fractured"
                  : interpretation === "gap"
                  ? "Divided"
                  : "Multiplied"}
              </span>
            </div>

            {/* Pillar bars */}
            <div className="space-y-3">
              {(["wealth", "health", "relationships", "growth", "purpose"] as const).map(
                (pillar) => {
                  const score =
                    answers[`${pillar}_score` as keyof AssessmentAnswers] as number;
                  const isLowest = lowestPillar?.pillar === pillar;
                  return (
                    <div key={pillar} className="flex items-center gap-4">
                      <span
                        className={cn(
                          "font-oswald w-28 text-left text-sm capitalize",
                          isLowest && score <= 5 ? "text-red-400" : "text-lp-gray"
                        )}
                      >
                        {pillar}
                        {isLowest && score <= 5 && " ←"}
                      </span>
                      <div className="bg-lp-border relative h-2 flex-1 overflow-hidden">
                        <div
                          className={cn(
                            "absolute top-0 left-0 h-full transition-all",
                            score >= 7 && "bg-lp-gold",
                            score >= 4 && score < 7 && "bg-lp-gold/60",
                            score < 4 && "bg-red-500/60"
                          )}
                          style={{ width: `${(score || 0) * 10}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "font-bebas w-6 text-right text-lg",
                          isLowest && score <= 5 ? "text-red-400" : "text-lp-gold"
                        )}
                      >
                        {score || "?"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Priority Pillar Insight */}
          {answers.priority_pillar && (
            <div className="bg-lp-gold/10 border-lp-gold/30 mb-6 border p-6">
              <p className="font-oswald text-lp-muted text-xs font-extralight tracking-wider uppercase mb-3">
                Your Leverage Point
              </p>
              <p className="font-oswald text-lp-gold text-lg font-light mb-2">
                {PRIORITY_INSIGHTS[answers.priority_pillar].validation}
              </p>
              <p className="font-oswald text-lp-white text-sm font-extralight leading-relaxed mb-3">
                {PRIORITY_INSIGHTS[answers.priority_pillar].whyFirst}
              </p>
              <p className="font-oswald text-lp-gray text-sm font-extralight leading-relaxed italic">
                {PRIORITY_INSIGHTS[answers.priority_pillar].rippleEffect}
              </p>
            </div>
          )}

          {/* Readiness-Based CTA */}
          {answers.readiness && (
            <div className="bg-lp-card border-lp-gold/50 mb-6 border p-6 text-center">
              <p className="font-oswald text-lp-white text-base leading-relaxed font-light mb-4">
                {READINESS_RESPONSES[answers.readiness].response}
              </p>
              <CTAButton
                onClick={handleDownloadCalendar}
                variant="primary"
                size="large"
                arrowIcon={false}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {READINESS_RESPONSES[answers.readiness].cta}
              </CTAButton>
            </div>
          )}

          {/* Lead Score (hidden but useful for debugging) */}
          {process.env.NODE_ENV === "development" && (
            <p className="text-center font-oswald text-lp-muted/50 text-xs">
              Lead Score: {leadScore}
            </p>
          )}

          {/* Back to webinar link */}
          <div className="text-center mt-6">
            <a
              href="/webinar"
              className="font-oswald text-lp-muted hover:text-lp-white text-sm font-extralight underline"
            >
              Back to Webinar Page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
