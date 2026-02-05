import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

import { buttonActionTypes } from "@resources/types/button";

import ActionButton from "./ActionButton";

const meta = {
  title: "Components/ActionButton",
  component: ActionButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The primary button component used throughout Gynergy. Supports multiple variants including default, outlined, text, checkbox, radio, slider, and toggle.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    buttonActionType: {
      control: "select",
      options: Object.values(buttonActionTypes),
      description: "The visual style variant of the button",
    },
    label: {
      control: "text",
      description: "Button label text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    isLoading: {
      control: "boolean",
      description: "Whether to show loading state",
    },
    isActive: {
      control: "boolean",
      description: "Active state for toggle/checkbox/slider variants",
    },
    icon: {
      control: "text",
      description: "Icon name from the Gynergy icon font (without gng- prefix)",
    },
  },
  args: {
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-w-[300px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default Button (Primary CTA)
export const Default: Story = {
  args: {
    label: "Get Started",
    buttonActionType: buttonActionTypes.default,
  },
};

export const DefaultWithIcon: Story = {
  args: {
    label: "Continue",
    buttonActionType: buttonActionTypes.default,
    icon: "arrow-right",
  },
};

export const DefaultLoading: Story = {
  args: {
    label: "Saving...",
    buttonActionType: buttonActionTypes.default,
    isLoading: true,
    isSpinner: true,
  },
};

export const DefaultDisabled: Story = {
  args: {
    label: "Disabled",
    buttonActionType: buttonActionTypes.default,
    disabled: true,
  },
};

// Outlined Button (Secondary)
export const Outlined: Story = {
  args: {
    label: "Cancel",
    buttonActionType: buttonActionTypes.outlined,
  },
};

export const OutlinedWithIcon: Story = {
  args: {
    label: "Back",
    buttonActionType: buttonActionTypes.outlined,
    icon: "arrow-left",
  },
};

// Text Button (Tertiary)
export const Text: Story = {
  args: {
    label: "Learn More",
    buttonActionType: buttonActionTypes.text,
  },
};

export const TextWithIcon: Story = {
  args: {
    label: "View Details",
    buttonActionType: buttonActionTypes.text,
    icon: "arrow-right",
  },
};

// Checkbox Button
export const Checkbox: Story = {
  args: {
    label: "I agree to the terms and conditions",
    buttonActionType: buttonActionTypes.check,
    isActive: false,
  },
};

export const CheckboxChecked: Story = {
  args: {
    label: "I agree to the terms and conditions",
    buttonActionType: buttonActionTypes.check,
    isActive: true,
  },
};

// Radio Button
export const Radio: Story = {
  args: {
    label: "Option A",
    buttonActionType: buttonActionTypes.radio,
    isActive: false,
  },
};

export const RadioSelected: Story = {
  args: {
    label: "Option A",
    buttonActionType: buttonActionTypes.radio,
    isActive: true,
  },
};

// Slider Toggle
export const Slider: Story = {
  args: {
    label: "Enable notifications",
    buttonActionType: buttonActionTypes.slider,
    isActive: false,
  },
};

export const SliderActive: Story = {
  args: {
    label: "Enable notifications",
    buttonActionType: buttonActionTypes.slider,
    isActive: true,
  },
};

// Toggle Button
export const Toggle: Story = {
  args: {
    label: "Dark Mode",
    buttonActionType: buttonActionTypes.toggle,
    isActive: false,
  },
};

export const ToggleActive: Story = {
  args: {
    label: "Dark Mode",
    buttonActionType: buttonActionTypes.toggle,
    isActive: true,
  },
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-grey-400">Default (Primary CTA)</p>
        <ActionButton label="Get Started" buttonActionType={buttonActionTypes.default} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-grey-400">Outlined (Secondary)</p>
        <ActionButton label="Cancel" buttonActionType={buttonActionTypes.outlined} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-grey-400">Text (Tertiary)</p>
        <ActionButton label="Learn More" buttonActionType={buttonActionTypes.text} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-grey-400">Checkbox</p>
        <ActionButton
          label="Accept terms"
          buttonActionType={buttonActionTypes.check}
          isActive={true}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-grey-400">Slider Toggle</p>
        <ActionButton
          label="Notifications"
          buttonActionType={buttonActionTypes.slider}
          isActive={true}
        />
      </div>
    </div>
  ),
};
