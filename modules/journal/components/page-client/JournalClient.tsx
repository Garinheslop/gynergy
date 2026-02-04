"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { usePopup } from "@contexts/UsePopup";
import Inspiration from "@modules/book/components/onboarding/Inspiration";
import PotentialSelf from "@modules/book/components/onboarding/PotentialSelf";
import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { pagePaths } from "@resources/paths";
import { buttonActionTypes } from "@resources/types/button";
import { journalTypes } from "@resources/types/journal";
import { useDispatch, useSelector } from "@store/hooks";
import { resetEditorDataStates } from "@store/modules/editor";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { resetHistoryCurrentState } from "@store/modules/history";

import DailyJournal from "../DailyJournal";
import VisionJournal from "../VisionJournal";
import WeeklyJournal from "../WeeklyJournal";


const JournalClient = ({ bookSlug }: { bookSlug: string }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const journals = useSelector((state) => state.journals);
  const histories = useSelector((state) => state.histories);
  const userEnrollment = useSelector((state) => state.enrollments.current);

  useEffect(() => {
    if (!histories?.current?.entryType) {
      router.push(`/${bookSlug}/${pagePaths.history}`);
    }
  }, [histories?.current]);
  return (
    <section className="bg-bkg-light mx-auto flex w-full max-w-[1220px] flex-col justify-start gap-[20px] px-4 py-[100px] sm:bg-transparent md:py-[130px]">
      <ActionButton
        label="Back to Histories"
        buttonActionType={buttonActionTypes.text}
        onClick={() => {
          dispatch(resetHistoryCurrentState());
        }}
        icon="arrow-left"
        sx="w-max [&>p]:!font-bold"
      />
      {histories.current?.isDailyJournal && (
        <div className="flex flex-col gap-[5px]">
          <Heading variant={headingVariants.heading} sx="!font-bold capitalize">
            Day{" "}
            {histories?.current?.entryDate
              ? dayjs(histories?.current?.entryDate).diff(userEnrollment?.enrollmentDate, "d") + 1
              : dayjs().diff(userEnrollment?.enrollmentDate, "d") + 1}
          </Heading>
          <Paragraph
            content={dayjs(histories?.current?.entryDate).format("MMM DD, YYYY")}
            variant={paragraphVariants.title}
            sx="text-content-dark-secondary !font-bold"
          />
        </div>
      )}
      <div className="flex flex-col gap-[50px]">
        {histories.current?.isDailyJournal && (
          <DailyJournal
            day={dayjs(histories?.current?.entryDate).diff(userEnrollment?.enrollmentDate, "d") + 1}
          />
        )}
        {histories.current?.isVisionJournal && <VisionJournal />}
        {histories.current?.isWeeklyJournal && <WeeklyJournal />}
        {(histories.current?.isOnboardingInspiration ||
          histories.current?.isOnboardingPotentialSelf) && (
          <div className="bg-bkg-light mx-auto flex max-w-[1200px] flex-col items-center gap-[30px] rounded-[20px] p-[20px] pb-[20px] md:gap-[40px] md:p-[50px] md:pb-[30px]">
            {histories.current?.isOnboardingInspiration && <Inspiration />}
            {histories.current?.isOnboardingPotentialSelf && <PotentialSelf />}
          </div>
        )}
      </div>
    </section>
  );
};

export default JournalClient;
