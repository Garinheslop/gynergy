"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

// Celebration event types for the queue system
export type CelebrationEventType =
  | "badge"
  | "milestone"
  | "streak"
  | "feature_unlock"
  | "share"
  | "achievement";

export type CelebrationEvent = {
  id: string;
  type: CelebrationEventType;
  priority: number; // Higher = more important, shown first
  data: any;
  onDismiss?: () => void;
};

type CelebrationQueueObj = {
  queue: CelebrationEvent[];
  current: CelebrationEvent | null;
  add: (event: Omit<CelebrationEvent, "id">) => void;
  addMultiple: (events: Omit<CelebrationEvent, "id">[]) => void;
  dismiss: () => void;
  clear: () => void;
};

export type PopupContextType = {
  messagePopupObj: contextRetrunObjType;
  imageScanPopupObj: contextRetrunObjType;
  journalCompletionPopupObj: contextRetrunObjType;
  journalPopupObj: contextRetrunObjType;
  meditationPopupObj: contextRetrunObjType;
  // New queue-based celebration system
  celebrationQueue: CelebrationQueueObj;
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

  //
  // Celebration Queue System
  const [celebrationQueueState, setCelebrationQueueState] = useState<CelebrationEvent[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationEvent | null>(null);

  const generateCelebrationId = () =>
    `celebration_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const addCelebration = useCallback(
    (event: Omit<CelebrationEvent, "id">) => {
      const newEvent: CelebrationEvent = {
        ...event,
        id: generateCelebrationId(),
      };

      setCelebrationQueueState((prev) => {
        const updated = [...prev, newEvent].sort((a, b) => b.priority - a.priority);
        // If nothing is currently showing, show the highest priority item
        if (!currentCelebration) {
          setCurrentCelebration(updated[0]);
          return updated.slice(1);
        }
        return updated;
      });
    },
    [currentCelebration]
  );

  const addMultipleCelebrations = useCallback(
    (events: Omit<CelebrationEvent, "id">[]) => {
      const newEvents: CelebrationEvent[] = events.map((event) => ({
        ...event,
        id: generateCelebrationId(),
      }));

      setCelebrationQueueState((prev) => {
        const updated = [...prev, ...newEvents].sort((a, b) => b.priority - a.priority);
        if (!currentCelebration) {
          setCurrentCelebration(updated[0]);
          return updated.slice(1);
        }
        return updated;
      });
    },
    [currentCelebration]
  );

  const dismissCelebration = useCallback(() => {
    if (currentCelebration?.onDismiss) {
      currentCelebration.onDismiss();
    }

    setCelebrationQueueState((prev) => {
      if (prev.length > 0) {
        setCurrentCelebration(prev[0]);
        return prev.slice(1);
      }
      setCurrentCelebration(null);
      return [];
    });
  }, [currentCelebration]);

  const clearCelebrations = useCallback(() => {
    setCelebrationQueueState([]);
    setCurrentCelebration(null);
  }, []);

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
        celebrationQueue: {
          queue: celebrationQueueState,
          current: currentCelebration,
          add: addCelebration,
          addMultiple: addMultipleCelebrations,
          dismiss: dismissCelebration,
          clear: clearCelebrations,
        },
      }}
    >
      {children}
    </UsePopupContext.Provider>
  );
};

export default UsePopupContextProvider;
