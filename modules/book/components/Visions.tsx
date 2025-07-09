import { cn } from "@lib/utils/style";
import Card from "@modules/common/components/Card";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { pagePaths } from "@resources/paths";
import { visionTypes, UserVision } from "@resources/types/vision";
import { journalTypes } from "@resources/types/journal";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setEditorDataStates } from "@store/modules/editor";
import { getUserVisions } from "@store/modules/vision";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ActionButton from "@modules/common/components/ActionButton";
import { setHistoryCurrentStates } from "@store/modules/history";
import { buttonActionTypes } from "@resources/types/button";
import {
  discoveryInputData,
  highestSelfInputData,
  visionInputData,
} from "@resources/data/input/visions";
import Image from "@modules/common/components/Image";

const Visions = ({ isStatic = false }: { isStatic?: boolean }) => {
  const router = useRouter();
  const currentBook = useSelector((state) => state.books.current);
  const currentEnrollment = useSelector((state) => state.enrollments.current);
  const visions = useSelector((state) => state.visions);

  const dispatch = useDispatch();

  const [visionsCards, setVisionsCard] = useState<
    {
      title: string;
      visionType?: string;
      value?: UserVision;
    }[]
  >([
    {
      title: "Your Highest Self",
    },
    {
      title: "Your Mantra",
    },
    {
      title: "Your Creed",
    },
    {
      title: "Your Highest Discovery",
    },
  ]);

  const visionCardClickHandler = (value: UserVision, visionType: string) => {
    const visionData = visions.data.find((vision) => vision.visionType === visionType);
    dispatch(
      setEditorDataStates({
        data: visionData ?? null,
        type: visionType,
      })
    );
    router.push(`/${currentBook?.slug}/${pagePaths.journalEditor}`);
  };
  useEffect(() => {
    setVisionsCard([
      {
        title: "Your Highest Self",
        visionType: visionTypes.highestSelf,
        value: visions.data.find((vision) => vision.visionType === visionTypes.highestSelf),
      },
      {
        title: "Your Mantra",
        visionType: visionTypes.mantra,
        value: visions.data.find((vision) => vision.visionType === visionTypes.mantra),
      },
      {
        title: "Your Creed",
        visionType: visionTypes.creed,
        value: visions.data.find((vision) => vision.visionType === visionTypes.creed),
      },
      {
        title: "Your Self Discovery",
        visionType: visionTypes.discovery,
        value: visions.data.find((vision) => vision.visionType === visionTypes.discovery),
      },
    ]);
  }, [visions.data]);

  useEffect(() => {
    if (currentEnrollment?.session?.id && !visions.fetched && !visions.loading) {
      dispatch(getUserVisions(currentEnrollment?.session?.id));
    }
  }, [currentEnrollment]);

  if (isStatic && visions.data.length > 0) {
    if (visionsCards.filter((visionsCard) => visionsCard?.value?.isCompleted).length > 0) {
      return (
        <div className="flex flex-col gap-[10px] w-full">
          {visionsCards
            .filter(
              (visionsCard) =>
                visionsCard?.value?.isCompleted &&
                visionsCard?.value?.visionType === visionTypes.mantra
            )
            .map((visionsCard, index) => (
              <UserVisionData
                key={index}
                title={visionsCard.title}
                isStaticAccordion={visionsCard.visionType === visionTypes.mantra}
                userVision={visionsCard.value!}
              />
            ))}
          {visionsCards
            .filter(
              (visionsCard) =>
                visionsCard?.value?.isCompleted &&
                visionsCard?.value?.visionType !== visionTypes.mantra
            )
            .map((visionsCard, index) => (
              <UserVisionData
                key={index}
                title={visionsCard.title}
                isStaticAccordion={visionsCard.visionType === visionTypes.mantra}
                userVision={visionsCard.value!}
              />
            ))}
        </div>
      );
    }
  } else if (
    !isStatic &&
    visionsCards.filter((visionsCard) => visionsCard?.value?.isCompleted).length < 4
  ) {
    return (
      <section className="flex flex-col items-center gap-[30px]">
        <Heading variant={headingVariants.sectionHeading} sx="text-center !font-bold">
          Set Your Vision
        </Heading>
        <Paragraph
          content={
            "Complete these foundational tasks to set the tone for your journal experience. Visualize your highest potential, craft your mantra, define your creed, and embark on self-discovery. Start building the life you aspire to today!"
          }
          variant={paragraphVariants.regular}
          sx="text-center max-w-[800px]"
        />
        <div className="flex flex-col gap-[10px] w-full">
          {visionsCards
            .filter((visionsCard) => !visionsCard?.value?.isCompleted)
            .map((visionsCard, index) => (
              <Card
                key={index}
                title={visionsCard.title}
                isLoading={visions.loading}
                actionBtn={
                  !visionsCard?.value?.isCompleted
                    ? {
                        label: "Write Now",
                        icon: "long-arrow-right-circle",
                        action: () =>
                          visionCardClickHandler(visionsCard.value!, visionsCard.visionType!),
                      }
                    : undefined
                }
                onClick={
                  visionsCard?.value?.isCompleted
                    ? () => visionCardClickHandler(visionsCard.value!, visionsCard.visionType!)
                    : undefined
                }
                icon={{
                  class: visionsCard?.value?.isCompleted
                    ? "complete-circle !text-action-secondary"
                    : "alert-circle !text-primary",
                  label: visionsCard?.value?.isCompleted ? "Completed" : "Not Completed",
                }}
                sx={cn("rounded", {
                  "bg-grey-50 [&>div>div>h3]:!text-content-dark-secondary":
                    visionsCard?.value?.isCompleted,
                })}
              />
            ))}
        </div>
      </section>
    );
  } else return null;
};

