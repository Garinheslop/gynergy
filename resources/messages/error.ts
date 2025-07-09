export type JournalErrorMessageType = {
  "affirmation-required": string;
  "gratitudes-required": string;
  "excitements-required": string;
  "plan-required": string;
  already_completed: string;
  "save-error": string;
  "no-book-session": string;
  "invalid-book": string;
};

export const journalErrorMessages: JournalErrorMessageType = {
  ["affirmation-required"]: "Please enter atleasst 5 affirmations.",
  ["gratitudes-required"]: "Please list at least 3 gratitudes.",
  ["excitements-required"]: "Please list at least 3 things you're excited about.",
  ["plan-required"]: "Please write about your tomorrow's plan.",
  ["already_completed"]: "You have already completed this action.",
  ["save-error"]: "Failed to save journal entry. Please try again.",
  ["no-book-session"]: "",
  ["invalid-book"]: "",
};

export const generalErrorMessages = {
  somethingWentWrong: "Something went wrong.",
  largeImage: "Image size is too large.",
  imageRequired: "Image is required.",
  imageUpload: "Something went wrong.",
  dashboardDataFetch: "Something went wrong. Please try again later.",
  formSubmissionFailed: "Something went wrong. Please try again later.",
  imageFileRequired: "Please provide an image file.",
  pleaseTryAgainLater: "Please try again later.",
  contactAdminstration: "Please contact the adminstration.",
  serverError: "Something unexpected happened on our end.",
  alreadyExists: "Already Exists.",
};
