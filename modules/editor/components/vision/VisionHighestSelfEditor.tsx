import { FC, useEffect, useRef, useState } from "react";

import { journalOcrFileLimit } from "@configs/app";
import { usePopup } from "@contexts/UsePopup";
import FileInput from "@modules/common/components/FileInput";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import { getBase64 } from "@lib/utils/image";
import { cropImageFromArrayBuffer } from "@lib/utils/imageCrop";
import Heading from "@modules/common/components/typography/Heading";
import { cn } from "@lib/utils/style";
import Image from "@modules/common/components/Image";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useSetEditorData from "@modules/journal/hooks/useSetEditorData";
import { highestSelfInputData } from "@resources/data/input/visions";
import { ImageRawData } from "@resources/types/ocr";
import { visionHighestSelfKeys, VisionHighestSelf, EmblemsCrop } from "@resources/types/vision";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";
import {
  setEditorLoadingState,
  updateEditorCurrentState,
  updateEditorImageState,
} from "@store/modules/editor";

import EditorActionBtns from "../EditorActionBtns";

const VisionHighestSelfEditor: FC = () => {
  const { imageScanPopupObj } = usePopup();
  const editorStates = useSelector((state) => state.editor);
  const visionType = useSelector((state) => state.editor.type);

  const { editor } = useSetEditorData<VisionHighestSelf>({
    data: editorStates.current as VisionHighestSelf,
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
      {(Object.keys(highestSelfInputData) as (keyof typeof highestSelfInputData)[]).map(
        (field, index) => (
          <>
            {field === "symbols" ? (
              <></>
            ) : (
              <TextAreaWithHeading
                key={index}
                heading={highestSelfInputData[field].heading}
                description={highestSelfInputData[field].description}
                value={editor.data ? editor.data[field] : ""}
                onChange={(value) => editor.update(field, value)}
                placeholder="Start writing from here or press “Scan & Fill” button to autofill"
              />
            )}
          </>
        )
      )}
      <Emblems
        // image={editorStates.images.find((_: any, i: any) => i === editor.data?.symbols?.index! - 1)}
        // crop={editor.data?.symbols?.xMax ? editor.data?.symbols : null}
        value={editor.data?.symbols}
        onUpdate={(value) => editor.update("symbols", value)}
      />
    </div>
  );
};

export default VisionHighestSelfEditor;

interface CropImageProps {
  // image: ImageRawData;
  // crop?: EmblemsCrop | null;
  value?: any;
  onUpdate: (data: any) => void;
}

const Emblems: React.FC<CropImageProps> = ({ value, onUpdate }) => {
  const [croppedUrl, setCroppedUrl] = useState<string>("");

  // useEffect(() => {
  //   if (!image?.file || !crop) return;

  //   const getCroppedImage = async () => {
  //     const buffer = Buffer.from(image?.file as any);
  //     const { arrayBuffer, blob } = await cropImageFromArrayBuffer(buffer, crop);
  //     const newUrl = URL.createObjectURL(blob);
  //     setCroppedUrl(newUrl);
  //     console.log({ newUrl });
  //     console.log({ arrayBuffer });
  //     if (onUpdate && arrayBuffer) {
  //       console.log({ arrayBuffer });

  //       onUpdate(arrayBuffer);
  //     }
  //   };
  //   getCroppedImage();
  // }, [image, crop]);
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
    let filteData;

    const compressedFile = await handleImageCompress(file);
    const arrBuffer = await compressedFile.arrayBuffer();
    const buffer = Buffer.from(arrBuffer);
    filteData = {
      file: buffer,
      name: file?.name ?? new Date().getTime(),
      contentType: file?.type,
    };
    if (onUpdate) {
      onUpdate(filteData);
    }
    setCroppedUrl(url);
  };
  return (
    <section className="flex flex-col gap-1">
      <Heading variant={headingVariants.title} sx="!font-bold">
        {"Symbols and Emblems"}
      </Heading>
      <Paragraph
        content={
          "Does your highest self have a symbol or emblem that represents your core values and mission? Draw or describe this symbol."
        }
        variant={paragraphVariants.meta}
        sx="text-content-dark-secondary"
      />
      {croppedUrl || value ? (
        <div
          className={cn(
            "relative flex max-h-[270px] w-full max-w-[250px] gap-2.5 overflow-hidden rounded"
          )}
        >
          <button
            onClick={() => {
              setCroppedUrl("");
              onUpdate(null);
            }}
            className="!bg-dark-900/60 absolute top-2 right-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded"
          >
            <i className="gng-trash text-danger text-body" />
          </button>
          <Image
            src={croppedUrl}
            path={!value?.file && value}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : (
        <section
          className="md:max-h-auto relative mx-auto h-full max-h-[550px] w-full shrink-0 overflow-hidden rounded md:shrink lg:w-[500px]"
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
            <div className="border-border-light flex h-full flex-col justify-center gap-5 rounded border-[4px] border-dashed p-5 lg:p-10">
              <div className="border-border-light mx-auto flex size-[70px] cursor-pointer items-center justify-center rounded border">
                <i className="gng-add-photo-filled text-content-dark-secondary text-center text-2xl" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-center gap-1">
                  <Paragraph
                    content={"Click to upload"}
                    variant={paragraphVariants.regular}
                    sx={"text-action-secondary text-center"}
                  />
                  <Paragraph
                    content={"or drag and drop"}
                    variant={paragraphVariants.regular}
                    sx={"text-content-dark-secondary text-center"}
                  />
                </div>

                <Paragraph
                  content={"PNG or JPG (max. 20MB)"}
                  variant={paragraphVariants.regular}
                  sx={"text-content-dark-secondary text-center"}
                />
              </div>
            </div>
          </FileInput>
        </section>
      )}
    </section>
  );
};
