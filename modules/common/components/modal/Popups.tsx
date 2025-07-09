"use client";

import ImageScanPopup from "@modules/common/components/popups/ImageScanPopup";
import MessagePopup from "../popups/MessagePopup";
import JournalCompletionPopup from "@modules/journal/components/popups/JournalCompletionPopup";
import JournalPopup from "@modules/journal/components/popups/JournalPopup";
import MeditationPopup from "@modules/journal/components/popups/MeditationPopup";

//components

const Popups = () => {
  return (
    <>
      <ImageScanPopup />
      <MessagePopup />
      <JournalPopup />
      <JournalCompletionPopup />
      <MeditationPopup />
    </>
  );
};

export default Popups;
