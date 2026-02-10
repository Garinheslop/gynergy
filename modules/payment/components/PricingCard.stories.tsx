import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

import { PRICING_TIERS, PricingTier } from "@resources/types/payment";

import PricingCard from "./PricingCard";

const meta = {
  title: "Payment/PricingCard",
  component: PricingCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A pricing card component that displays product tiers with features, pricing, and CTA buttons. Used on the pricing page to showcase the 45-Day Challenge, Friend Code redemption, and Journal subscription options.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tier: {
      control: "object",
      description: "The pricing tier configuration object",
    },
    isLoading: {
      control: "boolean",
      description: "Whether the card is in a loading state (during checkout)",
    },
  },
  args: {
    onCheckout: fn(),
    onFriendCode: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PricingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Main Challenge Tier (Highlighted)
export const ChallengeTier: Story = {
  args: {
    tier: PRICING_TIERS[0],
  },
};

// Friend Code Redemption Tier
export const FriendCodeTier: Story = {
  args: {
    tier: PRICING_TIERS[1],
  },
};

// Journal Subscription Tier
export const JournalTier: Story = {
  args: {
    tier: PRICING_TIERS[2],
  },
};

// Loading State
export const Loading: Story = {
  args: {
    tier: PRICING_TIERS[0],
    isLoading: true,
  },
};

// Custom Tier Example
const customTier: PricingTier = {
  name: "Annual Plan",
  price: "$399",
  priceSubtext: "/year",
  description: "Best value for committed growth seekers.",
  features: [
    "Full 45-day challenge",
    "All premium features",
    "Save $80 annually",
    "Priority support",
  ],
  ctaText: "Choose Annual",
  ctaAction: "checkout",
  highlighted: true,
  badge: "Best Value",
};

export const CustomHighlighted: Story = {
  args: {
    tier: customTier,
  },
};

// Without Badge
const noBadgeTier: PricingTier = {
  ...PRICING_TIERS[0],
  badge: undefined,
  highlighted: false,
};

export const WithoutBadge: Story = {
  args: {
    tier: noBadgeTier,
  },
};

// All Tiers Showcase
export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {PRICING_TIERS.map((tier, index) => (
        <div key={index} className="w-80">
          <PricingCard tier={tier} onCheckout={fn()} onFriendCode={fn()} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
