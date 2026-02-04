import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import ActionButton from "@modules/common/components/ActionButton";
import Card from "@modules/common/components/Card";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { pagePaths } from "@resources/paths";
import { buttonActionTypes } from "@resources/types/button";
import { visionTypes, VisionMantra, UserVision } from "@resources/types/vision";
import { paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setEditorDataStates } from "@store/modules/editor";
import { setHistoryCurrentStates } from "@store/modules/history";
const Mantra = ({ userVision }: { userVision: UserVision }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const currentBook = useSelector((state) => state.books.current);

  const contentRef = useRef<HTMLDivElement>(null);
  const [isClamped, setClamped] = useState(false);

  useEffect(() => {
    if (contentRef && contentRef?.current) {
      setClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [contentRef]);

  return (
    <Card
      title="Your Mantra"
      isAccordion
      isStatic
      primaryActionIconBtn={{
        icon: "edit-underline",
        action: () => {
          dispatch(
            setEditorDataStates({
              data: userVision,
              type: visionTypes.mantra,
            })
          );
          router.push(`/${currentBook?.slug}/${pagePaths.journalEditor}`);
        },
      }}
    >
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
    </Card>
  );
};

export default Mantra;
