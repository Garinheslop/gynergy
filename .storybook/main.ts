import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../modules/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/nextjs",
  staticDirs: ["../public"],
  webpackFinal: async (config) => {
    // Add path aliases to match tsconfig
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@contexts": path.resolve(__dirname, "../contexts"),
        "@lib": path.resolve(__dirname, "../lib"),
        "@modules": path.resolve(__dirname, "../modules"),
        "@resources": path.resolve(__dirname, "../resources"),
        "@store": path.resolve(__dirname, "../store"),
        "@styles": path.resolve(__dirname, "../styles"),
      };
    }
    return config;
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
