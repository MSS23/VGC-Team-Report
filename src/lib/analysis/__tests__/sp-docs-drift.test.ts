import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
  MAX_EV_PER_STAT,
  championsSpToEv,
  evToChampionsSp,
} from "../stat-calculator";

// VGC-266: llms.txt taught AI crawlers "Standard Points, 1 SP = 1 EV" and the
// FAQ claimed a 600/200 budget — both flatly wrong. These tests pin the
// user-facing SP documentation to the real constants so the docs cannot
// drift from the implementation again.
//
// SWARM-LLMSTXT: the original version of this test only read llms.txt, so
// public/llms-full.txt kept serving the very myth VGC-266 removed ("SP
// (Stat Points or Standard Points) … where 1 SP = 1 EV. The terms are
// interchangeable."). Every AI-facing SP document is now checked by the same
// shared assertions, driven off the calculator constants and the conversion
// curve itself, so correcting one document and forgetting the other fails.

const read = (...segments: string[]) =>
  readFileSync(join(process.cwd(), ...segments), "utf8");

/** Every document that teaches an AI crawler how Champions SP works. */
const SP_DOCS: ReadonlyArray<readonly [string, string]> = [
  ["public/llms.txt", read("public", "llms.txt")],
  ["public/llms-full.txt", read("public", "llms-full.txt")],
];

// Derived from the implementation, never hardcoded: if the curve in
// stat-calculator changes, these expectations change with it and the docs
// (which state the numbers in prose) start failing until they are updated.
const FIRST_SP_EV_COST = championsSpToEv(1); // 4
const LATER_SP_EV_COST = championsSpToEv(3) - championsSpToEv(2); // 8
const CAP_EV_COST = championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT); // 248

/** The ladder sentence, in either of the two phrasings the site uses. */
const LADDER = new RegExp(
  `first SP in a stat costs ${FIRST_SP_EV_COST} EVs and (?:every|each) SP after (?:that|it) costs ${LATER_SP_EV_COST}`,
  "i",
);

function expectSpDocIsCorrect(name: string, text: string) {
  // --- the budget, stated with the real constants -------------------------
  expect(text, `${name}: SP total`).toContain(`${CHAMPIONS_TOTAL_SP} SP total`);
  expect(text, `${name}: SP per stat`).toContain(
    `${CHAMPIONS_MAX_SP_PER_STAT} SP per stat`,
  );
  expect(text, `${name}: names the system`).toContain("Stat Points");

  // Any *other* number quoted as the budget or the per-stat cap is drift —
  // this catches a stale "510 SP total" or "200 SP per stat" anywhere in the
  // document, not just in the sentence checked above.
  const totals = [...text.matchAll(/(\d+)\s+SP total/gi)].map((m) => Number(m[1]));
  expect(totals.length, `${name}: states a total`).toBeGreaterThan(0);
  expect(totals, `${name}: every stated SP total`).toEqual(
    totals.map(() => CHAMPIONS_TOTAL_SP),
  );

  const perStat = [...text.matchAll(/(\d+)\s+SP per (?:individual )?stat/gi)].map(
    (m) => Number(m[1]),
  );
  expect(perStat.length, `${name}: states a per-stat cap`).toBeGreaterThan(0);
  expect(perStat, `${name}: every stated per-stat cap`).toEqual(
    perStat.map(() => CHAMPIONS_MAX_SP_PER_STAT),
  );

  // --- the conversion curve ----------------------------------------------
  expect(text, `${name}: says the conversion is not 1:1`).toMatch(/not 1:1/i);
  expect(text, `${name}: states the EV cost ladder`).toMatch(LADDER);
  expect(text, `${name}: states the per-stat cap in EVs`).toContain(
    `${CHAMPIONS_MAX_SP_PER_STAT} SP = ${CAP_EV_COST}+ EVs`,
  );

  // --- the myths VGC-266 removed, which must never come back -------------
  expect(text, `${name}: "Standard Points" myth`).not.toMatch(/standard points/i);
  expect(text, `${name}: "1 SP = 1 EV" myth`).not.toMatch(/1\s*SP\s*=\s*1\s*EV/i);
  expect(text, `${name}: "interchangeable" myth`).not.toMatch(/interchangeable/i);
  // SP values are capped at 32 per stat, so EV-sized SP figures are a tell
  // that EVs are being relabelled as SP again.
  expect(text, `${name}: EV-sized SP figure`).not.toMatch(/\b(?:1\d\d|2\d\d|[3-9]\d\d)\s*SP\b/i);
}

describe("SP documentation matches stat-calculator constants", () => {
  const faq = read("src", "app", "faq", "page.tsx");

  it.each(SP_DOCS)("%s states the real SP budget and conversion", (name, text) => {
    expectSpDocIsCorrect(name, text);
  });

  it("the conversion curve the docs describe is the one the code implements", () => {
    // Guards the derivation above: the prose ladder "4, then 8 each" is only
    // a faithful description of evToChampionsSp if these hold.
    expect(evToChampionsSp(FIRST_SP_EV_COST)).toBe(1);
    expect(evToChampionsSp(FIRST_SP_EV_COST - 1)).toBe(1);
    expect(evToChampionsSp(0)).toBe(0);
    expect(evToChampionsSp(CAP_EV_COST)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
    for (let sp = 2; sp < CHAMPIONS_MAX_SP_PER_STAT; sp++) {
      expect(championsSpToEv(sp) - championsSpToEv(sp - 1)).toBe(LATER_SP_EV_COST);
    }
    // The final step is the one exception, and the docs say so: the per-stat
    // cap is hit at CAP_EV_COST EVs rather than at the 4 + 8 x 31 the ladder
    // would otherwise predict, which is why the docs write "248+ EVs".
    expect(championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT)).toBe(CAP_EV_COST);
    expect(evToChampionsSp(MAX_EV_PER_STAT)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
  });

  it("llms-full.txt spells out the full EV→SP ladder correctly", () => {
    const full = read("public", "llms-full.txt");
    for (let sp = 1; sp <= 3; sp++) {
      expect(full).toContain(`${championsSpToEv(sp)} EVs = ${sp} SP`);
    }
    expect(full).toContain(
      `${CAP_EV_COST} EVs = ${CHAMPIONS_MAX_SP_PER_STAT} SP`,
    );
  });

  it("FAQ states the real budget, not the old 600/200 claim", () => {
    expect(faq).toContain(`${CHAMPIONS_TOTAL_SP} total SP`);
    expect(faq).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per individual stat`);
    expect(faq).toMatch(LADDER);
    expect(faq).not.toContain("600 total SP");
    expect(faq).not.toContain("200 SP per individual stat");
  });
});
