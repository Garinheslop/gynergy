import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { WeeklyJournalData } from "@resources/types/journal";
import { useSelector } from "@store/hooks";
import { FC } from "react";
import EditorActionBtns from "../EditorActionBtns";
import { usePopup } from "@contexts/UsePopup";
import { ImageRawData } from "@resources/types/ocr";
import { journalOcrFileLimit } from "@configs/app";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

const WeeklyJournalEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const journalType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<WeeklyJournalData>({
    data: editorStates.current as WeeklyJournalData,
    editorType: journalType!,
    reduxLoadingAction: setEditorLoadingState,
    reduxUpdateAction: updateEditorCurrentState,
    reduxUpdateImagesAction: updateEditorImageState,
  });

  const onScanHandler = (images: ImageRawData[]) => {
    editor.ocr<ImageRawData[]>(images);
  };

  return (
    <div className="flex flex-col gap-5 w-full ">
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

      <TextAreaWithHeading
        heading={"Biggest Wins"}
        description={"What were your biggest wins this week?"}
        value={editor.data ? editor.data.wins : ""}
        onChange={(value) => editor.update("wins", value)}
        placeholder="Start writing from here or press “Scan & Fill” button to autofill"
      />
      <TextAreaWithHeading
        heading={"Challenges Overcome"}
        description={"What challenges did you overcome, and how did you do it?"}
        value={editor.data ? editor.data.challenges : ""}
        onChange={(value) => editor.update("challenges", value)}
        placeholder="Start writing from here or press “Scan & Fill” button to autofill"
      />
      <TextAreaWithHeading
        heading={"Lessons Learned"}
        description={"What did you learn from the experiences of this week?"}
        value={editor.data ? editor.data.lessons : ""}
        onChange={(value) => editor.update("lessons", value)}
        placeholder="Start writing from here or press “Scan & Fill” button to autofill"
      />
    </div>
  );
};

export default WeeklyJournalEditor;
