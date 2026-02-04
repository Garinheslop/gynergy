import { useEffect, useRef, useState } from "react";

import { useDispatch } from "react-redux";

import { usePopup } from "@contexts/UsePopup";
import { cn } from "@lib/utils/style";
import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { buttonActionTypes } from "@resources/types/button";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useSelector } from "@store/hooks";
import { createUserMeditations } from "@store/modules/meditation";

interface MeditationCardProps {
  day: number;
  isStatic?: boolean;
  isLoading?: boolean;
  isCompleted?: boolean;
  reflection?: string;
}
const MeditationCard: React.FC<MeditationCardProps> = ({
  day,
  isStatic,
  isCompleted,
  isLoading,
  reflection,
}) => {
  const { meditationPopupObj } = usePopup();
  const dispatch = useDispatch();
  const userEnrollment = useSelector((state) => state.enrollments.current);

  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (day === 15) {
      setVideoUrl("https://www.youtube.com/embed/4pLUleLdwY4?si=oE-kqWDI0kyqYpq7");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=4pLUleLdwY4");
    } else if (day === 16) {
      setVideoUrl("https://www.youtube.com/embed/ZToicYcHIOU?si=3sz-dtXNDh40bihO");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=ZToicYcHIOU");
    } else if (day === 17) {
      setVideoUrl("https://www.youtube.com/embed/tybOi4hjZFQ?si=WdSiYIC6ozjjJpmM");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=tybOi4hjZFQ");
    } else if (day === 18) {
      setVideoUrl("https://www.youtube.com/embed/itZMM5gCboo?si=pPHxeKPXvvpmaYqV");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=itZMM5gCboo");
    } else if (day === 19) {
      setVideoUrl("https://www.youtube.com/embed/hktYEf2sWkE?si=oZCX6Qj39KTXxFRK");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=hktYEf2sWkE");
    } else if (day === 20) {
      setVideoUrl("https://www.youtube.com/embed/6p_yaNFSYao?si=oPs1gbGZ0a2SMqtr");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=6p_yaNFSYao");
    } else if (day === 21) {
      setVideoUrl("https://www.youtube.com/embed/inpok4MKVLM?si=hD9KSvUUJzw6OtPA");
      setYoutubeUrl("https://www.youtube.com/watch?app=desktop&v=inpok4MKVLM");
    }
  }, [day]);

  return (
    <div
      className={cn(
        "items-between relative flex flex-col justify-center gap-[20px] rounded bg-[#E5EDFA] p-5 md:p-[30px]",
        { "card-loading grayscale": isLoading }
      )}
    >
      <div className="flex h-full flex-col gap-[20px]">
        <div className={cn("flex flex-col gap-[10px]")}>
          <i className={cn(`gng-meditation text-[25px] text-[#6699FF]`)} />
          <Heading
            variant={headingVariants.cardHeading}
            sx={cn("!font-bold", {
              "text-content-dark-secondary": isCompleted,
            })}
          >
            Day {day} Meditation
          </Heading>
          {!isStatic && (
            <Paragraph
              content={`Your Meditations for Mindful Reflections. Tap the link below to watch today's meditation. Afterward, use the 'Write My Reflection' button to capture your thoughts.`}
              variant={paragraphVariants.regular}
              sx={"text-content-dark-secondary"}
            />
          )}
        </div>
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-white sm:p-[10px]">
          <iframe
            className="h-full w-full rounded-[6px]"
            src={videoUrl}
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
      {!isStatic && (
        <div className="flex w-full items-center gap-[10px] border-t border-[#CADBFD] pt-[15px]">
          <i className="gng-info text-content-dark text-[21px]" />
          <Paragraph
            content={`Complete this meditation as part of this week’s challenge`}
            variant={paragraphVariants.regular}
            sx={"text-content-dark"}
          />
        </div>
      )}
      {!isStatic && (
        <div className="top-[30px] right-[30px] md:absolute">
          {isCompleted ? (
            <div className="flex gap-[10px]">
              <i className="gng-complete-circle text-action-secondary text-[25px]" />
              <Paragraph content={"Completed"} variant={paragraphVariants.regular} />
            </div>
          ) : (
            <ActionButton
              label="Write Reflection"
              buttonActionType={buttonActionTypes.text}
              onClick={() =>
                meditationPopupObj.open({
                  popupData: {
                    video: youtubeUrl,
                    day,
                  },
                  popupAction: (reflection: string) => {
                    dispatch(
                      createUserMeditations({
                        sessionId: userEnrollment?.session?.id!,
                        reflection,
                      })
                    );
                  },
                })
              }
              disabled={isCompleted || isLoading}
              icon="long-arrow-right-circle"
              sx="[&>p]:!font-bold flex-row-reverse w-max"
            />
          )}
        </div>
      )}
      {isStatic && reflection && (
        <>
          <Paragraph
            content={"Reflect on your Meditation"}
            variant={paragraphVariants.title}
            sx="font-bold"
          />
          <Paragraph content={reflection} sx="text-content-dark-secondary" />
        </>
      )}
    </div>
  );
};

export default MeditationCard;
