import { cn } from "@lib/utils/style";
import Image from "@modules/common/components/Image";
import Loader from "@modules/common/components/Loader";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { fontIcons } from "@resources/icons";
import { ActionLogData } from "@resources/types/action";
import { historyRequestTypes, historyTypes } from "@resources/types/history";
import {
  EveningJournalData,
  journalEntryTypes,
  journalTypes,
  MorningJournalData,
} from "@resources/types/journal";
import { loaderTypes } from "@resources/types/loader";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserDailyHistory } from "@store/modules/history";
import { useEffect, useState } from "react";
import MeditationCard from "./card/MeditationCard";
import dayjs from "dayjs";
import images from "@resources/images";

const DailyJournal = ({ day }: { day: number }) => {
  const dispatch = useDispatch();
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const histories = useSelector((state) => state.histories);
  const meditations = useSelector((state) => state.meditations);

  const [morningData, setMorningData] = useState<(MorningJournalData & { entries: any[] }) | null>(
    null
  );
  const [eveningData, setEveningData] = useState<(EveningJournalData & { entries: any[] }) | null>(
    null
  );
  const [actionData, setActionData] = useState<(ActionLogData & { action: any }) | null>(null);

  useEffect(() => {
    setMorningData(
      histories.current.entries.find(
        (journal) => journal?.journalType === journalTypes.morningJournal
      )
    );
    setEveningData(
      histories.current.entries.find(
        (journal) => journal?.journalType === journalTypes.eveningJournal
      )
    );
    setActionData(
      histories.current.entries.find(
        (journal) => journal?.actionType === journalTypes.gratitudeAction
      )
    );
  }, [histories.current]);
  useEffect(() => {
    if (histories.current?.entryDate && !histories.loading && userEnrollment?.session?.id) {
      dispatch(
        getUserDailyHistory({
          sessionId: userEnrollment?.session.id,
          historyType: historyTypes.daily,
          entryDate: histories.current.entryDate,
          historyRequestType: historyRequestTypes.userDailyHistory,
        })
      );
    }
  }, [histories.current?.entryDate, userEnrollment]);

  return (
    <>
      {(morningData || histories.loading) && (
        <section className="flex flex-col gap-[20px] md:p-[30px] rounded-[20px] bg-bkg-light">
          <Header type={journalTypes.morningJournal} />

          <div className="w-full border-b border-border-light" />

          {histories.loading ? (
            <Loader type={loaderTypes.spinner} sx={"h-[500px]"} />
          ) : (
            <div className="flex flex-col gap-5">
              <Question
                heading="Did You Dream?"
                isCompleted={morningData?.capturedEssence ? true : false}
                description={morningData?.capturedEssence!}
              />
              <MoodScore
                score={morningData?.moodScore!}
                contributions={morningData?.moodContribution!}
              />
              <div className={cn("flex flex-col gap-[10px]")}>
                <Heading variant={headingVariants.cardHeading} sx="!font-bold">
                  Positive Affirmations
                </Heading>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-[20px] lg:gap-[40px]">
                  <Entries
                    entryType={journalEntryTypes.affirmation}
                    entries={
                      morningData?.entries.find(
                        (entry) => entry.entryType === journalEntryTypes.affirmation
                      )?.content
                    }
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px]">
                    <Entries
                      entryType={journalEntryTypes.gratitude}
                      heading="I Am Grateful For:"
                      entries={
                        morningData?.entries.find(
                          (entry) => entry.entryType === journalEntryTypes.gratitude
                        )?.content
                      }
                      sx="w-full"
                    />
                    <Entries
                      entryType={journalEntryTypes.excitement}
                      heading="I Am Excited About:"
                      entries={
                        morningData?.entries.find(
                          (entry) => entry.entryType === journalEntryTypes.excitement
                        )?.content
                      }
                      sx="w-full"
                    />
                  </div>
                </div>
              </div>
              <TextInputs heading="My Mantra" description={morningData?.mantra!} />
            </div>
          )}
        </section>
      )}
      {(eveningData || histories.loading) && (
        <section className="flex flex-col gap-[20px] md:p-[30px] rounded-[20px] bg-bkg-light">
          <Header type={journalTypes.eveningJournal} />

          <div className="w-full border-b border-border-light" />
          {histories.loading ? (
            <Loader type={loaderTypes.spinner} sx={"h-[500px]"} />
          ) : (
            <div className="flex flex-col gap-5">
              <MoodScore score={eveningData?.moodScore!} />
              <TextInputs
                heading="Thought of the Day"
                description={eveningData?.insight!}
                subDescription={eveningData?.insightImpact!}
              />
              <TextInputs heading="What Went Well" description={eveningData?.success!} />
              <TextInputs heading="Changes for Tomorrow" description={eveningData?.changes!} />

              <div className="flex flex-col gap-[10px]">
                <Heading variant={headingVariants.title} sx="!font-bold">
                  Free Flow
                </Heading>
                {eveningData?.freeflow && eveningData?.freeflow?.startsWith("drawings") ? (
                  <Image
                    path={eveningData.freeflow}
                    className="h-auto w-[210px] rounded object-cover"
                    onErrorImage={images.placeholders.image}
                  />
                ) : (
                  <Paragraph content={eveningData?.freeflow!} sx="text-content-dark-secondary" />
                )}
              </div>
              <div className={cn("flex flex-col gap-[10px]")}>
                <Heading variant={headingVariants.cardHeading} sx="!font-bold">
                  Dream Magic
                </Heading>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-[20px] lg:gap-[40px]">
                  <Entries
                    entryType={journalEntryTypes.dreammagic}
                    entries={
                      eveningData?.entries.find(
                        (entry) => entry.entryType === journalEntryTypes.dreammagic
                      )?.content
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      {(actionData || histories.loading) && (
        <section className="flex flex-col gap-[20px] md:p-[30px] rounded-[20px] bg-bkg-light">
          <Header type={journalTypes.gratitudeAction} />

          <div className="w-full border-b border-border-light" />
          {histories.loading ? (
            <Loader type={loaderTypes.spinner} sx={"h-[500px]"} />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-[10px]">
                <Paragraph
                  content={`“ ${actionData?.action?.title?.charAt(0).toUpperCase() + actionData?.action?.title?.toLowerCase().slice(1)} ”`}
                  variant={paragraphVariants.titleLg}
                  sx="!font-bold first-letter:capitalize"
                />
                {actionData?.action?.tip && (
                  <Paragraph
                    content={actionData.action.tip.toLowerCase()}
                    sx="text-content-dark-secondary first-letter:capitalize"
                  />
                )}
              </div>

              {actionData?.note && (
                <Paragraph
                  content={actionData?.note}
                  sx="text-content-dark-secondary whitespace-pre-line"
                />
              )}

              {actionData?.draw && (
                <Image path={actionData.draw} className="h-auto w-[210px] rounded object-cover" />
              )}
              <Question
                heading="Did you complete today’s daily gratitude action?"
                isCompleted={actionData?.isCompleted!}
                description={actionData?.obstacles! ?? actionData?.reflection!}
              />
            </div>
          )}
        </section>
      )}
      {meditations.fetched && day > 14 && day < 22 && (
        <MeditationCard
          day={day}
          isStatic
          reflection={
            meditations.data.find((meditation) =>
              dayjs(histories.current.entryDate).startOf("d").isSame(meditation.entryDate, "d")
            )?.reflection
          }
        />
      )}
    </>
  );
};

export default DailyJournal;

const getHeaderData = (journalType: string) => {
  if (journalType === journalTypes.morningJournal) {
    return "Morning Journal";
  } else if (journalType === journalTypes.eveningJournal) {
    return "Evening Journal";
  } else if (journalType === journalTypes.gratitudeAction) {
    return "Daily Gratitude Action";
  }
};

const Header = ({ type }: { type: string }) => {
  return (
    <div className="flex items-center sm:items-start sm:flex-col gap-[10px]">
      <i
        className={cn(`text-[32px] py-[4px]`, {
          "gng-morning text-primary": type === journalTypes.morningJournal,
          "gng-evening text-action-secondary": type === journalTypes.eveningJournal,
          "gng-action text-primary-500": type === journalTypes.gratitudeAction,
        })}
      />
      <Heading variant={headingVariants.titleLg} sx={cn("!font-bold")}>
        {getHeaderData(type)}
      </Heading>
    </div>
  );
};

const Question = ({
  heading,
  isCompleted,
  description,
}: {
  heading: string;
  description: string;
  isCompleted: boolean;
}) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <Heading variant={headingVariants.title} sx="!font-bold">
        {heading}
      </Heading>
      <div
        className={cn(
          "h-[57px] w-[73px] flex justify-center items-center rounded border border-border-light bg-action"
        )}
      >
        <Paragraph content={isCompleted ? "Yes" : "No"} />
      </div>
      <Paragraph content={description!} sx="text-content-dark-secondary" />
    </div>
  );
};

const TextInputs = ({
  heading,
  description,
  subDescription,
}: {
  heading: string;
  description: string;
  subDescription?: string;
}) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <Heading variant={headingVariants.title} sx="!font-bold">
        {heading}
      </Heading>
      <Paragraph content={description!} sx="text-content-dark-secondary" />
      {subDescription && <Paragraph content={subDescription!} sx="text-content-dark-secondary" />}
    </div>
  );
};

