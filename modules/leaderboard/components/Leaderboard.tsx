import { cn } from "@lib/utils/style";
import SkeletonWrapper from "@modules/common/components/SkeletonWrapper";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { leaderboardFilterTypes } from "@resources/types/leaderboard";
import { headingVariants, paragraphVariants } from "@resources/variants";
import useLeaderBoardData from "../hooks/useLeaderBoardData";
import UserCard from "./UserCard";
import UserCardSkeleton from "./UserCardSkeleton";
import { useDispatch, useSelector } from "@store/hooks";
import { setLeaderboardFilter } from "@store/modules/leaderboard";

const Leaderboard = () => {
  const dispatch = useDispatch();
  const leaderboard = useSelector((state) => state.leaderboard);
  const currentProfile = useSelector((state) => state.profile.current);

  const { scrollEndRef, leaderboardData } = useLeaderBoardData();

  return (
    <section className="flex flex-col items-center gap-[30px] max-w-[1200px] w-full mx-auto">
      <i className="gng-community text-[28px] py-[10] text-content" />
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

      <div className="flex flex-col gap-5 w-full">
        <div
          className={cn(
            "flex justify-between sm:gap-2.5 p-2.5 border border-border-light rounded bg-bkg-light w-full sm:w-fit mx-auto"
          )}
        >
          {Object.values(leaderboardFilterTypes).map((type: string) => {
            let content;
            if (type === leaderboardFilterTypes.weekly) content = "Last 7 Days";
            if (type === leaderboardFilterTypes.monthly) content = "Last 30 Days";
            if (type === leaderboardFilterTypes.session) content = "Lifetime";
            return (
              <Paragraph
                key={type}
                variant={paragraphVariants.regular}
                content={content}
                sx={cn(
                  "text-content-dark text-center py-3 w-full px-2 sm:px-8 rounded-[10px] cursor-pointer text-nowrap",
                  {
                    "text-white bg-grey-900": type === leaderboard.filter,
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

        <div className="flex flex-col gap-2.5 p-[15px] rounded-large bg-bkg-light shadow w-full">
          {leaderboard.loading && !leaderboardData.length ? (
            <SkeletonWrapper renderTimes={10}>
              <UserCardSkeleton />
            </SkeletonWrapper>
          ) : (
            <>
              <UserCard
                key={"x"}
                rank={leaderboard.current.userRank!}
                data={{ ...leaderboard.current, userData: currentProfile }}
                sx={cn({
                  "grayscale card-loading": leaderboard.current.fetching,
                })}
              />

              {!(leaderboardData.length > 0) ? (
                <Paragraph
                  content={"No data found."}
                  variant={paragraphVariants.regular}
                  sx={"text-center py-[100px]"}
                />
              ) : (
                <>
                  <div className=" items-center p-2 sm:px-[15px] sm:py-2.5 mt-[22px] rounded [&>p]:text-black hidden sm:flex">
                    <Paragraph
                      content={"Rank"}
                      variant={paragraphVariants.regular}
                      sx={"!font-bold text-center w-[84px] mr-2 sm:mr-5"}
                    />
                    <div className="grid grid-cols-3 w-full">
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
