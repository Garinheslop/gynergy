"use client";

import { useState, useCallback } from "react";

import { useSelector } from "react-redux";

import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { BookSessionData } from "@resources/types/book";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useDispatch } from "@store/hooks";
import { enrollUserToBookSession } from "@store/modules/enrollment";

function NPSPrompt() {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!score) return;
    setSubmitting(true);
    try {
      await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback: feedback || undefined, context: "day_45" }),
      });
      setSubmitted(true);
    } catch {
      // Silently fail — NPS is non-critical
    } finally {
      setSubmitting(false);
    }
  }, [score, feedback]);

  if (submitted) {
    return (
      <div className="bg-bkg-dark/5 rounded-large mt-6 p-6 text-center">
        <p className="text-content-dark-secondary text-sm font-medium">
          Thank you for your feedback. It means the world to us.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bkg-dark/5 rounded-large mt-6 w-full max-w-md p-6">
      <p className="text-content-dark mb-2 text-center text-sm font-semibold">
        How likely are you to recommend this to a friend?
      </p>

      {/* Score buttons 1-10 */}
      <div className="mb-3 flex justify-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
              score === n
                ? "bg-action text-white"
                : "bg-bkg-light text-content-dark-secondary hover:bg-action/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="text-content-dark-tertiary mb-4 flex justify-between text-xs">
        <span>Not likely</span>
        <span>Extremely likely</span>
      </div>

      {/* Feedback textarea (shown after selecting score) */}
      {score && (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What's the main reason for your score? (optional)"
            rows={2}
            className="border-grey-300 bg-bkg-light text-content-dark placeholder:text-content-dark-tertiary focus:border-action mb-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-action hover:bg-action-hover w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Submit Feedback"}
          </button>
        </>
      )}
    </div>
  );
}

const BookCompletion = ({ latestSession }: { latestSession?: BookSessionData | null }) => {
  const dispatch = useDispatch();

  const currentBook = useSelector((state: RootState) => state.books.current);
  return (
    <section className="bg-bkg-light rounded-large mx-auto flex max-w-[1200px] flex-col items-center gap-8 p-5 pb-[20px] md:gap-10 md:p-[50px] md:pb-8">
      <Heading
        isHtml
        variant={headingVariants.heading}
        sx="text-center mx-auto !font-bold capitalize"
      >
        {`Congratulations On Completing ${currentBook?.shortName}`}
      </Heading>

      <Paragraph
        isHtml
        content={currentBook?.farewell}
        variant={paragraphVariants.regular}
        sx="flex flex-col gap-1 text-content-dark-secondary"
      />

      {/* NPS Prompt */}
      <NPSPrompt />

      {latestSession && (
        <ActionButton
          label={`Start New ${currentBook?.shortName} Session`}
          icon="arrow-right"
          onClick={() => {
            dispatch(enrollUserToBookSession(latestSession?.bookId));
          }}
          sx="w-full sm:w-max ml-auto flex-row-reverse"
        />
      )}
    </section>
  );
};

export default BookCompletion;
