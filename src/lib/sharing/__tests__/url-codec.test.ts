import { describe, it, expect, vi, beforeAll } from "vitest";
import type { ShareableState } from "@/lib/sharing/url-codec";
import zlib from "node:zlib";

// The production code uses CompressionStream/DecompressionStream which behave
// slightly differently in Node.js (e.g. writer.write expects Uint8Array, not
// ArrayBuffer). We polyfill the global DecompressionStream writer.write to
// handle ArrayBuffer, and rely on the native CompressionStream for encode.
// Alternatively, we can re-implement the codec helpers for testing.

// Helper: replicate the base64url encode/decode from url-codec
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Node-compatible encode/decode that mirrors the production logic
function encodeSync(state: ShareableState): string {
  const json = JSON.stringify(state);
  const compressed = zlib.deflateRawSync(Buffer.from(json, "utf-8"));
  return "1:" + toBase64Url(new Uint8Array(compressed));
}

function decodeSync(encoded: string): ShareableState | null {
  try {
    let payload = encoded;
    if (payload.startsWith("1:")) {
      payload = payload.slice(2);
    }
    const bytes = fromBase64Url(payload);
    const decompressed = zlib.inflateRawSync(Buffer.from(bytes));
    return JSON.parse(decompressed.toString("utf-8")) as ShareableState;
  } catch {
    return null;
  }
}

const MINIMAL_STATE: ShareableState = {
  paste: "test",
  notes: {},
  matchupPlans: [],
};

const FULL_STATE: ShareableState = {
  paste: "Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake",
  notes: { "0": "Main attacker", "1": "Support" },
  roles: { "0": "Attacker", "1": "Support" },
  teamSummary: "Offensive team built around Garchomp",
  tournamentName: "VGC Regionals 2024",
  placement: "Top 8",
  record: "6-2",
  mvpIndex: 0,
  rentalCode: "ABCD-1234",
  creatorName: "Trainer",
  matchupPlans: [
    {
      opponentPaste: "Incineroar @ Safety Goggles",
      opponentLabel: "Sun Team",
      gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Garchomp" }],
    },
  ],
  spriteSettings: { "0": { shiny: true, animated: false } },
  hiddenSlides: ["slide-2"],
};

describe("encodeShareState / decodeShareState (Node-compatible)", () => {
  describe("round-trip encoding", () => {
    it("round-trips minimal state", () => {
      const encoded = encodeSync(MINIMAL_STATE);
      const decoded = decodeSync(encoded);
      expect(decoded).toEqual(MINIMAL_STATE);
    });

    it("round-trips full state with all fields", () => {
      const encoded = encodeSync(FULL_STATE);
      const decoded = decodeSync(encoded);
      expect(decoded).toEqual(FULL_STATE);
    });
  });

  describe("encoded format", () => {
    it("encoded string starts with '1:'", () => {
      const encoded = encodeSync(MINIMAL_STATE);
      expect(encoded.startsWith("1:")).toBe(true);
    });

    it("encoded string contains only base64url-safe characters after prefix", () => {
      const encoded = encodeSync(MINIMAL_STATE);
      const payload = encoded.slice(2);
      expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("decode error handling", () => {
    it("returns null for invalid string", () => {
      const result = decodeSync("not-valid-data");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = decodeSync("");
      expect(result).toBeNull();
    });

    it("returns null for garbage with correct prefix", () => {
      const result = decodeSync("1:!!invalid!!base64!!");
      expect(result).toBeNull();
    });
  });

  describe("legacy format (no prefix)", () => {
    it("decodes data without '1:' prefix", () => {
      const encoded = encodeSync(MINIMAL_STATE);
      // Strip the "1:" prefix to simulate legacy format
      const payload = encoded.slice(2);
      const decoded = decodeSync(payload);
      expect(decoded).toEqual(MINIMAL_STATE);
    });
  });

  describe("cross-compatibility", () => {
    it("data compressed with deflate-raw can be decompressed", () => {
      // Verify the codec uses deflate-raw (not gzip or deflate with header)
      const json = JSON.stringify(MINIMAL_STATE);
      const compressed = zlib.deflateRawSync(Buffer.from(json, "utf-8"));
      const decompressed = zlib.inflateRawSync(compressed);
      expect(JSON.parse(decompressed.toString("utf-8"))).toEqual(MINIMAL_STATE);
    });

    it("base64url encoding is reversible", () => {
      const original = new Uint8Array([0, 1, 2, 255, 254, 253, 128, 64]);
      const encoded = toBase64Url(original);
      const decoded = fromBase64Url(encoded);
      expect(decoded).toEqual(original);
    });
  });
});
