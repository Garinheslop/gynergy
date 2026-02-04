import { useEffect, useRef, useState } from "react";

import { usePopup } from "@contexts/UsePopup";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Image from "@modules/common/components/Image";
import TextSkeleton from "@modules/common/components/skeleton/TextSkeleton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import { buttonActionTypes } from "@resources/types/button";
import { journalTypes } from "@resources/types/journal";
import { headingVariants, paragraphVariants } from "@resources/variants";

interface JournalCardProps {
  journalType: (typeof journalTypes)[keyof typeof journalTypes];
  heading: string;
  subHeading?: string;
  description: string;
  subDescription?: string;
  hyperlink?: string;
  icon?: string;
  streak?: number;
  points: number;
  onWrite?: (journalType: string) => void;
  isDisabled?: boolean;
  isTimeRestricted?: boolean;
  isLoading?: boolean;
  isCompleted: boolean;
}
const JournalCard: React.FC<JournalCardProps> = ({
  journalType,
  heading,
  subHeading,
  description,
  subDescription,
  hyperlink,
  icon,
  points,
  streak = 0,
  onWrite,
  isDisabled,
  isTimeRestricted,
  isLoading = false,
  isCompleted,
}) => {
  const { journalPopupObj } = usePopup();

  const contentRef = useRef<HTMLDivElement>(null);
  const [isClamped, setClamped] = useState(false);

  useEffect(() => {
    if (contentRef && contentRef?.current) {
      setClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [contentRef]);
  return (
    <div
      className={cn(
        "items-between bg-bkg-light flex flex-col justify-center gap-[30px] rounded p-5 md:p-[30px]",
        { "bg-grey-50": isCompleted || isDisabled }
      )}
    >
      <div className="flex h-full flex-col gap-[30px]">
        <div
          className={cn("flex flex-col gap-[10px]", {
            "gap-5": journalType === journalTypes.weeklyChallenge,
          })}
        >
          {icon && (
            <i
              className={cn(`gng-${icon} py-[4px] text-[32px]`, {
                "text-primary": journalType === journalTypes.morningJournal,
                "text-action-secondary": journalType === journalTypes.eveningJournal,
                "text-primary-500": journalType === journalTypes.gratitudeAction,
                "text-grey-300": isCompleted,
                "text-content-dark-secondary text-loading": isLoading,
              })}
            />
          )}
          <Heading
            variant={headingVariants.cardHeading}
            sx={cn("!font-bold", {
              "text-content-dark-secondary": isCompleted,
            })}
          >
            {heading}
          </Heading>
          {isLoading && subDescription ? (
            <div className="flex w-full flex-col gap-[5px]">
              <TextSkeleton sx="w-[65%] h-[18px]" />
            </div>
          ) : (
            <Paragraph
              isHtml
              content={subDescription}
              variant={paragraphVariants.regular}
              sx={cn("[&>span]:!font-bold", {
                "text-content-dark-secondary": isCompleted || isDisabled || isTimeRestricted,
              })}
            />
          )}
          <div
            className={cn("flex w-full flex-col", {
              "gap-[10px]": journalType === journalTypes.weeklyChallenge,
            })}
          >
            {journalType === journalTypes.weeklyChallenge && !isDisabled && (
              <Paragraph
                content={"THIS WEEK’S CHALLENGE:"}
                variant={paragraphVariants.regular}
                sx={cn("[&>span]:!font-bold", {
                  "text-content-dark-secondary": isCompleted || isDisabled,
                })}
              />
            )}
            {subHeading && !isDisabled && (
              <>
                {isLoading ? (
                  <TextSkeleton sx="w-full h-[18px] mb-[5px]" />
                ) : (
                  <Paragraph
                    content={subHeading}
                    variant={paragraphVariants.regular}
                    sx={cn("!font-bold capitalize", {
                      "text-content-dark-secondary": isCompleted || isDisabled,
                    })}
                  />
                )}
              </>
            )}
            {isLoading &&
            (journalType === journalTypes.gratitudeAction ||
              journalType === journalTypes.weeklyChallenge) ? (
              <div className="flex w-full flex-col gap-[5px]">
                <TextSkeleton sx="w-full h-[18px]" />
                <TextSkeleton sx="w-[95%] h-[18px]" />
              </div>
            ) : (
              <>
                {!isDisabled && description && (
                  <Paragraph
                    ref={contentRef}
                    content={description}
                    variant={paragraphVariants.regular}
                    sx={cn({
                      "line-clamp-2": journalType !== journalTypes.weeklyChallenge,
                      "text-content-dark-secondary": isCompleted || isDisabled,
                    })}
                  />
                )}
              </>
            )}
            {isClamped && (
              <ActionButton
                label="Read More"
                onClick={() => {
                  journalPopupObj.open({
                    popupData: {
                      heading,
                      subHeading,
                      description,
                      subDescription,
                      icon,
                      points,
                      streak,
                      onWrite,
                      isDisabled,
                      isLoading,
                      isCompleted,
                    },
                    popupAction: () => onWrite && onWrite(journalType),
                    popupType: journalType,
                  });
                }}
                buttonActionType={buttonActionTypes.text}
                sx="[&>P]:text-[#326FCF] hover:bg-transparent hover:px-0 hover:[&>p]:text-action-secondary [&>p]:duration-150"
              />
            )}
          </div>
          {hyperlink && journalType === journalTypes.weeklyChallenge && !isDisabled && (
            <ActionButton
              label="Watch Garin & Yesi Explain This Challenge"
              buttonActionType={buttonActionTypes.text}
              onClick={() => {
                window.open(hyperlink, "_blank", "noopener,noreferrer");
              }}
              disabled={isLoading}
              icon="hyperlink"
              sx="[&>i]:text-[13px] [&>p,&>i]:text-[#007AFF] [&>p,&>i]:group-hover:opacity-90 hover:px-0 hover:bg-transparent [&>p]:underline gap-[5px] [&>p]:truncate [&>p]:max-w-[85%] sm:[&>p]:max-w-max justify-end flex-row-reverse w-max group"
            />
          )}
        </div>
        {isCompleted && !isDisabled ? (
          <div className="flex gap-[10px]">
            <i className="gng-complete-circle text-action-secondary text-[25px]" />
            <Paragraph content={"Completed"} variant={paragraphVariants.regular} />
          </div>
        ) : (
          <>
            {!isDisabled && (
              <ActionButton
                label="Write Now"
                buttonActionType={buttonActionTypes.text}
                onClick={() => onWrite && onWrite(journalType)}
                disabled={isLoading || !onWrite || isDisabled || isTimeRestricted}
                icon="long-arrow-right-circle"
                sx="[&>p]:!font-bold flex-row-reverse w-max"
              />
            )}
          </>
        )}

        {(
          [
            journalTypes.morningJournal,
            journalTypes.eveningJournal,
            journalTypes.gratitudeAction,
          ] as readonly string[]
        ).includes(journalType) && (
          <>
            {isLoading ? (
              <TextSkeleton sx="w-[60%]" />
            ) : (
              <div className="flex gap-[5px]">
                <Image src={icons.streak} className="h-[25px] w-auto" />
                <Paragraph
                  isHtml
                  content={`<span>${streak > 0 ? streak.toString().padStart(2, "0") : 0}<span/> Days Streak`}
                  variant={paragraphVariants.regular}
                  sx="[&>span]:!font-bold"
                />
              </div>
            )}
          </>
        )}
      </div>

      {!isCompleted && !isDisabled && (
        <div className="border-border-light flex gap-[10px] border-t pt-[15px]">
          {isLoading ? (
            <TextSkeleton sx="w-[70%]" />
          ) : (
            <>
              <Image src={icons.point} className="h-[25px] w-auto" />
              <Paragraph
                isHtml
                content={`Complete & Earn <span>${points} Pts<span/>`}
                variant={paragraphVariants.regular}
                sx="[&>span]:!font-bold"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalCard;
