import Card from "@modules/common/components/Card";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { pagePaths } from "@resources/paths";
import { visionTypes, UserVision } from "@resources/types/vision";
import { paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setEditorDataStates } from "@store/modules/editor";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Journals from "./Journals";
import Visions from "./Visions";
import Growth from "../../growth/components/Growth";
import Leaderboard from "@modules/leaderboard/components/Leaderboard";
import dayjs from "dayjs";
import BookCompletion from "./BookCompletion";
import useCheckEnrollmentSession from "../hooks/useCheckEnrollmentSession";
import { useSession } from "@contexts/UseSession";
import { setHideBookMessageState } from "@store/modules/global/states";
import Mantra from "./Mantra";

const JournalDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const growthSectionRef = useRef<HTMLDivElement>(null);

  const globalStates = useSelector((state) => state.global);
  const currentBook = useSelector((state) => state.books.current);

  const searchParams = useSearchParams().get("section");

  const { bookSession } = useSession();

  useEffect(() => {
    if (searchParams === "progress") {
      setTimeout(() => {
        if (growthSectionRef?.current) {
          growthSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "start",
          });
        }
      }, 500);
      router.push(`${window.location.origin}/${window.location.pathname}`);
    }
  }, [searchParams]);

  const setSiteDatahandler = () => {
    dispatch(setHideBookMessageState());
  };

  return (
    <section className="flex flex-col gap-[60px]">
      {bookSession.isCompleted && <BookCompletion latestSession={bookSession.latest} />}
      <Visions isStatic />
      {!globalStates.states.hideBookMessage && (
        <Card
          isHtml
          title={currentBook?.messageHeading}
          primaryActionIconBtn={{
            icon: "close-circled",
            action: () => setSiteDatahandler(),
          }}
          sx="bg-action-100"
        >
          <Paragraph
            isHtml
            content={currentBook?.messageDescription}
            variant={paragraphVariants.regular}
            sx="flex flex-col gap-[10px]"
          />
        </Card>
      )}
      <Visions />
      <Journals />
      <Growth ref={growthSectionRef} />
      <Leaderboard />
    </section>
  );
};

export default JournalDashboard;
