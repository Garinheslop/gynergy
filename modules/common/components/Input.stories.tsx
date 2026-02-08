import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { useState } from "react";

import Input from "./Input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Text input component with support for labels, icons, password visibility toggle, and error states.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text displayed above the input",
    },
    value: {
      control: "text",
      description: "Current value of the input",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel"],
      description: "HTML input type",
    },
    inputPlaceholder: {
      control: "text",
      description: "Placeholder text",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    icon: {
      control: "text",
      description: "Icon name for left icon",
    },
    inputIcon: {
      control: "text",
      description: "Icon name for right icon",
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default Input
export const Default: Story = {
  args: {
    value: "",
    inputPlaceholder: "Enter your email",
  },
};

// With Label
export const WithLabel: Story = {
  args: {
    label: "Email Address",
    value: "",
    inputPlaceholder: "you@example.com",
    type: "email",
  },
};

// With Value
export const WithValue: Story = {
  args: {
    label: "Full Name",
    value: "Jane Doe",
    inputPlaceholder: "Enter your name",
  },
};

// Password Input
export const Password: Story = {
  args: {
    label: "Password",
    value: "secretpassword",
    type: "password",
    inputPlaceholder: "Enter your password",
  },
};

// With Error
export const WithError: Story = {
  args: {
    label: "Email Address",
    value: "invalid-email",
    inputPlaceholder: "you@example.com",
    type: "email",
    error: "Please enter a valid email address",
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    label: "Email Address",
    value: "disabled@example.com",
    inputPlaceholder: "you@example.com",
    disabled: true,
  },
};

// Interactive Example
export const Interactive: Story = {
  render: function InteractiveInput() {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (e.target.value && !e.target.value.includes("@")) {
        setError("Please include @ in the email");
      } else {
        setError("");
      }
    };

    return (
      <Input
        label="Email Address"
        value={value}
        onChange={handleChange}
        inputPlaceholder="you@example.com"
        type="email"
        error={error}
      />
    );
  },
};

// All States Showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Default</p>
        <Input value="" inputPlaceholder="Enter text..." />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">With Label</p>
        <Input label="Full Name" value="" inputPlaceholder="Jane Doe" />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Password</p>
        <Input label="Password" value="secret" type="password" inputPlaceholder="••••••••" />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Error State</p>
        <Input
          label="Email"
          value="invalid"
          inputPlaceholder="you@example.com"
          error="Invalid email format"
        />
      </div>
      <div>
        <p className="text-grey-400 mb-2 text-sm font-semibold">Disabled</p>
        <Input label="Disabled" value="Cannot edit" inputPlaceholder="..." disabled />
      </div>
    </div>
  ),
};
