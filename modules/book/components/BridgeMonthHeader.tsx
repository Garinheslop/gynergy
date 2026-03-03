import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { JourneyPhaseKey } from "@resources/types/book";
import { headingVariants, paragraphVariants } from "@resources/variants";

interface BridgeMonthHeaderProps {
  phase: JourneyPhaseKey;
  dayInJourney: number;
}

const PHASE_CONTENT: Record<
  "bridge_integration" | "bridge_choose_path",
  { title: string; description: string }
> = {
  bridge_integration: {
    title: "Bridge Month: Integration",
    description:
      "The core challenge is complete. This is your lighter practice phase — morning journal only. Lock in the habit. Day 66 is the science-backed milestone where habits become automatic.",
  },
  bridge_choose_path: {
    title: "Bridge Month: Choose Your Path",
    description:
      "You've passed the Day 66 habit milestone. Your practice is now automatic. It's time to choose your next chapter.",
  },
};

const BridgeMonthHeader = ({ phase, dayInJourney }: BridgeMonthHeaderProps) => {
  const content = PHASE_CONTENT[phase as "bridge_integration" | "bridge_choose_path"];
  if (!content) return null;

  const totalDays = 75;
  const progressPercent = Math.min(Math.round((dayInJourney / totalDays) * 100), 100);

  return (
    <section className="bg-bkg-light rounded-large mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-5 md:p-[50px]">
      <div className="flex items-center justify-between gap-4">
        <Heading variant={headingVariants.title} sx="!font-bold">
          {content.title}
        </Heading>
        <span className="text-action-600 text-sm font-semibold whitespace-nowrap">
          Day {dayInJourney} of {totalDays}
        </span>
      </div>

      <div className="bg-border-light h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-action-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <Paragraph
        content={content.description}
        variant={paragraphVariants.regular}
        sx="text-content-dark-secondary"
      />
    </section>
  );
};

export default BridgeMonthHeader;
