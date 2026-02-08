import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

import { CohortMember } from "@resources/types/community";

import MemberCard from "./MemberCard";

// Mock member data
const createMockMember = (overrides: Partial<CohortMember> = {}): CohortMember => ({
  id: "member-1",
  firstName: "Sarah",
  lastName: "Chen",
  profileImage: null,
  role: "member",
  joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  streak: 12,
  points: 1250,
  ...overrides,
});

const meta = {
  title: "Community/MemberCard",
  component: MemberCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Member card component displaying cohort member info, stats, and action buttons. Supports compact mode for leaderboards.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    member: {
      description: "Member data object",
    },
    isCompact: {
      control: "boolean",
      description: "Show compact version for lists/leaderboards",
    },
    onSendEncouragement: {
      description: "Callback when encourage button is clicked",
    },
    onViewProfile: {
      description: "Callback when profile button is clicked",
    },
  },
  args: {
    onSendEncouragement: fn(),
    onViewProfile: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MemberCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default Member
export const Default: Story = {
  args: {
    member: createMockMember(),
  },
};

// High Achiever
export const HighAchiever: Story = {
  args: {
    member: createMockMember({
      firstName: "Alex",
      lastName: "Rivera",
      streak: 45,
      points: 5680,
    }),
  },
};

// New Member
export const NewMember: Story = {
  args: {
    member: createMockMember({
      firstName: "Jordan",
      lastName: "Taylor",
      streak: 2,
      points: 150,
      joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  },
};

// Admin Role
export const AdminRole: Story = {
  args: {
    member: createMockMember({
      firstName: "Coach",
      lastName: "Maya",
      role: "admin",
      streak: 365,
      points: 15000,
    }),
  },
};

// Moderator Role
export const ModeratorRole: Story = {
  args: {
    member: createMockMember({
      firstName: "Sam",
      lastName: "Johnson",
      role: "moderator",
      streak: 90,
      points: 8500,
    }),
  },
};

// Compact Mode
export const Compact: Story = {
  args: {
    member: createMockMember(),
    isCompact: true,
  },
  decorators: [
    (Story) => (
      <div className="border-border-dark bg-bkg-dark-secondary w-[300px] rounded border p-2">
        <Story />
      </div>
    ),
  ],
};

// Compact - No Streak
export const CompactNoStreak: Story = {
  args: {
    member: createMockMember({
      streak: 0,
      points: 50,
    }),
    isCompact: true,
  },
  decorators: [
    (Story) => (
      <div className="border-border-dark bg-bkg-dark-secondary w-[300px] rounded border p-2">
        <Story />
      </div>
    ),
  ],
};

// Leaderboard List
export const LeaderboardList: Story = {
  render: () => (
    <div className="border-border-dark bg-bkg-dark-secondary w-[350px] space-y-1 rounded border p-4">
      <h3 className="text-content-light mb-3 font-semibold">Top Streakers</h3>
      {[
        createMockMember({ id: "1", firstName: "Alex", lastName: "R.", streak: 45, points: 5680 }),
        createMockMember({ id: "2", firstName: "Sam", lastName: "J.", streak: 38, points: 4200 }),
        createMockMember({
          id: "3",
          firstName: "Jordan",
          lastName: "T.",
          streak: 32,
          points: 3800,
        }),
        createMockMember({ id: "4", firstName: "Casey", lastName: "M.", streak: 28, points: 3100 }),
        createMockMember({ id: "5", firstName: "Riley", lastName: "K.", streak: 21, points: 2500 }),
      ].map((member, index) => (
        <div key={member.id} className="flex items-center gap-2">
          <span className="text-grey-500 w-6 text-center text-sm font-bold">{index + 1}</span>
          <MemberCard member={member} isCompact onViewProfile={fn()} />
        </div>
      ))}
    </div>
  ),
};

// Member Grid
export const MemberGrid: Story = {
  render: () => (
    <div className="grid max-w-[800px] gap-4 sm:grid-cols-2">
      <MemberCard
        member={createMockMember({
          firstName: "Sarah",
          lastName: "Chen",
          streak: 12,
          points: 1250,
        })}
        onSendEncouragement={fn()}
        onViewProfile={fn()}
      />
      <MemberCard
        member={createMockMember({
          firstName: "Alex",
          lastName: "Rivera",
          role: "moderator",
          streak: 28,
          points: 3400,
        })}
        onSendEncouragement={fn()}
        onViewProfile={fn()}
      />
      <MemberCard
        member={createMockMember({
          firstName: "Jordan",
          lastName: "Taylor",
          streak: 5,
          points: 420,
        })}
        onSendEncouragement={fn()}
        onViewProfile={fn()}
      />
      <MemberCard
        member={createMockMember({
          firstName: "Coach",
          lastName: "Maya",
          role: "admin",
          streak: 365,
          points: 15000,
        })}
        onSendEncouragement={fn()}
        onViewProfile={fn()}
      />
    </div>
  ),
};

// Role Badges Showcase
export const RoleBadges: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Admin</p>
        <MemberCard
          member={createMockMember({ firstName: "Coach", lastName: "Maya", role: "admin" })}
          onSendEncouragement={fn()}
          onViewProfile={fn()}
        />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Moderator</p>
        <MemberCard
          member={createMockMember({ firstName: "Sam", lastName: "Johnson", role: "moderator" })}
          onSendEncouragement={fn()}
          onViewProfile={fn()}
        />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Member (no badge)</p>
        <MemberCard
          member={createMockMember({ firstName: "Sarah", lastName: "Chen", role: "member" })}
          onSendEncouragement={fn()}
          onViewProfile={fn()}
        />
      </div>
    </div>
  ),
};
