import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// SEC-GUARD: regression gate for a real incident.
//
// A live Discord webhook (18-digit channel id + 68-char token) was hardcoded as a
// fallback in the feedback route and committed to this PUBLIC repo in 5da513a. It was
// deleted from the working tree in 28f5b8b, which did NOT remove it from history — the
// blob is still extractable by anyone who clones. Nothing in CI would have stopped it,
// and nothing would stop the next one. This test is that gate.
//
// SCOPE: this scans the tracked WORKING TREE only, because that is what a pre-merge
// check can actually block. It intentionally does not scan history — too slow for CI,
// and a leak already in history needs rotation, not a red test.
//
// METHODOLOGY PITFALL (recorded so nobody repeats it): auditing history with
// `git grep --all` produces FALSE NEGATIVES. It searches the tree at each ref tip, so a
// secret added and later removed is invisible to it — exactly the 5da513a case, which it
// reported clean. The only reliable history sweep enumerates every blob:
//     git rev-list --objects --all | ... | git cat-file --batch
//
// DESIGN RULE: failures report file and line ONLY, never the matched value. This output
// lands in public CI logs; echoing the secret there would leak it a second time.

/** Extensions whose contents are binary/opaque — nothing greppable, only noise. */
const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|eot|pdf|zip|mp4)$/i;

/**
 * Placeholder and documentation forms. `.env.example` and the `.swarm/` audit notes are
 * deliberately NOT path-excluded — they are exactly where a real value gets pasted by
 * accident — so instead we recognise the fake shapes they legitimately contain:
 * `xxxx`, `<your-clerk-webhook-signing-secret>`, `your-posthog-webhook-secret`, `...`.
 */
const PLACEHOLDER =
  /x{4,}|\.\.\.|<[^>]{0,80}>|\byour[-_]|\bchange[-_]?me\b|\bplaceholder\b|\bexample\b|\bredacted\b|\bdummy\b|\bfake\b|\bsample\b|\bhere\b|\bTODO\b|process\.env|0{8,}|1234567890|abcdef/i;

/**
 * Rules are deliberately shape-specific. There is NO generic "long hex string" rule,
 * because that shape is not a credential in this repo and never can be trusted:
 *   - src/app/api/discord/route.ts:7 holds DISCORD_PUBLIC_KEY, a 64-hex Ed25519
 *     *public* verification key. It is published by Discord, is meant to be in source,
 *     and is not a credential.
 *   - src/lib/data/__tests__/dex-subset.test.ts holds three 64-hex SHA-256 fixtures.
 * Both are indistinguishable from a hex secret by shape alone, so rather than carve out
 * path exceptions (which rot, and which would also blind the scanner to a genuine hex
 * secret in those files) the hex shape is simply not a rule. Every rule below keys off a
 * vendor-specific prefix or structure that a public key or a digest cannot produce.
 *
 * Likewise absent: PostHog `phc_` project keys, which are public by design and ship to
 * the browser in NEXT_PUBLIC_POSTHOG_KEY.
 */
