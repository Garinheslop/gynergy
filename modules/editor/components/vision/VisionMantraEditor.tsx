import { FC } from "react";

import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { ImageRawData } from "@resources/types/ocr";
import { VisionMantra } from "@resources/types/vision";
import { useSelector } from "@store/hooks";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

import EditorActionBtns from "../EditorActionBtns";


const VisionMantraEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const visionType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<VisionMantra>({
    data: editorStates.current as VisionMantra,
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
        heading={"Write Out Your Mantra"}
        description={"What values and aspirations guide you?"}
        value={editor.data ? editor.data.mantra : ""}
        onChange={(value) => editor.update("mantra", value)}
        wordLimit={1000}
        placeholder="Start writing from here or press “Scan & Fill” button to autofill"
      />
    </div>
  );
};

export default VisionMantraEditor;
