"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { usePopup } from "@contexts/UsePopup";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Loader from "@modules/common/components/Loader";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import VisionHighestSelfEditor from "@modules/editor/components/vision/VisionHighestSelfEditor";
import VisionMantraEditor from "@modules/editor/components/vision/VisionMantraEditor";
import { pagePaths } from "@resources/paths";
import { actionRequestTypes } from "@resources/types/action";
import { buttonActionTypes } from "@resources/types/button";
import { useDispatch, useSelector } from "@store/hooks";
import { editorDataCreationRequested, resetEditorDataStates } from "@store/modules/editor";

import EveningJournalEditor from "../daily-journal/EveningJournalEditor";
import MorningJournalEditor from "../daily-journal/MorningJournalEditor";
import EditorHeader from "../EditorHeader";
import { journalRequestTypes, journalTypes } from "@resources/types/journal";
import VisionCreedEditor from "../vision/VisionCreedEditor";
import VisionDiscoveryEditor from "../vision/VisionDiscoveryEditor";
import { headingVariants, paragraphVariants } from "@resources/variants";


import GratitudeActionJournalEditor from "../daily-journal/GratitudeActionJournalEditor";
import WeeklyChallengeJournalEditor from "../weekly-journal/WeeklyChallengeJournalEditor";
import WeeklyJournalEditor from "../weekly-journal/WeeklyJournalEditor";

import { loaderTypes } from "@resources/types/loader";
import { createUserjournal } from "@store/modules/journal";
import { visionRequestTypes, visionTypes } from "@resources/types/vision";
import { createUserActionLog } from "@store/modules/action";
import { updateUserVisions } from "@store/modules/vision";

