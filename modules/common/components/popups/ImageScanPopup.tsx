//context
import { useCallback, useEffect, useRef, useState } from "react";

import Webcam from "react-webcam";

import { usePopup } from "@contexts/UsePopup";
import { base64ToArrayBuffer, getBase64 } from "@lib/utils/image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import { convertNumberToWords } from "@lib/utils/number";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import FileInput from "@modules/common/components/FileInput";
import Image from "@modules/common/components/Image";
import Modal from "@modules/common/components/modal";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useWindowDimensions from "@modules/common/hooks/useWindowDimensions";
import { buttonActionTypes } from "@resources/types/button";
import { ImageRawData } from "@resources/types/ocr";
import { headingVariants, paragraphVariants } from "@resources/variants";

import Spinner from "../Spinner";

const ImageScanPopup = () => {
  //context
  const webcamRef = useRef<any>(null);
  const { width: windowWidth } = useWindowDimensions();
  const { messagePopupObj, imageScanPopupObj } = usePopup();

  const [loading, setLoading] = useState<boolean>(false);
  const [uncompressedImages, setUncompressedImages] = useState<
    {
      id: number;
      url: string;
      progress: number;
    }[]
  >([]);
  const [images, setImages] = useState<ImageRawData[]>([]);
  const [openCamera, setOpenCamera] = useState<boolean>(false);

  const { popupAction, popupData } = imageScanPopupObj.data;

  const { fileLimit } = popupData;

  useEffect(() => {
    if (!imageScanPopupObj.show) {
      setImages([]);
      setUncompressedImages([]);
      setOpenCamera(false);
    }
  }, [imageScanPopupObj.show]);

  const captureHandler = () => {
    if (webcamRef?.current) {
      setLoading(true);
      const imageSrc = webcamRef.current.getScreenshot();
      handleFileInput(imageSrc, null, new Date().getTime());
    }
  };

  const videoConstraints = {
    width: 414,
    height: 720,
    facingMode: { exact: "environment" },
  };

  useEffect(() => {
    if (fileLimit && images.length === fileLimit) {
      setOpenCamera(false);
      return;
    }
  }, [images]);

  const readImageHandler = () => {
    if (popupAction) {
      popupAction(images);
      imageScanPopupObj.close();
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setLoading(true);
      getBase64(file).then((result: string) => {
        handleFileInput(result, file);
      });
      e.target.value = "";
    }
  };
  const preventDefaultHandler = (e: any) => {
    e.preventDefault();
  };
  const handleFileInput = async (url: string, file: File | null, id?: number) => {
    let filteData;
    setLoading(true);

    if (windowWidth! <= 450) {
      setOpenCamera(false);
    }
    setUncompressedImages((prev) =>
      prev.concat({ id: id ?? prev.length + 1, url: url, progress: 0 })
    );

    const updateProgress = (progress: number) => {
      setUncompressedImages((prev) =>
        prev.map((img) => {
          if (img.id === id) {
            return { ...img, progress: progress };
          }
          return img;
        })
      );
    };

    if (file) {
      const compressedFile = await handleImageCompress(file, updateProgress);
      const compressedUrl = await getBase64(compressedFile);
      const arrBuffer = await compressedFile.arrayBuffer();
      const buffer = Buffer.from(arrBuffer);
      filteData = {
        url: compressedUrl,
        file: buffer,
        name: file?.name ?? new Date().getTime(),
        contentType: file?.type,
      };
    } else {
      const fileData = base64ToArrayBuffer(url);
      const compressedFile = await handleImageCompress(fileData.blobFile);
      const compressedUrl = await getBase64(compressedFile);
      const arrBuffer = await compressedFile.arrayBuffer();
      const buffer = Buffer.from(arrBuffer);
      filteData = {
        url: compressedUrl,
        file: buffer,
        name: compressedFile?.name ?? new Date().getTime(),
        contentType: compressedFile?.type,
      };
    }
    setUncompressedImages((prev) => prev.filter((img) => img.id !== id));
    setImages((prev) => prev.concat({ id: prev.length + 1, ...filteData }));
    setLoading(false);
  };

  useEffect(() => {
    if (fileLimit && images && images?.length > fileLimit) {
      messagePopupObj.open({
        popupData: {
          heading: "Too many images",
          description: `Please select only ${fileLimit} images.`,
        },
      });
      setImages((prev) => (prev = []));
      setUncompressedImages((prev) => (prev = []));
      setLoading(false);
    }
  }, [images]);
  if (!imageScanPopupObj.show) return null;

  return (
    <Modal open={imageScanPopupObj.show} onClose={imageScanPopupObj.close}>
      <section
        className={cn(
          "bg-bkg-light mx-auto flex h-screen w-screen flex-col gap-[30px] overflow-auto rounded p-[30px] pb-[150px] sm:h-auto sm:max-h-[95vh] sm:max-w-[95vw] sm:pb-[30px] md:w-[730px]",
          { "bg-bkg-dark !w-max gap-0 p-0": openCamera && windowWidth! > 450 }
        )}
      >
        {openCamera && images.length < fileLimit && windowWidth! > 450 ? (
          <div className="relative mx-auto flex w-max gap-5">
            <Webcam
              ref={webcamRef}
              audio={false}
              height={720}
              screenshotFormat="image/jpeg"
              width={414}
              className="min-h-[720px] rounded-[6px]"
              videoConstraints={videoConstraints}
            />
            <i
              className="gng-close text-content-light absolute top-4 right-4 cursor-pointer text-[18px]"
              onClick={() => setOpenCamera(false)}
            />
            {images.length > 0 && (
              <div className="grid h-max grid-cols-2 gap-[10px] pt-12">
                {images.map((imgObj, index) => (
                  <ImageViewer
                    key={index}
                    id={imgObj.id!}
                    image={imgObj.url!}
                    onDelete={(id) => {
                      setImages(images.filter((img) => img.id !== id));
                    }}
                    sx="h-[100px] w-auto"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-[10px]">
              <div className="flex justify-between">
                <Heading variant={headingVariants.cardHeading} sx="font-bold">
                  Add Pages to Scan
                </Heading>
                <i
                  className="gng-close cursor-pointer text-[18px]"
                  onClick={imageScanPopupObj.close}
                />
              </div>
              <Paragraph
                content={
                  "Take a photo of the relevant page from your physical Date ZERO journal. If there are two pages, you may include two photos. For the best results, please ensure the photos are sharp and taken under sufficient lighting."
                }
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary"
              />
            </div>

            <div
              className={cn(
                "relative h-[270px] w-full shrink-0 overflow-hidden rounded-[10px] md:shrink",
                {
                  "h-max": openCamera,
                }
              )}
              onDrop={handleDrop}
              onDragOver={preventDefaultHandler}
              onDragEnter={preventDefaultHandler}
              onDragLeave={preventDefaultHandler}
            >
              <div className={cn("grid h-full w-full grid-cols-4 gap-[10px] md:flex")}>
                {images.map((imgObj, index) => (
                  <ImageViewer
                    key={index}
                    id={imgObj.id!}
                    image={imgObj.url!}
                    onDelete={(id) => {
                      setImages(images.filter((img) => img.id !== id));
                    }}
                    sx="w-full md:max-w-[210px] h-[100px] md:h-full"
                  />
                ))}
                {loading ? (
                  <>
                    {uncompressedImages &&
                      uncompressedImages.map((img, index) => (
                        <div
                          key={index}
                          className={cn(
                            "relative flex h-[100px] max-h-[270px] w-full max-w-[250px] gap-[10px] overflow-hidden rounded md:h-full md:max-w-[210px]"
                          )}
                        >
                          <Image src={img.url} className="h-auto w-full object-cover" />
                          <div className="bg-bkg-dark/70 absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center gap-[5px]">
                            <Paragraph
                              content={`${img.progress}%`}
                              variant={paragraphVariants.meta}
                              sx="text-content-light"
                            />
                            <Spinner />
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <>
                    {images.length < fileLimit && (
                      <FileInput
                        isMultiple
                        limit={fileLimit}
                        isOpenCamera={openCamera}
                        onFileInputClose={() => setOpenCamera(false)}
                        onFileInput={(url, file) => {
                          if (file) {
                            handleFileInput(url!, file, new Date().getTime());
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "border-border-light flex w-[210px] flex-col justify-center gap-[20px] rounded-[10px] border-[4px] border-dashed p-[10px] md:h-full",
                            {
                              "h-[100px] w-full md:h-full md:w-[210px]":
                                images.length > 0 && windowWidth! < 768,
                            }
                          )}
                        >
                          <div
                            className={cn(
                              "border-border-light mx-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full",
                              {
                                "md:size-[70px] md:border":
                                  images.length > 0 && windowWidth! <= 450,
                                "size-[70px] border": images.length === 0 || windowWidth! > 450,
                              }
                            )}
                          >
                            <i className="gng-add-thin text-content-dark text-center text-[25px]" />
                          </div>

                          <div
                            className={cn("flex flex-col gap-[5px]", {
                              "hidden md:flex": images.length > 0 && windowWidth! < 768,
                            })}
                          >
                            <Paragraph
                              content={`Add ${images.length > 0 ? "Another" : "First"} Page`}
                              variant={paragraphVariants.regular}
                              sx={"text-center"}
                            />
                            <Paragraph
                              content={
                                images.length > 0
                                  ? "Only if your entry is more than one page"
                                  : "The starting page of your entry "
                              }
                              variant={paragraphVariants.regular}
                              sx={"text-content-dark-secondary text-center"}
                            />
                          </div>
                        </div>
                      </FileInput>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-5">
          {!openCamera && (
            <div className="flex items-center gap-[10px]">
              <i className="gng-Info text-content-dark-secondary text-[18px]" />
              <Paragraph
                content={`For this instance, you can upload ${fileLimit > 1 ? `up to ${convertNumberToWords(fileLimit)} images` : `${convertNumberToWords(fileLimit)} image`} at once.`}
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary"
              />
            </div>
          )}
          <div className="border-border-light flex justify-between gap-[10px] border-t pt-5">
            {!openCamera && (
              <ActionButton
                label={openCamera && windowWidth! > 450 ? "Close Camera" : "Take Photo"}
                onClick={() => setOpenCamera(!openCamera)}
                icon={openCamera && windowWidth! > 450 ? "" : "camera-filled"}
                disabled={images.length >= fileLimit}
                sx={cn("w-max [&>p,&>i]:text-content-light", {
                  "hover:bg-gray-700 bg-gray-900": images.length < fileLimit,
                  "bg-gray-400": images.length >= fileLimit,
                })}
              />
            )}
            {images.length > 0 && !openCamera && (
              <ActionButton
                label={openCamera && windowWidth! > 450 ? "Capture" : "Scan"}
                onClick={openCamera && windowWidth! > 450 ? captureHandler : readImageHandler}
                sx="w-max"
              />
            )}
            {openCamera && windowWidth! > 450 && (
              <div
                className="bg-bkg-light mx-auto flex size-[60px] cursor-pointer items-center justify-center rounded-full"
                onClick={captureHandler}
              >
                <div className="bg-bkg-light border-dark-pure flex size-[54px] rounded-full border-4"></div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Modal>
  );
};

const ImageViewer = ({
  id,
  image,
  onDelete,
  sx,
}: {
  id: number;
  image: string;
  onDelete: (id: number) => void;
  sx?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex h-full max-h-[270px] w-full max-w-[250px] gap-[10px] overflow-hidden rounded",
        sx
      )}
    >
      <button
        onClick={() => onDelete(id)}
        className="!bg-dark-900/60 absolute top-2 right-2 z-10 flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-[10px]"
      >
        <i className="gng-trash text-danger text-body" />
      </button>
      <Image src={image} className="h-auto w-full object-cover" />
    </div>
  );
};

export default ImageScanPopup;