const RULES: ReadonlyArray<{ name: string; pattern: RegExp; verify?: (m: RegExpExecArray) => boolean }> = [
  {
    // The incident shape. `xxxx` placeholders in .env.example cannot reach this rule:
    // the id group requires 17-20 literal digits.
    name: "discord-webhook-url",
    pattern: /discord(?:app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{40,}/g,
  },
  { name: "linear-api-key", pattern: /\blin_api_[A-Za-z0-9]{32,}\b/g },
  { name: "clerk-secret-key", pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b/g },
  { name: "aws-access-key-id", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "github-token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/g },
  {
    // Requires header AND payload to start with the base64 of `{"` — a JWT, not prose.
    name: "jwt-literal",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    // Postgres/Neon URL carrying a password. Group 1 is the password.
    name: "postgres-connection-string",
    pattern: /postgres(?:ql)?:\/\/[^\s:@/'"]+:([^\s:@/'"]{6,})@[^\s/'"]+/g,
    // `postgresql://user:password@host/database` in .env.example survives the placeholder
    // filter (the word "password" is not in it), so reject pure-alphabetic passwords:
    // real generated credentials mix classes, dictionary words are always documentation.
    verify: (m) => !/^[A-Za-z]+$/.test(m[1]),
  },
  {
    // Generic assignment of a high-entropy literal to a secret-named identifier. The
    // secret word may sit anywhere in the identifier, so `authToken` and `DISCORD_SECRET`
    // both match. The alternation deliberately excludes a bare `key`, which in this repo
    // means an HTTP header name (next.config.ts: `key: "X-Permitted-Cross-Domain-Policies"`)
    // or a React key far more often than a credential.
    name: "hardcoded-credential-literal",
    pattern:
      /[A-Za-z0-9_]*(?:api[_-]?key|secret|token|password|passwd|bearer|credential)[A-Za-z0-9_-]*\s*[:=]\s*["'`]([A-Za-z0-9_\-+/=.]{32,})["'`]/gi,
    verify: (m) => looksHighEntropy(m[1]),
  },
];

/** Shannon entropy in bits per character. */
function shannon(value: string): number {
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let bits = 0;
  for (const n of counts.values()) {
    const p = n / value.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

/**
 * A credential-shaped literal: long, mixes letters and digits, and is not a repetitive
 * or low-variety string. Filters out kebab-case identifiers, long class-name strings and
 * padded placeholders, all of which are common in this codebase.
 */
function looksHighEntropy(value: string): boolean {
  if (value.length < 32) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (new Set(value).size < 12) return false;
  return shannon(value) >= 3.5;
}

export interface SecretFinding {
  file: string;
  line: number;
  rule: string;
}

/** Scan one file's text. Returns findings WITHOUT the matched value — see DESIGN RULE. */
function scanContent(file: string, text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(text)) !== null) {
      if (PLACEHOLDER.test(match[0])) continue;
      if (rule.verify && !rule.verify(match)) continue;
      findings.push({
        file,
        line: text.slice(0, match.index).split("\n").length,
        rule: rule.name,
      });
    }
  }
  return findings;
}

function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
}

function scanTrackedTree(): SecretFinding[] {
  const root = process.cwd();
  const findings: SecretFinding[] = [];
  for (const file of trackedFiles()) {
    if (BINARY_EXTENSIONS.test(file)) continue;
    let buffer: Buffer;
    try {
      buffer = readFileSync(join(root, file));
    } catch {
      continue; // deleted-but-still-indexed; not our problem to report
    }
    if (buffer.includes(0)) continue; // NUL byte => binary, regardless of extension
    findings.push(...scanContent(file, buffer.toString("utf8")));
  }
  return findings;
}

// Fixtures are assembled from fragments at runtime so that this file does not itself
// contain a credential-shaped literal — the scanner runs over its own source.
const FAKE = {
  discord: "https://discord.com/api/webhooks/" + ("41159" + "2088173" + "20401") + "/" + "A1b2".repeat(17),
  linear: "lin_" + "api_" + "9f3c7d2e" + "4b1a6058" + "c7e29d41" + "8ab35f6027d1",
  clerk: "sk_" + "live_" + "7Qb2" + "Xr9m" + "T4kL" + "8vZc" + "1Np6" + "Ys3W" + "5Jd0",
  aws: "AK" + "IA" + "J7QX4M2NB6VKD3PZ",
  jwt: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "eyJzdWIiOiI5MDIxNzc0MSIsIm5hbWUiOiJhIn0", "K7dQ2mXpR4vB9nT6"].join("."),
  postgres: "postgres" + "ql://neondb_owner:" + "npg_8Kq2VxR7mTd4" + "@ep-cool-frost-a4x9.us-east-2.aws.neon.tech/neondb",
  literal: 'const authToken = "' + "9c4Ba7Xq2Ln6Ptv3Rd8Kf1Zy5Mw0Ej7Hs4Qb2Uc6" + '";',
};

describe("no hardcoded secrets in the tracked tree", () => {
  it("finds no real credentials in any tracked, non-binary file", () => {
    const offenders = scanTrackedTree().map((f) => `${f.file}:${f.line} [${f.rule}]`);
    expect(offenders).toEqual([]);
  });

  // Without these, a broken regex would make the gate above pass silently forever.
  it.each(Object.entries(FAKE))("detects a planted %s credential", (_shape, sample) => {
    expect(scanContent("scratch.ts", sample)).not.toEqual([]);
  });

  it("does not fire on the placeholders .env.example legitimately contains", () => {
    const sample = [
      "DATABASE_URL=postgresql://user:password@host/database?sslmode=require",
      "DISCORD_BUILDS_WEBHOOK=https://discord.com/api/webhooks/xxxx/xxxx",
      "CLERK_WEBHOOK_SIGNING_SECRET=<your-clerk-webhook-signing-secret>",
      "POSTHOG_WEBHOOK_SECRET=your-posthog-webhook-secret",
      "DISCORD_BUILDS_WEBHOOK=https://discord.com/api/webhooks/...",
    ].join("\n");
    expect(scanContent(".env.example", sample)).toEqual([]);
  });

  it("does not fire on env references, public keys, digests or header names", () => {
    const sample = [
      'const token = process.env.LINEAR_API_KEY ?? "";',
      // Discord's Ed25519 public verification key (src/app/api/discord/route.ts) —
      // published by Discord, safe in source, and not matched by any rule.
      'const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";',
      // SHA-256 fixture from src/lib/data/__tests__/dex-subset.test.ts.
      'const SPECIES_ID_HASH = "6432fb323d2daf3726360981b36b0927d95f98d0846f265d4d8e6c613fe8e6e2";',
      'key: "X-Permitted-Cross-Domain-Policies",',
      'const secretLabel = "team-report-share-visibility-control";',
    ].join("\n");
    expect(scanContent("sample.ts", sample)).toEqual([]);
  });
});
