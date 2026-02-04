"use client";
import { useEffect } from "react";

import dayjs from "dayjs";

import { useSession } from "@contexts/UseSession";
import Footer from "@modules/common/components/Footer";
import Loader from "@modules/common/components/Loader";
import { loaderTypes } from "@resources/types/loader";
import { useDispatch, useSelector } from "@store/hooks";
import { getLatestBookSession } from "@store/modules/book";

import JournalDashboard from "../JournalDashboard";
import BookOnboarding from "../onboarding/BookOnboarding";

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
      <section className="mx-auto flex max-w-[1253px] flex-col px-4 pt-[100px] md:pt-[130px]">
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
