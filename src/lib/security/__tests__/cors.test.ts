import { describe, it, expect } from "vitest";
import { getCorsHeaders, isAllowedOrigin, isDynamicAllowedOrigin } from "@/lib/security/cors";

// ---------------------------------------------------------------------------
// CORS allowlist. Regression coverage for C4 security audit Finding 3
// (2026-08-10): the preview-deployment regex used to be
// /^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/, which matched
// attacker-registrable *.vercel.app project names while the response also
// carried Access-Control-Allow-Credentials: true.
// ---------------------------------------------------------------------------

function req(origin?: string): Request {
  return new Request("http://localhost/api/thing", {
    headers: origin ? { origin } : {},
  });
}

describe("isDynamicAllowedOrigin", () => {
  it("allows the production domains", () => {
    expect(isDynamicAllowedOrigin("https://pokemonvgcteamreport.com")).toBe(true);
    expect(isDynamicAllowedOrigin("https://www.pokemonvgcteamreport.com")).toBe(true);
    expect(isDynamicAllowedOrigin("https://vgc-team-report.vercel.app")).toBe(true);
  });

  it("allows this project's Vercel preview deployment URLs (scoped to the team slug)", () => {
    expect(
      isDynamicAllowedOrigin("https://vgc-team-report-8k2j9d1qp-mss23s-projects.vercel.app"),
    ).toBe(true);
    expect(
      isDynamicAllowedOrigin("https://vgc-team-report-git-main-mss23s-projects.vercel.app"),
    ).toBe(true);
    expect(
      isDynamicAllowedOrigin(
        "https://vgc-team-report-git-swarm-nightly-2026-08-10-mss23s-projects.vercel.app",
      ),
    ).toBe(true);
  });

  describe("regression: attacker-registrable *.vercel.app origins are rejected (C4 Finding 3)", () => {
    it.each([
      "https://vgc-team-report-evil.vercel.app",
      "https://vgc-team-report-anything.vercel.app",
      "https://vgc-team-report.evil.vercel.app",
      "https://vgc-team-report-git-main-someone-else.vercel.app",
      "https://evil-vgc-team-report-mss23s-projects.vercel.app",
      "https://vgc-team-report-abc-mss23s-projects.vercel.app.evil.com",
      "http://vgc-team-report-abc-mss23s-projects.vercel.app",
      "https://pokemonvgcteamreport.com.evil.com",
    ])("rejects %s", (origin) => {
      expect(isDynamicAllowedOrigin(origin)).toBe(false);
    });
  });
});

describe("isAllowedOrigin", () => {
  it("treats a missing Origin header (same-origin / non-browser) as allowed", () => {
    expect(isAllowedOrigin(req())).toBe(true);
  });

  it("rejects a disallowed origin", () => {
    expect(isAllowedOrigin(req("https://vgc-team-report-evil.vercel.app"))).toBe(false);
  });
});

describe("getCorsHeaders", () => {
  it("echoes an allowed origin", () => {
    const headers = getCorsHeaders(req("https://pokemonvgcteamreport.com"));
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://pokemonvgcteamreport.com");
  });

  it("never echoes a disallowed origin", () => {
    const headers = getCorsHeaders(req("https://vgc-team-report-evil.vercel.app"));
    expect(headers["Access-Control-Allow-Origin"]).toBe("");
  });

  // VGC-274: credentialed cross-origin access was deliberately removed —
  // nothing legitimate reads /api cross-origin with cookies, and omitting
  // the header caps the blast radius of any future allowlist widening at
  // anonymous responses.
  it("never sends Access-Control-Allow-Credentials", () => {
    const allowed = getCorsHeaders(req("https://pokemonvgcteamreport.com"));
    expect(allowed["Access-Control-Allow-Credentials"]).toBeUndefined();
  });
});
