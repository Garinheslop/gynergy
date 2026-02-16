"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { track } from "@lib/utils/analytics";
import { cn } from "@lib/utils/style";

import { CTAButton, PillarProgressBar } from "./shared";
import {
  ASSESSMENT_V3_QUESTIONS,
  ASSESSMENT_V3_CONTENT,
  calculateV3TotalScore,
  getV3Interpretation,
  getV3LowestPillar,
  generatePatternReveals,
  TWO_AM_MEANINGS,
  V3_READINESS_RESPONSES,
  V3_PRIORITY_INSIGHTS,
  type AssessmentV3Question,
  type AssessmentV3Answers,
  type PriorityPillar,
} from "../data/assessment-v3-content";

// SVG Icons
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type AssessmentState = "intro" | "questions" | "email_capture" | "results";

const STORAGE_KEY = "gynergy_assessment_v3";
const STORAGE_PROGRESS_KEY = "gynergy_assessment_v3_progress";

export default function AssessmentPageV3() {
  const [state, setState] = useState<AssessmentState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentV3Answers>({});
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);

  // Analytics tracking
  const assessmentStartTime = useRef<number>(0);
  const questionStartTime = useRef<number>(Date.now());
  const lastSection = useRef<number>(1);

  // Load saved progress on mount and track page view
  useEffect(() => {
    // Track page view
    track("assessment_viewed", {
      version: "v3",
      referrer: typeof document !== "undefined" ? document.referrer : null,
    });

    // Check for completed assessment
    const storedResult = localStorage.getItem(STORAGE_KEY);
    let hasResult = false;
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult);
        if (result.completedAt) {
          setHasExistingResult(true);
          hasResult = true;
        }
      } catch {
        // Invalid stored data
      }
    }

    // Check for in-progress assessment
    const storedProgress = localStorage.getItem(STORAGE_PROGRESS_KEY);
    let hasProgress = false;
    if (storedProgress) {
      try {
        const progress = JSON.parse(storedProgress);
        if (progress.answers && progress.currentIndex !== undefined) {
          setAnswers(progress.answers);
          setCurrentQuestionIndex(progress.currentIndex);
          hasProgress = true;
        }
      } catch {
        // Invalid stored data
      }
    }

    // Track returning user state
    if (hasResult || hasProgress) {
      track("assessment_returning_user", {
        has_completed: hasResult,
        has_progress: hasProgress,
      });
    }
  }, []);

  // Auto-save progress
  useEffect(() => {
    if (state === "questions" && Object.keys(answers).length > 0) {
      const progress = {
        answers,
        currentIndex: currentQuestionIndex,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    }
  }, [answers, currentQuestionIndex, state]);

  const currentQuestion = ASSESSMENT_V3_QUESTIONS[currentQuestionIndex];
  const totalQuestions = ASSESSMENT_V3_QUESTIONS.length;

  // Calculate section and pillar info for progress bar
  const progressInfo = useMemo(() => {
    if (!currentQuestion) return { section: 1 as const, pillar: undefined, questionInSection: 1 };

    const section = currentQuestion.section;
    const pillar = currentQuestion.pillar;

    // Calculate question position within section
    let questionInSection = 1;
    for (let i = 0; i < currentQuestionIndex; i++) {
      if (ASSESSMENT_V3_QUESTIONS[i].section === section) {
        if (section === 3) {
          // For section 3, count within the current pillar
          if (ASSESSMENT_V3_QUESTIONS[i].pillar === pillar) {
            questionInSection++;
          }
        } else {
          questionInSection++;
        }
      }
    }

    return { section, pillar, questionInSection };
  }, [currentQuestion, currentQuestionIndex]);

  // Get dynamic subtext
  const dynamicSubtext = useMemo(() => {
    if (!currentQuestion) return undefined;
    if (currentQuestion.dynamicSubtext) {
      return currentQuestion.dynamicSubtext(answers);
    }
    return currentQuestion.subtext;
  }, [currentQuestion, answers]);

  // Calculate scores
  const totalScore = calculateV3TotalScore(answers);
  const interpretation = getV3Interpretation(totalScore);
  const lowestPillar = getV3LowestPillar(answers);
  const patternReveals = generatePatternReveals(answers);

  const handleAnswer = useCallback(
    (value: string | number | string[]) => {
      if (!currentQuestion) return;

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    const currentQ = ASSESSMENT_V3_QUESTIONS[currentQuestionIndex];
    const timeOnQuestion = Date.now() - questionStartTime.current;

    // Track question answered
    track("assessment_question_answered", {
      question_id: currentQ?.id,
      question_index: currentQuestionIndex + 1,
      question_total: totalQuestions,
      section: currentQ?.section,
      pillar: currentQ?.pillar || null,
      time_on_question_ms: timeOnQuestion,
      progress_percent: Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100),
    });

    // Track section completion
    if (currentQ && currentQ.section !== lastSection.current) {
      track("assessment_section_completed", {
        section: lastSection.current,
        questions_answered: currentQuestionIndex,
      });
      lastSection.current = currentQ.section;
    }

    // Reset question timer
    questionStartTime.current = Date.now();

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Track all questions completed
      const totalTime = Date.now() - assessmentStartTime.current;
      track("assessment_questions_completed", {
        total_questions: totalQuestions,
        total_time_ms: totalTime,
        total_time_minutes: Math.round(totalTime / 60000),
      });
      setState("email_capture");
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleStart = useCallback(() => {
    // Track assessment start
    assessmentStartTime.current = Date.now();
    questionStartTime.current = Date.now();
    lastSection.current = 1;

    track("assessment_started", {
      version: "v3",
      total_questions: totalQuestions,
      has_existing_result: hasExistingResult,
      source: "fresh_start",
    });

    setState("questions");
    setCurrentQuestionIndex(0);
    setAnswers({});
    localStorage.removeItem(STORAGE_PROGRESS_KEY);
  }, [totalQuestions, hasExistingResult]);

  const handleResumeProgress = useCallback(() => {
    // Track assessment resumed
    assessmentStartTime.current = Date.now();
    questionStartTime.current = Date.now();
    lastSection.current = ASSESSMENT_V3_QUESTIONS[currentQuestionIndex]?.section || 1;

    track("assessment_resumed", {
      version: "v3",
      resumed_at_question: currentQuestionIndex + 1,
      total_questions: totalQuestions,
      progress_percent: Math.round((currentQuestionIndex / totalQuestions) * 100),
    });

    setState("questions");
  }, [currentQuestionIndex, totalQuestions]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setEmailSubmitting(true);
      setEmailError(null);

      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const firstName = formData.get("first_name") as string;

      // Track email capture attempt
      track("assessment_email_submitted", {
        version: "v3",
        total_score: totalScore,
        interpretation,
        lowest_pillar: lowestPillar?.pillar || null,
        lowest_pillar_score: lowestPillar?.score || null,
        pattern_reveals_count: patternReveals.length,
      });

      try {
        const response = await fetch("/api/assessment/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            email,
            first_name: firstName,
            completed_at: new Date().toISOString(),
            source: "v3_assessment",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit assessment");
        }

        // Calculate total time
        const totalTime = Date.now() - assessmentStartTime.current;

        // Track successful completion
        track("assessment_completed", {
          version: "v3",
          total_score: totalScore,
          interpretation,
          lowest_pillar: lowestPillar?.pillar || null,
          lowest_pillar_score: lowestPillar?.score || null,
          pattern_reveals_count: patternReveals.length,
          total_time_ms: totalTime,
          total_time_minutes: Math.round(totalTime / 60000),
          priority_pillar: answers.priority_pillar || null,
          readiness: answers.readiness || null,
        });

        // Clear progress, save result
        localStorage.removeItem(STORAGE_PROGRESS_KEY);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            answers,
            totalScore,
            completedAt: new Date().toISOString(),
          })
        );

        setState("results");
      } catch {
        // Track failure
        track("assessment_email_failed", {
          version: "v3",
          error: "submission_failed",
        });
        setEmailError("Something went wrong. Please try again.");
      } finally {
        setEmailSubmitting(false);
      }
    },
    [answers, totalScore, interpretation, lowestPillar, patternReveals]
  );

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id as keyof AssessmentV3Answers];
    if (currentQuestion.type === "slider") {
      return answer !== undefined;
    }
    if (currentQuestion.type === "multi_select") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== "";
  }, [currentQuestion, answers]);

  // Get saved progress info
  const savedProgress = useMemo(() => {
    if (state !== "intro") return null;
    const stored = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!stored) return null;
    try {
      const progress = JSON.parse(stored);
      if (progress.currentIndex > 0) {
        return {
          questionNumber: progress.currentIndex + 1,
          total: totalQuestions,
        };
      }
    } catch {
      // Invalid
    }
    return null;
  }, [state, totalQuestions]);

  return (
    <div
      className={cn(
        "text-lp-white font-oswald",
        "relative min-h-screen",
        "flex flex-col items-center justify-center",
        "px-4 py-8 sm:px-6 sm:py-12"
      )}
      style={{
        background: `
          radial-gradient(ellipse 50% 42% at 50% 45%, rgba(184,148,62,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 100% 100% at 50% 50%, #0D0C0A 0%, #050505 80%)
        `,
      }}
    >
      {/* Corner Accents */}
      <CornerAccents />

      {/* Intro State */}
      {state === "intro" && (
        <IntroSection
          hasExistingResult={hasExistingResult}
          savedProgress={savedProgress}
          onStart={handleStart}
          onResume={handleResumeProgress}
        />
      )}

      {/* Questions State */}
      {state === "questions" && currentQuestion && (
        <div className="relative z-10 w-full max-w-[640px]">
          {/* Progress Bar */}
          <PillarProgressBar
            currentSection={progressInfo.section}
            currentPillar={progressInfo.pillar}
            questionInSection={progressInfo.questionInSection}
            className="mb-8"
          />

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            subtext={dynamicSubtext}
            answer={answers[currentQuestion.id as keyof AssessmentV3Answers]}
            onAnswer={handleAnswer}
          />

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
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
              disabled={!canProceed}
            >
              {currentQuestionIndex === totalQuestions - 1 ? "See My Results" : "Next"}
            </CTAButton>
          </div>

          {/* Question counter */}
          <p className="font-oswald text-lp-muted mt-4 text-center text-xs">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
      )}

      {/* Email Capture State */}
      {state === "email_capture" && (
        <EmailCaptureSection
          totalScore={totalScore}
          onSubmit={handleEmailSubmit}
          submitting={emailSubmitting}
          error={emailError}
        />
      )}

      {/* Results State */}
      {state === "results" && (
        <ResultsSection
          answers={answers}
          totalScore={totalScore}
          interpretation={interpretation}
          lowestPillar={lowestPillar}
          patternReveals={patternReveals}
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CornerAccents() {
  return (
    <>
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
    </>
  );
}

interface IntroSectionProps {
  hasExistingResult: boolean;
  savedProgress: { questionNumber: number; total: number } | null;
  onStart: () => void;
  onResume: () => void;
}

function IntroSection({ hasExistingResult, savedProgress, onStart, onResume }: IntroSectionProps) {
  return (
    <div className="relative z-10 max-w-[500px] text-center">
      {/* Brand */}
      <div className="font-oswald text-lp-gold mb-1 text-sm font-normal tracking-[0.5em] uppercase">
        G Y N E R G Y
      </div>
      <div className="font-oswald text-lp-gold/40 mb-6 text-2xl font-extralight">&infin;</div>

      <h1 className="font-bebas text-lp-white mb-4 text-4xl md:text-5xl">
        {ASSESSMENT_V3_CONTENT.title}
      </h1>

      <p className="font-oswald text-lp-gray mb-8 text-lg font-extralight">
        {ASSESSMENT_V3_CONTENT.subtitle}
      </p>

      {savedProgress && (
        <div className="bg-lp-card border-lp-border mb-6 border p-4">
          <p className="font-oswald text-lp-muted mb-3 text-sm">
            You have progress saved (Question {savedProgress.questionNumber} of{" "}
            {savedProgress.total})
          </p>
          <div className="flex gap-3">
            <button
              onClick={onResume}
              className="font-oswald bg-lp-gold/20 text-lp-gold hover:bg-lp-gold/30 flex-1 py-2 text-sm transition-colors"
            >
              Continue
            </button>
            <button
              onClick={onStart}
              className="font-oswald border-lp-border text-lp-gray hover:border-lp-gold flex-1 border py-2 text-sm transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {!savedProgress && (
        <CTAButton onClick={onStart} variant="primary" size="large">
          {hasExistingResult ? "Retake Assessment" : "Start Assessment"}
        </CTAButton>
      )}

      <p className="font-oswald text-lp-muted mt-6 text-xs font-extralight">
        {ASSESSMENT_V3_CONTENT.instruction}
      </p>
    </div>
  );
}

interface QuestionCardProps {
  question: AssessmentV3Question;
  subtext?: string;
  answer: unknown;
  onAnswer: (value: string | number | string[]) => void;
}

function QuestionCard({ question, subtext, answer, onAnswer }: QuestionCardProps) {
  return (
    <div className="bg-lp-card border-lp-border border p-6 md:p-8">
      <h2 className="font-oswald text-lp-white mb-3 text-lg leading-relaxed font-light md:text-xl">
        {question.question}
      </h2>

      {subtext && (
        <p className="font-oswald text-lp-muted mb-6 text-sm font-extralight italic">{subtext}</p>
      )}

      {/* Render input based on type */}
      {question.type === "single_choice" && question.options && (
        <SingleChoiceInput
          options={question.options}
          value={answer as string}
          onChange={onAnswer}
        />
      )}

      {question.type === "multi_select" && question.options && (
        <MultiSelectInput
          options={question.options}
          value={(answer as string[]) || []}
          onChange={onAnswer}
          maxSelections={question.maxSelections}
        />
      )}

      {question.type === "slider" && question.sliderConfig && (
        <SliderInput
          config={question.sliderConfig}
          value={(answer as number) || 5}
          onChange={onAnswer}
        />
      )}
    </div>
  );
}

interface SingleChoiceInputProps {
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
}

function SingleChoiceInput({ options, value, onChange }: SingleChoiceInputProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "w-full p-4 text-left transition-all",
            "border",
            value === option.value
              ? "border-lp-gold bg-lp-gold/10"
              : "border-lp-border hover:border-lp-gold/50 bg-transparent"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                value === option.value ? "border-lp-gold bg-lp-gold" : "border-lp-border"
              )}
            >
              {value === option.value && <CheckIcon className="text-lp-dark h-3 w-3" />}
            </div>
            <div>
              <span
                className={cn(
                  "font-oswald text-sm",
                  value === option.value ? "text-lp-white" : "text-lp-gray"
                )}
              >
                {option.label}
              </span>
              {option.description && (
                <p className="font-oswald text-lp-muted mt-0.5 text-xs font-extralight">
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

interface MultiSelectInputProps {
  options: Array<{ value: string; label: string; description?: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
}

function MultiSelectInput({ options, value, onChange, maxSelections }: MultiSelectInputProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else if (!maxSelections || value.length < maxSelections) {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {maxSelections && (
        <p className="font-oswald text-lp-muted mb-3 text-xs">
          Select up to {maxSelections} ({value.length}/{maxSelections} selected)
        </p>
      )}
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        const isDisabled = !isSelected && !!maxSelections && value.length >= maxSelections;

        return (
          <button
            key={option.value}
            onClick={() => toggleOption(option.value)}
            disabled={isDisabled}
            className={cn(
              "w-full p-4 text-left transition-all",
              "border",
              isSelected
                ? "border-lp-gold bg-lp-gold/10"
                : isDisabled
                  ? "border-lp-border/50 cursor-not-allowed opacity-50"
                  : "border-lp-border hover:border-lp-gold/50 bg-transparent"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-lp-gold bg-lp-gold" : "border-lp-border"
                )}
              >
                {isSelected && <CheckIcon className="text-lp-dark h-3 w-3" />}
              </div>
              <div>
                <span
                  className={cn(
                    "font-oswald text-sm",
                    isSelected ? "text-lp-white" : "text-lp-gray"
                  )}
                >
                  {option.label}
                </span>
                {option.description && (
                  <p className="font-oswald text-lp-muted mt-0.5 text-xs font-extralight">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface SliderInputProps {
  config: {
    min: number;
    max: number;
    lowLabel: string;
    midLabel?: string;
    highLabel: string;
  };
  value: number;
  onChange: (value: number) => void;
}

function SliderInput({ config, value, onChange }: SliderInputProps) {
  return (
    <div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        value={value}
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
      <div className="mt-3 flex items-center justify-between">
        <span className="font-oswald text-lp-muted max-w-[30%] text-xs font-extralight">
          {config.lowLabel}
        </span>
        <span className="font-bebas text-lp-gold-light text-4xl">{value}</span>
        <span className="font-oswald text-lp-muted max-w-[30%] text-right text-xs font-extralight">
          {config.highLabel}
        </span>
      </div>

      {/* Scale reference */}
      <div className="mt-4 flex justify-between px-1">
        {Array.from({ length: config.max - config.min + 1 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "font-oswald text-xs",
              value === i + config.min ? "text-lp-gold" : "text-lp-muted/50"
            )}
          >
            {i + config.min}
          </span>
        ))}
      </div>
    </div>
  );
}

interface EmailCaptureSectionProps {
  totalScore: number;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string | null;
}

function EmailCaptureSection({
  totalScore,
  onSubmit,
  submitting,
  error,
}: EmailCaptureSectionProps) {
  return (
    <div className="relative z-10 max-w-[500px] text-center">
      <h2 className="font-bebas text-lp-white mb-2 text-3xl md:text-4xl">Your Score is Ready</h2>

      <div className="font-bebas text-lp-gold-light mb-6 text-6xl md:text-7xl">
        {totalScore}
        <span className="text-lp-white/30 text-3xl">/50</span>
      </div>

      <p className="font-oswald text-lp-gray mb-8 text-base font-extralight">
        Enter your email to receive your personalized Five Pillar Report — including your pattern
        reveals and specific recommendations.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            required
            className={cn(
              "w-full px-4 py-3",
              "font-oswald text-lp-white text-sm",
              "bg-lp-card border-lp-border border",
              "placeholder:text-lp-muted",
              "focus:border-lp-gold focus:outline-none"
            )}
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            className={cn(
              "w-full px-4 py-3",
              "font-oswald text-lp-white text-sm",
              "bg-lp-card border-lp-border border",
              "placeholder:text-lp-muted",
              "focus:border-lp-gold focus:outline-none"
            )}
          />
        </div>

        {error && <p className="font-oswald text-sm text-red-400">{error}</p>}

        <CTAButton
          type="submit"
          variant="primary"
          size="large"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? "Sending..." : "Send My Report"}
        </CTAButton>
      </form>

      <p className="font-oswald text-lp-muted mt-4 text-xs font-extralight">
        Your information is private. We&apos;ll never spam or share your data.
      </p>
    </div>
  );
}

interface ResultsSectionProps {
  answers: AssessmentV3Answers;
  totalScore: number;
  interpretation: "elite" | "gap" | "critical";
  lowestPillar: { pillar: PriorityPillar; score: number } | null;
  patternReveals: Array<{ pattern: string; insight: string; recommendation: string }>;
}

function ResultsSection({
  answers,
  totalScore,
  interpretation: _interpretation,
  lowestPillar,
  patternReveals,
}: ResultsSectionProps) {
  const readinessResponse = answers.readiness ? V3_READINESS_RESPONSES[answers.readiness] : null;
  const priorityInsight = answers.priority_pillar
    ? V3_PRIORITY_INSIGHTS[answers.priority_pillar]
    : null;
  const twoAmMeaning = answers.two_am_thought ? TWO_AM_MEANINGS[answers.two_am_thought] : null;

  return (
    <div className="relative z-10 w-full max-w-[640px]">
      {/* Score Header */}
      <div className="mb-8 text-center">
        <p className="font-oswald text-lp-muted mb-2 text-sm tracking-wider uppercase">
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

      {/* Lowest Pillar Alert */}
      {lowestPillar && lowestPillar.score <= 5 && (
        <div className="mb-6 border border-red-500/30 bg-red-500/10 p-4 text-center">
          <p className="font-oswald text-sm">
            <span className="font-medium text-red-400">
              Your {lowestPillar.pillar} is bleeding.
            </span>
            <span className="text-lp-gray"> Score: {lowestPillar.score}/10</span>
          </p>
        </div>
      )}

      {/* Pillar Breakdown */}
      <div className="bg-lp-card border-lp-border mb-6 border p-6">
        <h3 className="font-oswald text-lp-muted mb-4 text-xs tracking-wider uppercase">
          Pillar Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { name: "Wealth", score: answers.wealth_freedom || 0 },
            { name: "Health", score: answers.health_vitality || 0 },
            { name: "Relationships", score: answers.relationships_depth || 0 },
            { name: "Growth", score: answers.growth_aliveness || 0 },
            { name: "Purpose", score: answers.purpose_clarity || 0 },
          ].map((pillar) => {
            const isLowest = lowestPillar?.pillar === pillar.name.toLowerCase();
            return (
              <div key={pillar.name} className="flex items-center gap-4">
                <span
                  className={cn(
                    "font-oswald w-28 text-left text-sm",
                    isLowest && pillar.score <= 5 ? "text-red-400" : "text-lp-gray"
                  )}
                >
                  {pillar.name}
                  {isLowest && pillar.score <= 5 && " ←"}
                </span>
                <div className="bg-lp-border relative h-2 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all",
                      pillar.score >= 7 && "bg-lp-gold",
                      pillar.score >= 4 && pillar.score < 7 && "bg-lp-gold/60",
                      pillar.score < 4 && "bg-red-500/60"
                    )}
                    style={{ width: `${pillar.score * 10}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "font-bebas w-6 text-right text-lg",
                    isLowest && pillar.score <= 5 ? "text-red-400" : "text-lp-gold"
                  )}
                >
                  {pillar.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Reveals */}
      {patternReveals.length > 0 && (
        <div className="bg-lp-card border-lp-gold/30 mb-6 border p-6">
          <h3 className="font-oswald text-lp-gold mb-4 text-sm tracking-wider uppercase">
            What We See In Your Answers
          </h3>
          <div className="space-y-4">
            {patternReveals.slice(0, 2).map((reveal, index) => (
              <div key={index} className="border-lp-border border-l-2 pl-4">
                <p className="font-oswald text-lp-gold-light text-sm font-medium">
                  {reveal.pattern}
                </p>
                <p className="font-oswald text-lp-gray mt-1 text-sm font-extralight">
                  {reveal.insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2am Thought Insight */}
      {twoAmMeaning && answers.two_am_thought !== "other" && (
        <div className="bg-lp-card border-lp-border mb-6 border p-6">
          <h3 className="font-oswald text-lp-muted mb-2 text-xs tracking-wider uppercase">
            Your 2am Thought
          </h3>
          <p className="font-oswald text-lp-gold-light mb-2 text-base italic">
            &ldquo;{twoAmMeaning.thought}&rdquo;
          </p>
          <p className="font-oswald text-lp-gold mb-3 text-sm font-medium">
            Pattern: {twoAmMeaning.pattern}
          </p>
          <p className="font-oswald text-lp-gray text-sm font-extralight">{twoAmMeaning.insight}</p>
        </div>
      )}

      {/* Priority Pillar Insight */}
      {priorityInsight && (
        <div className="bg-lp-card border-lp-border mb-6 border p-6">
          <h3 className="font-oswald text-lp-muted mb-2 text-xs tracking-wider uppercase">
            Your Priority Pillar
          </h3>
          <p className="font-oswald text-lp-gold mb-3 text-base">{priorityInsight.validation}</p>
          <p className="font-oswald text-lp-gray mb-3 text-sm font-extralight">
            {priorityInsight.whyFirst}
          </p>
          <div className="bg-lp-gold/10 border-lp-gold border-l-2 p-3">
            <p className="font-oswald text-lp-white text-sm font-light">
              <span className="text-lp-gold">Ripple Effect:</span> {priorityInsight.rippleEffect}
            </p>
          </div>
        </div>
      )}

      {/* Readiness Response & CTA */}
      {readinessResponse && (
        <div className="bg-lp-gold/10 border-lp-gold/30 mb-6 border p-6">
          <p className="font-oswald text-lp-white mb-4 text-base leading-relaxed font-light">
            {readinessResponse.response}
          </p>
          <a
            href="/webinar"
            className={cn(
              "flex w-full items-center justify-center gap-2",
              "bg-lp-gold-light text-lp-black",
              "px-10 py-4 text-base",
              "font-oswald font-medium tracking-widest uppercase",
              "hover:bg-lp-gold-hover hover:-translate-y-0.5",
              "hover:shadow-[0_8px_40px_rgba(184,148,62,0.3)]",
              "transition-all duration-400"
            )}
          >
            {readinessResponse.cta}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Email reminder */}
      <p className="font-oswald text-lp-muted text-center text-xs font-extralight">
        Check your email for your complete Five Pillar Report with all pattern reveals and
        recommendations.
      </p>
    </div>
  );
}
