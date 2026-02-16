//context
import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import ReactConfetti from "react-confetti";
import Webcam from "react-webcam";

import { usePopup } from "@contexts/UsePopup";
import { base64ToArrayBuffer, getBase64 } from "@lib/utils/image";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import FileInput from "@modules/common/components/FileInput";
import Image from "@modules/common/components/Image";
import Modal from "@modules/common/components/modal";

import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import icons from "@resources/icons";
import { buttonActionTypes } from "@resources/types/button";
import { journalTypes } from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";

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
      <section className="items-between bg-bkg-light relative mx-auto flex h-screen w-screen flex-col justify-center overflow-auto rounded px-8 py-[60px] sm:h-[692px] sm:w-[620px] sm:p-8">
        <i
          className="gng-close absolute top-2 right-2 cursor-pointer p-6 text-[18px]"
          onClick={journalPopupObj.close}
        />
        <div className="flex h-full w-full flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <i
              className={cn(`gng-${popupContents?.icon} p-[4px] text-[32px]`, {
                "text-primary": popupType === journalTypes.morningJournal,
                "text-action-secondary": popupType === journalTypes.eveningJournal,
                "text-primary-500": popupType === journalTypes.gratitudeAction,
              })}
            />
            <Heading variant={headingVariants.cardHeading} sx="!font-bold">
              {popupContents?.heading}
            </Heading>
          </div>
          <div className="border-border-light flex w-full border-t" />
          <div className="flex flex-col gap-2.5">
            <Paragraph
              variant={paragraphVariants.titleXlg}
              content={popupData?.subHeading?.toLowerCase()}
              sx="!font-bold capitalize"
            />
            <Paragraph content={popupData?.description} />
          </div>
        </div>

        <div className="flex h-max flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Image src={icons.streak} className="h-[25px] w-auto" />
              <Paragraph
                isHtml
                content={`<span>${popupData?.streak > 0 ? popupData?.streak.toString().padStart(2, "0") : 0}<span/> Days Streak`}
                variant={paragraphVariants.regular}
                sx="[&>span]:!font-bold"
              />
            </div>
            {popupData?.isCompleted ? (
              <div className="flex gap-2.5">
                <i className="gng-complete-circle text-action-secondary text-[25px]" />
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
            <div className="border-border-light flex gap-2.5 border-t pt-[15px]">
              <Image src={icons.point} className="h-[25px] w-auto" />
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
