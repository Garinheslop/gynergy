//context
import { useState } from "react";

import { usePopup } from "@contexts/UsePopup";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Modal from "@modules/common/components/modal";
import TextArea from "@modules/common/components/TextArea";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { buttonActionTypes } from "@resources/types/button";
import { journalTypes } from "@resources/types/journal";
import { headingVariants, paragraphVariants } from "@resources/variants";




const MeditationPopup = () => {
  const { meditationPopupObj } = usePopup();

  const [reflection, setReflection] = useState("");

  const { popupType, popupAction, popupData } = meditationPopupObj.data;

  if (!meditationPopupObj.show) return null;

  return (
    <Modal open={meditationPopupObj.show} onClose={meditationPopupObj.close}>
      <section className="items-between bg-bkg-light relative mx-auto flex h-screen w-screen flex-col justify-center gap-[30px] overflow-auto rounded p-[30px] sm:h-max sm:w-[620px]">
        <i
          className="gng-close absolute top-2 right-2 cursor-pointer p-6 text-[18px]"
          onClick={meditationPopupObj.close}
        />
        <div className="flex h-full w-full flex-col gap-5">
          <div className="flex flex-col gap-[10px]">
            <i
              className={cn(`gng-meditation py-[4px] text-[25px] text-[#6699FF]`, {
                "text-primary": popupType === journalTypes.morningJournal,
                "text-action-secondary": popupType === journalTypes.eveningJournal,
                "text-primary-500": popupType === journalTypes.gratitudeAction,
              })}
            />
            <Heading variant={headingVariants.titleLg} sx="!font-bold">
              Day {popupData?.day} Meditation
            </Heading>
          </div>
          <div className="border-border-light flex w-full border-t" />
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

        <div className="flex h-max flex-col items-center justify-between gap-5 sm:flex-row">
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
