import { profileRequestTypes } from "@resources/types/profile";
import * as urls from "../../configs/urls";
import userProfile from "./reducers";
import { apiCallBegan, signOutUser } from "@store/resources/apiActionTypes";
import { AppDispatch } from "@store/configureStore";

const {
  userProfileRequested,
  userProfileFetched,
  userProfileUpdateRequested,
  userProfileRequestFailed,
  userProfileUpdated,
  setCurrentProfileState,
  userRemoved,
} = userProfile.actions;

export default userProfile.reducer;

export const getUserProfile = () =>
  apiCallBegan({
    url: `${urls.users}/${profileRequestTypes.userProfile}`,
    method: "GET",
    onStart: userProfileRequested.type,
    onSuccess: userProfileFetched.type,
    onError: userProfileRequestFailed.type,
  });

export const updateUserProfileData = (data: any) =>
  apiCallBegan({
    url: `${urls.users}/${profileRequestTypes.updateUserData}`,
    data,
    method: "PUT",
    onStart: userProfileUpdateRequested.type,
    onSuccess: userProfileUpdated.type,
    onError: userProfileRequestFailed.type,
  });

export const setCurrentProfile = (payload: any) => {
  return (dispatch: AppDispatch): Promise<void> => {
    dispatch(setCurrentProfileState(payload));
    return Promise.resolve();
  };
};

export const signOutAndReset = () =>
  signOutUser({
    onSuccess: userRemoved.type,
  });
