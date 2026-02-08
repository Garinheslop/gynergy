import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { useState } from "react";

import TextArea from "./TextArea";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Multi-line text input component with auto-expanding rows and optional word limit feature.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "text",
      description: "Current value of the textarea",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    rows: {
      control: { type: "number", min: 1, max: 20 },
      description: "Initial number of visible rows",
    },
    wordLimit: {
      control: { type: "number", min: 0, max: 1000 },
      description: "Maximum word count allowed",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default
export const Default: Story = {
  args: {
    placeholder: "Write here...",
    rows: 4,
  },
};

// With Value
export const WithValue: Story = {
  args: {
    value:
      "Today I practiced my morning meditation and felt a sense of calm wash over me. I'm grateful for this journey of self-discovery.",
    placeholder: "Write here...",
    rows: 4,
  },
};

// With Word Limit
export const WithWordLimit: Story = {
  args: {
    placeholder: "Share your reflection (max 50 words)...",
    wordLimit: 50,
    rows: 4,
  },
};

// Word Limit Reached
export const WordLimitReached: Story = {
  args: {
    value:
      "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight twenty-nine thirty thirty-one thirty-two thirty-three thirty-four thirty-five thirty-six thirty-seven thirty-eight thirty-nine forty forty-one forty-two forty-three forty-four forty-five forty-six forty-seven forty-eight forty-nine fifty",
    placeholder: "Share your reflection...",
    wordLimit: 50,
    rows: 4,
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    value: "This content cannot be edited",
    placeholder: "Write here...",
    disabled: true,
    rows: 3,
  },
};

// Long Content (Auto-expand)
export const AutoExpanding: Story = {
  args: {
    value: `Day 15 of my 45-Day Awakening Challenge:

I woke up feeling energized today. The morning meditation session was particularly powerful - I felt deeply connected to my breath and present moment awareness.

Key wins today:
- Completed my morning routine without checking my phone
- Had a meaningful conversation with a family member
- Practiced gratitude journaling for 10 minutes

I'm starting to notice how these small daily practices are compounding. My sleep quality has improved, and I feel more patient throughout the day.

Tomorrow's intention: Stay present during conversations and practice active listening.`,
    placeholder: "Write here...",
    rows: 4,
  },
};

// Interactive Example
export const Interactive: Story = {
  render: function InteractiveTextArea() {
    const [value, setValue] = useState("");

    return (
      <div className="space-y-4">
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Share your thoughts..."
          wordLimit={100}
          rows={4}
        />
        <p className="text-grey-500 text-sm">
          Words: {value ? value.split(/\s+/).filter(Boolean).length : 0} / 100
        </p>
      </div>
    );
  },
};

// All States Showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Default</p>
        <TextArea placeholder="Write here..." rows={3} />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">With Content</p>
        <TextArea
          value="Today I'm grateful for the small moments of peace I found between meetings."
          rows={3}
        />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">With Word Limit</p>
        <TextArea placeholder="Max 25 words..." wordLimit={25} rows={3} />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Disabled</p>
        <TextArea value="Cannot edit this content" disabled rows={2} />
      </div>
    </div>
  ),
};