const EditorClient = ({ bookSlug }: { bookSlug: string }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { journalCompletionPopupObj } = usePopup();

  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const editorStates = useSelector((state) => state.editor);
  const editorType = useSelector((state) => state.editor.type);
  const [intro, setIntro] = useState<boolean>(true);

  useEffect(() => {
    window.scrollTo({ top: 100, behavior: "smooth" });
  }, [intro]);
  useEffect(() => {
    if (!editorStates.action?.isJourneyTable && !editorStates.action?.isEulogy) {
      setIntro(false);
    }
  }, [editorStates.action]);

  useEffect(() => {
    if (!editorType) {
      router.push(`/${bookSlug}`);
    }
  }, [editorType]);

  useEffect(() => {
    if (editorStates.isFormComplete && editorStates.creating && editorStates.created) {
      if (
        (Object.values(journalTypes) as string[]).includes(editorType as string) &&
        editorStates.isCompleted
      ) {
        journalCompletionPopupObj.open({
          popupType: editorType as string,
        });
      }
      dispatch(resetEditorDataStates());
      router.push(`/${currentBook?.slug}`);
    }
  }, [editorStates.created]);

  const completePromptHandler = () => {
    const journalRequestType = getJournalRequestType(editorType);
    const actionRequestType = getActionRequestType(editorType);
    const visionRequestType = getVisionRequestType(editorType);
    if (userEnrollment?.session?.id) {
      if (journalRequestType) {
        dispatch(
          createUserjournal({
            journalRequestType,
            sessionId: userEnrollment?.session.id,
            journal: editorStates.current,
            images: editorStates.images,
          })
        );
        dispatch(editorDataCreationRequested());
      } else if (actionRequestType && editorStates?.action?.id) {
        dispatch(
          createUserActionLog({
            actionRequestType,
            actionId: editorStates.action.id,
            sessionId: userEnrollment?.session.id,
            actionLog: editorStates.current,
            images: editorStates.images,
          })
        );
        dispatch(editorDataCreationRequested());
      } else if (visionRequestType) {
        dispatch(
          updateUserVisions({
            visionRequestType,
            sessionId: userEnrollment?.session.id,
            vision: editorStates.current,
            images: editorStates.images,
          })
        );
        dispatch(editorDataCreationRequested());
      }
    }
  };

  if (!editorType) return null;
  return (
    <section className="bg-bkg-light mx-auto flex w-full max-w-[1253px] flex-col justify-start gap-[20px] px-4 py-[100px] sm:bg-transparent md:py-[130px]">
      {editorStates.creating && <Loader label={"Please Wait..."} type={loaderTypes.window} />}{" "}
      {editorStates.loading && (
        <Loader
          heading="Please Wait"
          label={
            "Extracting text from your journal pages, please wait while we complete the conversion."
          }
          type={loaderTypes.card}
        />
      )}
      <ActionButton
        label="Back to Home"
        buttonActionType={buttonActionTypes.text}
        onClick={() => {
          dispatch(resetEditorDataStates());
        }}
        icon="arrow-left"
        sx="w-max [&>p]:!font-bold"
      />
      {(
        [
          journalTypes.morningJournal,
          journalTypes.eveningJournal,
          journalTypes.gratitudeAction,
        ] as readonly string[]
      ).includes(editorType) && (
        <div className="flex flex-col gap-[5px]">
          <Heading variant={headingVariants.heading} sx="!font-bold capitalize">
            Day{" "}
            {(dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1)
              .toString()
              .padStart(2, "0")}
          </Heading>
          <Paragraph
            content={dayjs().format("MMM DD, YYYY")}
            variant={paragraphVariants.title}
            sx="text-content-dark-secondary !font-bold"
          />
        </div>
      )}
      <div className="bg-bkg-light flex w-full flex-col gap-[30px] rounded-[20px] sm:p-[30px]">
        {(
          [
            journalTypes.morningJournal,
            journalTypes.eveningJournal,
            journalTypes.gratitudeAction,
            journalTypes.weeklyChallenge,
          ] as readonly string[]
        ).includes(editorType) ? (
          <>
            {editorType === journalTypes.morningJournal && <MorningJournalEditor />}
            {editorType === journalTypes.eveningJournal && <EveningJournalEditor />}
            {editorType === journalTypes.gratitudeAction && <GratitudeActionJournalEditor />}
            {editorType === journalTypes.weeklyChallenge && (
              <WeeklyChallengeJournalEditor intro={intro} />
            )}
          </>
        ) : (
          <>
            <EditorHeader
              heading={getHeaderData(editorType)?.heading!}
              description={getHeaderData(editorType)?.description}
            />
            {editorType === visionTypes.highestSelf && <VisionHighestSelfEditor />}
            {editorType === visionTypes.mantra && <VisionMantraEditor />}
            {editorType === visionTypes.creed && <VisionCreedEditor />}
            {editorType === visionTypes.discovery && <VisionDiscoveryEditor />}
            {editorType === journalTypes.weeklyReflection && <WeeklyJournalEditor />}
          </>
        )}
        <div className="border-border-light w-full border-b" />
        <div
          className={cn("flex items-center gap-5", {
            "sm:grid sm:grid-cols-3":
              editorStates.action?.isEulogy || editorStates.action?.isJourneyTable,
          })}
        >
          {(editorStates.action?.isEulogy || editorStates.action?.isJourneyTable) && (
            <div className="flex w-full md:w-max">
              {!intro && (
                <ActionButton
                  label={"Back"}
                  icon="arrow-left"
                  buttonActionType={buttonActionTypes.text}
                  onClick={() => setIntro(true)}
                  sx="md:w-max"
                />
              )}
            </div>
          )}
          {(editorStates.action?.isEulogy || editorStates.action?.isJourneyTable) && (
            <div className="mx-auto hidden items-center gap-[10px] sm:flex">
              {Array.from({ length: 2 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "bg-grey-300 h-[10px] w-[10px] cursor-pointer rounded-full duration-200",
                    {
                      "bg-dark-pure w-[30px] rounded-[20px]":
                        (index === 0 && intro) || (index === 1 && !intro),
                    }
                  )}
                  onClick={() => setIntro(index === 0 ? true : false)}
                />
              ))}
            </div>
          )}
          <ActionButton
            label={
              intro && (editorStates.action?.isEulogy || editorStates.action?.isJourneyTable)
                ? "Next"
                : (
                      [
                        visionTypes.highestSelf,
                        visionTypes.mantra,
                        visionTypes.creed,
                        visionTypes.discovery,
                      ] as readonly string[]
                    ).includes(editorType)
                  ? "Save"
                  : "Complete Prompt"
            }
            icon="arrow-right-long"
            onClick={() =>
              intro && (editorStates.action?.isEulogy || editorStates.action?.isJourneyTable)
                ? setIntro(false)
                : completePromptHandler()
            }
            disabled={!intro && (!editorStates.current || !editorStates.isFormComplete)}
            sx="md:w-max flex-row-reverse ml-auto"
          />
        </div>
      </div>
    </section>
  );
};

