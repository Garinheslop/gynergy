import { profileRequestTypes } from "@resources/types/profile";
import * as urls from "../../configs/urls";
import enrollments from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { AppDispatch } from "@store/configureStore";
import { booksRequestTypes } from "@resources/types/book";
import { visionRequestTypes } from "@resources/types/vision";

const {
  userVisionRequested,
  userVisionUpdateRequested,
  userVisionRequestFailed,
  userVisionFetched,
  userVisionUpdated,
} = enrollments.actions;

export default enrollments.reducer;

export const getUserVisions = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.visions}/${visionRequestTypes.userVisions}?sessionId=${sessionId}`,
    onStart: userVisionRequested.type,
    onSuccess: userVisionFetched.type,
    onError: userVisionRequestFailed.type,
  });

export const updateUserVisions = ({
  sessionId,
  vision,
  images,
  visionRequestType,
}: {
  sessionId: string;
  vision: any;
  images: any;
  visionRequestType: string;
}) =>
  apiCallBegan({
    url: `${urls.visions}/${visionRequestType}`,
    data: {
      sessionId,
      vision,
      images,
    },
    method: "PUT",
    onStart: userVisionUpdateRequested.type,
    onSuccess: userVisionUpdated.type,
    onError: userVisionRequestFailed.type,
  });
