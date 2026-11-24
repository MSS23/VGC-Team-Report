import { describe, it, expect } from "vitest";
import { calculateStat, calculateChampionsStat } from "@/lib/analysis/stat-calculator";

// Oracles: the hand-written level-50 formulas SpeedTierChart used before it
// switched to the shared stat calculator. Kept verbatim so any drift shows up.
const oldMaxSpeed = (b: number) =>
  Math.floor(((Math.floor(((2 * b + 31 + Math.floor(252 / 4)) * 50) / 100) + 5) * 1.1));
const oldMinSpeed = (b: number) =>
  Math.floor(((Math.floor(((2 * b + 0) * 50) / 100) + 5) * 0.9));
const oldChampionsMaxSpeed = (b: number) =>
  Math.floor((Math.floor((2 * b + 31) * 50 / 100) + 5 + 32) * 1.1);
const oldChampionsMinSpeed = (b: number) =>
  Math.floor((Math.floor((2 * b + 31) * 50 / 100) + 5) * 0.9);

describe("SpeedTierChart speed bounds match stat-calculator", () => {
  it("is identical for every base speed 1-255", () => {
    for (let b = 1; b <= 255; b++) {
      expect(calculateStat("spe", b, 31, 252, 50, "Jolly")).toBe(oldMaxSpeed(b));
      expect(calculateStat("spe", b, 0, 0, 50, "Brave")).toBe(oldMinSpeed(b));
      expect(calculateChampionsStat("spe", b, 32, "Jolly")).toBe(oldChampionsMaxSpeed(b));
      expect(calculateChampionsStat("spe", b, 0, "Brave")).toBe(oldChampionsMinSpeed(b));
    }
  });
});