const getHeaderData = (editorType: string) => {
  if (editorType === journalTypes.morningJournal) {
    return {
      heading: "Morning Journal",
      icon: "morning",
    };
  } else if (editorType === journalTypes.eveningJournal) {
    return {
      heading: "Evening Journal",
      icon: "evening",
    };
  } else if (editorType === journalTypes.gratitudeAction) {
    return {
      heading: "Daily Gratitude Action",
      icon: "action",
    };
  } else if (editorType === journalTypes.weeklyReflection) {
    return {
      heading: "Weekly Reflection",
      description:
        "At the end of each week, take time to review your achievements, overcome challenges, and lessons learned.",
    };
  } else if (editorType === journalTypes.weeklyChallenge) {
    return {
      heading: "Weekly Challenge",
    };
  } else if (editorType === visionTypes.highestSelf) {
    return {
      heading: "Your Highest Self",
      description:
        "Imagine your highest self as a superhero, embodying all the qualities and strengths you admire. Think of your favorite superheroes and their traits. Use these examples to help you visualize and describe your highest self. Answer the following prompts to develop a detailed picture:",
    };
  } else if (editorType === visionTypes.mantra) {
    return {
      heading: "Your Mantra",
      description:
        "Your mantra is a powerful phrase or sentence that encapsulates your highest aspirations and values. It should inspire and motivate you every day. Write your mantra here and commit to reading it daily:",
    };
  } else if (editorType === visionTypes.creed) {
    return {
      heading: "Your Creed",
      description:
        "Your creed is a declaration of your values, beliefs, and commitments. It serves as a guiding principle for your actions and decisions. Write a creed that you want your children to read and be inspired by.",
    };
  } else if (editorType === visionTypes.discovery) {
    return {
      heading: "Self Discovery",
      description:
        "Who are you, really? This is a question that deserves a lifetime of exploration. Delve into the depths of your being, layer by layer, to understand the complex and beautiful mosaic of your motivations, dreams, fears  and the unique tapestry of your identity.  Answer these questions not as a test, but as a compass, guiding you toward a deeper understanding of your authentic self.",
    };
  }
};

const getJournalRequestType = (editorType: string | null) => {
  if (editorType === journalTypes.morningJournal) {
    return journalRequestTypes.createMorningJournal;
  } else if (editorType === journalTypes.eveningJournal) {
    return journalRequestTypes.createEveningJournal;
  } else if (editorType === journalTypes.weeklyReflection) {
    return journalRequestTypes.createWeeklyJournal;
  } else return "";
};
const getActionRequestType = (editorType: string | null) => {
  if (editorType === journalTypes.gratitudeAction) {
    return actionRequestTypes.completeDailyAction;
  } else if (editorType === journalTypes.weeklyChallenge) {
    return actionRequestTypes.completeWeeklyChallenge;
  } else return "";
};
const getVisionRequestType = (visionType: string | null) => {
  if (visionType === visionTypes.highestSelf) {
    return visionRequestTypes.updateVisionHighestSelf;
  } else if (visionType === visionTypes.mantra) {
    return visionRequestTypes.updateVisionMantra;
  } else if (visionType === visionTypes.creed) {
    return visionRequestTypes.updateVisionCreed;
  } else if (visionType === visionTypes.discovery) {
    return visionRequestTypes.updateVisionDiscovery;
  } else return "";
};

export default EditorClient;
