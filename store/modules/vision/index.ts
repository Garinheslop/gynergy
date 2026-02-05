import * as urls from "../../configs/urls";
import enrollments from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
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
  vision: Record<string, unknown>;
  images: Record<string, unknown>[];
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
