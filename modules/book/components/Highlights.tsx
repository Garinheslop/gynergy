import { useEffect } from "react";

import dayjs from "dayjs";

import { cn } from "@lib/utils/style";
import Image from "@modules/common/components/Image";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import { journalTypes } from "@resources/types/journal";
import { paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";

const Highlights = () => {
  const journals = useSelector((state) => state.journals);
  const actions = useSelector((state) => state.actions);
  const userEnrollment = useSelector((state) => state.enrollments.current);

  return (
    <div className="bg-bkg-light flex flex-col gap-10 rounded px-8 py-5 md:px-[40px]">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-5">
          <Paragraph
            content={`Day ${(dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1).toString().padStart(2, "0")}`}
            variant={paragraphVariants.titleXlg}
            sx="!font-bold"
          />
          <div className="flex items-center gap-1">
            {[
              journalTypes.morningJournal,
              journalTypes.eveningJournal,
              journalTypes.gratitudeAction,
            ].map((type, index) => (
              <i
                key={index}
                className={cn(
                  "border-border-light bg-bkg-light h-[33px] w-[33px] shrink-0 rounded-full border-[10px]",
                  {
                    "gng-complete-circle text-action-secondary border-0 bg-none text-[33px]":
                      journals.data.find((journal) => journal.journalType === type) ||
                      actions.data.find((action) => action.actionType === type),
                  }
                )}
              />
            ))}
          </div>
        </div>
        <Paragraph
          content={`Journal Started on ${dayjs(userEnrollment?.enrollmentDate).format("MMM DD, YYYY")}`}
          variant={paragraphVariants.regular}
          sx="text-content-dark-secondary"
        />
      </div>
      <div className="flex gap-1">
        <Image src={icons.point} className="h-[25px] w-auto" />
        {userEnrollment && (
          <Paragraph
            isHtml
            content={`<span>${userEnrollment?.totalPoints > 0 ? userEnrollment?.totalPoints.toString().padStart(2, "0") : 0}<span/> Points Earned`}
            variant={paragraphVariants.regular}
            sx="[&>span]:!font-bold"
          />
        )}
      </div>
    </div>
  );
};

export default Highlights;
