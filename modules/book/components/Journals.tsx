import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { useSession } from "@contexts/UseSession";
import { cn } from "@lib/utils/style";
import Heading from "@modules/common/components/typography/Heading";
import MeditationCard from "@modules/journal/components/card/MeditationCard";
import { pagePaths } from "@resources/paths";
import { journalTypes } from "@resources/types/journal";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { getUserActions, getUserDailyActionLogs } from "@store/modules/action";
import { setEditorDataStates } from "@store/modules/editor";
import { updateUserStreak } from "@store/modules/enrollment";
import { getUserJournals } from "@store/modules/journal";
import { getUserMeditations } from "@store/modules/meditation";
import { getUserVisions } from "@store/modules/vision";

import Highlights from "./Highlights";
import Quote from "./Quote";
import JournalCard from "../../journal/components/card/JournalCard";

const sectionTypes = {
  daily: "daily",
  weekly: "weekly",
};

const Journals = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const userEnrollments = useSelector((state) => state.enrollments);
  const books = useSelector((state) => state.books);
  const journals = useSelector((state) => state.journals);
  const actions = useSelector((state) => state.actions);
  const meditations = useSelector((state) => state.meditations);

  const [dailyJournalCardContents, setDailyJournalCardContents] = useState<any>([]);
  const [weeklyJournalCardContents, setWeeklyJournalCardContents] = useState<any>([]);

  useEffect(() => {
    if (
      userEnrollments.current?.id &&
      !actions.loading &&
      (!actions.current.lastFetched || !dayjs().isSame(new Date(actions.current.lastFetched), "d"))
    ) {
      dispatch(getUserActions(userEnrollments.current.id));
    }
  }, [userEnrollments.current]);

  useEffect(() => {
    if (
      userEnrollments.current?.session?.id &&
      !journals.loading &&
      (!journals.lastFetched || !dayjs().isSame(new Date(journals.lastFetched), "d"))
    ) {
      dispatch(getUserJournals(userEnrollments.current?.session.id));
    }
  }, [userEnrollments.current]);
  useEffect(() => {
    if (
      userEnrollments.current?.session?.id &&
      !actions.loading &&
      (!actions.lastFetched || !dayjs().isSame(new Date(actions.lastFetched), "d"))
    ) {
      dispatch(getUserDailyActionLogs(userEnrollments.current?.session.id));
    }
  }, [userEnrollments.current]);

  useEffect(() => {
    const { daysLeft, hoursLeft } = getTimeLeftInWeeklyCycle(
      userEnrollments.current?.enrollmentDate
    );
    const isFirstWeekComplete =
      dayjs().diff(dayjs(userEnrollments.current?.enrollmentDate).startOf("d"), "d") >= 7;
    setDailyJournalCardContents([
      {
        data: journals.data.find((journal) => journal.journalType === journalTypes.morningJournal),
        heading: "Morning Journal",
        subHeading: "",
        description: "Best Before 10 AM",
        journalType: journalTypes.morningJournal,
        icon: "morning",
        points: books?.current?.dailyJournalPoints,
        streak: userEnrollments.current?.morningStreak,
      },
      {
        data: journals.data.find((journal) => journal.journalType === journalTypes.eveningJournal),
        heading: "Evening Journal",
        subHeading: "",
        description: "Available after 6 PM",
        journalType: journalTypes.eveningJournal,
        icon: "evening",
        isTimeRestricted: !dayjs().isAfter(
          dayjs().set("hour", 18).set("minute", 0).set("second", 0).set("millisecond", 0)
        ),
        points: books?.current?.dailyJournalPoints,
        streak: userEnrollments.current?.eveningStreak,
      },
      {
        data: actions.data.find((action) => action.actionType === journalTypes.gratitudeAction),
        heading: "Daily Gratitude Action",
        subHeading: actions.current.daily.data?.title,
        description: actions.current.daily.data?.tip,
        journalType: journalTypes.gratitudeAction,
        icon: "action",
        isDisabled: !actions.current.daily.data,
        points: books?.current?.dailyActionPoints,
        streak: userEnrollments.current?.gratitudeStreak,
      },
    ]);
    const weeklyJournalReflection = journals.data.find(
      (journal: any) => journal.journalType === journalTypes.weeklyReflection
    );
    const weeklyJournalAction = actions.data.find(
      (action: any) => action.actionType === journalTypes.weeklyChallenge
    );
    setWeeklyJournalCardContents([
      {
        data: weeklyJournalReflection,
        heading: "Weekly Reflection",
        subHeading: "",
        subDescription: `${weeklyJournalReflection ? "Next" : "This"} Prompt will ${isFirstWeekComplete && !weeklyJournalReflection ? "refresh" : "be available"} in <span>${daysLeft}D ${hoursLeft}HRS</span>`,
        journalType: journalTypes.weeklyReflection,
        points: books.current?.weeklyJournalPoints,
        isDisabled: !actions.current.weekly.data || !isFirstWeekComplete,
        streak: userEnrollments.current?.morningStreak,
      },
      {
        data: weeklyJournalAction,
        heading: "Weekly Challenge",
        subHeading: actions.current.weekly.data?.title,
        description: actions.current.weekly.data?.tip,
        subDescription: `${weeklyJournalAction ? "Next" : "This"} Prompt will ${isFirstWeekComplete && !weeklyJournalAction ? "refresh" : "be available"} in <span>${daysLeft}D ${hoursLeft}HRS</span>`,
        hyperlink: actions.current.weekly.data?.hyperlink,
        journalType: journalTypes.weeklyChallenge,
        points: books.current?.weeklyActionPoints,
        isDisabled: !actions.current.weekly.data || !isFirstWeekComplete || !meditations.fetched,
        streak: userEnrollments.current?.eveningStreak,
      },
    ]);
  }, [userEnrollments.current, journals.data, actions.data, actions.current, meditations.fetched]);

  const journalWriteHandler = (journalType: string) => {
    const journalData =
      journals.data.find((journal) => journal.journalType === journalType) ||
      actions.data.find((action) => action.actionType === journalType);
    dispatch(
      setEditorDataStates({
        data: journalData ?? null,
        action:
          journalType === journalTypes.gratitudeAction
            ? actions.current.daily.data
            : journalType === journalTypes.weeklyChallenge
              ? actions.current.weekly.data
              : null,
        type: journalType,
      })
    );
    router.push(`/${books.current?.slug}/${pagePaths.journalEditor}`);
  };
  return (
    <>
      <Tasks
        heading="Your Tasks Today"
        type={sectionTypes.daily}
        journalCardContents={dailyJournalCardContents}
        onJournalWrite={journalWriteHandler}
        isLoading={
          userEnrollments.loading ||
          journals.loading ||
          actions.loading ||
          userEnrollments?.streak?.loading
        }
      />
      {dayjs().diff(dayjs(userEnrollments.current?.enrollmentDate).startOf("d"), "d") + 1 < 50 && (
        <Tasks
          heading="Your Tasks This Week"
          type={sectionTypes.weekly}
          journalCardContents={weeklyJournalCardContents}
          onJournalWrite={journalWriteHandler}
          isLoading={
            userEnrollments?.loading ||
            journals.loading ||
            actions.loading ||
            meditations.loading ||
            userEnrollments?.streak?.loading
          }
        />
      )}
    </>
  );
};

