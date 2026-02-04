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
              "hover:[&>i]:text-action-secondary flex h-[60px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full duration-300",
              {
                "[&>i]:text-action-secondary bg-action-50 w-[60px]": value === index + 1,
              }
            )}
            onClick={() => onClick("moodScore", index + 1)}
          >
            <i className={`gng-${iconName} text-grey-400 text-[30px] duration-150`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker;
