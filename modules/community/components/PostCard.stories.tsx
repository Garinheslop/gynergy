import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { Provider } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

import { CommunityPost, PostType } from "@resources/types/community";
import UsePopupContextProvider from "@contexts/UsePopup";

import PostCard from "./PostCard";

// Mock Redux store for Storybook
const mockCommunitySlice = createSlice({
  name: "community",
  initialState: {
    expandedComments: [] as string[],
    comments: {} as Record<string, never[]>,
    commentsLoading: {} as Record<string, boolean>,
  },
  reducers: {
    toggleExpandComments: (state, action) => {
      const postId = action.payload;
      if (state.expandedComments.includes(postId)) {
        state.expandedComments = state.expandedComments.filter((id) => id !== postId);
      } else {
        state.expandedComments.push(postId);
      }
    },
  },
});

const mockProfileSlice = createSlice({
  name: "profile",
  initialState: {
    current: {
      id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      profileImage: null,
    },
  },
  reducers: {},
});

const createMockStore = (initialState = {}) =>
  configureStore({
    reducer: {
      community: mockCommunitySlice.reducer,
      profile: mockProfileSlice.reducer,
    },
    preloadedState: initialState,
  });

// Mock post data
const createMockPost = (overrides: Partial<CommunityPost> = {}): CommunityPost => ({
  id: "post-1",
  userId: "user-2",
  cohortId: "cohort-1",
  postType: "win" as PostType,
  title: "Completed my morning routine!",
  content:
    "Day 15 of the challenge and I finally nailed my morning routine. Woke up at 6am, meditated for 20 minutes, and journaled about my intentions for the day. Feeling energized and focused!",
  visibility: "cohort",
  isPinned: false,
  isFeatured: false,
  reactionCount: 12,
  commentCount: 3,
  shareCount: 2,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  updatedAt: new Date().toISOString(),
  author: {
    id: "user-2",
    firstName: "Sarah",
    lastName: "Chen",
    profileImage: null,
  },
  userReaction: null,
  mediaUrls: [],
  ...overrides,
});

const meta = {
  title: "Community/PostCard",
  component: PostCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Post card component for the community feed. Displays user posts with reactions, comments, and share functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    post: {
      description: "The post data object",
    },
    onReact: {
      description: "Callback when user reacts to the post",
    },
  },
  args: {
    onReact: fn(),
  },
  decorators: [
    (Story) => (
      <Provider store={createMockStore()}>
        <UsePopupContextProvider>
          <div className="max-w-[600px]">
            <Story />
          </div>
        </UsePopupContextProvider>
      </Provider>
    ),
  ],
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Win Post
export const WinPost: Story = {
  args: {
    post: createMockPost({
      postType: "win",
      title: "Completed my morning routine!",
      content:
        "Day 15 of the challenge and I finally nailed my morning routine. Woke up at 6am, meditated for 20 minutes, and journaled about my intentions for the day.",
    }),
  },
};

// Reflection Post
export const ReflectionPost: Story = {
  args: {
    post: createMockPost({
      postType: "reflection",
      title: null,
      content:
        "Today I realized how much my mindset has shifted since starting this journey. The small daily practices are compounding into something beautiful. I'm more patient, more present, and more grateful for the little things.",
      reactionCount: 8,
      commentCount: 5,
    }),
  },
};

// Milestone Post
export const MilestonePost: Story = {
  args: {
    post: createMockPost({
      postType: "milestone",
      title: "7-Day Streak! 🔥",
      content:
        "Just hit my first full week of completing both morning and evening routines. It wasn't easy, but the consistency is paying off. Here's to the next 7 days!",
      reactionCount: 24,
      commentCount: 12,
      shareCount: 5,
    }),
  },
};

// Celebration Post
export const CelebrationPost: Story = {
  args: {
    post: createMockPost({
      postType: "celebration",
      title: "Grateful for this community! 🎉",
      content:
        "Shoutout to everyone who's been supporting each other on this journey. The encouragement I've received has made such a difference. We're all in this together!",
      isFeatured: true,
      reactionCount: 45,
      commentCount: 18,
    }),
  },
};

// Question Post
export const QuestionPost: Story = {
  args: {
    post: createMockPost({
      postType: "question",
      title: "Tips for staying consistent?",
      content:
        "I've been struggling to maintain my evening routine. Work often runs late and I feel too tired by the time I get home. How do you all stay consistent when life gets busy?",
      reactionCount: 3,
      commentCount: 8,
    }),
  },
};

// Pinned Post
export const PinnedPost: Story = {
  args: {
    post: createMockPost({
      postType: "win",
      title: "Welcome to Week 3! 📅",
      content:
        "You've made it through the first two weeks - that's huge! This week, we're focusing on deepening our gratitude practice. Remember: progress, not perfection.",
      isPinned: true,
      author: {
        id: "coach-1",
        firstName: "Coach",
        lastName: "Maya",
        profileImage: null,
      },
      reactionCount: 67,
      commentCount: 23,
    }),
  },
};

// With User Reaction
export const WithUserReaction: Story = {
  args: {
    post: createMockPost({
      userReaction: "heart",
      reactionCount: 15,
    }),
  },
};

// Anonymous Post
export const AnonymousPost: Story = {
  args: {
    post: createMockPost({
      author: undefined,
      postType: "reflection",
      title: null,
      content:
        "Struggling today. Some days are harder than others, and that's okay. Sharing here because I know I'm not alone in this feeling.",
      reactionCount: 28,
      commentCount: 15,
    }),
  },
};

// Long Content
export const LongContent: Story = {
  args: {
    post: createMockPost({
      postType: "reflection",
      title: "My transformation story so far",
      content: `When I started this 45-day challenge, I was skeptical. I'd tried so many self-improvement programs before, and they always fizzled out after a week or two.

But something about this approach felt different. The daily accountability, the supportive community, the bite-sized practices that didn't overwhelm me.

Week 1 was rough. I missed days, felt frustrated, and almost quit. But I kept showing up, even imperfectly.

Week 2, something clicked. The morning meditation stopped feeling like a chore and started feeling like a gift to myself.

Now in Week 3, I'm noticing changes others can see too. My partner mentioned I seem calmer. My coworkers said I'm more patient in meetings.

The compounding effect is real. Small daily deposits of self-care are adding up to something meaningful. If you're struggling, keep going. It gets better.`,
      reactionCount: 89,
      commentCount: 34,
      shareCount: 12,
    }),
  },
};

// All Post Types Showcase
export const AllPostTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-grey-400">Win</p>
      <PostCard
        post={createMockPost({ postType: "win", title: "Morning routine complete!" })}
        onReact={fn()}
      />
      <p className="mt-4 text-sm font-semibold text-grey-400">Reflection</p>
      <PostCard
        post={createMockPost({
          postType: "reflection",
          title: null,
          content: "Today's insight: consistency beats intensity.",
        })}
        onReact={fn()}
      />
      <p className="mt-4 text-sm font-semibold text-grey-400">Milestone</p>
      <PostCard
        post={createMockPost({ postType: "milestone", title: "14-Day Streak! 🔥" })}
        onReact={fn()}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <Provider store={createMockStore()}>
        <UsePopupContextProvider>
          <div className="max-w-[600px]">
            <Story />
          </div>
        </UsePopupContextProvider>
      </Provider>
    ),
  ],
};
