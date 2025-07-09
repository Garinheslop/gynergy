import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BookSessionData } from "@resources/types/book";
import { User, UserStats } from "@resources/types/profile";

const dayZeroBookData = {
  milestones: [
    {
      id: "f1effcf4-3e68-47e3-9ef1-680569f67865",
      bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
      order: 1,
      name: "Base Camp",
      startPoint: 0,
      endPoint: 100,
      createdAt: "2025-03-06 07:15:04.661338+00",
    },
    {
      id: "a84ebba9-da22-4242-828e-61180faf1703",
      bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
      order: 2,
      name: "Camp 1",
      startPoint: 101,
      endPoint: 300,
      createdAt: "2025-03-06 07:15:24.870601+00",
    },
    {
      id: "acfd4fb7-baa4-4041-a553-b3238ecdaf35",
      bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
      order: 3,
      name: "Camp 2",
      startPoint: 301,
      endPoint: 600,
      createdAt: "2025-03-06 07:15:42.287849+00",
    },
    {
      id: "6ec04abf-32c9-4ea5-83b3-dbf891393e27",
      bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
      order: 4,
      name: "Camp 3",
      startPoint: 601,
      endPoint: 1000,
      createdAt: "2025-03-06 07:16:11.498348+00",
    },
    {
      id: "dec86780-7118-4c6b-b93e-c91dd9ba7b5b",
      bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
      order: 5,
      name: "Peak",
      startPoint: 1001,
      endPoint: null,
      createdAt: "2025-03-06 07:17:02.287184+00",
    },
  ],
  id: "7215727d-cefa-460e-a5a0-478ec1002d08",
  adminId: "9e9534df-be8b-4496-af67-d24ca0e674a0",
  slug: "date-zero-gratitude",
  name: "The Date Zero Gratitude",
  shortName: "Date Zero",
  heading: null,
  description:
    "<p>Dear Friend,<p/><p>We are Garin and Yesi, and we are thrilled to welcome you to the DATE ZERO Gratitude Journal.Over the past few years, we have dedicated our lives to developing routines and practices thathave helped us navigate through challenging times and build a mindset and rituals that allow usto thrive in any environment.<p/><p>This journal is the culmination of our research, real-life testing, and personal experiences. Itrepresents our commitment to helping you cultivate gratitude, deepen your self-awareness, andtransform your perspective on life.<p/><p>Date Zero is not just a journal; it is the foundation upon which you will build a more resilient andfulfilling life. Think of this journal as planting a seed. Through daily practices, reflections, andactions, you will nurture this seed, allowing it to grow and flourish. This journey will prepareyou for future growth, as we continue to develop additional journals and courses to support yourongoing transformation.<p/><p>To make this experience even more personal and connected, we have included a QR code below. Byscanning it, you can learn more about our journey, the principles behind this journal, and additionalresources that can support your growth.<p/><p>Thank you for allowing us to be a part of your journey. We are excited to see the incredible impactthis journal will have on your life. With gratitude, Garin & Yesi<p/>",
  messageHeading: "<h3>Your Date Zero Journey Has Started! 🎉</h3>",
  messageDescription:
    "<p>DEAR FRIEND,</p><p>Welcome to a journey like no other! Here at THE GYNERGY EFFECT, we believe in not just dreaming about your highest potential, but actively working towards it every single day. To make this journey engaging and motivating, we’ve introduced two exciting paths: Climbing the Mountain of Growth and Rock Climbing of Engagement. These systems transform your personal growth journey into an adventurous climb, where you can track your progress, earn rewards, and share your successes.</p>",
  cover: "books/7215727d-cefa-460e-a5a0-478ec1002d08/cover/the-day-zero.jpg",
  farewell:
    "<p>Dear Gynerger,</p><p>Congratulations on completing this significant chapter in your journey of self-discovery and transformation! Finishing this journal is a testament to your commitment, dedication, and determination to create a life of purpose and fulfillment. You’ve taken important steps toward becoming your highest self, and for that, we celebrate you.</p><p>As you reflect on your journey, remember that this is just the beginning. The insights and habits you’ve developed here are the foundation for continued growth, and we’re honored to have been a part of your progress.</p>",
  durationDays: 45,
  dailyJournalPoints: 5,
  weeklyJournalPoints: 10,
  dailyActionPoints: 10,
  weeklyActionPoints: 70,
  createdAt: "2025-03-05T10:06:56.401381+00:00",
  updatedAt: "2025-03-05T10:06:56.401381+00:00",
  // latestSession: {
  //   id: "3ae42bc9-1f98-4aa3-8304-6bb75844bfd0",
  //   bookId: "7215727d-cefa-460e-a5a0-478ec1002d08",
  //   durationDays: 14,
  //   startDate: "2025-03-01T08:01:09.575028+00:00",
  //   endDate: "2025-03-15T08:01:09.575028+00:00",
  //   createdAt: "2025-03-05T10:06:56.401381+00:00",
  //   updatedAt: "2025-03-05T10:06:56.401381+00:00",
  // },
};

interface bookData {
  latestSession?: BookSessionData;
  id: string;
  adminId: string;
  slug: string;
  name: string;
  shortName: string;
  heading: string;
  description: string;
  messageHeading: string;
  messageDescription: string;
  farewell: string;
  cover: string;
  durationDays: number;
  dailyJournalPoints: number;
  weeklyJournalPoints: number;
  dailyActionPoints: number;
  weeklyActionPoints: number;
  createdAt: string;
  updatedAt: string;
  milestones: any[];
}
interface bookState {
  current: bookData | null;
  lastFetched: number;
  hideMessage: boolean;
  fetched: boolean;
  loading: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}

const initialState: bookState = {
  current: null,
  hideMessage: false,
  lastFetched: 0,
  fetched: false,
  loading: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "books",
  initialState,
  reducers: {
    bookRequested: (state) => {
      state.loading = true;
    },
    bookRequestFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.updating = false;
    },
    bookSessionFetched: (state, action) => {
      state.current = action.payload.book;
      state.lastFetched = new Date().getTime();
      state.loading = false;
    },
  },
});

export default slice;
