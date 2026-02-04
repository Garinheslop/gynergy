import { FC } from "react";

import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { ImageRawData } from "@resources/types/ocr";
import { VisionCreed } from "@resources/types/vision";
import { useSelector } from "@store/hooks";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

import EditorActionBtns from "../EditorActionBtns";

const VisionCreedEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const visionType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<VisionCreed>({
    data: editorStates.current as VisionCreed,
    editorType: visionType!,
    reduxLoadingAction: setEditorLoadingState,
    reduxUpdateAction: updateEditorCurrentState,
    reduxUpdateImagesAction: updateEditorImageState,
  });

  const onScanHandler = (images: ImageRawData[]) => {
    editor.ocr<ImageRawData[]>(images);
  };

  return (
    <div className="flex w-full flex-col gap-5">
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
        heading={"Your Personal Creed"}
        description={
          "A declaration of your values, beliefs, and commitments, guiding your actions and decisions."
        }
        value={editor.data ? editor.data.creed : ""}
        onChange={(value) => editor.update("creed", value)}
        placeholder="Start writing from here or press “Scan & Fill” button to autofill"
      />
    </div>
  );
};

export default VisionCreedEditor;
