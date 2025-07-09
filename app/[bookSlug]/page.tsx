import BookDashboardClient from "@modules/book/components/page-client/BookDashboardClient";

const BookDashboard = ({ params: { bookSlug } }: { params: { bookSlug: string } }) => {
  return <BookDashboardClient bookSlug={bookSlug} />;
};

export default BookDashboard;
