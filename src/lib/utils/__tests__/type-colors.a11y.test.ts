import { describe, expect, it } from "vitest";
import { TYPE_COLORS } from "@/lib/utils/type-colors";

/**
 * Regression guard (A11Y-CONTRAST-BATCH / audit finding B3).
 *
 * `TYPE_COLORS` used to pair `text: "#FFFFFF"` with the pastel type
 * backgrounds, which measured 2.08:1 (Grass) to 3.15:1 (Psychic) — far under
 * the WCAG 2.1 AA 4.5:1 floor. Type badges render at 10–11px
 * (`TypeBadge.tsx`), so they are "small text" and the 4.5:1 bar applies; the
 * badge's `textShadow` does not count toward contrast.
 *
 * The ratio is computed here from the WCAG relative-luminance formula rather
 * than asserted against a snapshot, so ANY future palette edit — a new Tera
 * type, a re-tinted background, a text colour flipped back to white — fails
 * this test instead of silently shipping an unreadable badge.
 */

const AA_SMALL_TEXT = 4.5;

/** WCAG 2.1 relative luminance of an opaque #rrggbb colour. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const srgb = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG 2.1 contrast ratio between two opaque #rrggbb colours (1:1 – 21:1). */
function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("TYPE_COLORS contrast", () => {
  const entries = Object.entries(TYPE_COLORS);

  it("covers every type with opaque 6-digit hex values", () => {
    // A malformed hex would make parseInt return NaN and quietly render the
    // ratio assertions below meaningless, so validate the inputs first.
    expect(entries.length).toBeGreaterThan(0);
    for (const [type, colors] of entries) {
      for (const key of ["bg", "text", "border"] as const) {
        expect(colors[key], `${type}.${key}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it.each(entries)("%s badge text meets AA (4.5:1) on its own background", (type, colors) => {
    const ratio = contrastRatio(colors.text, colors.bg);
    expect(
      ratio,
      `${type}: ${colors.text} on ${colors.bg} is ${ratio.toFixed(2)}:1, needs ${AA_SMALL_TEXT}:1`,
    ).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it("sanity-checks the ratio maths against known WCAG reference pairs", () => {
    // Black on white is exactly 21:1; a colour against itself is exactly 1:1.
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#7AC74C", "#7AC74C")).toBeCloseTo(1, 5);
  });
});
