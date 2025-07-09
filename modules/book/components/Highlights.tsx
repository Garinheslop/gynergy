import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";
import { journalTypes } from "@resources/types/journal";
import dayjs from "dayjs";
import Image from "@modules/common/components/Image";
import icons from "@resources/icons";
import { useEffect } from "react";

const Highlights = () => {
  const journals = useSelector((state) => state.journals);
  const actions = useSelector((state) => state.actions);
  const userEnrollment = useSelector((state) => state.enrollments.current);

  return (
    <div className="flex flex-col gap-[40px] px-[30px] md:px-[40px] py-5 bg-bkg-light rounded">
      <div className="flex flex-col gap-[5px]">
        <div className="flex gap-5 justify-between">
          <Paragraph
            content={`Day ${(dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1).toString().padStart(2, "0")}`}
            variant={paragraphVariants.titleXlg}
            sx="!font-bold"
          />
          <div className="flex gap-[5px] items-center">
            {[
              journalTypes.morningJournal,
              journalTypes.eveningJournal,
              journalTypes.gratitudeAction,
            ].map((type, index) => (
              <i
                key={index}
                className={cn(
                  "w-[33px] h-[33px] border-[10px] border-border-light bg-bkg-light shrink-0 rounded-full",
                  {
                    "gng-complete-circle border-0 bg-none text-[33px] text-action-secondary":
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
      <div className="flex gap-[5px]">
        <Image src={icons.point} className="w-auto h-[25px]" />
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
