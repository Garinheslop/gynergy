import type { Meta, StoryObj } from "@storybook/nextjs";

import { paragraphVariants } from "@resources/variants";

import Paragraph from "./Paragraph";

const meta = {
  title: "Typography/Paragraph",
  component: Paragraph,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Paragraph component for body text. Supports multiple size variants from large titles to meta text.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: Object.values(paragraphVariants),
      description: "Size variant of the paragraph",
      table: {
        defaultValue: { summary: "regular" },
      },
    },
    content: {
      control: "text",
      description: "Text content",
    },
    sx: {
      control: "text",
      description: "Additional Tailwind classes",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof meta>;

// Title XL (48px)
export const TitleXL: Story = {
  args: {
    variant: paragraphVariants.titleXlg,
    content: "Transform Your Life",
  },
};

// Title Large (30px)
export const TitleLarge: Story = {
  args: {
    variant: paragraphVariants.titleLg,
    content: "Begin Your Journey",
  },
};

// Title (24px)
export const Title: Story = {
  args: {
    variant: paragraphVariants.title,
    content: "Daily Reflection",
  },
};

// Regular (18px) - Default
export const Regular: Story = {
  args: {
    variant: paragraphVariants.regular,
    content:
      "Your 45-Day Awakening Challenge is designed to help you build sustainable daily practices that transform your mindset and well-being.",
  },
};

// Meta (16px)
export const Meta: Story = {
  args: {
    variant: paragraphVariants.meta,
    content: "Posted 2 hours ago · 5 min read",
  },
};

// With Custom Styling
export const CustomStyling: Story = {
  args: {
    variant: paragraphVariants.regular,
    content: "This text uses the action color for emphasis.",
    sx: "text-action font-semibold",
  },
};

// Typography Scale Showcase
export const TypographyScale: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-grey-500">Title XL - 48px</p>
        <Paragraph variant={paragraphVariants.titleXlg} content="Hero Statement" />
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-grey-500">Title Large - 30px</p>
        <Paragraph variant={paragraphVariants.titleLg} content="Section Introduction" />
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-grey-500">Title - 24px</p>
        <Paragraph variant={paragraphVariants.title} content="Card Title Text" />
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-grey-500">Regular - 18px</p>
        <Paragraph
          variant={paragraphVariants.regular}
          content="Body text for longer content like descriptions, instructions, and general information."
        />
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-grey-500">Meta - 16px</p>
        <Paragraph
          variant={paragraphVariants.meta}
          content="Smaller text for timestamps, labels, and secondary information."
        />
      </div>
    </div>
  ),
};

// Color Variants
export const ColorVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Paragraph content="Default text color (content-dark)" variant={paragraphVariants.regular} />
      <Paragraph
        content="Action color for interactive hints"
        variant={paragraphVariants.regular}
        sx="text-action"
      />
      <Paragraph
        content="Primary color for highlights"
        variant={paragraphVariants.regular}
        sx="text-primary"
      />
      <Paragraph
        content="Success color for positive feedback"
        variant={paragraphVariants.regular}
        sx="text-success"
      />
      <Paragraph
        content="Danger color for errors"
        variant={paragraphVariants.regular}
        sx="text-danger"
      />
      <Paragraph
        content="Grey for secondary content"
        variant={paragraphVariants.regular}
        sx="text-grey-500"
      />
    </div>
  ),
};

// In Context - Card
export const InContext: Story = {
  render: () => (
    <div className="space-y-3 rounded border border-border-dark bg-bkg-dark-secondary p-6">
      <Paragraph variant={paragraphVariants.title} content="Morning Meditation" sx="font-bold" />
      <Paragraph
        variant={paragraphVariants.regular}
        content="Start your day with a 10-minute guided meditation to center yourself and set positive intentions."
      />
      <div className="flex items-center gap-4">
        <Paragraph variant={paragraphVariants.meta} content="Duration: 10 min" sx="text-grey-500" />
        <Paragraph
          variant={paragraphVariants.meta}
          content="Level: Beginner"
          sx="text-action"
        />
      </div>
    </div>
  ),
};
