import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  championsSpToEv,
  evToChampionsSp,
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
  MAX_EV_PER_STAT,
} from "../stat-calculator";

// VGC-266: llms.txt taught AI crawlers "Standard Points, 1 SP = 1 EV" and the
// FAQ claimed a 600/200 budget — both flatly wrong. These tests pin the
// user-facing SP documentation to the real constants so the docs cannot
// drift from the implementation again.
//
// VGC-298: the budget strings alone were not enough. llms-full.txt still
// carried the full "1 SP = 1 EV" myth months after llms.txt was fixed, because
// the guard only ever read llms.txt, and nothing pinned the EV→SP *ladder*
// figure that the prose quotes. Both files are now covered, and the ladder is
// asserted against `championsSpToEv` rather than a hand-typed number.
describe("SP documentation matches stat-calculator constants", () => {
  const read = (...parts: string[]) =>
    readFileSync(join(process.cwd(), ...parts), "utf8");

  const AI_DOCS = [
    ["llms.txt", read("public", "llms.txt")],
    ["llms-full.txt", read("public", "llms-full.txt")],
  ] as const;

  const faq = read("src", "app", "faq", "page.tsx");

  // The ladder the prose quotes, derived from the calculator so the docs and
  // the code can only ever move together.
  const FIRST_SP_EV_COST = championsSpToEv(1);
  const PER_SP_EV_STEP = championsSpToEv(2) - championsSpToEv(1);
  const MAX_SP_EV_COST = championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT);

  it("the EV->SP ladder is 8n-4 only up to the per-stat cap, which lands on 248 EVs", () => {
    expect(FIRST_SP_EV_COST).toBe(4);
    expect(PER_SP_EV_STEP).toBe(8);

    // cost(n) = 8n - 4 holds for every Stat Point below the cap.
    for (let sp = 1; sp < CHAMPIONS_MAX_SP_PER_STAT; sp++) {
      expect(championsSpToEv(sp)).toBe(8 * sp - 4);
    }

    // ...but NOT at the cap. `evToChampionsSp` saturates at 248 EVs, so the
    // 32nd Stat Point costs 248 EVs, not the 8 * 32 - 4 = 252 the curve would
    // predict. Docs that claim "32 SP = 252 EVs" are wrong; 248+ is correct,
    // because 248 and a maxed 252 both convert to the same 32 SP.
    expect(MAX_SP_EV_COST).toBe(248);
    expect(MAX_SP_EV_COST).not.toBe(8 * CHAMPIONS_MAX_SP_PER_STAT - 4);
    expect(evToChampionsSp(248)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
    expect(evToChampionsSp(MAX_EV_PER_STAT)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
  });

  for (const [name, doc] of AI_DOCS) {
    describe(name, () => {
      it("states the real budget and never the 1 SP = 1 EV myth", () => {
        expect(doc).toContain(`${CHAMPIONS_TOTAL_SP} SP total`);
        expect(doc).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per stat`);
        expect(doc).toContain("Stat Points");
        expect(doc).not.toMatch(/standard points/i);
        expect(doc).not.toMatch(/1 SP = 1 EV/i);
      });

      it("quotes the real EV->SP ladder, including the capped top of it", () => {
        expect(doc).toContain(
          `the first SP in a stat costs ${FIRST_SP_EV_COST} EVs and every SP after that costs ${PER_SP_EV_STEP}`,
        );
        expect(doc).toContain(
          `${CHAMPIONS_MAX_SP_PER_STAT} SP = ${MAX_SP_EV_COST}+ EVs`,
        );
        // The figure the curve predicts but the cap never reaches.
        expect(doc).not.toContain(
          `${CHAMPIONS_MAX_SP_PER_STAT} SP = ${8 * CHAMPIONS_MAX_SP_PER_STAT - 4} EVs`,
        );
      });

      it("names Regulation M-C as the current Champions format", () => {
        expect(doc).toMatch(/M-C/);
        expect(doc).toMatch(/current/i);
      });
    });
  }

  it("FAQ states the real budget, not the old 600/200 claim", () => {
    expect(faq).toContain(`${CHAMPIONS_TOTAL_SP} total SP`);
    expect(faq).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per individual stat`);
    expect(faq).not.toContain("600 total SP");
    expect(faq).not.toContain("200 SP per individual stat");
  });
});
