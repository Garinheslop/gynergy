//context
import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import ReactConfetti from "react-confetti";
import Webcam from "react-webcam";

import { usePopup } from "@contexts/UsePopup";
import { base64ToArrayBuffer, getBase64 } from "@lib/utils/image";
import { handleImageCompress } from "@lib/utils/ImageCompressor";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import FileInput from "@modules/common/components/FileInput";
import Image from "@modules/common/components/Image";
import Modal from "@modules/common/components/modal";
import Spinner from "@modules/common/components/Spinner";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import useWindowDimensions from "@modules/common/hooks/useWindowDimensions";
import useOcr from "@modules/journal/hooks/useOcr";
import icons from "@resources/icons";
import images from "@resources/images";
import { actionRequestTypes } from "@resources/types/action";
import { buttonActionTypes } from "@resources/types/button";
import {
  EditorData,
  journalRequestTypes,
  journalTypes,
  MorningJournalData,
  EveningJournalData,
  WeeklyJournalData,
  DailyChallengeData,
} from "@resources/types/journal";
import { ImageRawData } from "@resources/types/ocr";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { createUserActionLog } from "@store/modules/action";
import { createUserjournal } from "@store/modules/journal";

type PopupStep = "info" | "capture" | "processing" | "review" | "success";

const FILE_LIMIT = 2;

