/**
 * Number Utility Tests
 * Tests for lib/utils/number.ts
 */
import { describe, expect, it } from "vitest";

import { convertNumberToWords } from "@lib/utils/number";

describe("convertNumberToWords", () => {
  describe("single digits (0-9)", () => {
    it("converts 0", () => {
      expect(convertNumberToWords(0)).toBe("zero");
    });

    it("converts 1", () => {
      expect(convertNumberToWords(1)).toBe("one");
    });

    it("converts 5", () => {
      expect(convertNumberToWords(5)).toBe("five");
    });

    it("converts 9", () => {
      expect(convertNumberToWords(9)).toBe("nine");
    });
  });

  describe("teens (10-19)", () => {
    it("converts 10", () => {
      expect(convertNumberToWords(10)).toBe("ten");
    });

    it("converts 11", () => {
      expect(convertNumberToWords(11)).toBe("eleven");
    });

    it("converts 12", () => {
      expect(convertNumberToWords(12)).toBe("twelve");
    });

    it("converts 13", () => {
      expect(convertNumberToWords(13)).toBe("thirteen");
    });

    it("converts 15", () => {
      expect(convertNumberToWords(15)).toBe("fifteen");
    });

    it("converts 19", () => {
      expect(convertNumberToWords(19)).toBe("nineteen");
    });
  });

  describe("tens (20-99)", () => {
    it("converts 20", () => {
      expect(convertNumberToWords(20)).toBe("twenty");
    });

    it("converts 21", () => {
      expect(convertNumberToWords(21)).toBe("twenty-one");
    });

    it("converts 30", () => {
      expect(convertNumberToWords(30)).toBe("thirty");
    });

    it("converts 37", () => {
      expect(convertNumberToWords(37)).toBe("thirty-seven");
    });

    it("converts 42", () => {
      expect(convertNumberToWords(42)).toBe("forty-two");
    });

    it("converts 50", () => {
      expect(convertNumberToWords(50)).toBe("fifty");
    });

    it("converts 65", () => {
      expect(convertNumberToWords(65)).toBe("sixty-five");
    });

    it("converts 78", () => {
      expect(convertNumberToWords(78)).toBe("seventy-eight");
    });

    it("converts 84", () => {
      expect(convertNumberToWords(84)).toBe("eighty-four");
    });

    it("converts 99", () => {
      expect(convertNumberToWords(99)).toBe("ninety-nine");
    });
  });

  describe("hundreds (100-999)", () => {
    it("converts 100", () => {
      expect(convertNumberToWords(100)).toBe("one hundred");
    });

    it("converts 101", () => {
      expect(convertNumberToWords(101)).toBe("one hundred and one");
    });

    it("converts 110", () => {
      expect(convertNumberToWords(110)).toBe("one hundred and ten");
    });

    it("converts 115", () => {
      expect(convertNumberToWords(115)).toBe("one hundred and fifteen");
    });

    it("converts 123", () => {
      expect(convertNumberToWords(123)).toBe("one hundred and twenty-three");
    });

    it("converts 200", () => {
      expect(convertNumberToWords(200)).toBe("two hundred");
    });

    it("converts 256", () => {
      expect(convertNumberToWords(256)).toBe("two hundred and fifty-six");
    });

    it("converts 500", () => {
      expect(convertNumberToWords(500)).toBe("five hundred");
    });

    it("converts 999", () => {
      expect(convertNumberToWords(999)).toBe("nine hundred and ninety-nine");
    });
  });

  describe("edge cases", () => {
    it("converts multiples of 10 correctly", () => {
      expect(convertNumberToWords(40)).toBe("forty");
      expect(convertNumberToWords(60)).toBe("sixty");
      expect(convertNumberToWords(70)).toBe("seventy");
      expect(convertNumberToWords(80)).toBe("eighty");
      expect(convertNumberToWords(90)).toBe("ninety");
    });

    it("converts numbers ending in 0", () => {
      expect(convertNumberToWords(120)).toBe("one hundred and twenty");
      expect(convertNumberToWords(300)).toBe("three hundred");
    });

    it("handles the 45-day journey range (1-45)", () => {
      // Important for the app's 45-day journey
      expect(convertNumberToWords(1)).toBe("one");
      expect(convertNumberToWords(7)).toBe("seven");
      expect(convertNumberToWords(14)).toBe("fourteen");
      expect(convertNumberToWords(21)).toBe("twenty-one");
      expect(convertNumberToWords(30)).toBe("thirty");
      expect(convertNumberToWords(45)).toBe("forty-five");
    });
  });

  describe("specific application values", () => {
    it("converts streak counts correctly", () => {
      expect(convertNumberToWords(3)).toBe("three");
      expect(convertNumberToWords(7)).toBe("seven");
      expect(convertNumberToWords(14)).toBe("fourteen");
      expect(convertNumberToWords(21)).toBe("twenty-one");
      expect(convertNumberToWords(28)).toBe("twenty-eight");
    });

    it("converts day numbers for badges", () => {
      expect(convertNumberToWords(1)).toBe("one");
      expect(convertNumberToWords(5)).toBe("five");
      expect(convertNumberToWords(10)).toBe("ten");
      expect(convertNumberToWords(25)).toBe("twenty-five");
    });
  });
});
