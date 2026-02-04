import { useRef, FC, ReactNode, RefObject, ChangeEvent, useEffect } from "react";

// lib
import { usePopup } from "@contexts/UsePopup";
import { getBase64 } from "@lib/utils/image";
import { cn } from "@lib/utils/style";

interface FileInputProps {
  triggerRef?: RefObject<HTMLInputElement>;
  onFileInput?: (result: string | null, file: File) => void;
  children: ReactNode;
  limit?: number;
  isMultiple?: boolean;
  isOpenCamera?: boolean;
  onFileInputClose?: () => void;
  isImage?: boolean;
  sx?: string;
}

const FileInput: FC<FileInputProps> = ({
  triggerRef,
  onFileInput,
  children,
  isMultiple = false,
  isOpenCamera = false,
  onFileInputClose,
  limit,
  isImage = true,
  sx,
}) => {
  const { messagePopupObj } = usePopup();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleWindowCancel = () => {
    window.removeEventListener("cancel", handleWindowCancel);
    if (inputFileRef?.current && onFileInputClose) {
      inputFileRef.current.removeAttribute("capture");
      onFileInputClose();
    }
  };
  useEffect(() => {
    if (isOpenCamera && inputFileRef?.current) {
      inputFileRef.current.capture = "environment";
      window.addEventListener("cancel", handleWindowCancel);
      inputFileRef.current?.click();
      setTimeout(() => {
        if (inputFileRef?.current) inputFileRef.current.capture = "";
      }, 500);
    }
  }, [isOpenCamera]);

  const handleSelectedFile = (files: FileList | null) => {
    if (limit && files && files?.length > limit) {
      messagePopupObj.open({
        popupData: {
          heading: "Too many files",
          description: `Please select only ${limit} files`,
        },
      });
    } else if (files && files.length > 0 && onFileInput) {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (isImage) {
          getBase64(file).then((result: string) => {
            onFileInput(result, file);
            if (triggerRef?.current) {
              triggerRef.current.value = "";
            } else if (inputFileRef.current) {
              inputFileRef.current.value = "";
            }
          });
        } else {
          onFileInput(null, file);
          if (triggerRef?.current) {
            triggerRef.current.value = "";
          } else if (inputFileRef.current) {
            inputFileRef.current.value = "";
          }
        }
      }
    }
  };

  return (
    <label className={cn("cursor-pointer", sx)}>
      {children}
      <input
        ref={triggerRef ?? inputFileRef}
        accept=".jpg,.jpeg,.png"
        type="file"
        className="hidden"
        multiple={isMultiple}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleSelectedFile(event.target.files)}
      />
    </label>
  );
};

export default FileInput;
