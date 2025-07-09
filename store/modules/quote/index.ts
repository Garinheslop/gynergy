import { quotesRequestTypes } from "@resources/types/quote";
import * as urls from "../../configs/urls";
import quotes from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { AppDispatch } from "@store/configureStore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const { quoteRequested, quoteRequestFailed, dailyQuoteFetched } = quotes.actions;

export default quotes.reducer;

export const getUserDailyQuote = (enrollmentId: string) =>
  apiCallBegan({
    url: `${urls.quotes}/${quotesRequestTypes.dailyQuote}?enrollmentId=${enrollmentId}`,
    method: "GET",
    headers: {
      "X-User-Timezone": dayjs.tz.guess(),
    },
    onStart: quoteRequested.type,
    onSuccess: dailyQuoteFetched.type,
    onError: quoteRequestFailed.type,
  });
