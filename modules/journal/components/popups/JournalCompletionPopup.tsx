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
import images from "@resources/images";
import { buttonActionTypes } from "@resources/types/button";
import { journalTypes } from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";

const JournalCompletionPopup = () => {
  const router = useRouter();
  const currentBook = useSelector((state) => state.books.current);
  const { journalCompletionPopupObj } = usePopup();

  const [showConfetti, setShowConfetti] = useState(false);
  const [popupContents, setPopupContents] = useState<any | null>(null);

  const { popupType } = journalCompletionPopupObj.data;

  useEffect(() => {
    if (journalCompletionPopupObj.show) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [journalCompletionPopupObj.show]);

  useEffect(() => {
    if (journalCompletionPopupObj.show && popupType && currentBook) {
      setPopupContents(getContent(popupType, currentBook));
    } else {
      setPopupContents(null);
    }
  }, [journalCompletionPopupObj.show, popupType]);

  if (!journalCompletionPopupObj.show || !popupType) return null;

  const handleActionBtnHandler = () => {
    router.push(`/${currentBook?.slug}?section=progress`);
    journalCompletionPopupObj.close();
  };

  return (
    <Modal open={journalCompletionPopupObj.show} onClose={journalCompletionPopupObj.close}>
      <section className="bg-bkg-light relative mx-auto flex min-h-[430px] w-[90vw] flex-col gap-[30px] overflow-auto rounded-[20px] p-[30px] md:w-[500px]">
        <ReactConfetti
          className="h-full w-full"
          run={showConfetti}
          recycle={false}
          gravity={0.3}
          width={500}
          height={450}
          numberOfPieces={200}
          tweenDuration={1000}
          onConfettiComplete={() => {
            setShowConfetti(false);
          }}
        />
        <div className="relative mx-auto w-max">
          <i
            className={cn(`gng-${popupContents?.icon} p-[10px] text-[80px]`, {
              "text-primary": popupType === journalTypes.morningJournal,
              "text-action-secondary": popupType === journalTypes.eveningJournal,
              "text-primary-500": popupType === journalTypes.gratitudeAction,
            })}
          />
          <div className="bg-bkg-light absolute right-[0] -bottom-[10px] flex h-[45px] w-[45px] items-center justify-center rounded-full">
            <i className={cn(`gng-complete-circle text-action-secondary text-[30px]`)} />
          </div>
        </div>

        <div className="flex flex-col gap-[5px]">
          <Heading variant={headingVariants.cardHeading} sx="!font-bold text-center">
            {popupContents?.heading}
          </Heading>
          <Paragraph content={popupContents?.description} sx="text-center" />
        </div>
        {popupContents?.points && (
          <Paragraph
            content={`+${popupContents?.points} pts`}
            variant={paragraphVariants.titleXlg}
            sx="!font-bold text-center text-action-secondary lowercase"
          />
        )}
        <Image src={images.congratsAvatar} className="h-auto max-h-[225px] w-full" />
        <div className="flex gap-[20px]">
          <ActionButton
            label="Close"
            onClick={journalCompletionPopupObj.close}
            sx="bg-transparent border border-action"
          />
          <ActionButton label="See Progress" onClick={handleActionBtnHandler} />
        </div>
      </section>
    </Modal>
  );
};

const getContent = (
  popupType: string,
  currentBook?: {
    dailyJournalPoints: number;
    weeklyJournalPoints: number;
    dailyActionPoints: number;
    weeklyActionPoints: number;
  }
) => {
  if (popupType === journalTypes.morningJournal) {
    return {
      icon: "morning",
      heading: "Great Start for the Day!",
      description: "You’ve completed your Morning Journal.",
      points: currentBook?.dailyJournalPoints ?? 0,
    };
  } else if (popupType === journalTypes.eveningJournal) {
    return {
      icon: "evening",
      heading: "Nice Job!",
      description: "You’ve completed your Evening Journal.",
      points: currentBook?.dailyJournalPoints ?? 0,
    };
  } else if (popupType === journalTypes.gratitudeAction) {
    return {
      icon: "action",
      heading: "Awesome Work!",
      description: "You’ve completed your Daily Gratitude Action.",
      points: currentBook?.dailyActionPoints ?? 0,
    };
  } else if (popupType === journalTypes.weeklyReflection) {
    return {
      icon: "🎉",
      heading: "Congratulations!",
      description: "You’ve completed your Weekly Reflection.",
      points: currentBook?.weeklyJournalPoints ?? 0,
    };
  } else if (popupType === journalTypes.weeklyChallenge) {
    return {
      icon: "🎉",
      heading: "Congratulations!",
      description: "You’ve completed your Weekly Challenge.",
      points: currentBook?.weeklyActionPoints ?? 0,
    };
  } else return null;
};

export default JournalCompletionPopup;
