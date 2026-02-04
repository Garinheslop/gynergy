import { FC, useEffect } from "react";

import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import ActionButton from "@modules/common/components/ActionButton";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { discoveryInputData } from "@resources/data/input/visions";
import { journalTypes } from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { visionDiscoveryKeys, VisionDiscovery } from "@resources/types/vision";
import { useSelector } from "@store/hooks";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

import EditorActionBtns from "../EditorActionBtns";
import EditorHeader from "../EditorHeader";

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
