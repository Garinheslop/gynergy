"use client";

import ActionButton from "@modules/common/components/ActionButton";
import { buttonActionTypes } from "@resources/types/button";
import { useDispatch, useSelector } from "@store/hooks";
import { resetEditorDataStates } from "@store/modules/editor";
import { useRouter } from "next/navigation";
import { journalTypes } from "@resources/types/journal";
import Heading from "@modules/common/components/typography/Heading";
import { headingVariants, paragraphVariants } from "@resources/variants";
import Paragraph from "@modules/common/components/typography/Paragraph";
import dayjs from "dayjs";
import { usePopup } from "@contexts/UsePopup";
import DailyJournal from "../DailyJournal";
import VisionJournal from "../VisionJournal";
import { resetHistoryCurrentState } from "@store/modules/history";
import { useEffect } from "react";
import WeeklyJournal from "../WeeklyJournal";
import { pagePaths } from "@resources/paths";
import Inspiration from "@modules/book/components/onboarding/Inspiration";
import PotentialSelf from "@modules/book/components/onboarding/PotentialSelf";

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
    <section className="flex flex-col gap-[20px] bg-bkg-light sm:bg-transparent w-full justify-start max-w-[1220px] mx-auto py-[100px] md:py-[130px] px-4">
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
          <div className="flex flex-col items-center gap-[30px] md:gap-[40px] max-w-[1200px] p-[20px] md:p-[50px] pb-[20px] md:pb-[30px] bg-bkg-light rounded-[20px] mx-auto">
            {histories.current?.isOnboardingInspiration && <Inspiration />}
            {histories.current?.isOnboardingPotentialSelf && <PotentialSelf />}
          </div>
        )}
      </div>
    </section>
  );
};

export default JournalClient;
