import * as urls from "../../configs/urls";
import book from "./reducers";
import { apiCallBegan } from "@store/resources/apiActionTypes";
import { booksRequestTypes } from "@resources/types/book";

const { bookRequested, bookRequestFailed, bookSessionFetched } = book.actions;

export default book.reducer;

export const getLatestBookSession = (slug: string) =>
  apiCallBegan({
    url: `${urls.books}/${booksRequestTypes.latestBookSessions}?slug=${slug}`,
    onStart: bookRequested.type,
    onSuccess: bookSessionFetched.type,
    onError: bookRequestFailed.type,
  });
