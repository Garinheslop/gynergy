import React from "react";
import type { Preview } from "@storybook/nextjs";
import "../styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "#131313",
        },
        {
          name: "dark-secondary",
          value: "#27282a",
        },
        {
          name: "light",
          value: "#ffffff",
        },
      ],
    },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default preview;
