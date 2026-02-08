import type { Meta, StoryObj } from "@storybook/nextjs";

import { headingVariants } from "@resources/variants";

import Heading from "./Heading";

const meta = {
  title: "Typography/Heading",
  component: Heading,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Heading component for titles and section headers. Supports multiple size variants from h1 to h3.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: Object.values(headingVariants),
      description: "Size variant of the heading",
      table: {
        defaultValue: { summary: "section-heading" },
      },
    },
    children: {
      control: "text",
      description: "Heading content",
    },
    sx: {
      control: "text",
      description: "Additional Tailwind classes",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

// Heading (h1 - 48px)
export const H1Heading: Story = {
  args: {
    variant: headingVariants.heading,
    children: "Welcome to Your Awakening Journey",
  },
};

// Section Heading (h2 - 48px)
export const SectionHeading: Story = {
  args: {
    variant: headingVariants.sectionHeading,
    children: "Today's Reflection",
  },
};

// Title Large (h2 - 36px)
export const TitleLarge: Story = {
  args: {
    variant: headingVariants.titleLg,
    children: "Morning Meditation",
  },
};

// Card Heading (h3 - 30px)
export const CardHeading: Story = {
  args: {
    variant: headingVariants.cardHeading,
    children: "Daily Wins",
  },
};

// Title (h3 - 24px)
export const Title: Story = {
  args: {
    variant: headingVariants.title,
    children: "Gratitude Practice",
  },
};

// With Custom Styling
export const CustomStyling: Story = {
  args: {
    variant: headingVariants.title,
    children: "Highlighted Title",
    sx: "text-action",
  },
};

// Typography Scale Showcase
export const TypographyScale: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-grey-500 mb-2 text-xs tracking-wide uppercase">Heading (h1) - 48px</p>
        <Heading variant={headingVariants.heading}>Welcome to Gynergy</Heading>
      </div>
      <div>
        <p className="text-grey-500 mb-2 text-xs tracking-wide uppercase">
          Section Heading (h2) - 48px
        </p>
        <Heading variant={headingVariants.sectionHeading}>Your Journey Begins</Heading>
      </div>
      <div>
        <p className="text-grey-500 mb-2 text-xs tracking-wide uppercase">
          Title Large (h2) - 36px
        </p>
        <Heading variant={headingVariants.titleLg}>Daily Practices</Heading>
      </div>
      <div>
        <p className="text-grey-500 mb-2 text-xs tracking-wide uppercase">
          Card Heading (h3) - 30px
        </p>
        <Heading variant={headingVariants.cardHeading}>Today's Focus</Heading>
      </div>
      <div>
        <p className="text-grey-500 mb-2 text-xs tracking-wide uppercase">Title (h3) - 24px</p>
        <Heading variant={headingVariants.title}>Gratitude Entry</Heading>
      </div>
    </div>
  ),
};

// In Context
export const InContext: Story = {
  render: () => (
    <div className="border-border-dark bg-bkg-dark-secondary space-y-6 rounded border p-6">
      <Heading variant={headingVariants.cardHeading}>Day 15 Progress</Heading>
      <div className="space-y-4">
        <div>
          <Heading variant={headingVariants.title} sx="text-action">
            Morning Routine
          </Heading>
          <p className="text-grey-400 mt-1">Completed meditation and journaling</p>
        </div>
        <div>
          <Heading variant={headingVariants.title} sx="text-primary">
            Evening Reflection
          </Heading>
          <p className="text-grey-400 mt-1">Gratitude practice pending</p>
        </div>
      </div>
    </div>
  ),
};
