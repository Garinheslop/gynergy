export const errorTypes = {
  notInvited: "not-invited",
  inviteOnly: "invite-only",
  expiredInvitation: "expired-invitation",
  invalidToken: "invalid-token",
  noUser: "no-user",
  alreadyAdmin: "already-admin",
  alreadyRegistered: "already-registered",
  notRegistered: "not-registered",
  alreadyUser: "already-user",
  alreadyInvited: "already-invited",
  alreadyExists: "already-exists",
  jwtError: "jwt-error",
  expiredJwt: "jwt-expired",
  quizAttemptLimited: "attempt-limited",
  invalidJwtSignature: "invalid-signature",
  emailError: "email-error",
  userBanned: "user-banned",
  userCreationFailed: "user-creation-failed",
  networkError: "ERR_NETWORK",

  noBook: "no-book",
  noBookSession: "no-book-session",
  noSessionEnrollment: "no-session-enrollment",
};

export const serverErrorTypes = {
  serverError: "server-error",
  invalidRequest: "invalid-request",
};
export const journalErrorTypes = {
  invalidJournal: "invalid-journal",
};

export const fileErrorTypes = {
  fileTooLarge: "file-too-large",
};
