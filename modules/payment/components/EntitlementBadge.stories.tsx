import type { Meta, StoryObj } from "@storybook/nextjs";

import { UserEntitlements } from "@resources/types/payment";

import EntitlementBadge from "./EntitlementBadge";

const meta = {
  title: "Payment/EntitlementBadge",
  component: EntitlementBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays user access status including challenge access, journal subscription, and community access. Shows expiration warnings and upgrade prompts.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    compact: {
      control: "boolean",
      description: "Display compact badge version",
    },
    showUpgradePrompt: {
      control: "boolean",
      description: "Show upgrade prompts when applicable",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntitlementBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock entitlements data
const createEntitlements = (overrides: Partial<UserEntitlements> = {}): UserEntitlements => ({
  id: "ent-123",
  userId: "user-123",
  hasChallengeAccess: false,
  challengeAccessType: null,
  challengeAccessGrantedAt: null,
  challengeExpiresAt: null,
  hasJournalAccess: false,
  journalSubscriptionId: null,
  hasCommunityAccess: false,
  communityAccessGrantedAt: null,
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const futureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// No Entitlements
export const NoEntitlements: Story = {
  args: {
    entitlements: null,
    showUpgradePrompt: true,
  },
};

// Challenge Access (Purchased)
export const ChallengeAccess: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeAccessGrantedAt: new Date().toISOString(),
      challengeExpiresAt: futureDate(30),
      hasCommunityAccess: true,
      communityAccessGrantedAt: new Date().toISOString(),
    }),
  },
};

// Challenge Access (Friend Code)
export const FriendCodeAccess: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "friend_code",
      challengeAccessGrantedAt: new Date().toISOString(),
      challengeExpiresAt: futureDate(45),
      hasCommunityAccess: true,
      communityAccessGrantedAt: new Date().toISOString(),
    }),
  },
};

// Expiring Soon (7 days or less)
export const ExpiringSoon: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeAccessGrantedAt: new Date().toISOString(),
      challengeExpiresAt: futureDate(5),
      hasCommunityAccess: true,
    }),
  },
};

// Expired Access
export const ExpiredAccess: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeAccessGrantedAt: new Date().toISOString(),
      challengeExpiresAt: futureDate(0),
      hasCommunityAccess: false,
    }),
  },
};

// Full Access (Challenge + Journal)
export const FullAccess: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeAccessGrantedAt: new Date().toISOString(),
      challengeExpiresAt: futureDate(30),
      hasJournalAccess: true,
      journalSubscriptionId: "sub-123",
      hasCommunityAccess: true,
      communityAccessGrantedAt: new Date().toISOString(),
    }),
  },
};

// Compact Mode - Challenge
export const CompactChallenge: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeExpiresAt: futureDate(30),
    }),
    compact: true,
  },
};

// Compact Mode - Full Access
export const CompactFullAccess: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeExpiresAt: futureDate(30),
      hasJournalAccess: true,
      journalSubscriptionId: "sub-123",
    }),
    compact: true,
  },
};

// Compact Mode - Expiring Soon
export const CompactExpiringSoon: Story = {
  args: {
    entitlements: createEntitlements({
      hasChallengeAccess: true,
      challengeAccessType: "purchased",
      challengeExpiresAt: futureDate(3),
    }),
    compact: true,
  },
};

// Without Upgrade Prompt
export const NoUpgradePrompt: Story = {
  args: {
    entitlements: null,
    showUpgradePrompt: false,
  },
};

// All States Showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">No Entitlements</p>
        <EntitlementBadge entitlements={null} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Challenge Access (Purchased)</p>
        <EntitlementBadge
          entitlements={createEntitlements({
            hasChallengeAccess: true,
            challengeAccessType: "purchased",
            challengeExpiresAt: futureDate(30),
            hasCommunityAccess: true,
          })}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Expiring Soon</p>
        <EntitlementBadge
          entitlements={createEntitlements({
            hasChallengeAccess: true,
            challengeAccessType: "purchased",
            challengeExpiresAt: futureDate(5),
            hasCommunityAccess: true,
          })}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Full Access</p>
        <EntitlementBadge
          entitlements={createEntitlements({
            hasChallengeAccess: true,
            challengeAccessType: "purchased",
            challengeExpiresAt: futureDate(30),
            hasJournalAccess: true,
            journalSubscriptionId: "sub-123",
            hasCommunityAccess: true,
          })}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Compact Badges</p>
        <div className="flex gap-4">
          <EntitlementBadge
            entitlements={createEntitlements({
              hasChallengeAccess: true,
              challengeAccessType: "purchased",
              challengeExpiresAt: futureDate(30),
            })}
            compact
          />
          <EntitlementBadge
            entitlements={createEntitlements({
              hasChallengeAccess: true,
              challengeAccessType: "purchased",
              challengeExpiresAt: futureDate(30),
              hasJournalAccess: true,
            })}
            compact
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
