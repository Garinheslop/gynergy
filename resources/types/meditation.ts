export interface UserMeditation {
  id: string;
  userId: string;
  sessionId: string;

  entryDate: string;
  reflection: string;

  createdAt: Date;
  updatedAt: Date;
}

export const meditationRequestTypes = {
  userMeditations: "user-meditations",
  //create
  createUserMeditations: "create-user-meditations",
};
