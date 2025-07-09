import { createSlice } from "@reduxjs/toolkit";
//types
import { toastPositionTypes, toastSpecificationTypes } from "@resources/types/toast";

const slice = createSlice({
  name: "toast",
  initialState: {
    toastData: "",
    toastSpecificationType: "",
    toastType: "",
    toastPosition: toastPositionTypes.bottomLeft,
    toastHeading: "",
    toastDescription: "",
    profileType: "",
    isPersist: false,
    showToast: false,
  },
  reducers: {
    triggerToast: (toast, action) => {
      if (action.payload.toastType) toast.showToast = true;
      toast.toastData = action.payload.toastData;
      toast.toastSpecificationType = action.payload.toastSpecificationType;
      toast.toastType = action.payload.toastType;
      if (action.payload?.toastPosition) toast.toastPosition = action.payload.toastPosition;
      toast.profileType = action.payload.profileType;
      toast.toastHeading = action.payload.toastHeading;
      toast.toastDescription = action.payload.toastDescription;
      if (action.payload.toastSpecificationType === toastSpecificationTypes.error) {
        toast.isPersist = true;
      }
    },
    setToastPosition: (toast, action) => {
      toast.toastPosition = action.payload;
    },
    closeToast: (toast, action) => {
      toast.showToast = false;
    },
  },
});

export const { triggerToast, setToastPosition, closeToast } = slice.actions;
export default slice.reducer;
