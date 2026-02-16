import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import { fontIcons } from "@resources/icons";
import { headingVariants } from "@resources/variants";

interface MoodTrackerProps {
  value?: number;
  onClick: (field: "moodScore", value: number) => void;
}

const MOOD_OPTIONS: { iconName: string; label: string; value: number }[] = [
  { iconName: fontIcons.emoji.smileFull, label: "Very Happy", value: 1 },
  { iconName: fontIcons.emoji.smile, label: "Happy", value: 2 },
  { iconName: fontIcons.emoji.face, label: "Neutral", value: 3 },
  { iconName: fontIcons.emoji.sad, label: "Sad", value: 4 },
  { iconName: fontIcons.emoji.sadFull, label: "Very Sad", value: 5 },
];

const MoodTracker: React.FC<MoodTrackerProps> = ({ value, onClick }) => {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend>
        <Heading variant={headingVariants.title} sx="!font-bold">
          Mood Tracker:
        </Heading>
      </legend>
      <div className="flex">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <label
              key={option.iconName}
              className={cn(
                "hover:[&>i]:text-action-secondary focus-within:ring-action flex h-[60px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full duration-300 focus-within:ring-2",
                {
                  "[&>i]:text-action-secondary bg-action-50 w-[60px]": isSelected,
                }
              )}
            >
              <input
                type="radio"
                name="mood-score"
                value={option.value}
                checked={isSelected}
                onChange={() => onClick("moodScore", option.value)}
                className="sr-only"
              />
              <i
                className={`gng-${option.iconName} text-grey-400 text-[30px] duration-150`}
                aria-hidden="true"
              />
              <span className="sr-only">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default MoodTracker;
