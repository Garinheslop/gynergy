"use client";

import React from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { cn } from "@lib/utils/style";
import Image from "@modules/common/components/Image";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import SkeletonWrapper from "@modules/common/components/SkeletonWrapper";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useGenerateHistoryCards from "@modules/history/hooks/useGenerateHistoryCards";
import icons from "@resources/icons";
import { pagePaths } from "@resources/paths";
import { JournalCardData } from "@resources/types/history";
import { pageTypes } from "@resources/types/page";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setHistoryCurrentStates } from "@store/modules/history";
import { setJournalCurrentStates } from "@store/modules/journal";

import JournalHistoryCard from "../cards/JournalHistoryCard";
import HistoryCardSkeleton from "../skeleton/HistoryCardSkeleton";
import ViosionCards from "../VisionCards";

const HistoryPageClient: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const currentBook = useSelector((state) => state.books.current);
  const enrollments = useSelector((state) => state.enrollments);
  const histories = useSelector((state) => state.histories);
  const meditations = useSelector((state) => state.meditations);
  const { isLoading, historyData } = useGenerateHistoryCards();

  return (
    <section className="mx-auto flex w-full max-w-[1253px] flex-col gap-[30px] px-4 py-[100px] md:py-[130px]">
      <div className="flex items-center gap-2.5">
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

      <div className="flex flex-col items-center justify-between gap-[10px] sm:flex-row">
        {enrollments.loading ? (
          <div className="flex items-center gap-[10px]">
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

      <div className="mx-auto grid w-full max-w-[1202px] grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-[30px] lg:grid-cols-5">
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
        className="flex min-h-[178px] cursor-pointer flex-col gap-5 rounded bg-[#D1E9FF] p-5 shadow-2xs"
        onClick={() => openOnboardingHandler({ isOnboardingInspiration: true })}
      >
        <Paragraph
          variant={paragraphVariants.title}
          content={"Inspiration and Gratitude"}
          sx="!font-bold"
        />
      </div>
      <div
        className="flex min-h-[178px] cursor-pointer flex-col gap-5 rounded bg-[#D1E9FF] p-5 shadow-2xs"
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
