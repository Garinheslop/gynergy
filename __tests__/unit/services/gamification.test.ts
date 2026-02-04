import { describe, it, expect } from "vitest";

import {
  getBasePoints,
  getStreakMultiplier,
  getComboBonus,
  getEarlyBirdBonus,
  calculatePoints,
} from "@lib/services/pointsService";

describe("Points Service", () => {
  describe("getBasePoints", () => {
    it("should return 10 for morning_journal", () => {
      expect(getBasePoints("morning_journal")).toBe(10);
    });

    it("should return 10 for evening_journal", () => {
      expect(getBasePoints("evening_journal")).toBe(10);
    });

    it("should return 15 for dga", () => {
      expect(getBasePoints("dga")).toBe(15);
    });

    it("should return 25 for weekly_journal", () => {
      expect(getBasePoints("weekly_journal")).toBe(25);
    });

    it("should return 20 for vision", () => {
      expect(getBasePoints("vision")).toBe(20);
    });

    it("should return 0 for badge_reward", () => {
      expect(getBasePoints("badge_reward")).toBe(0);
    });
  });

  describe("getStreakMultiplier", () => {
    it("should return 1.0x for streak < 7", () => {
      expect(getStreakMultiplier(0)).toEqual({ value: 1.0, name: "No multiplier" });
      expect(getStreakMultiplier(3)).toEqual({ value: 1.0, name: "No multiplier" });
      expect(getStreakMultiplier(6)).toEqual({ value: 1.0, name: "No multiplier" });
    });

    it("should return 1.2x for streak 7-13", () => {
      expect(getStreakMultiplier(7)).toEqual({ value: 1.2, name: "Streak 7-13" });
      expect(getStreakMultiplier(10)).toEqual({ value: 1.2, name: "Streak 7-13" });
      expect(getStreakMultiplier(13)).toEqual({ value: 1.2, name: "Streak 7-13" });
    });

    it("should return 1.5x for streak 14-29", () => {
      expect(getStreakMultiplier(14)).toEqual({ value: 1.5, name: "Streak 14-29" });
      expect(getStreakMultiplier(20)).toEqual({ value: 1.5, name: "Streak 14-29" });
      expect(getStreakMultiplier(29)).toEqual({ value: 1.5, name: "Streak 14-29" });
    });

    it("should return 2.0x for streak 30+", () => {
      expect(getStreakMultiplier(30)).toEqual({ value: 2.0, name: "Streak 30+" });
      expect(getStreakMultiplier(45)).toEqual({ value: 2.0, name: "Streak 30+" });
      expect(getStreakMultiplier(100)).toEqual({ value: 2.0, name: "Streak 30+" });
    });
  });

  describe("getComboBonus", () => {
    it("should return 10 when hasCombo is true", () => {
      expect(getComboBonus(true)).toBe(10);
    });

    it("should return 0 when hasCombo is false", () => {
      expect(getComboBonus(false)).toBe(0);
    });
  });

  describe("getEarlyBirdBonus", () => {
    it("should return 5 for morning_journal when isEarlyBird is true", () => {
      expect(getEarlyBirdBonus("morning_journal", true)).toBe(5);
    });

    it("should return 0 for morning_journal when isEarlyBird is false", () => {
      expect(getEarlyBirdBonus("morning_journal", false)).toBe(0);
    });

    it("should return 0 for other activities even when isEarlyBird is true", () => {
      expect(getEarlyBirdBonus("evening_journal", true)).toBe(0);
      expect(getEarlyBirdBonus("dga", true)).toBe(0);
      expect(getEarlyBirdBonus("weekly_journal", true)).toBe(0);
    });
  });

  describe("calculatePoints", () => {
    it("should calculate base points without multiplier or bonus", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 3,
        hasCombo: false,
        isEarlyBird: false,
      });

      expect(result.basePoints).toBe(10);
      expect(result.multiplier).toBe(1.0);
      expect(result.bonusPoints).toBe(0);
      expect(result.finalPoints).toBe(10);
      expect(result.appliedMultipliers).toEqual([]);
    });

    it("should apply 1.2x multiplier for 7-day streak", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 7,
        hasCombo: false,
        isEarlyBird: false,
      });

      expect(result.multiplier).toBe(1.2);
      expect(result.finalPoints).toBe(12); // 10 * 1.2 = 12
      expect(result.appliedMultipliers).toContain("Streak 7-13");
    });

    it("should apply 1.5x multiplier for 14-day streak", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 14,
        hasCombo: false,
        isEarlyBird: false,
      });

      expect(result.multiplier).toBe(1.5);
      expect(result.finalPoints).toBe(15); // 10 * 1.5 = 15
      expect(result.appliedMultipliers).toContain("Streak 14-29");
    });

    it("should apply 2.0x multiplier for 30+ day streak", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 30,
        hasCombo: false,
        isEarlyBird: false,
      });

      expect(result.multiplier).toBe(2.0);
      expect(result.finalPoints).toBe(20); // 10 * 2.0 = 20
      expect(result.appliedMultipliers).toContain("Streak 30+");
    });

    it("should add combo bonus", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 7,
        hasCombo: true,
        isEarlyBird: false,
      });

      expect(result.bonusPoints).toBe(10);
      expect(result.finalPoints).toBe(22); // (10 * 1.2) + 10 = 22
      expect(result.appliedMultipliers).toContain("Daily Combo (+10)");
    });

    it("should add early bird bonus for morning journal", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 7,
        hasCombo: false,
        isEarlyBird: true,
      });

      expect(result.bonusPoints).toBe(5);
      expect(result.finalPoints).toBe(17); // (10 * 1.2) + 5 = 17
      expect(result.appliedMultipliers).toContain("Early Bird (+5)");
    });

    it("should stack all bonuses correctly", () => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak: 30,
        hasCombo: true,
        isEarlyBird: true,
      });

      // 10 * 2.0 = 20 (multiplied)
      // + 10 (combo) + 5 (early bird) = 35 total
      expect(result.multiplier).toBe(2.0);
      expect(result.bonusPoints).toBe(15);
      expect(result.finalPoints).toBe(35);
      expect(result.appliedMultipliers).toContain("Streak 30+");
      expect(result.appliedMultipliers).toContain("Daily Combo (+10)");
      expect(result.appliedMultipliers).toContain("Early Bird (+5)");
    });

    it("should handle dga points correctly", () => {
      const result = calculatePoints({
        activityType: "dga",
        basePoints: 15,
        streak: 14,
        hasCombo: true,
        isEarlyBird: false, // Early bird doesn't apply to DGA
      });

      // 15 * 1.5 = 22.5 -> 22 (floored)
      // + 10 (combo) = 32 total
      expect(result.multiplier).toBe(1.5);
      expect(result.finalPoints).toBe(32);
    });
  });
});

describe("Points Calculation Integration", () => {
  it("should match example test calculations", () => {
    // These should match the examples from example.test.ts
    const scenarios = [
      { streak: 5, hasCombo: false, expected: 10 },
      { streak: 7, hasCombo: false, expected: 12 },
      { streak: 13, hasCombo: false, expected: 12 },
      { streak: 14, hasCombo: false, expected: 15 },
      { streak: 29, hasCombo: false, expected: 15 },
      { streak: 30, hasCombo: false, expected: 20 },
      { streak: 45, hasCombo: false, expected: 20 },
      { streak: 7, hasCombo: true, expected: 22 },
      { streak: 30, hasCombo: true, expected: 30 },
    ];

    scenarios.forEach(({ streak, hasCombo, expected }) => {
      const result = calculatePoints({
        activityType: "morning_journal",
        basePoints: 10,
        streak,
        hasCombo,
        isEarlyBird: false,
      });
      expect(result.finalPoints).toBe(expected);
    });
  });
});
