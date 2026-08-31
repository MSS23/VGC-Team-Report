import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Regression test for the `min-h-11text-xs` / `min-h-11text-[10px]` defect
 * introduced in commit 0024679 (SpeedTierChart toggle buttons).
 *
 * Two Tailwind utilities were concatenated with no separating space, so
 * Tailwind emitted NEITHER of them: the "Mega Forms" / "Meta Threats" and
 * speed-modifier toggles lost their `text-xs` sizing AND lost the 44px
 * minimum touch target (`min-h-11`) that the commit existed to deliver —
 * a WCAG 2.5.8 regression on top of the visual one.
 *
 * There is no jsdom/RTL setup in this project, so this asserts on the source
 * text: every class token must be a single well-formed utility.
 */

const SOURCE = readFileSync(
  path.resolve(__dirname, "../SpeedTierChart.tsx"),
  "utf8",
);

/** Utility prefixes that can never legally appear mid-token. */
const UTILITY_PREFIXES = [
  "text-",
  "min-h-",
  "min-w-",
  "max-h-",
  "max-w-",
  "font-",
  "rounded",
  "border",
  "bg-",
  "shadow",
  "gap-",
  "px-",
  "py-",
  "items-",
  "justify-",
  "transition",
  "cursor-",
  "inline-flex",
  "flex-",
];

/** Split the file into whitespace-delimited candidate class tokens. */
function classTokens(src: string): string[] {
  return src.split(/[\s`"'{}()<>,;:?=]+/).filter(Boolean);
}

describe("SpeedTierChart class names", () => {
  it("has no `min-h-11` concatenated onto a text- utility (commit 0024679)", () => {
    expect(SOURCE).not.toMatch(/min-h-11text-/);
  });

  it("keeps the 44px touch target on the toggle buttons", () => {
    // Three toggle buttons: speed modifiers, Mega Forms, Meta Threats.
    const withTouchTarget = SOURCE.match(/\bmin-h-11\s/g) ?? [];
    expect(withTouchTarget.length).toBe(3);
  });

  it("has no two Tailwind utilities concatenated without a space", () => {
    const offenders = classTokens(SOURCE).filter((token) =>
      UTILITY_PREFIXES.some((prefix) => {
        let idx = token.indexOf(prefix, 1);
        while (idx > 0) {
          // A utility prefix directly after a digit or a `]` (arbitrary-value
          // close) means the space between two utilities was dropped.
          if (/[0-9\]]/.test(token[idx - 1])) return true;
          idx = token.indexOf(prefix, idx + 1);
        }
        return false;
      }),
    );
    expect(offenders).toEqual([]);
  });
});
