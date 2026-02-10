import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

import FriendCodeInput from "./FriendCodeInput";

const meta = {
  title: "Payment/FriendCodeInput",
  component: FriendCodeInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A form component for redeeming friend codes to join the 45-Day Awakening Challenge for free. Features real-time validation, loading states, and success/error feedback.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isLoading: {
      control: "boolean",
      description: "Whether the form is in a loading state during redemption",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    success: {
      control: "text",
      description: "Success message after successful redemption",
    },
  },
  args: {
    onRedeem: fn(() => Promise.resolve({ success: true })),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-w-[400px] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FriendCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default State
export const Default: Story = {
  args: {},
};

// With Close Button
export const WithCloseButton: Story = {
  args: {
    onClose: fn(),
  },
};

// Loading State (During Redemption)
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

// Error State
export const WithError: Story = {
  args: {
    error: "This friend code has already been used.",
  },
};

// Success State
export const Success: Story = {
  args: {
    success:
      "Your friend code has been redeemed! You now have access to the 45-Day Awakening Challenge.",
  },
};

// Invalid Code Error
export const InvalidCode: Story = {
  args: {
    error: "Invalid friend code. Please check and try again.",
  },
};

// Expired Code Error
export const ExpiredCode: Story = {
  args: {
    error: "This friend code has expired.",
  },
};

// All States Showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Default</p>
        <FriendCodeInput onRedeem={fn(() => Promise.resolve({ success: true }))} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Loading</p>
        <FriendCodeInput onRedeem={fn(() => Promise.resolve({ success: true }))} isLoading />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Error</p>
        <FriendCodeInput
          onRedeem={fn(() => Promise.resolve({ success: false }))}
          error="This friend code has already been used."
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Success</p>
        <FriendCodeInput
          onRedeem={fn(() => Promise.resolve({ success: true }))}
          success="Welcome to the Challenge!"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
