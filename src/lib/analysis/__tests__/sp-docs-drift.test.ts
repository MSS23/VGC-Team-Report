import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
} from "../stat-calculator";

// VGC-266: llms.txt taught AI crawlers "Standard Points, 1 SP = 1 EV" and the
// FAQ claimed a 600/200 budget — both flatly wrong. These tests pin the
// user-facing SP documentation to the real constants so the docs cannot
// drift from the implementation again.
describe("SP documentation matches stat-calculator constants", () => {
  const llms = readFileSync(join(process.cwd(), "public", "llms.txt"), "utf8");
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

  it("FAQ states the real budget, not the old 600/200 claim", () => {
    expect(faq).toContain(`${CHAMPIONS_TOTAL_SP} total SP`);
    expect(faq).toContain(`${CHAMPIONS_MAX_SP_PER_STAT} SP per individual stat`);
    expect(faq).not.toContain("600 total SP");
    expect(faq).not.toContain("200 SP per individual stat");
  });
});
