import { describe, it, expect } from "vitest";
import {
  isAllowedPokePasteHost,
  normalizePokePasteUrl,
  isPokePasteUrl,
  errorKindForStatus,
  pokePasteErrorMessage,
  PokePasteImportError,
  POKEPASTE_HOST,
} from "../pokepaste-url";

describe("isAllowedPokePasteHost", () => {
  it("accepts the exact host and the www alias", () => {
    expect(isAllowedPokePasteHost("pokepast.es")).toBe(true);
    expect(isAllowedPokePasteHost("www.pokepast.es")).toBe(true);
  });

  it("is case-insensitive and tolerates a trailing root dot", () => {
    expect(isAllowedPokePasteHost("PokePast.ES")).toBe(true);
    expect(isAllowedPokePasteHost("pokepast.es.")).toBe(true);
  });

  // The bug this allowlist exists to prevent: a substring/regex check would
  // happily match every one of these.
  it("rejects lookalike hosts that a substring match would allow", () => {
    expect(isAllowedPokePasteHost("pokepast.es.evil.com")).toBe(false);
    expect(isAllowedPokePasteHost("evil-pokepast.es")).toBe(false);
    expect(isAllowedPokePasteHost("notpokepast.es")).toBe(false);
    expect(isAllowedPokePasteHost("pokepast.es.attacker.net")).toBe(false);
    expect(isAllowedPokePasteHost("evil.com")).toBe(false);
  });

  it("rejects internal / metadata hosts", () => {
    expect(isAllowedPokePasteHost("localhost")).toBe(false);
    expect(isAllowedPokePasteHost("127.0.0.1")).toBe(false);
    expect(isAllowedPokePasteHost("169.254.169.254")).toBe(false);
    expect(isAllowedPokePasteHost("[::1]")).toBe(false);
  });
});

