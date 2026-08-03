import { describe, it, expect, afterEach, vi } from "vitest";
import { getCorsHeaders, isAllowedOrigin, isDynamicAllowedOrigin } from "@/lib/security/cors";

// ---------------------------------------------------------------------------
// CORS origin matching.
//
// Regression cover for the preview-deploy wildcard: the old pattern was
// /^https:\/\/vgc-team-report[a-z0-9-]*\.vercel\.app$/, which matched ANY
// vercel.app host starting with the project name. `*.vercel.app` subdomains
// are first-come-first-served across all Vercel accounts, so an attacker could
// register `vgc-team-report-x` and have that origin reflected into
// Access-Control-Allow-Origin next to Access-Control-Allow-Credentials: true.
// ---------------------------------------------------------------------------

const GENUINE_PREVIEW = "https://vgc-team-report-a1b2c3d4e-mss23s-projects.vercel.app";
const GENUINE_BRANCH_PREVIEW = "https://vgc-team-report-git-main-mss23s-projects.vercel.app";
const ATTACKER_LOOKALIKE = "https://vgc-team-report-x.vercel.app";

function makeRequest(opts: { origin?: string; host?: string } = {}): Request {
  const headers: Record<string, string> = {};
  if (opts.origin) headers["origin"] = opts.origin;
  headers["host"] = opts.host ?? "pokemonvgcteamreport.com";
  return new Request("http://localhost/api/thing", { method: "POST", headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDynamicAllowedOrigin", () => {
  it("accepts the canonical production origins", () => {
    expect(isDynamicAllowedOrigin("https://pokemonvgcteamreport.com")).toBe(true);
    expect(isDynamicAllowedOrigin("https://www.pokemonvgcteamreport.com")).toBe(true);
    expect(isDynamicAllowedOrigin("https://vgc-team-report.vercel.app")).toBe(true);
  });

  it("rejects an empty origin", () => {
    expect(isDynamicAllowedOrigin("")).toBe(false);
  });

  it("rejects an attacker-registerable vercel.app lookalike", () => {
    expect(isDynamicAllowedOrigin(ATTACKER_LOOKALIKE)).toBe(false);
    expect(isDynamicAllowedOrigin("https://vgc-team-report-evil.vercel.app")).toBe(false);
    expect(isDynamicAllowedOrigin("https://vgc-team-reportevil.vercel.app")).toBe(false);
  });

  it("rejects suffix and subdomain tricks on the canonical domain", () => {
    expect(isDynamicAllowedOrigin("https://vgc-team-report.vercel.app.evil.com")).toBe(false);
    expect(isDynamicAllowedOrigin("https://pokemonvgcteamreport.com.evil.com")).toBe(false);
    expect(isDynamicAllowedOrigin("https://evil.pokemonvgcteamreport.com")).toBe(false);
    expect(isDynamicAllowedOrigin("http://pokemonvgcteamreport.com")).toBe(false);
  });

  it("accepts genuine scoped preview deployments off production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isDynamicAllowedOrigin(GENUINE_PREVIEW)).toBe(true);
    expect(isDynamicAllowedOrigin(GENUINE_BRANCH_PREVIEW)).toBe(true);
  });

  it("still rejects the lookalike on a preview deployment", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isDynamicAllowedOrigin(ATTACKER_LOOKALIKE)).toBe(false);
  });

  it("never honours a preview origin on the production deployment", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isDynamicAllowedOrigin(GENUINE_PREVIEW)).toBe(false);
    expect(isDynamicAllowedOrigin(ATTACKER_LOOKALIKE)).toBe(false);
    // Static allowlist is unaffected.
    expect(isDynamicAllowedOrigin("https://pokemonvgcteamreport.com")).toBe(true);
  });
});

describe("isAllowedOrigin", () => {
  it("allows requests with no Origin header (same-origin / server-to-server)", () => {
    expect(isAllowedOrigin(makeRequest())).toBe(true);
  });

  it("blocks a cross-origin request from an attacker lookalike in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isAllowedOrigin(makeRequest({ origin: ATTACKER_LOOKALIKE }))).toBe(false);
  });

  it("blocks an arbitrary attacker origin", () => {
    expect(isAllowedOrigin(makeRequest({ origin: "https://evil.com" }))).toBe(false);
  });

  it("allows a deployment calling its own API, whatever its hostname", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const host = "vgc-team-report-zzz9-some-other-scope.vercel.app";
    expect(isAllowedOrigin(makeRequest({ origin: `https://${host}`, host }))).toBe(true);
  });

  it("does not treat a mismatched Origin/Host pair as same-origin", () => {
    expect(
      isAllowedOrigin(
        makeRequest({ origin: ATTACKER_LOOKALIKE, host: "pokemonvgcteamreport.com" }),
      ),
    ).toBe(false);
  });

  it("ignores a malformed Origin header", () => {
    expect(isAllowedOrigin(makeRequest({ origin: "not a url" }))).toBe(false);
  });
});

describe("getCorsHeaders", () => {
  it("reflects an allowed origin", () => {
    const headers = getCorsHeaders(makeRequest({ origin: "https://pokemonvgcteamreport.com" }));
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://pokemonvgcteamreport.com");
  });

  it("never reflects an attacker lookalike alongside credentials", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const headers = getCorsHeaders(makeRequest({ origin: ATTACKER_LOOKALIKE }));
    expect(headers["Access-Control-Allow-Origin"]).toBe("");
    expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
  });
});
