export const quotesRequestTypes = {
  dailyQuote: "daily-quote",
};

export interface QuotetData {
  id: string;
  bookId: string;

  day: number;

  content: string;
  author: string;

  createdAt: string;
}