const UserVisionData = ({
  title,
  userVision,
  isStaticAccordion = false,
}: {
  title: string;
  userVision: UserVision;
  isStaticAccordion?: boolean;
}) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const currentBook = useSelector((state) => state.books.current);

  const contentRef = useRef<HTMLDivElement>(null);
  const [isClamped, setClamped] = useState(false);

  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    if (userVision) {
      if (userVision.visionType === visionTypes.highestSelf) {
        setFields(Object.keys(highestSelfInputData) as (keyof typeof highestSelfInputData)[]);
      } else if (userVision.visionType === visionTypes.discovery) {
        setFields(Object.keys(discoveryInputData) as (keyof typeof discoveryInputData)[]);
      } else if (userVision.visionType === visionTypes.mantra) {
        setFields(["mantra"]);
      } else if (userVision.visionType === visionTypes.creed) {
        setFields(["creed"]);
      }
    }
  }, [userVision]);

  useEffect(() => {
    if (contentRef && contentRef?.current) {
      setClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [contentRef, userVision]);

  return (
    <Card
      title={title}
      isAccordion
      isStatic={isStaticAccordion}
      primaryActionIconBtn={{
        icon: "edit-underline",
        action: () => {
          dispatch(
            setEditorDataStates({
              data: userVision,
              type: userVision.visionType,
            })
          );
          router.push(`/${currentBook?.slug}/${pagePaths.journalEditor}`);
        },
      }}
    >
      {userVision?.visionType === visionTypes.mantra ? (
        <div className="flex flex-col">
          <Paragraph
            ref={contentRef}
            content={userVision?.mantra}
            variant={paragraphVariants.regular}
            sx="whitespace-pre-line line-clamp-15"
          />
          {isClamped && (
            <ActionButton
              label="Read More"
              onClick={() => {
                dispatch(
                  setHistoryCurrentStates({
                    ...userVision,
                    isVisionJournal: true,
                    entryType: userVision.visionType,
                  })
                );
                router.push(`/${currentBook?.slug}/${pagePaths.journalView}`);
              }}
              buttonActionType={buttonActionTypes.text}
              sx="[&>P]:text-[#326FCF] hover:bg-transparent hover:px-0 hover:[&>p]:text-action-secondary [&>p]:duration-150"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {fields.map((field, index) => {
            return (
              <div key={index} className="flex flex-col gap-[10px]">
                <Heading variant={headingVariants.title} sx="!font-bold">
                  {visionInputData[field].heading}
                </Heading>
                {field === "symbols" ? (
                  <div
                    className={
                      "relative rounded max-w-[250px] max-h-[270px] flex gap-[10px] overflow-hidden w-full"
                    }
                  >
                    {userVision[field] ? (
                      <Image
                        path={(userVision as any)[field]}
                        className="h-auto w-full object-cover"
                      />
                    ) : (
                      <Paragraph
                        content={
                          (userVision as any)[field] ? (userVision as any)[field] : "No input yet"
                        }
                        sx={cn("whitespace-pre-line", {
                          "text-content-light-secondary": !(userVision as any)[field],
                        })}
                      />
                    )}
                  </div>
                ) : (
                  <Paragraph
                    content={
                      (userVision as any)[field] ? (userVision as any)[field] : "No input yet"
                    }
                    sx={cn("whitespace-pre-line", {
                      "text-content-light-secondary": !(userVision as any)[field],
                    })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default Visions;
