"use client";

import { useSelector } from "react-redux";

import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { BookSessionData } from "@resources/types/book";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useDispatch } from "@store/hooks";
import { enrollUserToBookSession } from "@store/modules/enrollment";

const BookCompletion = ({ latestSession }: { latestSession?: BookSessionData | null }) => {
  const dispatch = useDispatch();

  const currentBook = useSelector((state: RootState) => state.books.current);
  return (
    <section className="bg-bkg-light mx-auto flex max-w-[1200px] flex-col items-center gap-8 rounded-large p-5 pb-[20px] md:gap-10 md:p-[50px] md:pb-8">
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
