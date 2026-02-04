import { useState } from "react";

import toast from "react-hot-toast";

import { usePopup } from "@contexts/UsePopup";
import { journalErrorMessages, JournalErrorMessageType } from "@resources/messages/error";
import { errorTypes, fileErrorTypes } from "@resources/types/error";
import { EditorData, journalTypes } from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { visionTypes } from "@resources/types/vision";
const editorTypes = {
  ...journalTypes,
  ...visionTypes,
};
const useOcr = <T extends EditorData>(
  editorType: (typeof editorTypes)[keyof typeof editorTypes],
  onFailed?: (err: any) => void
) => {
  const [data, setData] = useState<T>();
  const [images, setImages] = useState<ImageRawData[]>([]);

  const [isRead, setIsRead] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const readImages = async <T extends ImageRawData[]>(images: T) => {
    setIsReading(true);
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: images.map((img) => img.url), contentType: editorType }),
      });

      if (response?.status === 413 && onFailed) {
        setIsReading(false);
        onFailed(fileErrorTypes.fileTooLarge);
        return;
      }
      const data = await response.json();
      if (data?.journal && !Object.values(data.journal).find((val) => val) && onFailed) {
        onFailed({ error: "no-data" });
      }
      setData(data.journal);

      setImages(
        images.map((img) => ({ file: img.file, name: img.name, contentType: img.contentType }))
      );
      setIsRead(true);
      setIsReading(false);
    } catch (error: any) {
      console.log("Error reading journal:", error);
      if (onFailed) {
        onFailed({ error: error });
      }
      if (
        error?.message &&
        journalErrorMessages[error.message as keyof JournalErrorMessageType] &&
        onFailed
      ) {
        onFailed(journalErrorMessages[error.message as keyof JournalErrorMessageType]);
      } else {
        onFailed && onFailed({ error: error });
      }
      setIsReading(false);
    }
  };

  const resetStates = () => {
    setIsRead(false);
    setIsReading(false);
  };

  return {
    ocr: {
      data: data,
      images: images,
      read: readImages,
      reset: resetStates,
      isReading,
      isRead,
    },
  };
};
export default useOcr;
