import { useRouter } from "next/navigation";

import Paragraph from "@modules/common/components/typography/Paragraph";
import { pagePaths } from "@resources/paths";
import { UserVision, visionTypes } from "@resources/types/vision";
import { paragraphVariants } from "@resources/variants";
import { RootState } from "@store/configureStore";
import { useDispatch, useSelector } from "@store/hooks";
import { setEditorDataStates } from "@store/modules/editor";
import { setHistoryCurrentStates } from "@store/modules/history";
import { setJournalCurrentStates } from "@store/modules/journal";

const VisionCards: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentBook = useSelector((state) => state.books.current);
  const visions = useSelector((state) => state.visions);
  const cards = Object.values(visionTypes);

  return (
    <>
      {cards.map((card) => (
        <VisionCard
          key={card}
          visions={visions.data}
          cardType={card}
          onCardClick={(data) => {
            if (data) {
              dispatch(
                setHistoryCurrentStates({
                  ...data,
                  isVisionJournal: true,
                  entryType: data.visionType,
                })
              );
              router.push(`/${currentBook?.slug}/${pagePaths.journalView}`);
            } else {
              dispatch(
                setEditorDataStates({
                  data: null,
                  type: card,
                })
              );
              router.push(`/${currentBook?.slug}/${pagePaths.journalEditor}`);
            }
          }}
        />
      ))}
    </>
  );
};

export default VisionCards;

type VisionCardProps = {
  visions: UserVision[];
  cardType: string;
  onCardClick: (data: UserVision) => void;
};
const VisionCard: React.FC<VisionCardProps> = ({ visions, cardType, onCardClick }) => {
  let heading;
  const visionExists = visions.find((vision) => vision.visionType === cardType);
  if (cardType === visionTypes.highestSelf) heading = "Your Highest Self";
  if (cardType === visionTypes.mantra) heading = "Your Mantra";
  if (cardType === visionTypes.creed) heading = "Your Creed";
  if (cardType === visionTypes.discovery) heading = "Self Discovery";

  return (
    <div
      className="bg-purple-light flex min-h-[178px] cursor-pointer flex-col gap-5 rounded p-5 shadow-2xs"
      onClick={() => onCardClick && onCardClick(visionExists!)}
    >
      <Paragraph variant={paragraphVariants.title} content={heading} sx="!font-bold" />
      {visionExists?.isCompleted && (
        <div className="flex items-center gap-[5px]">
          <i className="gng-complete-circle text-purple p-[3px] text-[25px]" />
          <Paragraph variant={paragraphVariants.regular} content="Completed" sx="text-purple" />
        </div>
      )}
    </div>
  );
};
