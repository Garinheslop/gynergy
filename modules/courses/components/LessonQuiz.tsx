"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

import { cn } from "@lib/utils/style";
import {
  Quiz,
  QuizQuestion as QuizQuestionType,
  QuizAttempt,
} from "@resources/types/content";

import QuizQuestion from "./QuizQuestion";
import QuizResults from "./QuizResults";

interface LessonQuizProps {
  lessonId: string;
  onComplete?: (passed: boolean) => void;
  onContinue?: () => void;
}

type QuizState = "loading" | "ready" | "in-progress" | "submitting" | "results" | "review" | "error" | "no-quiz";

export default function LessonQuiz({ lessonId, onComplete, onContinue }: LessonQuizProps) {
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [userAttempts, setUserAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Track answers per question
  const [answers, setAnswers] = useState<Record<string, { selectedIds: string[]; textAnswer: string }>>({});

  // Review state (shows correct/incorrect after completion)
  const [reviewResponses, setReviewResponses] = useState<Record<string, { isCorrect: boolean; explanation?: string }>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // FETCH QUIZ FOR LESSON
  // ==========================================================================

  const fetchQuiz = useCallback(async () => {
    try {
      setQuizState("loading");
      setError(null);

      const res = await fetch(`/api/courses/quiz?type=get-quiz-by-lesson&lessonId=${lessonId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setQuizState("no-quiz");
          return;
        }
        throw new Error(data.error || "Failed to load quiz");
      }

      setQuiz(data.data.quiz);
      setUserAttempts(data.data.userAttempts);
      setQuizState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
      setQuizState("error");
    }
  }, [lessonId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // ==========================================================================
  // START ATTEMPT
  // ==========================================================================

  const startAttempt = async () => {
    if (!quiz) return;

    try {
      setQuizState("loading");

      // Start attempt
      const startRes = await fetch("/api/courses/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "start-attempt", quizId: quiz.id }),
      });
      const startData = await startRes.json();

      if (!startRes.ok) {
        throw new Error(startData.error || "Failed to start quiz");
      }

      const newAttemptId = startData.data.attempt.id;
      setAttemptId(newAttemptId);

      // Set timer if time limited
      if (startData.data.timeLimitMinutes) {
        const remaining = startData.data.isResume
          ? startData.data.remainingMinutes * 60
          : startData.data.timeLimitMinutes * 60;
        setTimeRemaining(Math.floor(remaining));
      }

      // Fetch questions
      const qRes = await fetch(
        `/api/courses/quiz?type=get-questions&quizId=${quiz.id}&attemptId=${newAttemptId}`
      );
      const qData = await qRes.json();

      if (!qRes.ok) {
        throw new Error(qData.error || "Failed to load questions");
      }

      setQuestions(qData.data.questions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setReviewResponses({});
      setQuizState("in-progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
      setQuizState("error");
    }
  };

  // ==========================================================================
  // TIMER
  // ==========================================================================

  useEffect(() => {
    if (quizState !== "in-progress" || timeRemaining === null) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          // Time's up - auto-submit
          handleFinalize();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState, timeRemaining !== null]);

  // ==========================================================================
  // SUBMIT RESPONSE FOR CURRENT QUESTION
  // ==========================================================================

  const submitCurrentResponse = async () => {
    const question = questions[currentQuestionIndex];
    if (!question || !attemptId) return;

    const answer = answers[question.id];
    if (!answer) return;

    try {
      await fetch("/api/courses/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "submit-response",
          attemptId,
          questionId: question.id,
          selectedAnswerIds: answer.selectedIds.length > 0 ? answer.selectedIds : undefined,
          textAnswer: answer.textAnswer || undefined,
        }),
      });
    } catch {
      // Non-critical - continue even if individual save fails
    }
  };

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const goToNext = async () => {
    await submitCurrentResponse();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // ==========================================================================
  // FINALIZE
  // ==========================================================================

  const handleFinalize = async () => {
    if (!attemptId) return;

    try {
      setQuizState("submitting");

      // Submit current response first
      await submitCurrentResponse();

      // Finalize
      const res = await fetch("/api/courses/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "finalize-attempt", attemptId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quiz");
      }

      setAttempt(data.data.attempt);
      setUserAttempts((prev) => prev + 1);
      setQuizState("results");

      if (timerRef.current) clearInterval(timerRef.current);

      onComplete?.(data.data.attempt.passed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
      setQuizState("error");
    }
  };

  // ==========================================================================
  // REVIEW
  // ==========================================================================

  const handleReview = async () => {
    if (!attemptId) return;

    try {
      const res = await fetch(
        `/api/courses/quiz?type=get-attempt-details&attemptId=${attemptId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load review");
      }

      // Build review responses map
      const responseMap: Record<string, { isCorrect: boolean; explanation?: string }> = {};
      for (const response of data.data.responses) {
        responseMap[response.questionId] = {
          isCorrect: response.isCorrect,
          explanation: response.question?.explanation,
        };
      }

      // If showing correct answers, update questions with correct answer info
      if (data.data.showCorrectAnswers) {
        const updatedQuestions = questions.map((q) => {
          const response = data.data.responses.find((r: any) => r.questionId === q.id);
          if (response?.question?.answers) {
            return {
              ...q,
              explanation: response.question.explanation,
              answers: q.answers?.map((a) => {
                const reviewAnswer = response.question.answers.find((ra: any) => ra.id === a.id);
                return { ...a, isCorrect: reviewAnswer?.isCorrect };
              }),
            };
          }
          return q;
        });
        setQuestions(updatedQuestions);
      }

      setReviewResponses(responseMap);
      setCurrentQuestionIndex(0);
      setQuizState("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review");
    }
  };

  // ==========================================================================
  // ANSWER HANDLERS
  // ==========================================================================

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    setAnswers((prev) => {
      const current = prev[questionId] || { selectedIds: [], textAnswer: "" };

      if (question.questionType === "multi_select") {
        // Toggle selection for multi-select
        const selectedIds = current.selectedIds.includes(answerId)
          ? current.selectedIds.filter((id) => id !== answerId)
          : [...current.selectedIds, answerId];
        return { ...prev, [questionId]: { ...current, selectedIds } };
      }

      // Single selection for other types
      return { ...prev, [questionId]: { ...current, selectedIds: [answerId] } };
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedIds: [], textAnswer: text },
    }));
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswered = currentAnswer
    ? currentAnswer.selectedIds.length > 0 || currentAnswer.textAnswer.length > 0
    : false;

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.selectedIds.length > 0 || a.textAnswer.length > 0);
  }).length;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // No quiz for this lesson
  if (quizState === "no-quiz") return null;

  // Loading
  if (quizState === "loading") {
    return (
      <div className="border-border mt-6 rounded-xl border bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <div className="border-action h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Error
  if (quizState === "error") {
    return (
      <div className="border-border mt-6 rounded-xl border bg-white p-6">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchQuiz}
            className="text-action mt-2 text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Ready to start
  if (quizState === "ready" && quiz) {
    const canAttempt = userAttempts < quiz.maxAttempts;

    return (
      <div className="border-border mt-6 rounded-xl border bg-white p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-action/10 flex h-12 w-12 items-center justify-center rounded-full">
            <svg className="text-action h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="text-content-dark text-lg font-semibold">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-content-muted mt-1 text-sm">{quiz.description}</p>
            )}
          </div>

          {/* Quiz Info */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="text-content-muted">
              Passing: <span className="text-content-dark font-medium">{quiz.passingScore}%</span>
            </span>
            <span className="text-content-muted">
              Attempts: <span className="text-content-dark font-medium">{userAttempts}/{quiz.maxAttempts}</span>
            </span>
            {quiz.timeLimitMinutes && (
              <span className="text-content-muted">
                Time: <span className="text-content-dark font-medium">{quiz.timeLimitMinutes} min</span>
              </span>
            )}
            {quiz.pointsReward > 0 && (
              <span className="text-content-muted">
                Reward: <span className="text-content-dark font-medium">{quiz.pointsReward} pts</span>
              </span>
            )}
          </div>

          {canAttempt ? (
            <button
              onClick={startAttempt}
              className="bg-action mt-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              {userAttempts > 0 ? "Retry Quiz" : "Start Quiz"}
            </button>
          ) : (
            <p className="mt-2 text-sm text-red-600">
              Maximum attempts reached ({quiz.maxAttempts})
            </p>
          )}
        </div>
      </div>
    );
  }

  // In Progress or Review
  if ((quizState === "in-progress" || quizState === "review") && currentQuestion) {
    const isReview = quizState === "review";

    return (
      <div className="border-border mt-6 rounded-xl border bg-white">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-3">
          <h3 className="text-content-dark text-sm font-semibold">
            {isReview ? "Review Answers" : quiz?.title}
          </h3>
          <div className="flex items-center gap-3">
            {!isReview && timeRemaining !== null && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  timeRemaining < 60
                    ? "bg-red-100 text-red-700"
                    : timeRemaining < 300
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            )}
            <span className="text-content-muted text-xs">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="border-border flex gap-1 border-b px-6 py-2">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const hasAnswer = a && (a.selectedIds.length > 0 || a.textAnswer.length > 0);
            const reviewResult = reviewResponses[q.id];

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i === currentQuestionIndex && "bg-action",
                  i !== currentQuestionIndex && !isReview && hasAnswer && "bg-action/40",
                  i !== currentQuestionIndex && !isReview && !hasAnswer && "bg-gray-200",
                  i !== currentQuestionIndex && isReview && reviewResult?.isCorrect && "bg-green-500",
                  i !== currentQuestionIndex && isReview && reviewResult && !reviewResult.isCorrect && "bg-red-500",
                  i !== currentQuestionIndex && isReview && !reviewResult && "bg-gray-200"
                )}
              />
            );
          })}
        </div>

        {/* Question */}
        <div className="p-6">
          <QuizQuestion
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            questionText={currentQuestion.questionText}
            questionType={currentQuestion.questionType}
            answers={currentQuestion.answers || []}
            selectedAnswerIds={currentAnswer?.selectedIds || []}
            textAnswer={currentAnswer?.textAnswer || ""}
            explanation={isReview ? currentQuestion.explanation : undefined}
            showResult={isReview}
            isCorrect={isReview ? reviewResponses[currentQuestion.id]?.isCorrect : undefined}
            onSelectAnswer={(id) => handleSelectAnswer(currentQuestion.id, id)}
            onTextAnswerChange={(text) => handleTextAnswer(currentQuestion.id, text)}
          />
        </div>

        {/* Navigation */}
        <div className="border-border flex items-center justify-between border-t px-6 py-3">
          <button
            onClick={goToPrev}
            disabled={currentQuestionIndex === 0}
            className={cn(
              "flex items-center gap-1 rounded-lg px-4 py-2 text-sm transition-colors",
              currentQuestionIndex === 0
                ? "cursor-not-allowed text-gray-300"
                : "text-content-dark hover:bg-gray-100"
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {isReview ? (
            <button
              onClick={() => setQuizState("results")}
              className="text-action text-sm font-medium hover:underline"
            >
              Back to Results
            </button>
          ) : currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleFinalize}
              disabled={answeredCount < questions.length}
              className={cn(
                "rounded-lg px-6 py-2 text-sm font-medium transition-colors",
                answeredCount >= questions.length
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              )}
            >
              Submit Quiz ({answeredCount}/{questions.length})
            </button>
          ) : (
            <button
              onClick={goToNext}
              className={cn(
                "flex items-center gap-1 rounded-lg px-4 py-2 text-sm transition-colors",
                hasAnswered
                  ? "bg-action text-white hover:opacity-90"
                  : "text-content-dark hover:bg-gray-100"
              )}
            >
              {hasAnswered ? "Next" : "Skip"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Submitting
  if (quizState === "submitting") {
    return (
      <div className="border-border mt-6 rounded-xl border bg-white p-6">
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="border-action h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-content-muted text-sm">Submitting your answers...</p>
        </div>
      </div>
    );
  }

  // Results
  if (quizState === "results" && attempt && quiz) {
    return (
      <div className="border-border mt-6 rounded-xl border bg-white p-6">
        <QuizResults
          attempt={attempt}
          passingScore={quiz.passingScore}
          pointsReward={quiz.pointsReward}
          canRetry={userAttempts < quiz.maxAttempts}
          onRetry={startAttempt}
          onReview={handleReview}
          onContinue={() => onContinue?.()}
        />
      </div>
    );
  }

  return null;
}
