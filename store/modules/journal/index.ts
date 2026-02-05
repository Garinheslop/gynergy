import * as urls from "../../configs/urls";
import journals from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { journalRequestTypes } from "@resources/types/journal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const {
  journalRequested,
  journalCreationRequested,
  journalUpdateRequested: _journalUpdateRequested,
  journalRequestFailed,
  journalFetched,
  userJournalsFetched: _userJournalsFetched,
  journalCreated,
  journalUpdated: _journalUpdated,
} = journals.actions;
export const { setJournalCurrentStates } = journals.actions;

export default journals.reducer;

export const getUserJournals = (sessionId: string) =>
  apiCallBegan({
    url: `${urls.journals}/${journalRequestTypes.userDailyJournals}?sessionId=${sessionId}`,
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: journalRequested.type,
    onSuccess: journalFetched.type,
    onError: journalRequestFailed.type,
  });

export const createUserjournal = ({
  sessionId,
  journal,
  images,
  journalRequestType,
}: {
  sessionId: string;
  journal: Record<string, unknown>;
  images: Record<string, unknown>[];
  journalRequestType: string;
}) =>
  apiCallBegan({
    url: `${urls.journals}/${journalRequestType}`,
    data: {
      sessionId,
      journal,
      images,
    },
    method: "POST",
    onStart: journalCreationRequested.type,
    onSuccess: journalCreated.type,
    onError: journalRequestFailed.type,
  });
