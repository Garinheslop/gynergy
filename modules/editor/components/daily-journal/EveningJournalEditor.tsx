import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { EveningJournalData, journalEntryTypes } from "@resources/types/journal";
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
import MoodTracker from "../MoodTracker";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { cn } from "@lib/utils/style";
import { getBase64 } from "@lib/utils/image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import Heading from "@modules/common/components/typography/Heading";
import Image from "@modules/common/components/Image";
import FileInput from "@modules/common/components/FileInput";
import Spinner from "@modules/common/components/Spinner";
import TextArea from "@modules/common/components/TextArea";

const EveningJournalEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const journalData = useSelector((state) => state.editor.current) as EveningJournalData;
  const journalType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<EveningJournalData>({
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
        heading={"Evening Journal"}
        headingVariant={headingVariants.titleLg}
        icon={{
          class: "text-action-secondary",
          name: "evening",
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
                fileLimit: journalOcrFileLimit.default,
              },
              popupAction: onScanHandler,
              popupType: editorStates.type!,
            })
          }
        />
      </EditorHeader>
      <div className="w-full border-b border-border-light" />
      <div className="flex flex-col gap-5">
        <MoodTracker
          value={editor.data?.moodScore}
          onClick={(field, value) => editor.update(field, value)}
        />

        <div className="flex flex-col gap-[10px]">
          <TextAreaWithHeading
            heading={"Thought of the Day"}
            description={"What is one unique thought or insight you had today?"}
            value={editor.data ? editor.data.insight : ""}
            onChange={(value) => editor.update("insight", value)}
            placeholder="Start writing from here or press “Scan & Fill” button to autofill"
          />
          <TextAreaWithHeading
            description={
              "How can this insight change your perspective or actions? Reflect on its potential impact."
            }
            value={editor.data ? editor.data.insightImpact : ""}
            onChange={(value) => editor.update("insightImpact", value)}
            placeholder="Start writing from here or press “Scan & Fill” button to autofill"
          />
        </div>
        <TextAreaWithHeading
          heading={"What Went Well"}
          description={
            "Reflect on why these things went well. How can you replicate these successes in other areas of your life?"
          }
          value={editor.data ? editor.data.success : ""}
          onChange={(value) => editor.update("success", value)}
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
        <TextAreaWithHeading
          heading={"Changes for Tomorrow"}
          description={
            "What steps can you take to make this change happen? How will it improve your day?"
          }
          value={editor.data ? editor.data.changes : ""}
          onChange={(value) => editor.update("changes", value)}
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
        <FreeFlow
          value={editor.data ? editor.data.freeflow : ""}
          onUpdate={(value: any) => editor.update("freeflow", value)}
        />
        <div className="flex flex-col gap-[10px]">
          <Heading variant={headingVariants.title} sx="!font-bold">
            Dream Magic
          </Heading>
          <Entries
            entryType={journalEntryTypes.gratitude}
            values={editor.data?.dreammagic}
            onEntryInput={(value) => editor.update("dreammagic", value)}
            sx="w-full"
          />
        </div>
      </div>
    </>
  );
};

const Entries = ({
  heading,
  values,
  entryType,
  onEntryInput,
  sx,
}: {
  heading?: string;
  values?: string[] | null;
  entryType: (typeof journalEntryTypes)[keyof typeof journalEntryTypes];
  onEntryInput: (value: any[]) => void;
  sx?: string;
}) => {
  const [entries, setEntries] = useState(
    Array.from({ length: 5 }).map((_, i) => ({
      value: "",
      label: "I am",
    }))
  );

  useEffect(() => {
    if (values) {
      setEntries((prev) =>
        prev.map((entry, index) => {
          if (values[index]) {
            return { ...entry, value: values[index] };
          }
          return entry;
        })
      );
    } else {
      setEntries(
        Array.from({ length: 5 }).map((_, i) => ({
          value: "",
          label: "I am",
        }))
      );
    }
  }, [values]);
  return (
    <div className={cn("flex flex-col gap-[10px]", sx)}>
      {heading && (
        <Paragraph
          content={heading}
          variant={paragraphVariants.regular}
          sx="!font-bold text-content-dark-secondary"
        />
      )}
      <div className="flex flex-col gap-[10px]">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-[10px]">
            <Paragraph
              content={entry.label}
              variant={paragraphVariants.regular}
              sx="text-nowrap text-content-dark-secondary min-w-[15px] shrink-0"
            />
            <input
              type="text"
              className="box-border w-full bg-bkg-transparent border border-border-light outline-0 rounded px-[15px] py-[10px] text-content-dark placeholder-content-dark/40 text-regular transition-all duration-300 ease focus:outline-none focus:border-action"
              value={entry.value}
              onChange={(e) => {
                const newEntries = [...entries];
                newEntries[index].value = e.target.value;
                setEntries(newEntries);
                onEntryInput(newEntries.map((entry) => entry.value));
              }}
            />
          </div>
        ))}
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

export default EveningJournalEditor;
