"use client";
import React, { createContext, useContext, useState } from "react";

export type PopupContextType = {
  messagePopupObj: contextRetrunObjType;
  imageScanPopupObj: contextRetrunObjType;
  journalCompletionPopupObj: contextRetrunObjType;
  journalPopupObj: contextRetrunObjType;
  meditationPopupObj: contextRetrunObjType;
};
type contextRetrunObjType = {
  data: popupDataStateType;
  show: boolean;
  open: (args: popupDataStateType) => void;
  close: () => void;
};
type popupDataStateType = {
  popupData?: any;
  popupAction?: any;
  popupType?: string;
};

const UsePopupContext = createContext<PopupContextType | any>({});

export const usePopup = () => useContext(UsePopupContext) as PopupContextType;

const UsePopupContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  //
  //message popups
  const [messagePopupDataState, setMessagePopupDataState] = useState<popupDataStateType>({
    popupData: "",
    popupType: "",
  });
  const [showMessagePopupState, setShowMessagePopupState] = useState(false);
  const openMessagePopup = ({ popupData, popupAction, popupType }: popupDataStateType) => {
    setShowMessagePopupState(true);
    setMessagePopupDataState({ popupData, popupAction, popupType });
  };
  const closeMessagePopup = () => {
    setShowMessagePopupState(false);
  };

  //
  //camera popups
  const [imageScanPopupDataState, setImageScanPopupDataState] = useState<popupDataStateType>({
    popupData: "",
    popupType: "",
  });
  const [showImageScanPopupState, setShowImageScanPopupState] = useState(false);
  const openImageScanPopup = ({ popupData, popupAction, popupType }: popupDataStateType) => {
    setShowImageScanPopupState(true);
    setImageScanPopupDataState({ popupData, popupAction, popupType });
  };
  const closeImageScanPopup = () => {
    setShowImageScanPopupState(false);
  };

  //
  //camera popups
  const [journalCompletionPopupDataState, setJournalCompletionPopupDataState] =
    useState<popupDataStateType>({
      popupData: "",
      popupAction: null,
      popupType: "",
    });
  const [showJournalCompletionPopupState, setShowJournalCompletionPopupState] = useState(false);
  const openJournalCompletionPopup = ({
    popupData,
    popupAction,
    popupType,
  }: popupDataStateType) => {
    setShowJournalCompletionPopupState(true);
    setJournalCompletionPopupDataState({ popupData, popupAction, popupType });
  };
  const closeJournalCompletionPopup = () => {
    setShowJournalCompletionPopupState(false);
  };
  //
  //journal popups
  const [journalPopupDataState, setJournalPopupDataState] = useState<popupDataStateType>({
    popupData: "",
    popupAction: null,
    popupType: "",
  });
  const [showJournalPopupState, setShowJournalPopupState] = useState(false);
  const openJournalPopup = ({ popupData, popupAction, popupType }: popupDataStateType) => {
    setShowJournalPopupState(true);
    setJournalPopupDataState({ popupData, popupAction, popupType });
  };
  const closeJournalPopup = () => {
    setShowJournalPopupState(false);
  };
  //
  //meditation popups
  const [meditationPopupDataState, setMeditationPopupDataState] = useState<popupDataStateType>({
    popupData: "",
    popupAction: null,
    popupType: "",
  });
  const [showMeditationPopupState, setShowMeditationPopupState] = useState(false);
  const openMeditationPopup = ({ popupData, popupAction, popupType }: popupDataStateType) => {
    setShowMeditationPopupState(true);
    setMeditationPopupDataState({ popupData, popupAction, popupType });
  };
  const closeMeditationPopup = () => {
    setShowMeditationPopupState(false);
  };

  return (
    <UsePopupContext.Provider
      value={{
        messagePopupObj: {
          data: messagePopupDataState,
          show: showMessagePopupState,
          open: openMessagePopup,
          close: closeMessagePopup,
        },
        imageScanPopupObj: {
          data: imageScanPopupDataState,
          show: showImageScanPopupState,
          open: openImageScanPopup,
          close: closeImageScanPopup,
        },
        journalCompletionPopupObj: {
          data: journalCompletionPopupDataState,
          show: showJournalCompletionPopupState,
          open: openJournalCompletionPopup,
          close: closeJournalCompletionPopup,
        },
        journalPopupObj: {
          data: journalPopupDataState,
          show: showJournalPopupState,
          open: openJournalPopup,
          close: closeJournalPopup,
        },
        meditationPopupObj: {
          data: meditationPopupDataState,
          show: showMeditationPopupState,
          open: openMeditationPopup,
          close: closeMeditationPopup,
        },
      }}
    >
      {children}
    </UsePopupContext.Provider>
  );
};

export default UsePopupContextProvider;
