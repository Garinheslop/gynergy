"use client";
import { RootState } from "@store/configureStore";
import BookOnboarding from "../onboarding/BookOnboarding";
import Loader from "@modules/common/components/Loader";
import { loaderTypes } from "@resources/types/loader";
import { useEffect } from "react";
import { useDispatch, useSelector } from "@store/hooks";
import JournalDashboard from "../JournalDashboard";
import { getLatestBookSession } from "@store/modules/book";
import dayjs from "dayjs";
import { useSession } from "@contexts/UseSession";
import Footer from "@modules/common/components/Footer";

const BookDashboardClient = ({ bookSlug }: { bookSlug: string }) => {
  const { session } = useSession();
  const dispatch = useDispatch();
  const books = useSelector((state) => state.books);
  const enrollments = useSelector((state) => state.enrollments);

  useEffect(() => {
    if (session && bookSlug && !books.loading && dayjs().diff(books.lastFetched, "h") > 1) {
      dispatch(getLatestBookSession(bookSlug));
    }
  }, [session]);

  return (
    <>
      <section className="flex flex-col max-w-[1253px] mx-auto pt-[100px] md:pt-[130px] px-4">
        {(!enrollments.current?.id && enrollments.loading) ||
        (books.loading && (!books.lastFetched || dayjs().diff(books.lastFetched, "h") > 1)) ? (
          <Loader type={loaderTypes.window} />
        ) : (
          <>{!enrollments.current?.id ? <BookOnboarding /> : <JournalDashboard />}</>
        )}
      </section>
      <Footer />
    </>
  );
};

export default BookDashboardClient;
