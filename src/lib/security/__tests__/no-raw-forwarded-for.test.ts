import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// VGC-264: every client-IP read must go through the hardened getClientIp
// (src/lib/security/input-validation.ts). Routes that parse x-forwarded-for
// themselves invariably take the LEFT-most entry, which the caller controls —
// that spoof voided rate limiting and identity keying once already.
function collectRouteFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectRouteFiles(full, acc);
    else if (/route\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("no raw x-forwarded-for parsing in API routes", () => {
  it("every route reads client IPs via getClientIp, never the raw header", () => {
    const apiDir = join(process.cwd(), "src", "app", "api");
    const offenders = collectRouteFiles(apiDir).filter((file) =>
      /x-forwarded-for/i.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