export default Journals;

interface TasksProps {
  heading: string;
  type: string;
  journalCardContents: [];
  onJournalWrite: (journalType: string) => void;
  isLoading: boolean;
}
const Tasks = ({ heading, type, journalCardContents, onJournalWrite, isLoading }: TasksProps) => {
  const { bookSession } = useSession();
  const dispatch = useDispatch();
  const userEnrollment = useSelector((state) => state.enrollments.current);
  const meditations = useSelector((state) => state.meditations);

  useEffect(() => {
    if (userEnrollment?.session?.id && !meditations.loading && !meditations.fetched) {
      dispatch(getUserMeditations(userEnrollment?.session?.id));
    }
  }, [userEnrollment]);

  return (
    <section className="flex flex-col items-center gap-[30px]">
      <Heading variant={headingVariants.sectionHeading} sx="text-center !font-bold">
        {heading}
      </Heading>
      {type === sectionTypes.daily && (
        <div className="xmd:grid-cols-[384px_1fr] xmd:gap-5 grid w-full grid-cols-1 gap-y-5">
          <Highlights />
          <Quote />
        </div>
      )}
      {(type === sectionTypes.weekly || !bookSession.isCompleted) && (
        <div
          className={cn("xmd:grid-cols-[386px_1fr] xmd:gap-5 grid w-full grid-cols-1 gap-y-5", {
            "xmd:grid-cols-2 gap-[20px] lg:grid-cols-3": type === sectionTypes.daily,
          })}
        >
          {journalCardContents.map((content: any, index: number) => (
            <JournalCard
              key={index}
              heading={content.heading}
              subHeading={content.subHeading}
              description={content.description}
              subDescription={content.subDescription}
              hyperlink={content.hyperlink}
              journalType={content.journalType}
              icon={content.icon}
              isDisabled={content?.isDisabled}
              isTimeRestricted={content?.isTimeRestricted}
              points={content.points}
              streak={content.streak}
              onWrite={onJournalWrite}
              isLoading={isLoading}
              isCompleted={content?.data?.id ? true : false}
            />
          ))}
        </div>
      )}
      {type === sectionTypes.daily &&
        dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1 > 14 &&
        dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1 < 22 && (
          <MeditationCard
            day={dayjs().diff(dayjs(userEnrollment?.enrollmentDate).startOf("d"), "d") + 1}
            isCompleted={
              meditations.data?.length
                ? meditations.data?.find((m) =>
                    dayjs().startOf("d").isSame(dayjs(m.entryDate), "d")
                  )
                  ? true
                  : false
                : false
            }
            isLoading={meditations.creating}
          />
        )}
    </section>
  );
};

const getTimeLeftInWeeklyCycle = (enrollmentDate?: string) => {
  if (!enrollmentDate) return { daysLeft: 0, hoursLeft: 0 };
  const cycleDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const now = dayjs();
  const enrollment = dayjs(enrollmentDate);
  const elapsedMs = now.diff(enrollment);
  const remainderMs = cycleDurationMs - (elapsedMs % cycleDurationMs);

  const daysLeft = Math.floor(remainderMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((remainderMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { daysLeft, hoursLeft };
};
