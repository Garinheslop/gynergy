import { cn } from "@lib/utils/style";
import Image from "@modules/common/components/Image";
import Loader from "@modules/common/components/Loader";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import JourneyTable from "@modules/editor/components/weekly-journal/JourneyTable";
import { historyRequestTypes, historyTypes } from "@resources/types/history";
import { journalTypes } from "@resources/types/journal";
import { loaderTypes } from "@resources/types/loader";

import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserDailyHistory } from "@store/modules/history";
import { useEffect, useState } from "react";

const WeeklyJournal = () => {
  const dispatch = useDispatch();
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const histories = useSelector((state) => state.histories);

  const [historyData, setHistoryData] = useState<any | null>(null);

  useEffect(() => {
    setHistoryData(
      histories.current.entries.find(
        (entry: any) =>
          entry?.journalType === journalTypes.weeklyReflection ||
          entry?.actionType === journalTypes.weeklyChallenge
      )
    );
  }, [histories.current]);

  useEffect(() => {
    if (histories.current?.entryDate && !histories.loading && userEnrollment?.session?.id) {
      dispatch(
        getUserDailyHistory({
          sessionId: userEnrollment?.session.id,
          historyType:
            histories.current?.entryType === journalTypes.weeklyReflection
              ? historyTypes.weeklyReflection
              : historyTypes.weeklyChallenge,
          entryDate: histories.current.entryDate,
          historyRequestType: historyRequestTypes.userWeeklyHistory,
        })
      );
    }
  }, [histories.current?.entryDate, userEnrollment]);

  return (
    <section className="flex flex-col gap-[30px] sm:p-[30px] rounded-[20px] bg-bkg-light w-full">
      <div className="flex items-center sm:items-start justify-between flex-col sm:flex-row gap-[10px]">
        <Heading variant={headingVariants.titleLg} sx={cn("!font-bold")}>
          {getHeaderData(histories.current?.entryType!)}
        </Heading>
      </div>
      <div className="w-full border-b border-border-light" />
      {histories.loading || !historyData ? (
        <Loader type={loaderTypes.spinner} sx={"h-[500px]"} />
      ) : (
        <>
          <div className="flex flex-col gap-[10px]">
            <Heading variant={headingVariants.heading} sx={cn("!font-bold capitalize")}>
              {historyData?.action?.title.toLowerCase()}
            </Heading>

            <Paragraph content={historyData?.action?.tip} variant={paragraphVariants.regular} />
          </div>

          {historyData?.action?.isMeditation && <MeditationCard />}
          {!historyData?.action?.isEulogy && !historyData?.action?.isJourneyTable && (
            <Question
              heading="Did you complete the weekly challenge?"
              isCompleted={historyData?.isCompleted!}
            />
          )}
          {historyData?.action?.isJourneyTable && (
            <JourneyTable isStatic journeyData={historyData.journey} />
          )}
          <div className="flex flex-col gap-5">
            {historyData.action?.isEulogy && (
              <div className="flex flex-col gap-[10px]">
                <Heading variant={headingVariants.title} sx="!font-bold">
                  Eulogy
                </Heading>
                <Paragraph content={historyData.eulogy} sx="whitespace-pre-line" />
              </div>
            )}
            {(Object.keys(weeklyJournalInputData) as (keyof typeof weeklyJournalInputData)[]).map(
              (field, index) => {
                if (!historyData[field]) {
                  return null;
                } else {
                  return (
                    <div key={index} className="flex flex-col gap-[10px]">
                      <Heading variant={headingVariants.title} sx="!font-bold">
                        {weeklyJournalInputData[field].heading}
                      </Heading>
                      <Paragraph content={historyData[field]} />
                    </div>
                  );
                }
              }
            )}
            {historyData?.freeflow && (
              <div className="flex flex-col gap-[10px]">
                <Heading variant={headingVariants.title} sx="!font-bold">
                  Free Flow
                </Heading>
                {historyData?.freeflow && historyData?.freeflow?.startsWith("drawings") ? (
                  <Image
                    path={historyData.freeflow}
                    className="h-auto w-[210px] rounded object-cover"
                  />
                ) : (
                  <Paragraph content={historyData?.freeflow!} sx="text-content-dark" />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default WeeklyJournal;

const weeklyJournalInputData = {
  wins: {
    heading: "Biggest Wins",
  },
  challenges: {
    heading: "Challenges Overcome",
  },
  lessons: {
    heading: "Lessons Learned",
  },
  reward: {
    heading: "Weekly reward",
  },
  motivation: {
    heading: "How will this reward motivate you?",
  },
  purpose: {
    heading: "Why is this challenge important to you?",
  },
  success: {
    heading: "What will success look like at the end of the week?",
  },
  focus: {
    heading: "Focus for next week",
  },
};
const getHeaderData = (type: string) => {
  if (type === historyTypes.weeklyReflection) {
    return "Weekly Reflection";
  } else if (type === historyTypes.weeklyChallenge) {
    return "Weekly Challenge";
  }
};

const Question = ({ heading, isCompleted }: { heading: string; isCompleted: boolean }) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <Heading variant={headingVariants.title} sx="!font-bold">
        {heading}
      </Heading>
      <div
        className={cn(
          "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light bg-action"
        )}
      >
        <Paragraph content={isCompleted ? "Yes" : "No"} />
      </div>
    </div>
  );
};
const MeditationCard = () => {
  const meditations = useSelector((state) => state.meditations);

  return (
    <div
      className={cn(
        "relative flex flex-col p-5 md:p-[30px] justify-center items-between rounded gap-[20px] bg-[#E5EDFA]"
      )}
    >
      <div className={cn("flex flex-col gap-[10px]")}>
        <i className={cn(`gng-meditation text-[25px] text-[#6699FF]`)} />
        <Heading variant={headingVariants.cardHeading} sx="font-bold">
          {meditations.total} out of 7 Daily Meditations Completed
        </Heading>
        <Paragraph
          content={`Throughout this week, you will be prompted to reflect on your meditation each day.`}
          variant={paragraphVariants.regular}
          sx={"text-content-dark-secondary"}
        />
      </div>
    </div>
  );
};
