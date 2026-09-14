import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
  championsSpToEv,
} from "../stat-calculator";

// VGC-266: llms.txt taught AI crawlers "Standard Points, 1 SP = 1 EV" and the
// FAQ claimed a 600/200 budget — both flatly wrong. These tests pin the
// user-facing SP documentation to the real constants so the docs cannot
// drift from the implementation again.
//
// VGC-266 follow-up: the original fix corrected llms.txt and the FAQ but left
// the same "1 SP = 1 EV / Standard Points / 252 SP Atk" passage standing in
// public/llms-full.txt, which this suite did not read. Every SP document we
// serve is now covered, so the long-form file cannot keep an already-corrected
// error alive.
describe("SP documentation matches stat-calculator constants", () => {
  const llms = readFileSync(join(process.cwd(), "public", "llms.txt"), "utf8");
  const llmsFull = readFileSync(
    join(process.cwd(), "public", "llms-full.txt"),
    "utf8",
  );
  const faq = readFileSync(
    join(process.cwd(), "src", "app", "faq", "page.tsx"),
    "utf8",
  );

  it("llms.txt states the real budget and never the 1 SP = 1 EV myth", () => {
    expect(llms).toContain(`${CHAMPIONS_TOTAL_SP} SP total`);
    expect(llms).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per stat`);
    expect(llms).toContain("Stat Points");
    expect(llms).not.toMatch(/standard points/i);
    expect(llms).not.toMatch(/1 SP = 1 EV/i);
  });

  it("llms-full.txt states the real budget and never the 1 SP = 1 EV myth", () => {
    expect(llmsFull).toContain(`${CHAMPIONS_TOTAL_SP} SP total`);
    expect(llmsFull).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per stat`);
    expect(llmsFull).toContain("Stat Points");
    expect(llmsFull).not.toMatch(/standard points/i);
    expect(llmsFull).not.toMatch(/1 SP = 1 EV/i);
    // "252 SP Atk" was the worked example of the myth; 32 is the per-stat cap,
    // so no EV-sized number can ever be legal as an SP value.
    expect(llmsFull).not.toMatch(/\d{3} SP\b/i);
    expect(llmsFull).not.toMatch(/terms are interchangeable/i);
    expect(llmsFull).not.toMatch(/alternative notation sometimes used/i);
  });

  it("llms-full.txt describes the real EV → SP cost curve", () => {
    // 1 SP costs 4 EVs, every SP after it costs 8 — derived, not hardcoded.
    const firstSpCost = championsSpToEv(1);
    const laterSpCost = championsSpToEv(3) - championsSpToEv(2);
    expect(llmsFull).toContain(
      `the first SP in a stat costs ${firstSpCost} EVs and every SP after that costs ${laterSpCost}`,
    );
    expect(llmsFull).toContain(
      `${CHAMPIONS_MAX_SP_PER_STAT} SP = ${championsSpToEv(CHAMPIONS_MAX_SP_PER_STAT)}+ EVs`,
    );
  });

  it("FAQ states the real budget, not the old 600/200 claim", () => {
    expect(faq).toContain(`${CHAMPIONS_TOTAL_SP} total SP`);
    expect(faq).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per individual stat`);
    expect(faq).not.toContain("600 total SP");
    expect(faq).not.toContain("200 SP per individual stat");
  });
});
