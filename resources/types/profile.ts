export interface User {
  id: string;
  supabaseId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
}
export interface UserStats {
  totalPoints: string;
  currentStreak: string;
}
export const profileRequestTypes = {
  userProfile: "user-profile",
  updateUserData: "update-user-data",
};
