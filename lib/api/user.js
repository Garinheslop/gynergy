//firebase
import { functions } from "@configs/firebase";
import { httpsCallable } from "firebase/functions";
import { checkRevenueEmailEligibility, checkSubmissionEmailEligibility } from "@lib/utils/number";

export const updateProgramDate = async (userId, joined) => {
  try {
    const updateJoinedDate = httpsCallable(functions, "updateJoinedDate");
    const user = await updateJoinedDate({ joined });
    return true;
  } catch (error) {
    return { error };
  }
};

export const updateAnonymityStatus = async (anonymity, userId) => {
  try {
    const updateAnonymity = httpsCallable(functions, "updateAnonymity");
    const res = await updateAnonymity({
      anonymity,
      userId
    });
    if (res?.data) return res.data;
  } catch (err) {
    return { error: err };
  }
};
