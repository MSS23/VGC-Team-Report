/**
 * TypeBadge render-safety regression tests.
 *
 * THE BUG: `TYPE_COLORS[type]` returns `undefined` for any string outside the
 * 18 PokemonType members + Stellar. The component then read `colors.bg`, which
 * threw on `undefined` and crashed the whole report render. The reported repro
 * was pasting `MissingNo. @ Leftovers`, because `dex-subset.json` ships
 * MissingNo. with the non-canonical type `"Bird"`.
 *
 * The data-side fix (pkmn-dex-fallback.ts) stops "Bird" at the boundary; this
 * is the belt-and-braces half, so a future data source cannot re-break the UI.
 *
 * Rendered with react-dom/server to avoid pulling in a DOM test harness.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { TeraType } from "@/lib/types/pokemon";
import { TypeBadge } from "../TypeBadge";

/** The crash-triggering value, cast the way bad generated data sneaks in. */
const BIRD = "Bird" as TeraType;

describe("TypeBadge — unknown type degrades to a neutral badge", () => {
  it('MissingNo. repro: does not throw on the unknown "Bird" type', () => {
    expect(() => renderToStaticMarkup(<TypeBadge type={BIRD} />)).not.toThrow();
  });

  it('MissingNo. repro: renders the neutral background for "Bird", not a broken style', () => {
    const html = renderToStaticMarkup(<TypeBadge type={BIRD} />);

    expect(html).toContain("#4B5563");
    expect(html).toContain("Bird");
    expect(html).not.toContain("undefined");
  });

  it("still renders the real colour for a canonical type", () => {
    const html = renderToStaticMarkup(<TypeBadge type="Fire" />);
    expect(html).toContain("#EE8130");
  });

  it("still renders Stellar (VGC-294) rather than falling back", () => {
    const html = renderToStaticMarkup(<TypeBadge type="Stellar" />);
    expect(html).toContain("#4FA89B");
    expect(html).not.toContain("#4B5563");
  });

  it("never emits an undefined style value for any garbage input", () => {
    for (const bogus of ["Bird", "Glitch", "", "normal", "???"]) {
      const html = renderToStaticMarkup(<TypeBadge type={bogus as TeraType} />);
      expect(html).not.toContain("undefined");
      expect(html).toContain("#4B5563");
    }
  });
});
