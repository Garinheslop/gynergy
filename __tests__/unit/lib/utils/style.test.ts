/**
 * Style Utility Tests
 * Tests for lib/utils/style.ts
 */
import { describe, expect, it } from "vitest";

import { cn } from "@lib/utils/style";

describe("cn (classname utility)", () => {
  describe("basic usage", () => {
    it("returns single class unchanged", () => {
      expect(cn("text-red-500")).toBe("text-red-500");
    });

    it("joins multiple classes", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles empty strings", () => {
      expect(cn("")).toBe("");
      expect(cn("text-red-500", "")).toBe("text-red-500");
    });

    it("handles undefined values", () => {
      expect(cn(undefined)).toBe("");
      expect(cn("text-red-500", undefined)).toBe("text-red-500");
    });

    it("handles null values", () => {
      expect(cn(null)).toBe("");
      expect(cn("text-red-500", null)).toBe("text-red-500");
    });

    it("handles false values", () => {
      expect(cn(false)).toBe("");
      expect(cn("text-red-500", false)).toBe("text-red-500");
    });
  });

  describe("conditional classes", () => {
    it("includes class when condition is true", () => {
      const isActive = true;
      expect(cn("base", isActive && "active")).toBe("base active");
    });

    it("excludes class when condition is false", () => {
      const isActive = false;
      expect(cn("base", isActive && "active")).toBe("base");
    });

    it("handles object syntax", () => {
      expect(cn({ active: true, disabled: false })).toBe("active");
    });

    it("handles mixed syntax", () => {
      expect(cn("base", { active: true }, "extra")).toBe("base active extra");
    });
  });

  describe("tailwind merge functionality", () => {
    it("merges conflicting tailwind classes (last wins)", () => {
      // twMerge should resolve conflicts
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });

    it("merges conflicting padding classes", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8");
    });

    it("preserves non-conflicting classes", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toContain("text-red-500");
      expect(result).toContain("bg-blue-500");
    });

    it("handles responsive variants correctly", () => {
      const result = cn("text-sm", "md:text-lg");
      expect(result).toContain("text-sm");
      expect(result).toContain("md:text-lg");
    });

    it("merges conflicting margin classes", () => {
      const result = cn("mt-4", "mt-8");
      expect(result).toBe("mt-8");
    });

    it("handles complex class combinations", () => {
      const result = cn(
        "flex items-center",
        "justify-between",
        "px-4 py-2",
        "bg-white dark:bg-gray-800"
      );
      expect(result).toContain("flex");
      expect(result).toContain("items-center");
      expect(result).toContain("justify-between");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });
  });

  describe("array input", () => {
    it("handles array of classes", () => {
      expect(cn(["text-red-500", "bg-blue-500"])).toBe("text-red-500 bg-blue-500");
    });

    it("handles nested arrays", () => {
      expect(cn(["text-red-500", ["bg-blue-500", "p-4"]])).toContain("text-red-500");
      expect(cn(["text-red-500", ["bg-blue-500", "p-4"]])).toContain("bg-blue-500");
      expect(cn(["text-red-500", ["bg-blue-500", "p-4"]])).toContain("p-4");
    });
  });

  describe("edge cases", () => {
    it("handles no arguments", () => {
      expect(cn()).toBe("");
    });

    it("handles whitespace", () => {
      expect(cn("  text-red-500  ")).toBe("text-red-500");
    });

    it("handles duplicate classes", () => {
      const result = cn("text-red-500", "text-red-500");
      // Should dedupe
      expect(result.match(/text-red-500/g)?.length).toBe(1);
    });
  });
});
