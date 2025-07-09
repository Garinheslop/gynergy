import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { visionDiscoveryKeys, VisionDiscovery } from "@resources/types/vision";
import { journalTypes } from "@resources/types/journal";
import { useSelector } from "@store/hooks";
import { FC, useEffect } from "react";
import EditorHeader from "../EditorHeader";
import EditorActionBtns from "../EditorActionBtns";
import { usePopup } from "@contexts/UsePopup";
import { ImageRawData } from "@resources/types/ocr";
import { journalOcrFileLimit } from "@configs/app";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";
import ActionButton from "@modules/common/components/ActionButton";
import { discoveryInputData } from "@resources/data/input/visions";

const VisionDiscoveryEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const journalData = useSelector((state) => state.editor.current) as VisionDiscovery;
  const visionType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<VisionDiscovery>({
    data: journalData,
    editorType: visionType!,
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
              fileLimit: journalOcrFileLimit.visions.discovery,
            },
            popupAction: onScanHandler,
            popupType: editorStates.type!,
          })
        }
      />
      {(Object.keys(discoveryInputData) as (keyof typeof discoveryInputData)[]).map(
        (field, index) => (
          <TextAreaWithHeading
            key={index}
            heading={discoveryInputData[field].heading}
            description={discoveryInputData[field].description}
            value={editor.data ? editor.data[field] : ""}
            onChange={(value) => editor.update(field, value)}
            placeholder="Start writing from here or press “Scan & Fill” button to autofill"
          />
        )
      )}
    </div>
  );
};

export default VisionDiscoveryEditor;
