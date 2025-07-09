import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { historyTypes, JournalCardData } from "@resources/types/history";
import { paragraphVariants } from "@resources/variants";
import dayjs from "dayjs";
import React from "react";

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
        "p-5 rounded bg-action-25 flex flex-col gap-5 shadow-2xs cursor-pointer hover:translate-y-[-2px] duration-150",
        {
          "gap-[10px] bg-bkg-light": data?.isDailyJournal,
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
          <div className="border-b border-border-light" />
          <div className="px-2.5 py-[15px] flex justify-between">
            <i
              className={cn("gng-morning text-[25px] text-primary", {
                "text-content-lighter": !data?.morningCompleted,
              })}
            />
            <i
              className={cn("gng-evening text-[25px] text-action-secondary", {
                "text-content-lighter": !data?.eveningCompleted,
              })}
            />
            <i
              className={cn("gng-action text-[25px] text-primary-500", {
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
        <div className="flex gap-[5px] items-center">
          <i
            className={cn(
              `gng-${data?.weeklyChallengeCompleted || data?.weeklyReflectionCompleted ? "complete-circle" : "alert-circle"} text-[24px] p-[3px] text-action-secondary`,
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

export default JournalHistoryCard;
