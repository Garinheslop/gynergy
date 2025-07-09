import { EditorData, journalTypes } from "@resources/types/journal";
import useSetEditorDataStates from "./useSetEditorDataStates";
import useOcr from "./useOcr";
import { useEffect } from "react";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { useDispatch } from "@store/hooks";
import { visionTypes } from "@resources/types/vision";
import { usePopup } from "@contexts/UsePopup";
import { fileErrorTypes } from "@resources/types/error";

const editorTypes = {
  ...journalTypes,
  ...visionTypes,
};

const useSetEditorData = <T extends EditorData>({
  data,
  editorType,
  reduxLoadingAction,
  reduxUpdateAction,
  reduxUpdateImagesAction,
}: {
  data: T | null;
  editorType: (typeof editorTypes)[keyof typeof editorTypes];
  reduxLoadingAction?: any;
  reduxUpdateAction?: any;
  reduxUpdateImagesAction?: any;
}) => {
  const { messagePopupObj } = usePopup();

  const dispatch = useDispatch();
  const { editorData, updateEditorField, setEditorData, resetEditor } = useSetEditorDataStates<T>({
    data: data,
  });

  const onOcrFailed = (type: string) => {
    if (type === fileErrorTypes.fileTooLarge) {
      messagePopupObj.open({
        popupData: {
          heading: "File too large",
          description: `It looks like the total size of the images you provided is too large for the system to process. Please try smaller files.`,
        },
      });
    } else {
      messagePopupObj.open({
        popupData: {
          heading: "Oops, We Couldn't Find Your Journal Entry",
          description: `It looks like we didn't detect any relevant text in the image you provided. Could you please try uploading a clearer photo which is relevant to the current journal? Make sure the image is well-lit, in focus, and that your journal entry is clearly visible. This will help our system accurately capture your entry.`,
        },
      });
    }
  };

  const { ocr } = useOcr<T>(editorType, onOcrFailed);

  useEffect(() => {
    if (reduxUpdateAction) {
      dispatch(reduxUpdateAction(editorData));
    }
  }, [editorData]);
  useEffect(() => {
    if (reduxLoadingAction) {
      dispatch(reduxLoadingAction(ocr.isReading));
    }
  }, [ocr.isReading]);
  useEffect(() => {
    if (ocr.data) {
      setEditorData(ocr.data);
      if (reduxUpdateAction) {
        dispatch(reduxUpdateAction(ocr.data));
      }
      if (reduxUpdateImagesAction) {
        dispatch(reduxUpdateImagesAction(ocr.images));
      }
    }
  }, [ocr.data]);

  const resetEditorStates = () => {
    resetEditor();
    dispatch(reduxUpdateImagesAction([]));
    ocr.reset();
  };

  return {
    editor: {
      data: editorData,
      update: updateEditorField,
      set: setEditorData,
      reset: resetEditorStates,
      ocr: ocr.read,
      isReading: ocr.isReading,
      isRead: ocr.isRead,
    },
  };
};

export default useSetEditorData;
