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
import TextArea from "@modules/common/components/TextArea";

const MeditationPopup = () => {
  const { meditationPopupObj } = usePopup();

  const [reflection, setReflection] = useState("");

  const { popupType, popupAction, popupData } = meditationPopupObj.data;

  if (!meditationPopupObj.show) return null;

  return (
    <Modal open={meditationPopupObj.show} onClose={meditationPopupObj.close}>
      <section className="relative flex justify-center items-between flex-col mx-auto p-[30px] w-screen h-screen sm:h-max sm:w-[620px] gap-[30px] overflow-auto bg-bkg-light rounded">
        <i
          className="gng-close text-[18px] cursor-pointer absolute top-2 right-2 p-6"
          onClick={meditationPopupObj.close}
        />
        <div className="flex flex-col w-full h-full gap-5">
          <div className="flex flex-col gap-[10px]">
            <i
              className={cn(`gng-meditation text-[25px] py-[4px] text-[#6699FF]`, {
                "text-primary": popupType === journalTypes.morningJournal,
                "text-action-secondary": popupType === journalTypes.eveningJournal,
                "text-primary-500": popupType === journalTypes.gratitudeAction,
              })}
            />
            <Heading variant={headingVariants.titleLg} sx="!font-bold">
              Day {popupData?.day} Meditation
            </Heading>
          </div>
          <div className="flex w-full border-t border-border-light" />
          <div className="flex flex-col gap-[5px]">
            <Paragraph
              variant={paragraphVariants.title}
              content={"Reflect on your Meditation"}
              sx="!font-bold capitalize"
            />
            <Paragraph
              content={"Jot down your thoughts and feelings after your meditation."}
              sx="text-content-dark-secondary"
            />
            <TextArea
              value={reflection}
              placeholder={"Start writing from here"}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>
        </div>

        <div className="flex sm:flex-row flex-col items-center justify-between gap-5 h-max">
          {popupData?.video && (
            <ActionButton
              label="Watch Meditation Video"
              buttonActionType={buttonActionTypes.text}
              onClick={() => {
                window.open(popupData?.video, "_blank", "noopener,noreferrer");
              }}
              icon="hyperlink"
              sx="[&>i]:text-[13px] [&>p,&>i]:text-[#007AFF] [&>p,&>i]:group-hover:opacity-90 hover:px-0 hover:bg-transparent [&>p]:underline gap-[5px] [&>p]:truncate sm:[&>p]:max-w-[85%] sm:[&>p]:max-w-max justify-end flex-row-reverse w-max group"
            />
          )}
          <ActionButton
            label="Complete Task"
            onClick={() => {
              popupAction && popupAction(reflection);
              meditationPopupObj.close();
            }}
            disabled={!popupAction || !reflection.trim()}
            icon="arrow-right"
            sx="[&>p]:!font-bold flex-row-reverse w-max"
          />
        </div>
      </section>
    </Modal>
  );
};

export default MeditationPopup;
