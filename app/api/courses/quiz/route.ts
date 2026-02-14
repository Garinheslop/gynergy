// Quiz System API Routes
// Handles quiz retrieval, attempts, and scoring

import { NextRequest } from "next/server";

import { errorResponse, successResponse, validateRequiredFields } from "@lib/api-utils";
import { createLogger } from "@lib/logger";
import { createClient } from "@lib/supabase-server";

const log = createLogger("api:quiz");

// =============================================================================
// TYPES
// =============================================================================

export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "multi_select";

interface Quiz {
  id: string;
  lessonId?: string;
  courseId?: string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  isRequired: boolean;
  pointsReward: number;
  orderIndex: number;
  isActive: boolean;
}

interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  timeTakenSeconds?: number;
  attemptNumber: number;
}

// =============================================================================
// GET HANDLERS
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestType = searchParams.get("type");
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (requestType) {
      // -----------------------------------------------------------------------
      // GET QUIZ BY LESSON ID
      // -----------------------------------------------------------------------
      case "get-quiz-by-lesson": {
        const lessonId = searchParams.get("lessonId");
        if (!lessonId) {
          return errorResponse("Lesson ID is required", 400);
        }

        // Verify user is enrolled in the course
        const { data: lesson } = await supabase
          .from("course_lessons")
          .select(
            `
            id,
            course_modules!inner(
              course_id,
              courses!inner(id)
            )
          `
          )
          .eq("id", lessonId)
          .single();

        if (!lesson) {
          return errorResponse("Lesson not found", 404);
        }

        const courseId = (lesson as any).course_modules.course_id;

        // Check enrollment
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", courseId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        // Check if admin
        const { data: isAdmin } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!enrollment && !isAdmin) {
          return errorResponse("Not enrolled in this course", 403);
        }

        // Get quiz for this lesson
        const { data: quiz, error } = await supabase
          .from("course_quizzes")
          .select("*")
          .eq("lesson_id", lessonId)
          .eq("is_active", true)
          .single();

        if (error || !quiz) {
          return errorResponse("Quiz not found for this lesson", 404);
        }

        // Get user's attempt count
        const { count: attemptCount } = await supabase
          .from("quiz_attempts")
          .select("id", { count: "exact" })
          .eq("quiz_id", quiz.id)
          .eq("user_id", user.id);

        return successResponse({
          quiz: mapQuiz(quiz),
          userAttempts: attemptCount || 0,
          canAttempt: (attemptCount || 0) < quiz.max_attempts,
        });
      }

      // -----------------------------------------------------------------------
      // GET QUIZ QUESTIONS
      // -----------------------------------------------------------------------
      case "get-questions": {
        const quizId = searchParams.get("quizId");
        const attemptId = searchParams.get("attemptId");

        if (!quizId) {
          return errorResponse("Quiz ID is required", 400);
        }

        // Verify user has access
        const { data: quiz } = await supabase
          .from("course_quizzes")
          .select("*, course_id")
          .eq("id", quizId)
          .single();

        if (!quiz) {
          return errorResponse("Quiz not found", 404);
        }

        // Check enrollment or admin
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", quiz.course_id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        const { data: isAdmin } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!enrollment && !isAdmin) {
          return errorResponse("Not enrolled in this course", 403);
        }

        // Check if user has a completed attempt (to show correct answers)
        let showCorrectAnswers = !!isAdmin;
        if (!showCorrectAnswers && quiz.show_correct_answers && attemptId) {
          const { data: completedAttempt } = await supabase
            .from("quiz_attempts")
            .select("id")
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .not("completed_at", "is", null)
            .single();

          showCorrectAnswers = !!completedAttempt;
        }

        // Get questions
        let questionsQuery = supabase
          .from("quiz_questions")
          .select(
            `
            *,
            quiz_answers (*)
          `
          )
          .eq("quiz_id", quizId)
          .eq("is_active", true);

        if (!quiz.shuffle_questions) {
          questionsQuery = questionsQuery.order("order_index", { ascending: true });
        }

        const { data: questions, error } = await questionsQuery;

        if (error) {
          log.error("Failed to get questions", { error });
          return errorResponse("Failed to get questions", 500);
        }

        // Shuffle questions if needed
        let mappedQuestions = (questions || []).map((q: any) => {
          let answers = (q.quiz_answers || []).map((a: any) => ({
            id: a.id,
            questionId: a.question_id,
            answerText: a.answer_text,
            orderIndex: a.order_index,
            ...(showCorrectAnswers ? { isCorrect: a.is_correct } : {}),
          }));

          // Shuffle answers if needed
          if (quiz.shuffle_answers) {
            answers = shuffleArray(answers);
          } else {
            answers.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
          }

          return {
            id: q.id,
            quizId: q.quiz_id,
            questionText: q.question_text,
            questionType: q.question_type,
            explanation: showCorrectAnswers ? q.explanation : undefined,
            points: q.points,
            orderIndex: q.order_index,
            answers,
          };
        });

        if (quiz.shuffle_questions) {
          mappedQuestions = shuffleArray(mappedQuestions);
        }

        return successResponse({
          questions: mappedQuestions,
          showCorrectAnswers,
          timeLimitMinutes: quiz.time_limit_minutes,
        });
      }

      // -----------------------------------------------------------------------
      // GET USER ATTEMPTS
      // -----------------------------------------------------------------------
      case "get-attempts": {
        const quizId = searchParams.get("quizId");
        if (!quizId) {
          return errorResponse("Quiz ID is required", 400);
        }

        const { data: attempts, error } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("quiz_id", quizId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          log.error("Failed to get attempts", { error });
          return errorResponse("Failed to get attempts", 500);
        }

        return successResponse({
          attempts: (attempts || []).map(mapAttempt),
        });
      }

      // -----------------------------------------------------------------------
      // GET ATTEMPT DETAILS WITH RESPONSES
      // -----------------------------------------------------------------------
      case "get-attempt-details": {
        const attemptId = searchParams.get("attemptId");
        if (!attemptId) {
          return errorResponse("Attempt ID is required", 400);
        }

        // Get attempt with responses
        const { data: attempt, error: attemptError } = await supabase
          .from("quiz_attempts")
          .select(
            `
            *,
            quiz_responses (
              *,
              quiz_questions (
                id,
                question_text,
                question_type,
                explanation,
                points,
                quiz_answers (*)
              )
            )
          `
          )
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .single();

        if (attemptError || !attempt) {
          return errorResponse("Attempt not found", 404);
        }

        // Check if completed (only show details after completion)
        if (!attempt.completed_at) {
          return errorResponse("Attempt not yet completed", 400);
        }

        // Get quiz settings
        const { data: quiz } = await supabase
          .from("course_quizzes")
          .select("show_correct_answers")
          .eq("id", attempt.quiz_id)
          .single();

        const showCorrect = quiz?.show_correct_answers ?? true;

        return successResponse({
          attempt: mapAttempt(attempt),
          responses: (attempt.quiz_responses || []).map((r: any) => ({
            id: r.id,
            questionId: r.question_id,
            selectedAnswerIds: r.selected_answer_ids,
            textAnswer: r.text_answer,
            isCorrect: r.is_correct,
            pointsEarned: r.points_earned,
            answeredAt: r.answered_at,
            question: {
              id: r.quiz_questions.id,
              questionText: r.quiz_questions.question_text,
              questionType: r.quiz_questions.question_type,
              explanation: showCorrect ? r.quiz_questions.explanation : undefined,
              points: r.quiz_questions.points,
              answers: (r.quiz_questions.quiz_answers || []).map((a: any) => ({
                id: a.id,
                answerText: a.answer_text,
                isCorrect: showCorrect ? a.is_correct : undefined,
              })),
            },
          })),
          showCorrectAnswers: showCorrect,
        });
      }

      // -----------------------------------------------------------------------
      // GET USER CERTIFICATES
      // -----------------------------------------------------------------------
      case "get-certificates": {
        const courseId = searchParams.get("courseId");

        let query = supabase
          .from("course_certificates")
          .select(
            `
            *,
            courses (id, title, thumbnail_url)
          `
          )
          .eq("user_id", user.id)
          .order("issued_at", { ascending: false });

        if (courseId) {
          query = query.eq("course_id", courseId);
        }

        const { data: certificates, error } = await query;

        if (error) {
          log.error("Failed to get certificates", { error });
          return errorResponse("Failed to get certificates", 500);
        }

        return successResponse({
          certificates: (certificates || []).map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            courseId: c.course_id,
            certificateNumber: c.certificate_number,
            issuedAt: c.issued_at,
            pdfUrl: c.pdf_url,
            metadata: c.metadata,
            course: c.courses
              ? {
                  id: c.courses.id,
                  title: c.courses.title,
                  thumbnailUrl: c.courses.thumbnail_url,
                }
              : null,
          })),
        });
      }

      default:
        return errorResponse(`Unknown request type: ${requestType}`, 400);
    }
  } catch (error) {
    log.error("Quiz API GET error", { error });
    return errorResponse("Internal server error", 500);
  }
}

