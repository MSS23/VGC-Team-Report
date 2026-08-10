import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
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

// Same wire format as encodeSync, but accepts arbitrary JSON so tests can build
// payloads that are structurally valid yet fail schema validation.
function encodeRaw(value: unknown): string {
  const compressed = zlib.deflateRawSync(Buffer.from(JSON.stringify(value), "utf-8"));
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

// ---------------------------------------------------------------------------
// VGC-256: zod moved out of the eager client bundle. `url-codec.ts` now loads
// `url-codec.schemas.ts` with a dynamic `import()` inside `decodeShareState`.
// The block above exercises a Node re-implementation of the codec; these tests
// drive the REAL exported `decodeShareState` so the schema validation and the
// new async boundary are actually covered.
// ---------------------------------------------------------------------------

/**
 * Node's `DecompressionStream` writer rejects a raw `ArrayBuffer` (it wants a
 * TypedArray), while browsers accept it — and production passes `bytes.buffer`.
 * Wrap the global so the real production code path can run under vitest.
 */
function installNodeCompatDecompressionStream() {
  const Native = globalThis.DecompressionStream;
  class NodeCompatDecompressionStream {
    readable: ReadableStream<Uint8Array>;
    writable: { getWriter: () => { write: (c: unknown) => Promise<void>; close: () => Promise<void> } };
    constructor(format: CompressionFormat) {
      const inner = new Native(format);
      this.readable = inner.readable as ReadableStream<Uint8Array>;
      const innerWritable = inner.writable;
      this.writable = {
        getWriter() {
          const writer = innerWritable.getWriter();
          // Production fires write()/close() without awaiting and relies on the
          // READABLE side rejecting to signal a corrupt payload. Under Node's
          // webstreams adapter the writable side also rejects (Z_BUF_ERROR),
          // which surfaces as an unhandled rejection in the test runner even
          // though the browser path is unaffected. Swallow it here — the
          // reader's rejection is what `decodeShareState` actually catches.
          const swallow = (p: Promise<void>) => {
            p.catch(() => {});
            return p;
          };
          return {
            write: (chunk: unknown) =>
              swallow(
                writer.write(
                  (chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk) as BufferSource,
                ),
              ),
            close: () => swallow(writer.close()),
          };
        },
      };
    }
  }
  globalThis.DecompressionStream =
    NodeCompatDecompressionStream as unknown as typeof globalThis.DecompressionStream;
  return () => {
    globalThis.DecompressionStream = Native;
  };
}

describe("decodeShareState (real implementation, lazy zod)", () => {
  let restoreDecompressionStream: () => void;
  let decodeShareState: (encoded: string) => Promise<ShareableState | null>;

  beforeAll(async () => {
    restoreDecompressionStream = installNodeCompatDecompressionStream();
    ({ decodeShareState } = await import("@/lib/sharing/url-codec"));
  });

  afterAll(() => {
    restoreDecompressionStream();
  });

  it("is async — returns a promise that resolves", () => {
    const pending = decodeShareState(encodeSync(MINIMAL_STATE));
    expect(pending).toBeInstanceOf(Promise);
    return expect(pending).resolves.toEqual(MINIMAL_STATE);
  });

  it("round-trips a valid share payload", async () => {
    await expect(decodeShareState(encodeSync(MINIMAL_STATE))).resolves.toEqual(MINIMAL_STATE);
    await expect(decodeShareState(encodeSync(FULL_STATE))).resolves.toEqual(FULL_STATE);
  });

  it("round-trips a legacy payload with no '1:' version prefix", async () => {
    const legacy = encodeSync(FULL_STATE).slice(2);
    await expect(decodeShareState(legacy)).resolves.toEqual(FULL_STATE);
  });

  it("resolves on repeated calls (the lazily-imported schema module is reused)", async () => {
    const encoded = encodeSync(MINIMAL_STATE);
    const [a, b, c] = await Promise.all([
      decodeShareState(encoded),
      decodeShareState(encoded),
      decodeShareState(encoded),
    ]);
    expect(a).toEqual(MINIMAL_STATE);
    expect(b).toEqual(MINIMAL_STATE);
    expect(c).toEqual(MINIMAL_STATE);
  });

  it("rejects a corrupt base64 payload with null", async () => {
    await expect(decodeShareState("1:!!invalid!!base64!!")).resolves.toBeNull();
    await expect(decodeShareState("not-valid-data")).resolves.toBeNull();
    await expect(decodeShareState("")).resolves.toBeNull();
  });

  it("rejects a payload that decompresses but fails schema validation with null", async () => {
    // Well-formed deflate + JSON, but `paste` is missing and `matchupPlans` is
    // the wrong type — safeParse must reject rather than leak it to the viewer.
    const bad = encodeRaw({ notes: {}, matchupPlans: "nope" });
    await expect(decodeShareState(bad)).resolves.toBeNull();
  });

  it("rejects non-object JSON with null", async () => {
    await expect(decodeShareState(encodeRaw("just a string"))).resolves.toBeNull();
    await expect(decodeShareState(encodeRaw(null))).resolves.toBeNull();
  });

  it("still decodes legacy links carrying the removed `replays` key (keys are stripped, not rejected)", async () => {
    const withLegacyKey = encodeRaw({ ...MINIMAL_STATE, replays: ["https://example.com/r/1"] });
    await expect(decodeShareState(withLegacyKey)).resolves.toEqual(MINIMAL_STATE);
  });
});
