"use client";

import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { BookSessionData } from "@resources/types/book";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useDispatch } from "@store/hooks";
import { enrollUserToBookSession } from "@store/modules/enrollment";
import { useSelector } from "react-redux";

const BookCompletion = ({ latestSession }: { latestSession?: BookSessionData | null }) => {
  const dispatch = useDispatch();

  const currentBook = useSelector((state: RootState) => state.books.current);
  return (
    <section className="flex flex-col items-center gap-[30px] md:gap-[40px] max-w-[1200px] p-[20px] md:p-[50px] pb-[20px] md:pb-[30px] bg-bkg-light rounded-[20px] mx-auto">
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
        sx="flex flex-col gap-[5px] text-content-dark-secondary"
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