// =============================================================================
// POST HANDLERS
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type: requestType } = body;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (requestType) {
      // -----------------------------------------------------------------------
      // START QUIZ ATTEMPT
      // -----------------------------------------------------------------------
      case "start-attempt": {
        const { quizId } = body;
        if (!quizId) {
          return errorResponse("Quiz ID is required", 400);
        }

        // Get quiz details
        const { data: quiz, error: quizError } = await supabase
          .from("course_quizzes")
          .select("*, course_id")
          .eq("id", quizId)
          .eq("is_active", true)
          .single();

        if (quizError || !quiz) {
          return errorResponse("Quiz not found", 404);
        }

        // Check enrollment
        const { data: enrollment } = await supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", quiz.course_id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        const { data: isAdmin } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!enrollment && !isAdmin) {
          return errorResponse("Not enrolled in this course", 403);
        }

        // Check attempt count
        const { count: attemptCount } = await supabase
          .from("quiz_attempts")
          .select("id", { count: "exact" })
          .eq("quiz_id", quizId)
          .eq("user_id", user.id);

        if ((attemptCount || 0) >= quiz.max_attempts) {
          return errorResponse(
            `Maximum attempts (${quiz.max_attempts}) reached for this quiz`,
            400
          );
        }

        // Check for incomplete attempt
        const { data: incompleteAttempt } = await supabase
          .from("quiz_attempts")
          .select("id, started_at")
          .eq("quiz_id", quizId)
          .eq("user_id", user.id)
          .is("completed_at", null)
          .single();

        if (incompleteAttempt) {
          // Check if time limit exceeded
          if (quiz.time_limit_minutes) {
            const startTime = new Date(incompleteAttempt.started_at).getTime();
            const elapsed = (Date.now() - startTime) / 1000 / 60;
            if (elapsed > quiz.time_limit_minutes) {
              // Auto-finalize the expired attempt
              await supabase.rpc("finalize_quiz_attempt", {
                p_attempt_id: incompleteAttempt.id,
              });
            } else {
              // Return existing attempt
              return successResponse({
                attempt: { id: incompleteAttempt.id, startedAt: incompleteAttempt.started_at },
                isResume: true,
                remainingMinutes: quiz.time_limit_minutes - elapsed,
              });
            }
          } else {
            // No time limit, return existing attempt
            return successResponse({
              attempt: { id: incompleteAttempt.id, startedAt: incompleteAttempt.started_at },
              isResume: true,
            });
          }
        }

        // Create new attempt
        const { data: attempt, error: attemptError } = await supabase
          .from("quiz_attempts")
          .insert({
            user_id: user.id,
            quiz_id: quizId,
            attempt_number: (attemptCount || 0) + 1,
          })
          .select()
          .single();

        if (attemptError) {
          log.error("Failed to create attempt", { error: attemptError });
          return errorResponse("Failed to start quiz", 500);
        }

        log.info("Quiz attempt started", { attemptId: attempt.id, quizId, userId: user.id });

        return successResponse({
          attempt: mapAttempt(attempt),
          isResume: false,
          timeLimitMinutes: quiz.time_limit_minutes,
        });
      }

      // -----------------------------------------------------------------------
      // SUBMIT RESPONSE
      // -----------------------------------------------------------------------
      case "submit-response": {
        const { attemptId, questionId, selectedAnswerIds, textAnswer } = body;

        const validation = validateRequiredFields(body, ["attemptId", "questionId"]);
        if (!validation.valid) {
          return errorResponse(`Missing required fields: ${validation.missing.join(", ")}`, 400);
        }

        // Verify attempt ownership and not completed
        const { data: attempt, error: attemptError } = await supabase
          .from("quiz_attempts")
          .select("*, course_quizzes!inner(time_limit_minutes)")
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .is("completed_at", null)
          .single();

        if (attemptError || !attempt) {
          return errorResponse("Attempt not found or already completed", 404);
        }

        // Check time limit
        if (attempt.course_quizzes.time_limit_minutes) {
          const startTime = new Date(attempt.started_at).getTime();
          const elapsed = (Date.now() - startTime) / 1000 / 60;
          if (elapsed > attempt.course_quizzes.time_limit_minutes) {
            // Auto-finalize
            await supabase.rpc("finalize_quiz_attempt", { p_attempt_id: attemptId });
            return errorResponse("Time limit exceeded. Quiz has been auto-submitted.", 400);
          }
        }

        // Get question details
        const { data: question, error: questionError } = await supabase
          .from("quiz_questions")
          .select(
            `
            *,
            quiz_answers (*)
          `
          )
          .eq("id", questionId)
          .eq("quiz_id", attempt.quiz_id)
          .single();

        if (questionError || !question) {
          return errorResponse("Question not found", 404);
        }

        // Calculate if correct and points earned
        let isCorrect = false;
        let pointsEarned = 0;

        if (
          question.question_type === "multiple_choice" ||
          question.question_type === "true_false"
        ) {
          // Single answer - check if selected answer is correct
          const selectedId = selectedAnswerIds?.[0];
          const correctAnswer = question.quiz_answers.find((a: any) => a.is_correct);
          isCorrect = selectedId === correctAnswer?.id;
          pointsEarned = isCorrect ? question.points : 0;
        } else if (question.question_type === "multi_select") {
          // Multiple answers - all correct answers must be selected, no incorrect ones
          const correctIds = question.quiz_answers
            .filter((a: any) => a.is_correct)
            .map((a: any) => a.id as string);
          const selectedSet = new Set(selectedAnswerIds || []);

          // Check if sets are equal
          isCorrect =
            correctIds.length === selectedSet.size &&
            correctIds.every((id: string) => selectedSet.has(id));
          pointsEarned = isCorrect ? question.points : 0;
        } else if (question.question_type === "short_answer") {
          // Short answer - check against any correct answer text (case-insensitive)
          const normalizedAnswer = (textAnswer || "").toLowerCase().trim();
          const correctAnswers = question.quiz_answers
            .filter((a: any) => a.is_correct)
            .map((a: any) => a.answer_text.toLowerCase().trim());
          isCorrect = correctAnswers.includes(normalizedAnswer);
          pointsEarned = isCorrect ? question.points : 0;
        }

        // Upsert response (allows changing answer during attempt)
        const { data: response, error: responseError } = await supabase
          .from("quiz_responses")
          .upsert(
            {
              attempt_id: attemptId,
              question_id: questionId,
              selected_answer_ids: selectedAnswerIds || [],
              text_answer: textAnswer || null,
              is_correct: isCorrect,
              points_earned: pointsEarned,
              answered_at: new Date().toISOString(),
            },
            {
              onConflict: "attempt_id,question_id",
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (responseError) {
          log.error("Failed to save response", { error: responseError });
          return errorResponse("Failed to save response", 500);
        }

        return successResponse({
          response: {
            id: response.id,
            questionId: response.question_id,
            isCorrect,
            pointsEarned,
          },
        });
      }

      // -----------------------------------------------------------------------
      // FINALIZE ATTEMPT
      // -----------------------------------------------------------------------
      case "finalize-attempt": {
        const { attemptId } = body;
        if (!attemptId) {
          return errorResponse("Attempt ID is required", 400);
        }

        // Verify ownership and not completed
        const { data: attempt, error: attemptError } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("id", attemptId)
          .eq("user_id", user.id)
          .is("completed_at", null)
          .single();

        if (attemptError || !attempt) {
          return errorResponse("Attempt not found or already completed", 404);
        }

        // Use database function to calculate and save results
        const { error: finalizeError } = await supabase.rpc("finalize_quiz_attempt", {
          p_attempt_id: attemptId,
        });

        if (finalizeError) {
          log.error("Failed to finalize attempt", { error: finalizeError });
          return errorResponse("Failed to finalize attempt", 500);
        }

        // Get updated attempt
        const { data: finalizedAttempt } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("id", attemptId)
          .single();

        // Award points if passed
        if (finalizedAttempt?.passed) {
          const { data: quiz } = await supabase
            .from("course_quizzes")
            .select("points_reward")
            .eq("id", finalizedAttempt.quiz_id)
            .single();

          if (quiz?.points_reward && quiz.points_reward > 0) {
            // Check if points already awarded for this quiz
            const { data: existingPoints } = await supabase
              .from("user_points")
              .select("id")
              .eq("user_id", user.id)
              .eq("source", "quiz_completion")
              .eq("source_id", finalizedAttempt.quiz_id)
              .single();

            if (!existingPoints) {
              await supabase.from("user_points").insert({
                user_id: user.id,
                points: quiz.points_reward,
                source: "quiz_completion",
                source_id: finalizedAttempt.quiz_id,
                description: "Quiz passed",
              });
            }
          }
        }

        log.info("Quiz attempt finalized", {
          attemptId,
          passed: finalizedAttempt?.passed,
          percentage: finalizedAttempt?.percentage,
        });

        return successResponse({
          attempt: mapAttempt(finalizedAttempt),
        });
      }

      default:
        return errorResponse(`Unknown request type: ${requestType}`, 400);
    }
  } catch (error) {
    log.error("Quiz API POST error", { error });
    return errorResponse("Internal server error", 500);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapQuiz(quiz: any): Quiz {
  return {
    id: quiz.id,
    lessonId: quiz.lesson_id,
    courseId: quiz.course_id,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passing_score,
    maxAttempts: quiz.max_attempts,
    timeLimitMinutes: quiz.time_limit_minutes,
    shuffleQuestions: quiz.shuffle_questions,
    shuffleAnswers: quiz.shuffle_answers,
    showCorrectAnswers: quiz.show_correct_answers,
    isRequired: quiz.is_required,
    pointsReward: quiz.points_reward,
    orderIndex: quiz.order_index,
    isActive: quiz.is_active,
  };
}

function mapAttempt(attempt: any): QuizAttempt {
  return {
    id: attempt.id,
    userId: attempt.user_id,
    quizId: attempt.quiz_id,
    startedAt: attempt.started_at,
    completedAt: attempt.completed_at,
    score: attempt.score,
    totalPoints: attempt.total_points,
    percentage: attempt.percentage ? Number.parseFloat(attempt.percentage) : undefined,
    passed: attempt.passed,
    timeTakenSeconds: attempt.time_taken_seconds,
    attemptNumber: attempt.attempt_number,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
