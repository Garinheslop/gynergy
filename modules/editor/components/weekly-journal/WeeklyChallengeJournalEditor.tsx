import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { EditorData, JourneyTableData, WeeklyChallengeData } from "@resources/types/journal";
import { useSelector } from "@store/hooks";
import { FC, useEffect, useState } from "react";
import { usePopup } from "@contexts/UsePopup";
import { ImageRawData } from "@resources/types/ocr";
import { journalOcrFileLimit } from "@configs/app";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";
import EditorHeader from "../EditorHeader";
import { headingVariants, paragraphVariants } from "@resources/variants";
import EditorActionBtns from "../EditorActionBtns";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { ActionData } from "@resources/types/action";
import { useRouter } from "next/navigation";
import { pagePaths } from "@resources/paths";
import { cn } from "@lib/utils/style";
import TextArea from "@modules/common/components/TextArea";
import FileInput from "@modules/common/components/FileInput";
import Spinner from "@modules/common/components/Spinner";
import Image from "@modules/common/components/Image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import { getBase64 } from "@lib/utils/image";
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
      <div className="w-full border-b border-border-light" />
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
            "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light cursor-pointer",
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
            "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light cursor-pointer",
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
        <div className="flex gap-[10px] items-center">
          <i className="gng-info text-[21px] text-content-dark" />
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
        "relative flex flex-col p-5 md:p-[30px] justify-center items-between rounded gap-[20px] bg-[#E5EDFA]"
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
      <div className="flex sm:grid grid-cols-3 sm:flex-row flex-col sm:justify-between gap-[30px] sm:items-start w-full sm:h-[280px]">
        {image ? (
          <div
            className={cn("relative rounded max-h-[270px] flex gap-[10px] overflow-hidden w-full")}
          >
            {!loading && (
              <button
                onClick={() => {
                  setImage(null);
                  onUpdate(null);
                }}
                className="absolute top-2 right-2 h-[20px] w-[20px] flex items-center justify-center z-10 !bg-dark-900/60 rounded-[10px] cursor-pointer"
              >
                <i className="gng-trash text-danger text-body" />
              </button>
            )}
            <Image src={image} className="h-auto w-full object-cover" />
            {loading && (
              <div
                className={cn(
                  "absolute top-0 left-0 bg-bkg-dark/50 flex items-center justify-center rounded w-full md:w-full border border-border-light gap-[10px] overflow-hidden h-[100px] md:h-full"
                )}
              >
                <Spinner />
              </div>
            )}
          </div>
        ) : (
          <section
            className="relative w-full max-h-[550px] md:max-h-auto h-full rounded-[10px] overflow-hidden mx-auto shrink"
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
              <div className="h-full border-[4px] border-dashed border-border-light rounded-[10px] flex flex-col gap-[20px] justify-center p-5 lg:p-10">
                <div
                  className={cn(
                    "flex justify-center items-center mx-auto cursor-pointer border-border-light rounded-full shrink-0 md:border md:size-[70px]"
                  )}
                >
                  <i className="gng-add-thin text-center text-[25px] text-content-dark" />
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
          <div className="flex sm:flex-row flex-col w-full h-full gap-5 col-span-2">
            <div className="flex sm:flex-col justify-center items-center h-full shrink-0 gap-5">
              <div className="flex sm:h-full w-full sm:w-[1px] border-t sm:border-r border-border-light " />
              <Paragraph content={"or"} sx="text-content-dark-secondary" />
              <div className="flex sm:h-full w-full sm:w-[1px] border-t sm:border-r border-border-light " />
            </div>
            <div className="flex flex-col gap-[5px] w-full h-full">
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
