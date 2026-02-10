import type { Meta, StoryObj } from "@storybook/nextjs";

import FriendCodeShare from "./FriendCodeShare";

interface FriendCode {
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

const meta = {
  title: "Payment/FriendCodeShare",
  component: FriendCodeShare,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays friend codes that users can share with others to invite them to the 45-Day Awakening Challenge. Features copy and native share functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    friendCodes: {
      control: "object",
      description: "Array of friend code objects with code, isUsed, usedAt, and createdAt fields",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FriendCodeShare>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockAvailableCodes: FriendCode[] = [
  {
    code: "FRIEND-ABC123",
    isUsed: false,
    usedAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    code: "FRIEND-XYZ789",
    isUsed: false,
    usedAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
];

const mockUsedCodes: FriendCode[] = [
  {
    code: "FRIEND-DEF456",
    isUsed: true,
    usedAt: "2024-01-20T14:30:00Z",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    code: "FRIEND-GHI012",
    isUsed: true,
    usedAt: "2024-01-22T09:15:00Z",
    createdAt: "2024-01-15T10:00:00Z",
  },
];

const mockMixedCodes: FriendCode[] = [
  {
    code: "FRIEND-ABC123",
    isUsed: false,
    usedAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    code: "FRIEND-DEF456",
    isUsed: true,
    usedAt: "2024-01-20T14:30:00Z",
    createdAt: "2024-01-15T10:00:00Z",
  },
];

// No Codes (Empty State)
export const NoCodes: Story = {
  args: {
    friendCodes: [],
  },
};

// All Available Codes
export const AllAvailable: Story = {
  args: {
    friendCodes: mockAvailableCodes,
  },
};

// All Used Codes
export const AllUsed: Story = {
  args: {
    friendCodes: mockUsedCodes,
  },
};

// Mixed Available and Used
export const MixedCodes: Story = {
  args: {
    friendCodes: mockMixedCodes,
  },
};

// Single Available Code
export const SingleAvailable: Story = {
  args: {
    friendCodes: [mockAvailableCodes[0]],
  },
};

// Single Used Code
export const SingleUsed: Story = {
  args: {
    friendCodes: [mockUsedCodes[0]],
  },
};

// All States Showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">No Codes Available</p>
        <FriendCodeShare friendCodes={[]} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">Two Available Codes</p>
        <FriendCodeShare friendCodes={mockAvailableCodes} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">One Available, One Used</p>
        <FriendCodeShare friendCodes={mockMixedCodes} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-600">All Codes Used</p>
        <FriendCodeShare friendCodes={mockUsedCodes} />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};
