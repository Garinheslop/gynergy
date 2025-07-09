//context
import Modal from "@modules/common/components/modal";
import { usePopup } from "@contexts/UsePopup";
import Webcam from "react-webcam";
import { useCallback, useEffect, useRef, useState } from "react";
import ActionButton from "@modules/common/components/ActionButton";
import { base64ToArrayBuffer, getBase64 } from "@lib/utils/image";
import FileInput from "@modules/common/components/FileInput";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { headingVariants, paragraphVariants } from "@resources/variants";
import Image from "@modules/common/components/Image";
import { ImageRawData } from "@resources/types/ocr";
import Heading from "@modules/common/components/typography/Heading";
import { buttonActionTypes } from "@resources/types/button";
import { cn } from "@lib/utils/style";
import { journalTypes } from "@resources/types/journal";
import icons from "@resources/icons";
import { useSelector } from "@store/hooks";
import { useRouter } from "next/navigation";
import ReactConfetti from "react-confetti";

const JournalPopup = () => {
  const router = useRouter();
  const currentBook = useSelector((state) => state.books.current);
  const { journalPopupObj } = usePopup();

  const [popupContents, setPopupContents] = useState<any | null>(null);

  const { popupType, popupAction, popupData } = journalPopupObj.data;

  useEffect(() => {
    if (journalPopupObj.show && popupType) {
      setPopupContents(getContent(popupType));
    } else {
      setPopupContents(null);
    }
  }, [journalPopupObj.show, popupType]);

  if (!journalPopupObj.show || !popupType) return null;

  return (
    <Modal open={journalPopupObj.show} onClose={journalPopupObj.close}>
      <section className="relative flex justify-center items-between flex-col mx-auto py-[60px] px-[30px] sm:p-[30px] w-screen h-screen sm:w-[620px] sm:h-[692px] overflow-auto bg-bkg-light rounded">
        <i
          className="gng-close text-[18px] cursor-pointer absolute top-2 right-2 p-6"
          onClick={journalPopupObj.close}
        />
        <div className="flex flex-col w-full h-full gap-5">
          <div className="flex flex-col gap-[10px]">
            <i
              className={cn(`gng-${popupContents?.icon} text-[32px] p-[4px]`, {
                "text-primary": popupType === journalTypes.morningJournal,
                "text-action-secondary": popupType === journalTypes.eveningJournal,
                "text-primary-500": popupType === journalTypes.gratitudeAction,
              })}
            />
            <Heading variant={headingVariants.cardHeading} sx="!font-bold">
              {popupContents?.heading}
            </Heading>
          </div>
          <div className="flex w-full border-t border-border-light" />
          <div className="flex flex-col gap-[10px]">
            <Paragraph
              variant={paragraphVariants.titleXlg}
              content={popupData?.subHeading?.toLowerCase()}
              sx="!font-bold capitalize"
            />
            <Paragraph content={popupData?.description} />
          </div>
        </div>

        <div className="flex flex-col gap-5 h-max">
          <div className="flex items-center justify-between">
            <div className="flex gap-[5px]">
              <Image src={icons.streak} className="w-auto h-[25px]" />
              <Paragraph
                isHtml
                content={`<span>${popupData?.streak > 0 ? popupData?.streak.toString().padStart(2, "0") : 0}<span/> Days Streak`}
                variant={paragraphVariants.regular}
                sx="[&>span]:!font-bold"
              />
            </div>
            {popupData?.isCompleted ? (
              <div className="flex gap-[10px]">
                <i className="gng-complete-circle text-[25px] text-action-secondary" />
                <Paragraph content={"Completed"} variant={paragraphVariants.regular} />
              </div>
            ) : (
              <ActionButton
                label="Write Now"
                buttonActionType={buttonActionTypes.text}
                onClick={() => {
                  popupAction && popupAction();
                  journalPopupObj.close();
                }}
                disabled={!popupAction}
                icon="long-arrow-right-circle"
                sx="[&>p]:!font-bold flex-row-reverse w-max"
              />
            )}
          </div>

          {!popupData?.isCompleted && (
            <div className="flex gap-[10px] pt-[15px] border-t border-border-light">
              <Image src={icons.point} className="w-auto h-[25px]" />
              <Paragraph
                isHtml
                content={`Complete & Earn <span>${popupData?.points} Pts<span/>`}
                variant={paragraphVariants.regular}
                sx="[&>span]:!font-bold"
              />
            </div>
          )}
        </div>
      </section>
    </Modal>
  );
};

const getContent = (popupType: string) => {
  if (popupType === journalTypes.gratitudeAction) {
    return {
      icon: "action",
      heading: "Daily Gratitude Action",
    };
  } else return null;
};

export default JournalPopup;
