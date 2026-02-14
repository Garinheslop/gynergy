import { cn } from "@lib/utils/style";
import SkeletonWrapper from "@modules/common/components/SkeletonWrapper";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { leaderboardFilterTypes } from "@resources/types/leaderboard";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import { setLeaderboardFilter } from "@store/modules/leaderboard";

import UserCard from "./UserCard";
import UserCardSkeleton from "./UserCardSkeleton";
import useLeaderBoardData from "../hooks/useLeaderBoardData";

const Leaderboard = () => {
  const dispatch = useDispatch();
  const leaderboard = useSelector((state) => state.leaderboard);
  const currentProfile = useSelector((state) => state.profile.current);

  const { scrollEndRef, leaderboardData } = useLeaderBoardData();

  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-[30px]">
      <i className="gng-community text-content py-[10] text-[28px]" />
      <Heading variant={headingVariants.sectionHeading} sx="text-center !font-bold max-w-[700px]">
        {"The Community Growth Leaderboard"}
      </Heading>
      <Paragraph
        content={
          "Track your progress, earn points, and see how you rank through weekly, monthly, and cohort-based challenges. Celebrate growth and stay inspired!"
        }
        variant={paragraphVariants.regular}
        sx="max-w-[850px] text-center"
      />

      <div className="flex w-full flex-col gap-5">
        <div
          className={cn(
            "border-border-light bg-bkg-light mx-auto flex w-full justify-between rounded border p-2.5 sm:w-fit sm:gap-2.5"
          )}
        >
          {Object.values(leaderboardFilterTypes).map((type: string) => {
            let content;
            if (type === leaderboardFilterTypes.daily) content = "Today";
            if (type === leaderboardFilterTypes.weekly) content = "7 Days";
            if (type === leaderboardFilterTypes.monthly) content = "30 Days";
            if (type === leaderboardFilterTypes.session) content = "All Time";
            return (
              <Paragraph
                key={type}
                variant={paragraphVariants.regular}
                content={content}
                sx={cn(
                  "text-content-dark text-center py-3 w-full px-2 sm:px-6 rounded-[10px] cursor-pointer text-nowrap transition-all duration-200",
                  {
                    "text-white bg-grey-900 shadow-md": type === leaderboard.filter,
                    "hover:bg-grey-100": type !== leaderboard.filter && !leaderboard.loading,
                    "text-content-dark/40 [&>p]:text-content-dark/40 cursor-default":
                      leaderboard.loading,
                    "bg-bkg-disabled/60": leaderboard.loading && type === leaderboard.filter,
                  }
                )}
                onClick={() => {
                  if (!leaderboard.loading) {
                    dispatch(setLeaderboardFilter(type));
                  }
                }}
              />
            );
          })}
        </div>

        <div className="rounded-large bg-bkg-light flex w-full flex-col gap-2.5 p-[15px] shadow">
          {leaderboard.loading && !leaderboardData.length ? (
            <SkeletonWrapper renderTimes={10}>
              <UserCardSkeleton />
            </SkeletonWrapper>
          ) : (
            <>
              {/* Current User Rank Card - Always Visible */}
              <div className="relative">
                {leaderboard.current.userRank && leaderboard.current.userRank > 10 && (
                  <div className="bg-action-900/20 border-action-500/30 mb-2 rounded-lg border px-3 py-2 text-center">
                    <span className="text-action-400 text-sm">
                      You&apos;re ranked <strong>#{leaderboard.current.userRank}</strong>
                      {leaderboard.total > 0 && ` of ${leaderboard.total}`}
                      {leaderboard.current.userRank <= 50 && " - Keep going!"}
                      {leaderboard.current.userRank > 50 &&
                        leaderboard.current.userRank <= 100 &&
                        " - You're making progress!"}
                    </span>
                  </div>
                )}
                <UserCard
                  key={"x"}
                  rank={leaderboard.current.userRank!}
                  data={{ ...leaderboard.current, userData: currentProfile }}
                  sx={cn("ring-2 ring-action-500/50", {
                    "grayscale card-loading": leaderboard.current.fetching,
                  })}
                />
              </div>

              {!(leaderboardData.length > 0) ? (
                <Paragraph
                  content={"No data found."}
                  variant={paragraphVariants.regular}
                  sx={"text-center py-[100px]"}
                />
              ) : (
                <>
                  <div className="mt-[22px] hidden items-center rounded p-2 sm:flex sm:px-[15px] sm:py-2.5 [&>p]:text-black">
                    <Paragraph
                      content={"Rank"}
                      variant={paragraphVariants.regular}
                      sx={"!font-bold text-center w-[84px] mr-2 sm:mr-5"}
                    />
                    <div className="grid w-full grid-cols-3">
                      <Paragraph
                        content={"User"}
                        variant={paragraphVariants.regular}
                        sx={"!font-bold w-[100px] sm:w-[200px]"}
                      />{" "}
                      <div className="flex w-full justify-start">
                        <Paragraph
                          content={"Points"}
                          variant={paragraphVariants.regular}
                          sx={"!font-bold text-center"}
                        />
                      </div>
                      <div className="flex w-full justify-end">
                        <Paragraph
                          content={"Date Joined"}
                          variant={paragraphVariants.regular}
                          sx={"!font-bold text-center"}
                        />
                      </div>
                    </div>
                  </div>
                  {leaderboardData.map((user: any, index: number) => (
                    <UserCard
                      key={user?.enrollmentId}
                      rank={index + 1}
                      data={user}
                      sx={cn({
                        "grayscale card-loading": leaderboard.loading && leaderboardData.length,
                      })}
                    />
                  ))}
                </>
              )}
            </>
          )}
          {leaderboard.skip < leaderboard.total && (
            <div ref={scrollEndRef}>
              <UserCardSkeleton />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
