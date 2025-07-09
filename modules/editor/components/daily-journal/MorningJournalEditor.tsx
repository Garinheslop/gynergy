import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import { cn } from "@lib/utils/style";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { journalEntryTypes, MorningJournalData } from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";
import { FC, useEffect, useState } from "react";
import EditorActionBtns from "../EditorActionBtns";
import EditorHeader from "../EditorHeader";
import MoodTracker from "../MoodTracker";

const MorningJournalEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const journalData = useSelector((state) => state.editor.current) as MorningJournalData;
  const journalType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<MorningJournalData>({
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
        heading={"Morning Journal"}
        headingVariant={headingVariants.titleLg}
        icon={{
          class: "text-primary",
          name: "morning",
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
        <DreamEssence
          value={editor.data?.isDreamt}
          onValueSet={(value) => editor.update("isDreamt", value)}
        >
          <TextAreaWithHeading
            description={"If yes: (capture the essence)"}
            value={editor.data ? editor.data.capturedEssence : ""}
            onChange={(value) => editor.update("capturedEssence", value)}
            placeholder="Start writing from here or press “Scan & Fill” button to autofill"
          />
        </DreamEssence>
        <div className="flex flex-col gap-[10px]">
          <MoodTracker
            value={editor.data?.moodScore}
            onClick={(field, value) => editor.update(field, value)}
          />
          <TextAreaWithHeading
            description={"What do you think contributed to your mood today?"}
            value={editor.data ? editor.data.moodContribution : ""}
            onChange={(value) => editor.update("moodContribution", value)}
            placeholder="Start writing from here or press “Scan & Fill” button to autofill"
          />
        </div>
        <div className={cn("flex flex-col gap-[10px]")}>
          <Heading variant={headingVariants.cardHeading} sx="!font-bold">
            Positive Affirmations
          </Heading>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-[20px] lg:gap-[40px]">
            <Entries
              entryType={journalEntryTypes.affirmation}
              values={editor.data?.affirmations}
              onEntryInput={(value) => editor.update("affirmations", value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px]">
              <Entries
                entryType={journalEntryTypes.gratitude}
                values={editor.data?.gratitudes}
                heading="I Am Grateful For:"
                onEntryInput={(value) => editor.update("gratitudes", value)}
                sx="w-full"
              />
              <Entries
                entryType={journalEntryTypes.excitement}
                values={editor.data?.excitements}
                heading="I Am Excited About:"
                onEntryInput={(value) => editor.update("excitements", value)}
                sx="w-full"
              />
            </div>
          </div>
        </div>
        <TextAreaWithHeading
          heading={"My Mantra"}
          value={editor.data ? editor.data.mantra : ""}
          onChange={(value) => editor.update("mantra", value)}
          placeholder="Start writing from here or press “Scan & Fill” button to autofill"
        />
      </div>
    </>
  );
};

const DreamEssence = ({
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
        Did You Dream?
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
          value ? "max-h-[50vh] ease-in" : "max-h-0 ease-out"
        }`}
      >
        {children}
      </div>
    </div>
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
    Array.from({ length: entryType === journalEntryTypes.affirmation ? 5 : 3 }).map((_, i) => ({
      value: "",
      label: entryType === journalEntryTypes.affirmation ? "I am" : `${i + 1}.`,
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
        Array.from({ length: entryType === journalEntryTypes.affirmation ? 5 : 3 }).map((_, i) => ({
          value: "",
          label: entryType === journalEntryTypes.affirmation ? "I am" : `${i + 1}.`,
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

export default MorningJournalEditor;
