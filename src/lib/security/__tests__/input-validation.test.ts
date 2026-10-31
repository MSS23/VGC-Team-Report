import { describe, it, expect } from "vitest";
import { getClientIp, hasValidContentType } from "@/lib/security/input-validation";

// ---------------------------------------------------------------------------
// getClientIp — client identity used for rate-limit buckets (api-guard.ts) and
// for the anonymous comment-flag identity (api/comments/flag/route.ts).
//
// Regression coverage for C4 security audit Finding 1 (2026-08-10):
// "Spoofable left-most X-Forwarded-For → any comment deletable by an
//  unauthenticated attacker + global rate-limit bypass".
// X-Forwarded-For is append-only, so the LEFT-most entry is attacker-supplied
// and the RIGHT-most is the one appended by our own trusted proxy.
// ---------------------------------------------------------------------------

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/thing", { headers });
}

describe("getClientIp", () => {
  describe("regression: forged left-most X-Forwarded-For must not become the client identity (C4 Finding 1)", () => {
    it("returns the right-most (proxy-appended) entry, not the forged left-most one", () => {
      // Attacker sends "X-Forwarded-For: 1.1.1.1"; Vercel appends the address
      // it actually observed (203.0.113.7).
      const ip = getClientIp(req({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" }));
      expect(ip).toBe("203.0.113.7");
      expect(ip).not.toBe("1.1.1.1");
    });

    it("does not scan leftwards past an unparseable right-most entry", () => {
      // Appending junk must not let the caller reinstate the spoof by falling
      // back to an earlier, client-controlled entry.
      const ip = getClientIp(req({ "x-forwarded-for": "1.1.1.1, not-an-ip" }));
      expect(ip).not.toBe("1.1.1.1");
    });

    it("gives the SAME identity however many entries the attacker prepends — three forged flags can no longer delete a comment", () => {
      const real = "203.0.113.7";
      const forged = [
        getClientIp(req({ "x-forwarded-for": `1.1.1.1, ${real}` })),
        getClientIp(req({ "x-forwarded-for": `2.2.2.2, ${real}` })),
        getClientIp(req({ "x-forwarded-for": `3.3.3.3, 4.4.4.4, ${real}` })),
      ];
      expect(new Set(forged).size).toBe(1);
      expect(forged[0]).toBe(real);
    });
  });

  describe("header precedence", () => {
    it("prefers x-real-ip (set by the Vercel proxy) over any x-forwarded-for entry", () => {
      const ip = getClientIp(
        req({
          "x-forwarded-for": "1.1.1.1, 203.0.113.7",
          "x-real-ip": "198.51.100.9",
        }),
      );
      expect(ip).toBe("198.51.100.9");
    });

    it("prefers x-vercel-forwarded-for over x-real-ip and x-forwarded-for", () => {
      const ip = getClientIp(
        req({
          "x-vercel-forwarded-for": "192.0.2.44",
          "x-real-ip": "198.51.100.9",
          "x-forwarded-for": "1.1.1.1, 203.0.113.7",
        }),
      );
      expect(ip).toBe("192.0.2.44");
    });

    it("falls through to x-forwarded-for when x-real-ip is not a valid IP", () => {
      const ip = getClientIp(
        req({ "x-real-ip": "not-an-ip", "x-forwarded-for": "203.0.113.7" }),
      );
      expect(ip).toBe("203.0.113.7");
    });
  });

  describe("single-entry and normalization", () => {
    it("returns a single-entry x-forwarded-for as-is", () => {
      expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
    });

    it("tolerates whitespace around the right-most entry", () => {
      expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1,   203.0.113.7  " }))).toBe(
        "203.0.113.7",
      );
    });

    it("strips a trailing port from the right-most IPv4 entry", () => {
      expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1, 203.0.113.7:8080" }))).toBe(
        "203.0.113.7",
      );
    });

    it("unwraps a bracketed IPv6 right-most entry", () => {
      expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1, [2001:db8::1]:443" }))).toBe(
        "2001:db8::1",
      );
    });

    it("rejects an out-of-range IPv4 octet", () => {
      expect(getClientIp(req({ "x-forwarded-for": "999.1.1.1" }))).not.toBe("999.1.1.1");
    });
  });

  describe("fallback when no IP header is present", () => {
    it("falls back to a header fingerprint", () => {
      const ip = getClientIp(
        req({ "user-agent": "Mozilla/5.0 (Test)", "accept-language": "en-GB" }),
      );
      expect(ip).toBe("fp:Mozilla/5.0 (Test)|en-GB");
    });

    it("returns 'unknown' when nothing identifying is present", () => {
      expect(getClientIp(new Request("http://localhost/api/thing"))).toBe("unknown");
    });

    it("falls back rather than trusting a spoofed header when every XFF entry is junk", () => {
      const ip = getClientIp(
        req({ "x-forwarded-for": "garbage, junk", "user-agent": "UA" }),
      );
      expect(ip).toBe("fp:UA");
    });
  });
});

describe("hasValidContentType", () => {
  it("accepts application/json with a charset", () => {
    expect(
      hasValidContentType(req({ "content-type": "application/json; charset=utf-8" })),
    ).toBe(true);
  });

  it("rejects a missing content-type", () => {
    expect(hasValidContentType(new Request("http://localhost/api/thing"))).toBe(false);
  });
});
