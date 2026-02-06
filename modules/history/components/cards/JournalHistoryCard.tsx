import React, { memo } from "react";

import dayjs from "dayjs";

import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { historyTypes, JournalCardData } from "@resources/types/history";
import { paragraphVariants } from "@resources/variants";

type Props = {
  data: JournalCardData;
  onCardClick: (data: JournalCardData) => void;
  isMeditation: boolean;
  isMeditationCompleted: boolean;
};

const JournalHistoryCard = ({ data, onCardClick, isMeditation, isMeditationCompleted }: Props) => {
  const onCardClickHandler = () => {
    if (
      (data?.morningCompleted ||
        data?.eveningCompleted ||
        data?.gratitudeActionCompleted ||
        data?.weeklyReflectionCompleted ||
        data?.weeklyChallengeCompleted ||
        isMeditationCompleted) &&
      !dayjs(data.createdAt).isAfter(new Date()) &&
      onCardClick
    ) {
      onCardClick(data);
    }
  };
  return (
    <div
      className={cn(
        "bg-action-25 flex cursor-pointer flex-col gap-5 rounded p-5 shadow-2xs duration-150 hover:translate-y-[-2px]",
        {
          "bg-bkg-light gap-[10px]": data?.isDailyJournal,
          "bg-grey-50 cursor-default hover:translate-y-0":
            !data?.morningCompleted &&
            !data?.eveningCompleted &&
            !data?.gratitudeActionCompleted &&
            !data?.weeklyReflectionCompleted &&
            !data?.weeklyChallengeCompleted &&
            !isMeditationCompleted &&
            dayjs(data.entryDate).isBefore(new Date()) &&
            !dayjs(data.entryDate).isSame(new Date(), "d"),
          "cursor-default hover:translate-y-0":
            dayjs(data.entryDate).isAfter(new Date()) &&
            !data?.weeklyReflectionCompleted &&
            !data?.weeklyChallengeCompleted,
          "bg-bkg-light":
            dayjs(data.entryDate).isAfter(new Date()) ||
            dayjs(data.entryDate).isSame(new Date(), "d"),
        }
      )}
      onClick={onCardClickHandler}
    >
      <Paragraph
        variant={paragraphVariants.title}
        content={
          data?.isDailyJournal
            ? `Day ${data.day}`
            : data?.isWeeklyJournal
              ? data?.entryType === historyTypes.weeklyChallenge
                ? "Weekly Challenge"
                : "Weekly Reflection"
              : ""
        }
        sx={"!font-bold"}
      />
      {(data?.isDailyJournal || isMeditation) && (
        <>
          <div className="border-border-light border-b" />
          <div className="flex justify-between px-2.5 py-[15px]">
            <i
              className={cn("gng-morning text-primary text-[25px]", {
                "text-content-lighter": !data?.morningCompleted,
              })}
            />
            <i
              className={cn("gng-evening text-action-secondary text-[25px]", {
                "text-content-lighter": !data?.eveningCompleted,
              })}
            />
            <i
              className={cn("gng-action text-primary-500 text-[25px]", {
                "text-content-lighter": !data.gratitudeActionCompleted,
              })}
            />
            {isMeditation && (
              <i
                className={cn("gng-meditation text-[21px] text-[#6699FF]", {
                  "text-content-lighter": !isMeditationCompleted,
                })}
              />
            )}
          </div>

          <Paragraph
            variant={paragraphVariants.meta}
            content={dayjs(data.entryDate).format("DD MMM, YYYY")}
            sx={"text-content-dark-secondary text-center"}
          />
        </>
      )}
      {data?.isWeeklyJournal && (
        <div className="flex items-center gap-[5px]">
          <i
            className={cn(
              `gng-${data?.weeklyChallengeCompleted || data?.weeklyReflectionCompleted ? "complete-circle" : "alert-circle"} text-action-secondary p-[3px] text-[24px]`,
              {
                "text-content-dark-secondary":
                  !data?.weeklyChallengeCompleted && !data?.weeklyReflectionCompleted,
              }
            )}
          />

          <Paragraph
            variant={paragraphVariants.regular}
            content={
              data?.weeklyReflectionCompleted || data?.weeklyChallengeCompleted
                ? "Completed"
                : "Not Completed"
            }
            sx={cn("text-content-dark-secondary", {
              "text-action-secondary":
                data?.weeklyReflectionCompleted || data?.weeklyChallengeCompleted,
            })}
          />
        </div>
      )}
    </div>
  );
};

export default memo(JournalHistoryCard);
