"use client";

import React from "react";

import { cn } from "@lib/utils/style";
import { QuizAnswer, QuestionType } from "@resources/types/content";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  questionType: QuestionType;
  answers: QuizAnswer[];
  selectedAnswerIds: string[];
  textAnswer: string;
  explanation?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  onSelectAnswer: (answerId: string) => void;
  onTextAnswerChange: (text: string) => void;
}

export default function QuizQuestion({
  questionNumber,
  totalQuestions,
  questionText,
  questionType,
  answers,
  selectedAnswerIds,
  textAnswer,
  explanation,
  showResult,
  isCorrect,
  onSelectAnswer,
  onTextAnswerChange,
}: QuizQuestionProps) {
  const isMultiSelect = questionType === "multi_select";
  const isShortAnswer = questionType === "short_answer";

  return (
    <div className="flex flex-col gap-4">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <span className="text-content-muted text-sm font-medium">
          Question {questionNumber} of {totalQuestions}
        </span>
        {showResult && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isCorrect
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-content-dark text-lg font-semibold">{questionText}</h3>

      {/* Type hint for multi-select */}
      {isMultiSelect && !showResult && (
        <p className="text-content-muted text-sm">Select all that apply</p>
      )}

      {/* Answer Options */}
      {!isShortAnswer ? (
        <div className="flex flex-col gap-2">
          {answers.map((answer) => {
            const isSelected = selectedAnswerIds.includes(answer.id);
            const showCorrectHighlight = showResult && answer.isCorrect;
            const showIncorrectHighlight = showResult && isSelected && !answer.isCorrect;

            return (
              <button
                key={answer.id}
                onClick={() => !showResult && onSelectAnswer(answer.id)}
                disabled={showResult}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                  !showResult && !isSelected && "border-border hover:border-action/50 hover:bg-action/5",
                  !showResult && isSelected && "border-action bg-action/10",
                  showCorrectHighlight && "border-green-500 bg-green-50",
                  showIncorrectHighlight && "border-red-500 bg-red-50",
                  showResult && !showCorrectHighlight && !showIncorrectHighlight && "border-border opacity-60",
                  showResult && "cursor-default"
                )}
              >
                {/* Selection Indicator */}
                <div
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 transition-colors",
                    isMultiSelect ? "rounded" : "rounded-full",
                    !showResult && !isSelected && "border-gray-300",
                    !showResult && isSelected && "border-action bg-action",
                    showCorrectHighlight && "border-green-500 bg-green-500",
                    showIncorrectHighlight && "border-red-500 bg-red-500"
                  )}
                >
                  {(isSelected || showCorrectHighlight) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Answer Text */}
                <span
                  className={cn(
                    "text-sm",
                    isSelected && !showResult && "text-action font-medium",
                    showCorrectHighlight && "font-medium text-green-700",
                    showIncorrectHighlight && "font-medium text-red-700",
                    !isSelected && !showCorrectHighlight && !showIncorrectHighlight && "text-content-dark"
                  )}
                >
                  {answer.answerText}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Short Answer Input */
        <div>
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => onTextAnswerChange(e.target.value)}
            disabled={showResult}
            placeholder="Type your answer..."
            className={cn(
              "border-border w-full rounded-lg border px-4 py-3 text-sm transition-colors",
              "focus:border-action focus:ring-action/20 focus:outline-none focus:ring-2",
              showResult && isCorrect && "border-green-500 bg-green-50",
              showResult && !isCorrect && "border-red-500 bg-red-50",
              showResult && "cursor-default"
            )}
          />
        </div>
      )}

      {/* Explanation (shown after answering) */}
      {showResult && explanation && (
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-1 text-xs font-semibold text-blue-600">Explanation</p>
          <p className="text-sm text-blue-800">{explanation}</p>
        </div>
      )}
    </div>
  );
}