describe("normalizePokePasteUrl", () => {
  const expected = {
    id: "abc123",
    htmlUrl: "https://pokepast.es/abc123",
    rawUrl: "https://pokepast.es/abc123/raw",
  };

  it("accepts the canonical https form", () => {
    expect(normalizePokePasteUrl("https://pokepast.es/abc123")).toEqual(expected);
  });

  it("accepts the URL without a scheme", () => {
    expect(normalizePokePasteUrl("pokepast.es/abc123")).toEqual(expected);
  });

  it("accepts the www subdomain, with and without a scheme", () => {
    expect(normalizePokePasteUrl("https://www.pokepast.es/abc123")).toEqual(expected);
    expect(normalizePokePasteUrl("www.pokepast.es/abc123")).toEqual(expected);
  });

  it("accepts a scheme-relative URL", () => {
    expect(normalizePokePasteUrl("//pokepast.es/abc123")).toEqual(expected);
  });

  it("accepts a trailing slash, /raw, and /raw/", () => {
    expect(normalizePokePasteUrl("https://pokepast.es/abc123/")).toEqual(expected);
    expect(normalizePokePasteUrl("https://pokepast.es/abc123/raw")).toEqual(expected);
    expect(normalizePokePasteUrl("https://pokepast.es/abc123/raw/")).toEqual(expected);
    expect(normalizePokePasteUrl("pokepast.es/abc123/raw")).toEqual(expected);
  });

  it("upgrades an http link to https so the outbound request is never plaintext", () => {
    const result = normalizePokePasteUrl("http://pokepast.es/abc123");
    expect(result?.rawUrl).toBe("https://pokepast.es/abc123/raw");
    expect(result?.htmlUrl.startsWith("https://")).toBe(true);
  });

  it("ignores query strings and fragments", () => {
    expect(normalizePokePasteUrl("https://pokepast.es/abc123?utm_source=x")).toEqual(expected);
    expect(normalizePokePasteUrl("https://pokepast.es/abc123#team")).toEqual(expected);
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePokePasteUrl("  https://pokepast.es/abc123\n")).toEqual(expected);
  });

  it("rebuilds the URL from the paste id only", () => {
    // Nothing the user typed beyond the id can reach the outbound request.
    const result = normalizePokePasteUrl("https://www.pokepast.es/abc123/raw/?x=1#f");
    expect(result?.rawUrl).toBe(`https://${POKEPASTE_HOST}/abc123/raw`);
  });

  // ── SSRF rejections ──────────────────────────────────────────
  it("rejects the pokepast.es.evil.com lookalike", () => {
    expect(normalizePokePasteUrl("https://pokepast.es.evil.com/abc123")).toBeNull();
    expect(isPokePasteUrl("https://pokepast.es.evil.com/abc123")).toBe(false);
  });

  it("rejects other hosts that merely mention pokepast.es", () => {
    expect(normalizePokePasteUrl("https://evil.com/pokepast.es/abc123")).toBeNull();
    expect(normalizePokePasteUrl("https://evil.com/?u=https://pokepast.es/abc")).toBeNull();
    expect(normalizePokePasteUrl("https://evil-pokepast.es/abc123")).toBeNull();
  });

  it("rejects credentials that make another host look like pokepast.es", () => {
    // hostname here is evil.com, not pokepast.es
    expect(normalizePokePasteUrl("https://pokepast.es@evil.com/abc123")).toBeNull();
    // hostname is pokepast.es but the userinfo is a red flag; refuse it too
    expect(normalizePokePasteUrl("https://evil.com@pokepast.es/abc123")).toBeNull();
  });

  it("rejects internal addresses and non-web schemes", () => {
    expect(normalizePokePasteUrl("http://localhost/abc123")).toBeNull();
    expect(normalizePokePasteUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(normalizePokePasteUrl("file:///etc/passwd")).toBeNull();
    expect(normalizePokePasteUrl("gopher://pokepast.es/abc123")).toBeNull();
    expect(normalizePokePasteUrl("javascript:alert(1)")).toBeNull();
    expect(normalizePokePasteUrl("data:text/plain,hello")).toBeNull();
  });

  it("rejects non-default ports", () => {
    expect(normalizePokePasteUrl("https://pokepast.es:8080/abc123")).toBeNull();
  });

  it("rejects paths that are not a single paste id", () => {
    expect(normalizePokePasteUrl("https://pokepast.es/")).toBeNull();
    expect(normalizePokePasteUrl("https://pokepast.es")).toBeNull();
    expect(normalizePokePasteUrl("https://pokepast.es/abc123/extra/segments")).toBeNull();
    expect(normalizePokePasteUrl("https://pokepast.es/abc 123")).toBeNull();
  });

  it("resolves traversal before validating, so it cannot escape the host", () => {
    // `new URL` collapses `..` before we look at the path, so traversal can
    // only ever land on another path of the same allowed host — never on a
    // different host. Multi-segment leftovers are still rejected.
    expect(normalizePokePasteUrl("https://pokepast.es/../../etc/passwd")).toBeNull();
    // Collapses to `/evil`: still pokepast.es, so it is a normal (harmless) id.
    expect(normalizePokePasteUrl("https://pokepast.es/abc123/../../evil")?.rawUrl).toBe(
      "https://pokepast.es/evil/raw",
    );
    // Traversal never rewrites the host.
    expect(normalizePokePasteUrl("https://pokepast.es/..%2f..%2fevil.com")).toBeNull();
  });

  it("rejects empty input and Showdown paste text", () => {
    expect(normalizePokePasteUrl("")).toBeNull();
    expect(normalizePokePasteUrl("   ")).toBeNull();
    expect(
      normalizePokePasteUrl("Miraidon @ Choice Specs\nAbility: Hadron Engine\nEVs: 4 HP"),
    ).toBeNull();
    expect(normalizePokePasteUrl("Incineroar")).toBeNull();
  });
});

describe("error taxonomy", () => {
  it("maps proxy statuses onto distinct kinds", () => {
    expect(errorKindForStatus(404)).toBe("not-found");
    expect(errorKindForStatus(429)).toBe("rate-limited");
    expect(errorKindForStatus(504)).toBe("timeout");
    expect(errorKindForStatus(400)).toBe("invalid-url");
    expect(errorKindForStatus(502)).toBe("upstream");
    expect(errorKindForStatus(500)).toBe("upstream");
  });

  it("gives every kind its own human-readable message", () => {
    const kinds = [
      "invalid-url",
      "not-found",
      "rate-limited",
      "timeout",
      "upstream",
      "empty-team",
    ] as const;
    const messages = kinds.map(pokePasteErrorMessage);
    // Distinct, non-empty, and not a generic catch-all.
    expect(new Set(messages).size).toBe(kinds.length);
    for (const message of messages) {
      expect(message.length).toBeGreaterThan(10);
      expect(message.toLowerCase()).not.toContain("something went wrong");
    }
  });

  it("PokePasteImportError carries its kind and default message", () => {
    const err = new PokePasteImportError("not-found");
    expect(err).toBeInstanceOf(Error);
    expect(err.kind).toBe("not-found");
    expect(err.message).toBe(pokePasteErrorMessage("not-found"));
  });
});