const MoodScore = ({ score, contributions }: { score: number; contributions?: string }) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <Heading variant={headingVariants.title} sx="!font-bold">
        Mood Tracker:
      </Heading>
      <div className="flex">
        {Object.values(fontIcons.emoji).map((iconName, index) => (
          <>
            {score === index + 1 && (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-center h-[60px] rounded-full duration-300 shrink-0 text-action-secondary w-[60px] bg-action-50"
                )}
              >
                <i className={`gng-${iconName} text-[30px] duration-150 text-action-secondary`} />
              </div>
            )}
          </>
        ))}
      </div>
      {contributions && <Paragraph content={contributions!} sx="text-content-dark-secondary" />}
    </div>
  );
};

const Entries = ({
  heading,
  entries,
  entryType,
  sx,
}: {
  heading?: string;
  entries?: string[] | null;
  entryType: string;
  sx?: string;
}) => {
  return (
    <div className={cn("flex flex-col gap-[10px]", sx)}>
      {heading && <Paragraph content={heading} sx="!font-bold text-content-dark-secondary" />}
      <div className="flex flex-col gap-[10px]">
        {entries &&
          entries.map((entry, index) => (
            <div key={index} className="flex items-start lg:items-center gap-[10px]">
              <Paragraph
                content={entryType === journalEntryTypes.affirmation ? "I am" : `${index + 1}.`}
                sx={cn("text-content-dark-secondary min-w-[15px] shrink-0", {
                  "!font-bold": entryType === journalEntryTypes.affirmation,
                })}
              />
              <Paragraph
                content={entry}
                sx={cn("text-content-dark-secondary min-w-[15px]", {
                  "underline lg:max-w-[450px] lg:truncate lg:shrink-0":
                    entryType === journalEntryTypes.affirmation,
                  "underline sm:max-w-[200px] sm:truncate sm:shrink-0":
                    entryType === journalEntryTypes.excitement ||
                    entryType === journalEntryTypes.gratitude,
                })}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
