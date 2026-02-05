import * as urls from "../../configs/urls";
import enrollments from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { meditationRequestTypes } from "@resources/types/meditation";
import dayjs from "dayjs";

const {
  userMeditationRequested,
  userMeditationUpdateRequested,
  userMeditationRequestFailed,
  userMeditationFetched,
  userMeditationCreated,
} = enrollments.actions;

export default enrollments.reducer;

export const getUserMeditations = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.meditations}/${meditationRequestTypes.userMeditations}?sessionId=${sessionId}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: userMeditationRequested.type,
    onSuccess: userMeditationFetched.type,
    onError: userMeditationRequestFailed.type,
  });

export const createUserMeditations = ({
  sessionId,
  reflection,
}: {
  sessionId: string;
  reflection: string;
}) =>
  apiCallBegan({
    url: `${urls.meditations}/${meditationRequestTypes.createUserMeditations}`,
    data: {
      sessionId,
      reflection,
    },
    method: "POST",
    onStart: userMeditationUpdateRequested.type,
    onSuccess: userMeditationCreated.type,
    onError: userMeditationRequestFailed.type,
  });
