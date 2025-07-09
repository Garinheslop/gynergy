//firebase
//redux
import { successReducerTypes } from "@store/resources/reducerActionTypes";

//reason input
//toast redux actions
import { triggerToast } from "@store/modules/global/toast";
//types
import { toastSpecificationTypes, toastTypes } from "@resources/types/toast";
import { errorTypes } from "@resources/types/error";
import { generalErrorMessages } from "@resources/messages";

//toast
export const dispatchSuccessToasts = (dispatch, onSuccess, payload) => {
  let toastSpecificationType = toastSpecificationTypes.success;
  if (onSuccess === successReducerTypes.userRemoved) {
    return;
  }
};
export const dispatchErrorToasts = (dispatch, onError, payload) => {
  let toastSpecificationType = toastSpecificationTypes.error;
  if (payload?.code === errorTypes.networkError)
    dispatch(
      triggerToast({
        toastData: "",
        toastType: toastTypes.networkError,
        toastSpecificationType,
        toastHeading: generalErrorMessages.serverError,
        toastDescription: generalErrorMessages.contactAdminstration,
        toastPosition: "",
        profileType: "",
      })
    );
  else if (payload?.response?.status === 429)
    dispatch(
      triggerToast({
        toastData: payload?.response?.data,
        toastType: toastTypes.tooManyRequest,
        toastSpecificationType,
        toastPosition: "",
        profileType: "",
      })
    );
};
