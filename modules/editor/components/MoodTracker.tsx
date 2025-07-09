import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import { fontIcons } from "@resources/icons";
import { headingVariants } from "@resources/variants";

interface MoodTrackerProps {
  value?: number;
  onClick: (field: "moodScore", value: number) => void;
}
const MoodTracker: React.FC<MoodTrackerProps> = ({ value, onClick }) => {
  return (
    <div className="flex flex-col gap-5">
      <Heading variant={headingVariants.title} sx="!font-bold">
        Mood Tracker:
      </Heading>
      <div className="flex">
        {Object.values(fontIcons.emoji).map((iconName, index) => (
          <button
            key={index}
            className={cn(
              "flex items-center justify-center h-[60px] w-[50px] rounded-full cursor-pointer duration-300 shrink-0 hover:[&>i]:text-action-secondary",
              {
                "[&>i]:text-action-secondary w-[60px] bg-action-50": value === index + 1,
              }
            )}
            onClick={() => onClick("moodScore", index + 1)}
          >
            <i className={`gng-${iconName} text-[30px] text-grey-400 duration-150`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
