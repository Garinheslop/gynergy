import { useEffect, useRef } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@contexts/UseSession";
import Card from "@modules/common/components/Card";
import Paragraph from "@modules/common/components/typography/Paragraph";
import Leaderboard from "@modules/leaderboard/components/Leaderboard";
import { paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setHideBookMessageState } from "@store/modules/global/states";

import BookCompletion from "./BookCompletion";
import Journals from "./Journals";
import Visions from "./Visions";
import Growth from "../../growth/components/Growth";

const JournalDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const growthSectionRef = useRef<HTMLDivElement>(null);

  const globalStates = useSelector((state) => state.global);
  const currentBook = useSelector((state) => state.books.current);
  const enrollment = useSelector((state) => state.enrollments.current);
  const isPersonalSession = enrollment?.session?.isPersonal === true;

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
            sx="flex flex-col gap-2.5"
          />
        </Card>
      )}
      <Visions />
      <Journals />
      <Growth ref={growthSectionRef} />
      {isPersonalSession ? (
        <Card
          title="Ready for the Full Experience?"
          sx="bg-gradient-to-r from-action-50 to-purple/10"
        >
          <Paragraph
            content="Join a 45-Day Challenge Cohort for group coaching calls, cohort leaderboard, accountability partners, and the full transformation experience."
            variant={paragraphVariants.regular}
          />
          <a
            href="/"
            className="bg-action-600 hover:bg-action-700 mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Learn About the Challenge
          </a>
        </Card>
      ) : (
        <Leaderboard />
      )}
    </section>
  );
};

export default JournalDashboard;
