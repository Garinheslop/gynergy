export const leaderboardFilterTypes = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  session: "session",
};

export const leaderboardRequestTypes = {
  leaderboardData: "leaderboard-data",
  userRank: "user-rank",
};

export interface leaderboardUserData {
  userId: string;
  totalPoints: number;
  userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
  };
}
