/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.tsx"],
    include: ["__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["__tests__/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
        "**/*.stories.*",
        "**/index.ts",
      ],
      // Coverage thresholds - Phase 9 target: 80%
      // Start with lower thresholds and increase as tests are added
      thresholds: {
        global: {
          statements: 40,
          branches: 35,
          functions: 40,
          lines: 40,
        },
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./modules/common/components"),
      "@configs": path.resolve(__dirname, "./configs"),
      "@contexts": path.resolve(__dirname, "./contexts"),
      "@resources": path.resolve(__dirname, "./resources"),
      "@lib": path.resolve(__dirname, "./lib"),
      "@modules": path.resolve(__dirname, "./modules"),
      "@public": path.resolve(__dirname, "./public"),
      "@store": path.resolve(__dirname, "./store"),
      "@styles": path.resolve(__dirname, "./styles"),
      "@tests": path.resolve(__dirname, "./__tests__"),
    },
  },
});
