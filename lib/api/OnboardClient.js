//firebase
import { functions } from "@configs/firebase";
import { httpsCallable } from "firebase/functions";
//utils

export const checkClientUniqueness = async (clientName, clientType) => {
  try {
    const checkClientAtomicity = httpsCallable(functions, "checkClientAtomicity");
    const res = await checkClientAtomicity({
      clientName,
      clientType,
    });
    if (res?.data) return res.data;
  } catch (err) {
    return { error: err };
  }
};

export const addOnboardClient = async (
  clientName,
  clientType,
  amountPerMonth,
  image,
  imagePath,
  isExistingClient,
  anonymity
) => {
  try {
    const addOnboardClient = httpsCallable(functions, "addOnboardClient");
    const res = await addOnboardClient({
      clientName,
      clientType,
      amountPerMonth,
      image,
      imagePath,
      isExistingClient,
      anonymity,
    });
    if (res?.data) return res.data;
  } catch (err) {
    return { error: err };
  }
};
