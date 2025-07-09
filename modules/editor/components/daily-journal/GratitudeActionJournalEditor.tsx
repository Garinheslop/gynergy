import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { DailyChallengeData } from "@resources/types/journal";
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
import { cn } from "@lib/utils/style";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { ActionData } from "@resources/types/action";
import { useRouter } from "next/navigation";
import { pagePaths } from "@resources/paths";
import { getBase64 } from "@lib/utils/image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import Image from "@modules/common/components/Image";
import Spinner from "@modules/common/components/Spinner";
import FileInput from "@modules/common/components/FileInput";

const GratitudeActionJournalEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const router = useRouter();
  const actions = useSelector((state) => state.actions);
  const editorStates = useSelector((state) => state.editor);
  const journalData = useSelector((state) => state.editor.current) as DailyChallengeData;
  const journalType = useSelector((state) => state.editor.type);

  const [dailyAction, setDailyAction] = useState<ActionData | null>(null);

  useEffect(() => {
    if (!actions.current.daily.data?.id) {
      router.push(pagePaths.home);
    } else {
      setDailyAction(actions.current.daily.data);
    }
  }, [actions.current]);

  const { editor } = useSetEditorData<DailyChallengeData>({
    data: journalData,
    editorType: journalType!,
    reduxLoadingAction: setEditorLoadingState,
    reduxUpdateAction: updateEditorCurrentState,
    reduxUpdateImagesAction: updateEditorImageState,
  });
  const onScanHandler = (images: ImageRawData[]) => {
    editor.ocr<ImageRawData[]>(images);
  };

  return (
    <>
      <EditorHeader
        heading={"Daily Gratitude Action"}
        headingVariant={headingVariants.titleLg}
        icon={{
          class: "text-primary-500",
          name: "action",
        }}
      >
        <EditorActionBtns
          isScanned={
            editor.isRead &&
            (editor.data && Object.values(editor.data as any).find((val) => val) ? true : false)
          }
          onClear={() => editor.reset()}
          onScan={() =>
            imageScanPopupObj.open({
              popupData: {
                fileLimit: journalOcrFileLimit.journal.dga,
              },
              popupAction: onScanHandler,
              popupType: editorStates.type!,
            })
          }
        />
      </EditorHeader>
      <div className="w-full border-b border-border-light" />
      <div className="flex flex-col gap-[10px]">
        <Heading variant={headingVariants.sectionHeading} sx="!font-bold capitalize">
          {dailyAction?.title.toLowerCase()}
        </Heading>
        <Paragraph content={`TIP: ${dailyAction?.tip}`} variant={paragraphVariants.regular} />
      </div>

      {editorStates.action?.isSelf && (
        <TextAreaWithHeading
          value={editor.data?.note}
          onChange={(value) => editor.update("note", value)}
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
      )}
      {editorStates.action?.isList && (
        <TextAreaWithHeading
          value={editor.data?.list}
          onChange={(value) => editor.update("list", value)}
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
      )}
      {editorStates.action?.isDraw && (
        <Draw onUpdate={(value: any) => editor.update("draw", value)} />
      )}

      <ActionCompletion
        value={editor.data?.isCompleted}
        onValueSet={(value) => editor.update("isCompleted", value)}
      >
        <TextAreaWithHeading
          description={
            editor.data?.isCompleted
              ? "How did it make you feel to express gratitude?"
              : "What obstacles did you encounter, and how can you overcome them tomorrow?"
          }
          value={editor.data?.isCompleted ? editor.data.reflection : editor.data?.obstacles}
          onChange={(value) =>
            editor.update(editor.data?.isCompleted ? "reflection" : "obstacles", value)
          }
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
      </ActionCompletion>
    </>
  );
};

const ActionCompletion = ({
  value,
  onValueSet,
  children,
}: {
  value?: boolean;
  children: React.ReactNode;
  onValueSet: (value: boolean) => void;
}) => {
  // const [value, setValue] = useState<boolean | null>(null);
  return (
    <div className={cn("flex flex-col gap-[10px]")}>
      <Heading variant={headingVariants.cardHeading} sx="!font-bold">
        Did you complete today’s daily gratitude action?
      </Heading>
      <div className="flex gap-[10px]">
        <button
          className={cn(
            "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light cursor-pointer",
            { "bg-action": value }
          )}
          onClick={() => {
            onValueSet(true);
          }}
        >
          Yes
        </button>

        <button
          className={cn(
            "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light cursor-pointer",
            { "bg-action": value === false }
          )}
          onClick={() => {
            onValueSet(false);
          }}
        >
          No
        </button>
      </div>
      <div
        className={`overflow-hidden flex flex-col gap-5 md:gap-[30px] px-1 transition-all duration-500 sm:p-0 ${
          value === undefined ? "max-h-0 ease-out" : "max-h-[50vh] ease-in"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const Draw = ({ onUpdate }: { onUpdate: (data?: any) => void }) => {
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
        {"GRATITUDE ART"}
      </Heading>
      <Paragraph
        content={"Upload your gratitude art drawing."}
        variant={paragraphVariants.meta}
        sx="text-content-dark-secondary"
      />
      {image ? (
        <div
          className={cn(
            "relative rounded max-w-[250px] max-h-[270px] flex gap-[10px] overflow-hidden w-full"
          )}
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
                "absolute top-0 left-0 bg-bkg-dark/50 flex items-center justify-center rounded w-full md:w-[250px] border border-border-light gap-[10px] overflow-hidden h-[100px] md:h-full"
              )}
            >
              <Spinner />
            </div>
          )}
        </div>
      ) : (
        <section
          className="relative w-full max-h-[550px] md:max-h-auto h-full rounded-[10px] overflow-hidden mx-auto shrink-0 md:shrink"
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
    </section>
  );
};

export default GratitudeActionJournalEditor;
