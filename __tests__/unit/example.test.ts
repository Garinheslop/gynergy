import { describe, it, expect } from "vitest";

describe("Example Test Suite", () => {
  it("should pass a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const greeting = "Hello, Gynergy!";
    expect(greeting).toContain("Gynergy");
  });

  it("should handle array operations", () => {
    const badges = ["morning-streak-7", "first-light", "week-warrior"];
    expect(badges).toHaveLength(3);
    expect(badges).toContain("first-light");
  });

  it("should handle object matching", () => {
    const user = {
      name: "Test User",
      streak: 7,
      badges: ["first-morning"],
    };
    expect(user).toMatchObject({
      name: "Test User",
      streak: 7,
    });
  });
});

describe("Points Calculation (Example)", () => {
  const calculatePoints = (
    basePoints: number,
    streak: number,
    hasCombo: boolean
  ): number => {
    let multiplier = 1.0;
    if (streak >= 30) multiplier = 2.0;
    else if (streak >= 14) multiplier = 1.5;
    else if (streak >= 7) multiplier = 1.2;

    const bonus = hasCombo ? 10 : 0;
    return Math.floor(basePoints * multiplier) + bonus;
  };

  it("should apply no multiplier for streak < 7", () => {
    expect(calculatePoints(10, 5, false)).toBe(10);
  });

  it("should apply 1.2x multiplier for 7-13 day streak", () => {
    expect(calculatePoints(10, 7, false)).toBe(12);
    expect(calculatePoints(10, 13, false)).toBe(12);
  });

  it("should apply 1.5x multiplier for 14-29 day streak", () => {
    expect(calculatePoints(10, 14, false)).toBe(15);
    expect(calculatePoints(10, 29, false)).toBe(15);
  });

  it("should apply 2.0x multiplier for 30+ day streak", () => {
    expect(calculatePoints(10, 30, false)).toBe(20);
    expect(calculatePoints(10, 45, false)).toBe(20);
  });

  it("should add combo bonus", () => {
    expect(calculatePoints(10, 7, true)).toBe(22); // 12 + 10 bonus
    expect(calculatePoints(10, 30, true)).toBe(30); // 20 + 10 bonus
  });
});
