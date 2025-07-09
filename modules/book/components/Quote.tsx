import { useSession } from "@contexts/UseSession";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserDailyQuote } from "@store/modules/quote";
import dayjs from "dayjs";
import { Fragment, useEffect } from "react";

const Quote = () => {
  const dispatch = useDispatch();
  const enrollmentData = useSelector((state) => state.enrollments.current);
  const quotes = useSelector((state) => state.quotes);

  useEffect(() => {
    if (
      enrollmentData?.enrollmentDate &&
      !quotes.loading &&
      !quotes.fetched &&
      (!quotes.lastFetched || !dayjs().isSame(new Date(quotes.lastFetched), "d"))
    ) {
      dispatch(getUserDailyQuote(enrollmentData?.id));
    }
  }, [enrollmentData]);
  return (
    <div className="flex flex-col py-[15px] px-[30px] md:px-[40px] gap-[30px] w-full bg-action-50 rounded">
      {quotes.loading ? (
        <>
          <div className="flex flex-col gap-[10px]">
            <TextSkeleton sx="w-full" />
            <TextSkeleton sx="w-full" />
            <TextSkeleton sx="w-[60%]" />
          </div>
          <TextSkeleton sx="w-[30%]" />
        </>
      ) : (
        <>
          <Paragraph
            content={quotes.current?.content ? `“ ${quotes.current?.content}. ”` : "No Quote"}
            variant={paragraphVariants.titleLg}
          />
          <Paragraph
            content={quotes.current?.author}
            variant={paragraphVariants.title}
            sx="!font-bold uppercase"
          />
        </>
      )}
    </div>
  );
};

export default Quote;
