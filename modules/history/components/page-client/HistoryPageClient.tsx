"use client";

import Image from "@modules/common/components/Image";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useGenerateHistoryCards from "@modules/history/hooks/useGenerateHistoryCards";
import icons from "@resources/icons";
import { JournalCardData } from "@resources/types/history";
import { headingVariants, paragraphVariants } from "@resources/variants";
import dayjs from "dayjs";
import React from "react";
import JournalHistoryCard from "../cards/JournalHistoryCard";
import ViosionCards from "../VisionCards";
import HistoryCardSkeleton from "../skeleton/HistoryCardSkeleton";
import { useDispatch, useSelector } from "@store/hooks";
import { useRouter } from "next/navigation";
import { pageTypes } from "@resources/types/page";
import { pagePaths } from "@resources/paths";
import { setJournalCurrentStates } from "@store/modules/journal";
import SkeletonWrapper from "@modules/common/components/SkeletonWrapper";
import { cn } from "@lib/utils/style";
import { setHistoryCurrentStates } from "@store/modules/history";

const HistoryPageClient: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const currentBook = useSelector((state) => state.books.current);
  const enrollments = useSelector((state) => state.enrollments);
  const histories = useSelector((state) => state.histories);
  const meditations = useSelector((state) => state.meditations);
  const { isLoading, historyData } = useGenerateHistoryCards();

  return (
    <section className="flex flex-col w-full max-w-[1253px] mx-auto gap-[30px] py-[100px] md:py-[130px] px-4">
      <div className="flex gap-2.5 items-center">
        <Heading variant={headingVariants.heading} sx="!font-bold text-start capitalize">
          {currentBook?.shortName} Journal History
        </Heading>
        {dayjs(enrollments.current?.enrollmentDate)
          .add(currentBook?.durationDays!, "day")
          .isBefore(dayjs()) && (
          <Paragraph
            variant={paragraphVariants.meta}
            content={"Ended"}
            sx={"bg-[#A4A7AE] px-2.5 py-[5px] rounded-[10px] w-fit h-fit"}
          />
        )}
      </div>

      <div className="flex sm:flex-row flex-col items-center justify-between gap-[10px]">
        {enrollments.loading ? (
          <div className="flex gap-[10px] items-center">
            <TextSkeleton sx="h-[20px] w-[150px]" />
            -
            <TextSkeleton sx="h-[20px] w-[150px]" />
          </div>
        ) : (
          <Paragraph
            variant={paragraphVariants.title}
            content={`${dayjs(enrollments.current?.enrollmentDate).format("MMM DD, YYYY")} - ${dayjs(
              enrollments.current?.enrollmentDate
            )
              .add(currentBook?.durationDays!, "day")
              .format("MMM DD, YYYY")}`}
            sx="!font-bold"
          />
        )}
        <div className="flex items-center gap-[5px]">
          <Image src={icons.point} alt="star-icon" className="h-[30px] w-[30px]" />

          <Paragraph
            variant={paragraphVariants.title}
            isHtml
            content={`<span>${enrollments.current?.totalPoints ?? 0}</span> Points Earned`}
            sx={cn("flex items-center gap-[5px] [&>span]:!font-bold", {
              "text-loading": enrollments?.loading,
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-[30px] w-full max-w-[1202px] mx-auto">
        {isLoading || histories.loading ? (
          <>
            <SkeletonWrapper renderTimes={4}>
              <HistoryCardSkeleton isVision />
            </SkeletonWrapper>
            <SkeletonWrapper renderTimes={20}>
              <HistoryCardSkeleton />
            </SkeletonWrapper>
          </>
        ) : (
          <>
            <Onboardings />
            <ViosionCards />

            {historyData.length > 0 &&
              historyData.map((journal: JournalCardData, index: number) => (
                <JournalHistoryCard
                  key={index}
                  data={journal}
                  isMeditation={journal.day > 14 && journal.day < 22 && journal.isDailyJournal}
                  isMeditationCompleted={
                    meditations.data?.length
                      ? meditations.data?.find((m) =>
                          dayjs(journal.entryDate).startOf("d").isSame(dayjs(m.entryDate), "d")
                        )
                        ? true
                        : false
                      : false
                  }
                  onCardClick={() => {
                    dispatch(setHistoryCurrentStates(journal));
                    router.push(`/${currentBook?.slug}/${pagePaths.journalView}`);
                  }}
                />
              ))}
          </>
        )}
      </div>
    </section>
  );
};

const Onboardings = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentBook = useSelector((state) => state.books.current);

  const openOnboardingHandler = ({
    isOnboardingInspiration = false,
    isOnboardingPotentialSelf = false,
  }: {
    isOnboardingInspiration?: boolean;
    isOnboardingPotentialSelf?: boolean;
  }) => {
    dispatch(
      setHistoryCurrentStates({
        isOnboardingInspiration,
        isOnboardingPotentialSelf,
        entryType: "onboardings",
      })
    );
    router.push(`/${currentBook?.slug}/${pagePaths.journalView}`);
  };
  return (
    <>
      <div
        className="p-5 rounded bg-[#D1E9FF] flex flex-col gap-5 shadow-2xs cursor-pointer min-h-[178px]"
        onClick={() => openOnboardingHandler({ isOnboardingInspiration: true })}
      >
        <Paragraph
          variant={paragraphVariants.title}
          content={"Inspiration and Gratitude"}
          sx="!font-bold"
        />
      </div>
      <div
        className="p-5 rounded bg-[#D1E9FF] flex flex-col gap-5 shadow-2xs cursor-pointer min-h-[178px]"
        onClick={() => openOnboardingHandler({ isOnboardingPotentialSelf: true })}
      >
        <Paragraph
          variant={paragraphVariants.title}
          content={"Meeting Your Highest Potential Self"}
          sx="!font-bold"
        />
      </div>
    </>
  );
};

export default HistoryPageClient;
