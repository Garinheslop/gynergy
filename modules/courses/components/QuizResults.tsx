"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import { QuizAttempt } from "@resources/types/content";

interface QuizResultsProps {
  attempt: QuizAttempt;
  passingScore: number;
  pointsReward: number;
  canRetry: boolean;
  onRetry: () => void;
  onReview: () => void;
  onContinue: () => void;
}

export default function QuizResults({
  attempt,
  passingScore,
  pointsReward,
  canRetry,
  onRetry,
  onReview,
  onContinue,
}: QuizResultsProps) {
  const passed = attempt.passed ?? false;
  const percentage = attempt.percentage ?? 0;
  const score = attempt.score ?? 0;
  const totalPoints = attempt.totalPoints ?? 0;

  // Calculate circumference for the progress ring
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Result Icon */}
      <div className="relative">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={passed ? "#22c55e" : "#ef4444"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-3xl font-bold",
              passed ? "text-green-600" : "text-red-600"
            )}
          >
            {Math.round(percentage)}%
          </span>
          <span className="text-content-muted text-xs">
            {score}/{totalPoints} pts
          </span>
        </div>
      </div>

      {/* Result Message */}
      <div className="text-center">
        <h3
          className={cn(
            "text-xl font-bold",
            passed ? "text-green-600" : "text-red-600"
          )}
        >
          {passed ? "Quiz Passed!" : "Quiz Not Passed"}
        </h3>
        <p className="text-content-muted mt-1 text-sm">
          {passed
            ? `Great job! You scored ${Math.round(percentage)}% (passing: ${passingScore}%)`
            : `You needed ${passingScore}% to pass. You scored ${Math.round(percentage)}%.`}
        </p>
      </div>

      {/* Points Earned */}
      {passed && pointsReward > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2">
          <span className="text-lg">&#11088;</span>
          <span className="text-sm font-semibold text-yellow-700">
            +{pointsReward} points earned!
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex w-full max-w-xs gap-4">
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-content-dark text-lg font-bold">{score}</p>
          <p className="text-content-muted text-xs">Score</p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-content-dark text-lg font-bold">{totalPoints}</p>
          <p className="text-content-muted text-xs">Total</p>
        </div>
        {attempt.timeTakenSeconds && (
          <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-content-dark text-lg font-bold">
              {Math.floor(attempt.timeTakenSeconds / 60)}:{(attempt.timeTakenSeconds % 60).toString().padStart(2, "0")}
            </p>
            <p className="text-content-muted text-xs">Time</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          onClick={onReview}
          className="border-border text-content-dark w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          Review Answers
        </button>

        {!passed && canRetry && (
          <button
            onClick={onRetry}
            className="bg-action w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Try Again
          </button>
        )}

        <button
          onClick={onContinue}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            passed
              ? "bg-action text-white hover:opacity-90"
              : "text-content-muted hover:text-content-dark"
          )}
        >
          {passed ? "Continue to Next Lesson" : "Continue Anyway"}
        </button>
      </div>
    </div>
  );
}
