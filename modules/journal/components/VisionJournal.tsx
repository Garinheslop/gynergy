import { useSession } from "@contexts/UseSession";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Image from "@modules/common/components/Image";
import TextAreaWithHeading from "@modules/common/components/TextAreaWithHeading";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import {
  discoveryInputData,
  highestSelfInputData,
  visionInputData,
} from "@resources/data/input/visions";
import { pagePaths } from "@resources/paths";
import { pageTypes } from "@resources/types/page";
import {
  visionCreedKeys,
  visionDiscoveryKeys,
  visionHighestSelfKeys,
  VisionMantra,
  visionMantraKeys,
  visionTypes,
} from "@resources/types/vision";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setEditorDataStates } from "@store/modules/editor";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const VisionJournal = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentBook = useSelector((state) => state.books.current);
  const currentHistories = useSelector((state) => state.histories.current);
  const { bookSession } = useSession();

  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    if (currentHistories.entryType === visionTypes.highestSelf) {
      setFields(Object.keys(highestSelfInputData) as (keyof typeof highestSelfInputData)[]);
    } else if (currentHistories.entryType === visionTypes.discovery) {
      setFields(Object.keys(discoveryInputData) as (keyof typeof discoveryInputData)[]);
    } else if (currentHistories.entryType === visionTypes.mantra) {
      setFields(["mantra"]);
    } else if (currentHistories.entryType === visionTypes.creed) {
      setFields(["creed"]);
    }
  }, [currentHistories]);

  return (
    <section className="flex flex-col gap-[30px] sm:p-[30px] rounded-[20px] bg-bkg-light w-full">
      <div className="flex items-center sm:items-start justify-between flex-col sm:flex-row gap-[10px]">
        <Heading variant={headingVariants.heading} sx={cn("!font-bold")}>
          {getHeaderData(currentHistories?.entryType!)}
        </Heading>
        {!bookSession.isCompleted && (
          <ActionButton
            label="Edit"
            icon="edit-underline"
            onClick={() => {
              dispatch(
                setEditorDataStates({
                  data: currentHistories,
                  type: currentHistories?.entryType,
                })
              );
              router.push(`/${currentBook?.slug}/${pagePaths.journalEditor}`);
            }}
            sx={cn("sm:w-max w-full")}
          />
        )}
      </div>
      <div className="w-full border-b border-border-light" />
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
                  <Image
                    path={(currentHistories as any)[field]}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ) : (
                <Paragraph
                  content={
                    (currentHistories as any)[field]
                      ? (currentHistories as any)[field]
                      : "No input yet"
                  }
                  sx={cn("whitespace-pre-line", {
                    "text-content-light-secondary": !(currentHistories as any)[field],
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default VisionJournal;

const getHeaderData = (type: string) => {
  if (type === visionTypes.highestSelf) {
    return "Your Highest Self";
  } else if (type === visionTypes.mantra) {
    return "Your Mantra";
  } else if (type === visionTypes.creed) {
    return "Your Creed";
  } else if (type === visionTypes.discovery) {
    return "Self Discovery";
  }
};