const JournalPopup = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const webcamRef = useRef<any>(null);
  const { width: windowWidth } = useWindowDimensions();
  const currentBook = useSelector((state) => state.books.current);
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const journals = useSelector((state) => state.journals);
  const actions = useSelector((state) => state.actions);
  const { journalPopupObj } = usePopup();

  const [step, setStep] = useState<PopupStep>("info");
  const [popupContents, setPopupContents] = useState<any | null>(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uncompressedImages, setUncompressedImages] = useState<
    { id: number; url: string; progress: number }[]
  >([]);
  const [capturedImages, setCapturedImages] = useState<ImageRawData[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { popupType, popupAction, popupData } = journalPopupObj.data;

  const ocrType = (popupType ??
    journalTypes.morningJournal) as (typeof journalTypes)[keyof typeof journalTypes];
  const { ocr } = useOcr<EditorData>(ocrType, (err) => {
    setOcrError(getOcrErrorMessage(err));
    setStep("capture");
  });

  // Set popup contents when type changes
  useEffect(() => {
    if (journalPopupObj.show && popupType) {
      setPopupContents(getContent(popupType));
    } else {
      setPopupContents(null);
    }
  }, [journalPopupObj.show, popupType]);

  // Jump to capture if flagged
  useEffect(() => {
    if (journalPopupObj.show && popupData?.startAtCapture) {
      setStep("capture");
    }
  }, [journalPopupObj.show, popupData?.startAtCapture]);

  // When OCR finishes reading, move to review
  useEffect(() => {
    if (ocr.isRead && ocr.data) {
      setStep("review");
    }
  }, [ocr.isRead, ocr.data]);

  // Detect submission success
  useEffect(() => {
    if (submitting && !journals.creating && !actions.creating) {
      setSubmitting(false);
      setStep("success");
      setShowConfetti(true);
    }
  }, [submitting, journals.creating, actions.creating]);

  // Reset all state when popup closes
  useEffect(() => {
    if (!journalPopupObj.show) {
      setStep("info");
      setCapturedImages([]);
      setUncompressedImages([]);
      setOpenCamera(false);
      setLoading(false);
      setOcrError(null);
      setShowConfetti(false);
      setSubmitting(false);
      ocr.reset();
    }
  }, [journalPopupObj.show]);

  const videoConstraints = {
    width: 414,
    height: 720,
    facingMode: { exact: "environment" },
  };

  const captureHandler = useCallback(() => {
    if (webcamRef?.current) {
      setLoading(true);
      const imageSrc = webcamRef.current.getScreenshot();
      handleFileInput(imageSrc, null, Date.now());
    }
  }, []);

  const handleDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setLoading(true);
      getBase64(file).then((result: string) => {
        handleFileInput(result, file);
      });
    }
  };

  const preventDefaultHandler = (e: any) => {
    e.preventDefault();
  };

  const handleFileInput = async (url: string, file: File | null, id?: number) => {
    setLoading(true);
    const imageId = id ?? Date.now();

    if (windowWidth! <= 450) {
      setOpenCamera(false);
    }

    setUncompressedImages((prev) => prev.concat({ id: imageId, url, progress: 0 }));

    const updateProgress = (progress: number) => {
      setUncompressedImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, progress } : img))
      );
    };

    let fileData;
    if (file) {
      const compressedFile = await handleImageCompress(file, updateProgress);
      const compressedUrl = await getBase64(compressedFile);
      const arrBuffer = await compressedFile.arrayBuffer();
      const buffer = Buffer.from(arrBuffer);
      fileData = {
        url: compressedUrl,
        file: buffer,
        name: file?.name ?? Date.now(),
        contentType: file?.type,
      };
    } else {
      const converted = base64ToArrayBuffer(url);
      const compressedFile = await handleImageCompress(converted.blobFile);
      const compressedUrl = await getBase64(compressedFile);
      const arrBuffer = await compressedFile.arrayBuffer();
      const buffer = Buffer.from(arrBuffer);
      fileData = {
        url: compressedUrl,
        file: buffer,
        name: compressedFile?.name ?? Date.now(),
        contentType: compressedFile?.type,
      };
    }

    setUncompressedImages((prev) => prev.filter((img) => img.id !== imageId));
    setCapturedImages((prev) => prev.concat({ id: prev.length + 1, ...fileData }));
    setLoading(false);
  };

  // Close camera when file limit reached
  useEffect(() => {
    if (capturedImages.length >= FILE_LIMIT) {
      setOpenCamera(false);
    }
  }, [capturedImages]);

  const startOcrScan = () => {
    setOcrError(null);
    setStep("processing");
    ocr.read(capturedImages);
  };

  const submitJournal = () => {
    if (!userEnrollment?.session?.id || !ocr.data) return;

    const sessionId = userEnrollment.session.id;
    const journalRequestType = getJournalRequestType(popupType);
    const actionRequestType = getActionRequestType(popupType);
    const ocrImages = ocr.images.map((img) => ({
      file: img.file,
      name: img.name,
      contentType: img.contentType,
    }));

    if (journalRequestType) {
      dispatch(
        createUserjournal({
          journalRequestType,
          sessionId,
          journal: ocr.data as Record<string, unknown>,
          images: ocrImages,
        })
      );
      setSubmitting(true);
    } else if (actionRequestType) {
      const actionId =
        popupType === journalTypes.gratitudeAction
          ? actions.current?.daily?.data?.id
          : actions.current?.weekly?.data?.id;
      if (!actionId) return;
      dispatch(
        createUserActionLog({
          actionRequestType,
          actionId,
          sessionId,
          actionLog: ocr.data as Record<string, unknown>,
          images: ocrImages,
        })
      );
      setSubmitting(true);
    }
  };

  if (!journalPopupObj.show || !popupType) return null;

  return (
    <Modal open={journalPopupObj.show} onClose={journalPopupObj.close}>
      <section
        className={cn(
          "bg-bkg-light relative mx-auto flex h-screen w-screen flex-col overflow-auto rounded sm:h-auto sm:max-h-[95vh]",
          {
            "justify-center gap-8 px-8 py-[60px] sm:h-[692px] sm:w-[620px] sm:p-8": step === "info",
            "gap-8 p-8 sm:w-[730px]": step === "capture",
            "items-center justify-center gap-6 p-8 sm:w-[500px]": step === "processing",
            "gap-6 p-8 sm:w-[620px]": step === "review",
            "items-center gap-8 p-8 sm:w-[500px]": step === "success",
          }
        )}
      >
        {/* Close Button */}
        {step !== "processing" && (
          <button
            type="button"
            aria-label="Close journal popup"
            className="absolute top-2 right-2 z-20 cursor-pointer p-6"
            onClick={journalPopupObj.close}
          >
            <i className="gng-close text-[18px]" aria-hidden="true" />
          </button>
        )}

        {/* ─── INFO STEP ─── */}
        {step === "info" && (
          <>
            <div className="flex h-full w-full flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <i
                  className={cn(`gng-${popupContents?.icon} p-[4px] text-[32px]`, {
                    "text-primary": popupType === journalTypes.morningJournal,
                    "text-action-secondary": popupType === journalTypes.eveningJournal,
                    "text-primary-500": popupType === journalTypes.gratitudeAction,
                  })}
                />
                <Heading variant={headingVariants.cardHeading} sx="!font-bold">
                  {popupContents?.heading}
                </Heading>
              </div>
              <div className="border-border-light flex w-full border-t" />
              <div className="flex flex-col gap-2.5">
                <Paragraph
                  variant={paragraphVariants.titleXlg}
                  content={popupData?.subHeading?.toLowerCase()}
                  sx="!font-bold capitalize"
                />
                <Paragraph content={popupData?.description} />
              </div>
            </div>

            <div className="flex h-max flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Image src={icons.streak} className="h-[25px] w-auto" />
                  <Paragraph
                    isHtml
                    content={`<span>${popupData?.streak > 0 ? popupData?.streak.toString().padStart(2, "0") : 0}<span/> Days Streak`}
                    variant={paragraphVariants.regular}
                    sx="[&>span]:!font-bold"
                  />
                </div>
                {popupData?.isCompleted ? (
                  <div className="flex gap-2.5">
                    <i className="gng-complete-circle text-action-secondary text-[25px]" />
                    <Paragraph content={"Completed"} variant={paragraphVariants.regular} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Quick Capture Button */}
                    {popupType !== journalTypes.weeklyChallenge && (
                      <ActionButton
                        label="Quick Capture"
                        buttonActionType={buttonActionTypes.text}
                        onClick={() => setStep("capture")}
                        icon="camera-filled"
                        sx="[&>p]:!font-bold flex-row-reverse w-max"
                      />
                    )}
                    {/* Write Now Button */}
                    <ActionButton
                      label="Write Now"
                      buttonActionType={buttonActionTypes.text}
                      onClick={() => {
                        popupAction?.();
                        journalPopupObj.close();
                      }}
                      disabled={!popupAction}
                      icon="long-arrow-right-circle"
                      sx="[&>p]:!font-bold flex-row-reverse w-max"
                    />
                  </div>
                )}
              </div>

              {!popupData?.isCompleted && (
                <div className="border-border-light flex gap-2.5 border-t pt-[15px]">
                  <Image src={icons.point} className="h-[25px] w-auto" />
                  <Paragraph
                    isHtml
                    content={`Complete & Earn <span>${popupData?.points} Pts<span/>`}
                    variant={paragraphVariants.regular}
                    sx="[&>span]:!font-bold"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── CAPTURE STEP ─── */}
        {step === "capture" && (
          <>
            {openCamera && capturedImages.length < FILE_LIMIT && windowWidth! > 450 ? (
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
                <button
                  type="button"
                  aria-label="Close camera"
                  className="absolute top-4 right-4 cursor-pointer"
                  onClick={() => setOpenCamera(false)}
                >
                  <i className="gng-close text-content-light text-[18px]" />
                </button>
                {capturedImages.length > 0 && (
                  <div className="grid h-max grid-cols-2 gap-2.5 pt-12">
                    {capturedImages.map((imgObj, index) => (
                      <ImageViewer
                        key={index}
                        id={imgObj.id!}
                        image={imgObj.url!}
                        onDelete={(id) => {
                          setCapturedImages(capturedImages.filter((img) => img.id !== id));
                        }}
                        sx="h-[100px] w-auto"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2.5">
                  <Heading variant={headingVariants.cardHeading} sx="font-bold">
                    Scan Your Journal
                  </Heading>
                  <Paragraph
                    content="Take a photo of your journal page or upload an image. For best results, ensure photos are sharp and well-lit."
                    variant={paragraphVariants.regular}
                    sx="text-content-dark-secondary"
                  />
                </div>

                {ocrError && (
                  <div className="bg-danger/10 border-danger/30 flex items-start gap-2.5 rounded-lg border p-3">
                    <i className="gng-alert text-danger mt-0.5 text-lg" />
                    <Paragraph
                      content={ocrError}
                      variant={paragraphVariants.regular}
                      sx="text-danger"
                    />
                  </div>
                )}

                <div
                  className="relative h-[270px] w-full shrink-0 overflow-hidden rounded md:shrink"
                  onDrop={handleDrop}
                  onDragOver={preventDefaultHandler}
                  onDragEnter={preventDefaultHandler}
                  onDragLeave={preventDefaultHandler}
                >
                  <div className="grid h-full w-full grid-cols-4 gap-2.5 md:flex">
                    {capturedImages.map((imgObj, index) => (
                      <ImageViewer
                        key={index}
                        id={imgObj.id!}
                        image={imgObj.url!}
                        onDelete={(id) => {
                          setCapturedImages(capturedImages.filter((img) => img.id !== id));
                        }}
                        sx="w-full md:max-w-[210px] h-[100px] md:h-full"
                      />
                    ))}
                    {loading ? (
                      <>
                        {uncompressedImages.map((img, index) => (
                          <div
                            key={index}
                            className="relative flex h-[100px] max-h-[270px] w-full max-w-[250px] gap-2.5 overflow-hidden rounded md:h-full md:max-w-[210px]"
                          >
                            <Image src={img.url} className="h-auto w-full object-cover" />
                            <div className="bg-bkg-dark/70 absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center gap-1">
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
                        {capturedImages.length < FILE_LIMIT && (
                          <FileInput
                            isMultiple
                            limit={FILE_LIMIT}
                            isOpenCamera={openCamera}
                            onFileInputClose={() => setOpenCamera(false)}
                            onFileInput={(url, file) => {
                              if (file) {
                                handleFileInput(url!, file, Date.now());
                              }
                            }}
                          >
                            <div
                              className={cn(
                                "border-border-light flex w-[210px] flex-col justify-center gap-5 rounded border-[4px] border-dashed p-2.5 md:h-full",
                                {
                                  "h-[100px] w-full md:h-full md:w-[210px]":
                                    capturedImages.length > 0 && windowWidth! < 768,
                                }
                              )}
                            >
                              <div
                                className={cn(
                                  "border-border-light mx-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full",
                                  {
                                    "md:size-[70px] md:border":
                                      capturedImages.length > 0 && windowWidth! <= 450,
                                    "size-[70px] border":
                                      capturedImages.length === 0 || windowWidth! > 450,
                                  }
                                )}
                              >
                                <i className="gng-add-thin text-content-dark text-center text-[25px]" />
                              </div>
                              <div
                                className={cn("flex flex-col gap-1", {
                                  "hidden md:flex": capturedImages.length > 0 && windowWidth! < 768,
                                })}
                              >
                                <Paragraph
                                  content={`Add ${capturedImages.length > 0 ? "Another" : "First"} Page`}
                                  variant={paragraphVariants.regular}
                                  sx="text-center"
                                />
                                <Paragraph
                                  content={
                                    capturedImages.length > 0
                                      ? "Only if your entry is more than one page"
                                      : "The starting page of your entry"
                                  }
                                  variant={paragraphVariants.regular}
                                  sx="text-content-dark-secondary text-center"
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
              <div className="border-border-light flex justify-between gap-2.5 border-t pt-5">
                <div className="flex gap-2.5">
                  <ActionButton
                    label="Back"
                    buttonActionType={buttonActionTypes.text}
                    onClick={() => {
                      setStep("info");
                      setCapturedImages([]);
                      setUncompressedImages([]);
                      setOpenCamera(false);
                      setOcrError(null);
                    }}
                    sx="w-max"
                  />
                  {!openCamera && (
                    <ActionButton
                      label="Take Photo"
                      onClick={() => setOpenCamera(!openCamera)}
                      icon="camera-filled"
                      disabled={capturedImages.length >= FILE_LIMIT}
                      sx={cn("w-max [&>p,&>i]:text-content-light", {
                        "hover:bg-gray-700 bg-gray-900": capturedImages.length < FILE_LIMIT,
                        "bg-gray-400": capturedImages.length >= FILE_LIMIT,
                      })}
                    />
                  )}
                </div>
                {capturedImages.length > 0 && !openCamera && (
                  <ActionButton label="Scan" onClick={startOcrScan} disabled={loading} sx="w-max" />
                )}
                {openCamera && windowWidth! > 450 && (
                  <button
                    type="button"
                    aria-label="Capture photo"
                    className="bg-bkg-light mx-auto flex size-[60px] cursor-pointer items-center justify-center rounded-full"
                    onClick={captureHandler}
                  >
                    <div className="bg-bkg-light border-dark-pure flex size-[54px] rounded-full border-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── PROCESSING STEP ─── */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-6 py-12">
            <Spinner sx="h-12 w-12" />
            <div className="flex flex-col items-center gap-2">
              <Heading variant={headingVariants.cardHeading} sx="!font-bold text-center">
                Scanning Your Journal
              </Heading>
              <Paragraph
                content="Extracting text from your journal entry..."
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary text-center"
              />
            </div>
          </div>
        )}

        {/* ─── REVIEW STEP ─── */}
        {step === "review" && ocr.data && (
          <>
            <div className="flex flex-col gap-2.5">
              <i
                className={cn(`gng-${popupContents?.icon} p-[4px] text-[32px]`, {
                  "text-primary": popupType === journalTypes.morningJournal,
                  "text-action-secondary": popupType === journalTypes.eveningJournal,
                  "text-primary-500": popupType === journalTypes.gratitudeAction,
                })}
              />
              <Heading variant={headingVariants.cardHeading} sx="!font-bold">
                Review Your {popupContents?.heading}
              </Heading>
              <Paragraph
                content="Here's what we extracted from your journal. Review the content and submit when ready."
                variant={paragraphVariants.regular}
                sx="text-content-dark-secondary"
              />
            </div>

            <div className="border-border-light flex w-full border-t" />

            <div className="flex max-h-[400px] flex-col gap-4 overflow-y-auto">
              {renderReviewFields(popupType, ocr.data)}
            </div>

            <div className="border-border-light flex justify-between gap-2.5 border-t pt-5">
              <ActionButton
                label="Retake"
                buttonActionType={buttonActionTypes.text}
                onClick={() => {
                  setCapturedImages([]);
                  setUncompressedImages([]);
                  ocr.reset();
                  setStep("capture");
                }}
                sx="w-max"
              />
              <ActionButton
                label="Submit"
                onClick={submitJournal}
                disabled={submitting}
                icon="arrow-right"
                sx="[&>p]:!font-bold flex-row-reverse w-max"
              />
            </div>
          </>
        )}

        {/* ─── SUCCESS STEP ─── */}
        {step === "success" && (
          <>
            <ReactConfetti
              className="h-full w-full"
              run={showConfetti}
              recycle={false}
              gravity={0.3}
              width={500}
              height={450}
              numberOfPieces={200}
              tweenDuration={1000}
              onConfettiComplete={() => setShowConfetti(false)}
            />
            <div className="relative mx-auto w-max">
              <i
                className={cn(`gng-${popupContents?.icon} p-2.5 text-[80px]`, {
                  "text-primary": popupType === journalTypes.morningJournal,
                  "text-action-secondary": popupType === journalTypes.eveningJournal,
                  "text-primary-500": popupType === journalTypes.gratitudeAction,
                })}
              />
              <div className="bg-bkg-light absolute right-[0] -bottom-2.5 flex h-[45px] w-[45px] items-center justify-center rounded-full">
                <i className="gng-complete-circle text-action-secondary text-[30px]" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Heading variant={headingVariants.cardHeading} sx="!font-bold text-center">
                {popupContents?.successHeading ?? "Great Job!"}
              </Heading>
              <Paragraph
                content={
                  popupContents?.successDescription ?? "Your journal entry has been submitted."
                }
                sx="text-center"
              />
            </div>

            {getSuccessPoints(popupType, currentBook) > 0 && (
              <Paragraph
                content={`+${getSuccessPoints(popupType, currentBook)} pts`}
                variant={paragraphVariants.titleXlg}
                sx="!font-bold text-center text-action-secondary lowercase"
              />
            )}

            <Image src={images.congratsAvatar} className="h-auto max-h-[225px] w-full" />

            <div className="flex w-full gap-5">
              <ActionButton
                label="Close"
                onClick={journalPopupObj.close}
                sx="bg-transparent border border-action"
              />
              <ActionButton
                label="See Progress"
                onClick={() => {
                  router.push(`/${currentBook?.slug}?section=progress`);
                  journalPopupObj.close();
                }}
              />
            </div>
          </>
        )}
      </section>
    </Modal>
  );
};

export default JournalPopup;

// ─── Helpers ────────────────────────────────────────────

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
        "relative flex h-full max-h-[270px] w-full max-w-[250px] gap-2.5 overflow-hidden rounded",
        sx
      )}
    >
      <button
        type="button"
        aria-label="Remove image"
        onClick={() => onDelete(id)}
        className="!bg-dark-900/60 absolute top-2 right-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded"
      >
        <i className="gng-trash text-danger text-body" />
      </button>
      <Image src={image} className="h-auto w-full object-cover" />
    </div>
  );
};

const getOcrErrorMessage = (err: any): string => {
  if (typeof err === "string") return err;
  if (err?.error === "no-data") {
    return "Could not extract text from the image. Please try again with a clearer photo.";
  }
  if (err?.error === "file-too-large") {
    return "Image file is too large. Please use a smaller image.";
  }
  return "Something went wrong while scanning. Please try again.";
};

const getContent = (popupType: string) => {
  if (popupType === journalTypes.morningJournal) {
    return {
      icon: "morning",
      heading: "Morning Journal",
      successHeading: "Great Start for the Day!",
      successDescription: "You've completed your Morning Journal.",
      points: null,
    };
  } else if (popupType === journalTypes.eveningJournal) {
    return {
      icon: "evening",
      heading: "Evening Journal",
      successHeading: "Nice Job!",
      successDescription: "You've completed your Evening Journal.",
      points: null,
    };
  } else if (popupType === journalTypes.gratitudeAction) {
    return {
      icon: "action",
      heading: "Daily Gratitude Action",
      successHeading: "Awesome Work!",
      successDescription: "You've completed your Daily Gratitude Action.",
      points: null,
    };
  } else if (popupType === journalTypes.weeklyReflection) {
    return {
      icon: "weekly",
      heading: "Weekly Reflection",
      successHeading: "Congratulations!",
      successDescription: "You've completed your Weekly Reflection.",
      points: null,
    };
  } else return null;
};

const getSuccessPoints = (
  popupType: string | undefined,
  currentBook?: {
    dailyJournalPoints: number;
    weeklyJournalPoints: number;
    dailyActionPoints: number;
    weeklyActionPoints: number;
  } | null
) => {
  if (!popupType || !currentBook) return 0;
  if (popupType === journalTypes.morningJournal || popupType === journalTypes.eveningJournal) {
    return currentBook.dailyJournalPoints ?? 0;
  }
  if (popupType === journalTypes.gratitudeAction) {
    return currentBook.dailyActionPoints ?? 0;
  }
  if (popupType === journalTypes.weeklyReflection) {
    return currentBook.weeklyJournalPoints ?? 0;
  }
  return 0;
};

const getJournalRequestType = (editorType: string | undefined) => {
  if (editorType === journalTypes.morningJournal) return journalRequestTypes.createMorningJournal;
  if (editorType === journalTypes.eveningJournal) return journalRequestTypes.createEveningJournal;
  if (editorType === journalTypes.weeklyReflection) return journalRequestTypes.createWeeklyJournal;
  return "";
};

const getActionRequestType = (editorType: string | undefined) => {
  if (editorType === journalTypes.gratitudeAction) return actionRequestTypes.completeDailyAction;
  return "";
};

const renderReviewFields = (popupType: string | undefined, data: EditorData) => {
  if (!popupType) return null;

  const fields: { label: string; value: string | number | null | undefined }[] = [];

  if (popupType === journalTypes.morningJournal) {
    const d = data as MorningJournalData;
    if (d.moodScore) fields.push({ label: "Mood Score", value: `${d.moodScore}/10` });
    if (d.capturedEssence) fields.push({ label: "Dream Essence", value: d.capturedEssence });
    if (d.moodContribution) fields.push({ label: "Mood Contribution", value: d.moodContribution });
    if (d.mantra) fields.push({ label: "Mantra", value: d.mantra });
    if (d.affirmations?.length)
      fields.push({ label: "Affirmations", value: d.affirmations.join(", ") });
    if (d.gratitudes?.length) fields.push({ label: "Gratitudes", value: d.gratitudes.join(", ") });
    if (d.excitements?.length)
      fields.push({ label: "Excitements", value: d.excitements.join(", ") });
  } else if (popupType === journalTypes.eveningJournal) {
    const d = data as EveningJournalData;
    if (d.moodScore) fields.push({ label: "Mood Score", value: `${d.moodScore}/10` });
    if (d.insight) fields.push({ label: "Insight", value: d.insight });
    if (d.insightImpact) fields.push({ label: "Insight Impact", value: d.insightImpact });
    if (d.success) fields.push({ label: "Success", value: d.success });
    if (d.changes) fields.push({ label: "Changes", value: d.changes });
    if (d.freeflow) fields.push({ label: "Freeflow", value: d.freeflow });
  } else if (popupType === journalTypes.weeklyReflection) {
    const d = data as WeeklyJournalData;
    if (d.wins) fields.push({ label: "Wins", value: d.wins });
    if (d.challenges) fields.push({ label: "Challenges", value: d.challenges });
    if (d.lessons) fields.push({ label: "Lessons", value: d.lessons });
  } else if (popupType === journalTypes.gratitudeAction) {
    const d = data as DailyChallengeData;
    if (d.note) fields.push({ label: "Note", value: d.note });
    if (d.reflection) fields.push({ label: "Reflection", value: d.reflection });
    if (d.obstacles) fields.push({ label: "Obstacles", value: d.obstacles });
  }

  if (fields.length === 0) {
    return (
      <Paragraph
        content="No content was extracted. Please try scanning again with a clearer photo."
        variant={paragraphVariants.regular}
        sx="text-content-dark-secondary py-4"
      />
    );
  }

  return fields.map((field, index) => (
    <div key={index} className="flex flex-col gap-1">
      <Paragraph
        content={field.label}
        variant={paragraphVariants.regular}
        sx="!font-bold text-content-dark"
      />
      <Paragraph
        content={String(field.value ?? "")}
        variant={paragraphVariants.regular}
        sx="text-content-dark-secondary"
      />
    </div>
  ));
};
