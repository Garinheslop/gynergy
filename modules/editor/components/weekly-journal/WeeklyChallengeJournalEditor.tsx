import { FC, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import { getBase64 } from "@lib/utils/image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import { cn } from "@lib/utils/style";
import FileInput from "@modules/common/components/FileInput";
import Spinner from "@modules/common/components/Spinner";
import TextArea from "@modules/common/components/TextArea";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { EditorData, JourneyTableData, WeeklyChallengeData } from "@resources/types/journal";
import { useSelector } from "@store/hooks";
import { ImageRawData } from "@resources/types/ocr";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

import EditorActionBtns from "../EditorActionBtns";
import EditorHeader from "../EditorHeader";

import { headingVariants, paragraphVariants } from "@resources/variants";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { ActionData } from "@resources/types/action";


import { pagePaths } from "@resources/paths";
import Image from "@modules/common/components/Image";

import EulogyIntro from "./EulogyIntro";
import JourneyTable from "./JourneyTable";

import { JournalCardData } from "@resources/types/history";

const WeeklyChallengeJournalEditor: FC<{ intro?: boolean }> = ({ intro }) => {
  const { imageScanPopupObj } = usePopup();
  const router = useRouter();
  const actions = useSelector((state) => state.actions);
  const editorStates = useSelector((state) => state.editor);
  const journalData = useSelector((state) => state.editor.current) as WeeklyChallengeData;
  const journalType = useSelector((state) => state.editor.type);
  const meditations = useSelector((state) => state.meditations);

  const [weeklyAction, setWeeklyAction] = useState<ActionData | null>(null);

  useEffect(() => {
    if (!actions.current.weekly.data?.id) {
      router.push(pagePaths.home);
    } else {
      setWeeklyAction(actions.current.weekly.data);
    }
  }, [actions.current]);

  useEffect(() => {
    if (weeklyAction?.isMeditation) {
      editor.update("isCompleted", meditations.total > 0 ? true : false);
    }
  }, [meditations.total, weeklyAction]);

  const { editor } = useSetEditorData<WeeklyChallengeData>({
    data: journalData,
    editorType: journalType!,
    reduxLoadingAction: setEditorLoadingState,
    reduxUpdateAction: updateEditorCurrentState,
    reduxUpdateImagesAction: updateEditorImageState,
  });
  const onScanHandler = (images: ImageRawData[]) => {
    editor.ocr<ImageRawData[]>(images);
  };

  const [journeyData, setJourneyData] = useState<JourneyTableData | null>(null);

  useEffect(() => {
    if (
      !intro &&
      journeyData &&
      weeklyAction?.isJourneyTable &&
      Object.values(journeyData).find((v) => v.trim() !== "")
    ) {
      editor.update("journey", journeyData);
      editor.update("isCompleted", true);
    }
  }, [intro]);

  return (
    <>
      <EditorHeader heading={"Weekly Challenge"} headingVariant={headingVariants.titleLg}>
        {!intro && (
          <EditorActionBtns
            isScanned={
              editor.isRead &&
              (editor.data && Object.values(editor.data as any).find((val) => val) ? true : false)
            }
            onClear={() => editor.reset()}
            isDisabled={weeklyAction?.isMeditation && meditations.total === 0}
            onScan={() =>
              imageScanPopupObj.open({
                popupData: {
                  fileLimit: journalOcrFileLimit.journal.weeklyChallenge,
                },
                popupAction: onScanHandler,
                popupType: editorStates.type!,
              })
            }
          />
        )}
      </EditorHeader>
      <div className="border-border-light w-full border-b" />
      <div className="flex flex-col gap-[10px]">
        <Heading variant={headingVariants.sectionHeading} sx="!font-bold capitalize">
          {weeklyAction?.title.toLowerCase()}
        </Heading>
        {weeklyAction?.tip && (
          <Paragraph content={`${weeklyAction?.tip}`} variant={paragraphVariants.regular} />
        )}
      </div>
      {weeklyAction?.isMeditation && <MeditationCard />}
      {!weeklyAction?.isEulogy && !weeklyAction?.isJourneyTable && (
        <ActionCompletion
          value={
            weeklyAction?.isMeditation
              ? meditations.total > 0
                ? true
                : false
              : editor.data?.isCompleted
          }
          isMeditation={weeklyAction?.isMeditation}
          onValueSet={(value) => {
            if (!value) {
              editor.update("reward", null);
              editor.update("motivation", null);
              editor.update("purpose", null);
              editor.update("success", null);
              editor.update("focus", null);
              editor.update("freeflow", null);
            }
            editor.update("isCompleted", value);
          }}
        />
      )}

      {weeklyAction?.isEulogy && intro && <EulogyIntro />}
      {weeklyAction?.isJourneyTable && intro && (
        <JourneyTable
          journeyData={(editorStates.current as WeeklyChallengeData)?.journey}
          onTableInput={(value) => setJourneyData(value)}
        />
      )}
      {(editor.data?.isCompleted || weeklyAction?.isEulogy || weeklyAction?.isJourneyTable) &&
        !intro && (
          <div className="flex flex-col gap-5">
            {weeklyAction?.isEulogy && (
              <TextAreaWithHeading
                heading="Write your Eulogy"
                description="This exercise guides you to envision your eulogy by reflecting on your impact in relationships, contributions, and personal growth, prompting you to consider how you want to be remembered. It then encourages you to align your current life with this desired legacy by identifying actionable steps for more authentic living."
                value={editor.data?.eulogy}
                onChange={(value) => {
                  editor.update("eulogy", value);
                  editor.update("isCompleted", value ? true : false);
                }}
                placeholder="Start writing from here or press “Scan & Fill” button to autofill"
              />
            )}
            <TextAreaWithHeading
              heading="Weekly reward"
              description="What reward will you give yourself for completing your weekly challenge?"
              value={editor.data?.reward}
              onChange={(value) => editor.update("reward", value)}
              placeholder="Start writing from here or press “Scan & Fill” button to autofill"
            />
            <TextAreaWithHeading
              heading="How will this reward motivate you?"
              description="Reflect on how celebrating small wins contributes to your overall happiness and motivation."
              value={editor.data?.motivation}
              onChange={(value) => editor.update("motivation", value)}
              placeholder="Start writing from here or press “Scan & Fill” button to autofill"
            />
            <TextAreaWithHeading
              heading="Why is this challenge important to you?"
              value={editor.data?.purpose}
              onChange={(value) => editor.update("purpose", value)}
              placeholder="Start writing from here or press “Scan & Fill” button to autofill"
            />
            <TextAreaWithHeading
              heading="What will success look like at the end of the week?"
              value={editor.data?.success}
              onChange={(value) => editor.update("success", value)}
              placeholder="Start writing from here or press “Scan & Fill” button to autofill"
            />
            <TextAreaWithHeading
              heading="Focus for next week"
              description="What will you focus on next week to continue your growth and progress?"
              value={editor.data?.focus}
              onChange={(value) => editor.update("focus", value)}
              placeholder="Start writing from here or press “Scan & Fill” button to autofill"
            />

            <FreeFlow
              value={editor.data ? editor.data.freeflow : ""}
              onUpdate={(value: any) => editor.update("freeflow", value)}
            />
          </div>
        )}
    </>
  );
};

const ActionCompletion = ({
  value,
  isMeditation = false,
  onValueSet,
}: {
  value?: boolean;
  isMeditation?: boolean;
  onValueSet?: (value: boolean) => void;
}) => {
  // const [value, setValue] = useState<boolean | null>(null);
  return (
    <div className={cn("flex flex-col gap-[10px]")}>
      <Heading variant={headingVariants.cardHeading} sx="!font-bold">
        Did you complete the weekly challenge?
      </Heading>
      <div className="flex gap-[10px]">
        <button
          className={cn(
            "border-border-light flex h-[57px] w-[73px] cursor-pointer items-center justify-center rounded border",
            { "bg-action": value, "cursor-default": isMeditation }
          )}
          onClick={() => {
            if (!isMeditation && onValueSet) {
              onValueSet(true);
            }
          }}
        >
          Yes
        </button>

        <button
          className={cn(
            "border-border-light flex h-[57px] w-[73px] cursor-pointer items-center justify-center rounded border",
            { "bg-action": value === false, "cursor-default": isMeditation }
          )}
          onClick={() => {
            if (!isMeditation && onValueSet) {
              onValueSet(false);
            }
          }}
        >
          No
        </button>
      </div>
      {isMeditation && (
        <div className="flex items-center gap-[10px]">
          <i className="gng-info text-content-dark text-[21px]" />
          <Paragraph
            content={`Complete at least one meditation to complete this week’s challenge`}
            variant={paragraphVariants.regular}
            sx={"text-content-dark"}
          />
        </div>
      )}
    </div>
  );
};

const MeditationCard = () => {
  const meditations = useSelector((state) => state.meditations);

  return (
    <div
      className={cn(
        "items-between relative flex flex-col justify-center gap-[20px] rounded bg-[#E5EDFA] p-5 md:p-[30px]"
      )}
    >
      <div className={cn("flex flex-col gap-[10px]")}>
        <i className={cn(`gng-meditation text-[25px] text-[#6699FF]`)} />
        <Heading variant={headingVariants.cardHeading} sx="font-bold">
          {meditations.total} out of 7 Daily Meditations Completed
        </Heading>
        <Paragraph
          content={`Throughout this week, you will be prompted to reflect on your meditation each day.`}
          variant={paragraphVariants.regular}
          sx={"text-content-dark-secondary"}
        />
      </div>
    </div>
  );
};

const FreeFlow = ({ value, onUpdate }: { value?: any; onUpdate: (data?: any) => void }) => {
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!value?.file) {
      setImage(null);
    }
  }, [value]);

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      getBase64(file).then((result: string) => {
        handleFileInput(result, file);
      });
      e.target.value = "";
    }
  };
  const preventDefaultHandler = (e: any) => {
    e.preventDefault();
  };
  const handleFileInput = async (url: string, file: File) => {
    setImage(url);
    setLoading(true);
    let filteData;
    const compressedFile = await handleImageCompress(file);
    const arrBuffer = await compressedFile.arrayBuffer();
    const buffer = Buffer.from(arrBuffer);

    filteData = {
      file: buffer,
      name: compressedFile?.name ?? new Date().getTime(),
      contentType: compressedFile?.type,
    };
    if (onUpdate) {
      onUpdate(filteData);
    }
    setLoading(false);
  };

  return (
    <section className="flex flex-col gap-[5px]">
      <Heading variant={headingVariants.title} sx="!font-bold">
        {"Free Flow"}
      </Heading>
      <Paragraph
        content={"Upload your free flow drawing."}
        variant={paragraphVariants.meta}
        sx="text-content-dark-secondary"
      />
      <div className="flex w-full grid-cols-3 flex-col gap-[30px] sm:grid sm:h-[280px] sm:flex-row sm:items-start sm:justify-between">
        {image ? (
          <div
            className={cn("relative flex max-h-[270px] w-full gap-[10px] overflow-hidden rounded")}
          >
            {!loading && (
              <button
                onClick={() => {
                  setImage(null);
                  onUpdate(null);
                }}
                className="!bg-dark-900/60 absolute top-2 right-2 z-10 flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-[10px]"
              >
                <i className="gng-trash text-danger text-body" />
              </button>
            )}
            <Image src={image} className="h-auto w-full object-cover" />
            {loading && (
              <div
                className={cn(
                  "bg-bkg-dark/50 border-border-light absolute top-0 left-0 flex h-[100px] w-full items-center justify-center gap-[10px] overflow-hidden rounded border md:h-full md:w-full"
                )}
              >
                <Spinner />
              </div>
            )}
          </div>
        ) : (
          <section
            className="md:max-h-auto relative mx-auto h-full max-h-[550px] w-full shrink overflow-hidden rounded-[10px]"
            onDrop={handleDrop}
            onDragOver={preventDefaultHandler}
            onDragEnter={preventDefaultHandler}
            onDragLeave={preventDefaultHandler}
          >
            <FileInput
              isMultiple
              limit={1}
              onFileInput={(url, file) => {
                if (file) {
                  handleFileInput(url!, file);
                }
              }}
            >
              <div className="border-border-light flex h-full flex-col justify-center gap-[20px] rounded-[10px] border-[4px] border-dashed p-5 lg:p-10">
                <div
                  className={cn(
                    "border-border-light mx-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full md:size-[70px] md:border"
                  )}
                >
                  <i className="gng-add-thin text-content-dark text-center text-[25px]" />
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <Paragraph
                    content={"Add your Free Flow Drawing"}
                    variant={paragraphVariants.regular}
                    sx={"text-center"}
                  />
                  <Paragraph
                    content={"Take a photo of your drawing and upload it here."}
                    variant={paragraphVariants.meta}
                    sx={"text-content-dark-secondary text-center max-w-[280px]"}
                  />
                </div>
              </div>
            </FileInput>
          </section>
        )}
        {!value?.file && (
          <div className="col-span-2 flex h-full w-full flex-col gap-5 sm:flex-row">
            <div className="flex h-full shrink-0 items-center justify-center gap-5 sm:flex-col">
              <div className="border-border-light flex w-full border-t sm:h-full sm:w-[1px] sm:border-r" />
              <Paragraph content={"or"} sx="text-content-dark-secondary" />
              <div className="border-border-light flex w-full border-t sm:h-full sm:w-[1px] sm:border-r" />
            </div>
            <div className="flex h-full w-full flex-col gap-[5px]">
              <Paragraph content={"Explain your freeflow"} sx="text-content-dark" />
              <TextArea
                value={value?.file ? "" : value}
                placeholder={"Write here"}
                onChange={(e) => {
                  onUpdate(e.target.value);
                }}
                rows={8}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default WeeklyChallengeJournalEditor;
