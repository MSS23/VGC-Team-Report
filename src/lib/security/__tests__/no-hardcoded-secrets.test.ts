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
// (Nov 2026: a full-history blob sweep found that single blob and no other credential
// shape; Discord returns "Unknown Webhook" for it, so that leaked webhook is dead.)
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
 *
 * GAP-3 (security audit, 23 Nov 2026): the `abcdef` and `1234567890` alternatives used to
 * be UNANCHORED, so any real token that merely *contained* one of those runs was silently
 * whitelisted — a `lin_api_` key with `abcdef` somewhere in the middle returned true here
 * and was skipped. Both are now `\b`-anchored, so they only match filler that stands as
 * its own word (`abcdef-abcdef-…`, `id-1234567890`), which is the only form documentation
 * actually uses. Every other alternative is already either anchored or unambiguous.
 */
const PLACEHOLDER =
  /x{4,}|\.\.\.|<[^>]{0,80}>|\byour[-_]|\bchange[-_]?me\b|\bplaceholder\b|\bexample\b|\bredacted\b|\bdummy\b|\bfake\b|\bsample\b|\bhere\b|\bTODO\b|process\.env|0{8,}|\b1234567890\b|\babcdef\b/i;

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
    // VGC-350. `web-push` is a prod dependency (src/lib/web-push.ts reads this key from
    // the env; src/app/api/user/push/* sends with it), so a committed VAPID private key
    // would let anyone push notifications to every subscriber.
    //
    // A VAPID private key is a P-256 scalar: 32 bytes base64url == exactly 43 chars (44
    // with `=` padding). The matching PUBLIC key is 65 bytes == 87-88 chars and is
    // legitimately shipped to the browser, so the length is PINNED rather than open-ended
    // and the identifier must itself say `private` — a public key can reach neither half
    // of this rule. `VAPID_PRIVATE_KEY=` (empty, as in .env.example) has no value to
    // match, and the quote is optional because env files write `NAME=value` bare.
    name: "vapid-private-key",
    pattern: /vapid[_-]?private[_-]?key[A-Za-z0-9_-]*\s*[:=]\s*["'`]?([A-Za-z0-9_-]{43}=?)(?![A-Za-z0-9_-])/gi,
    verify: (m) => looksHighEntropy(m[1]),
  },
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
    // or a React key far more often than a credential. `private[_-]?key` IS included
    // (VGC-350): `VAPID_PRIVATE_KEY` contains none of the other words, so before it was
    // added this rule could not see the one secret the repo names that way. It cannot
    // match a PEM banner (`-----BEGIN PRIVATE KEY-----`) because of the space.
    //
    // GAP-2 (security audit, 23 Nov 2026): the value used to REQUIRE quotes, so every
    // `.env`-shaped line — `NAME=value`, which is exactly the form a real value gets
    // pasted in, and the form `.env.example` is deliberately kept in scope for — was
    // invisible to the only rule that can catch an unprefixed secret. There are now two
    // value forms: quoted anywhere (group 1), or bare and running to end of line / to a
    // `#` comment (group 2). The bare form is line-anchored on purpose: unanchored it
    // would match any long run of value characters following a colon in prose. Both forms
    // stay gated on `looksHighEntropy`, so placeholders still fall out.
    name: "hardcoded-credential-literal",
    pattern:
      /[A-Za-z0-9_]*(?:api[_-]?key|secret|token|password|passwd|bearer|credential|private[_-]?key)[A-Za-z0-9_-]*\s*[:=]\s*(?:["'`]([A-Za-z0-9_\-+/=.]{32,})["'`]|([A-Za-z0-9_\-+/=.]{32,})[ \t\r]*(?=$|#))/gim,
    verify: (m) => looksHighEntropy(m[1] || m[2]),
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

// Every value below is invented filler with the SHAPE of the credential it stands in for
// and none of its meaning: no real key, current or expired, appears in this file. They are
// assembled from fragments at runtime so that this file does not itself contain a
// credential-shaped literal — the scanner runs over its own source.

/** 43 base64url chars: the exact length of a VAPID (P-256) private key. Synthetic. */
const VAPID_SHAPED =
  "7hQ2" + "mZx9" + "Lp4R" + "vB6t" + "Nk1D" + "sY8f" + "Jc3W" + "gT5n" + "wE2u" + "Ri7b" + "zK9";
/** 87 base64url chars: the matching PUBLIC key shape, which is not a secret. Synthetic. */
const VAPID_PUBLIC_SHAPED =
  "B7" + "qZ4mXt9" + "Lw2Rn6Vy" + "Hc1Ps8Kd" + "Jf3Gb5Tz" + "Mq7Nx0Yr" +
  "Wv4Lk2Sd" + "Pe9Hb6Tn" + "Zc3Xm1Qy" + "Rg8Jw5Vk" + "Fd2Ls7Bp" + "Tq4Nz9";
/** Two high-entropy fillers for the unquoted env-assignment fixtures. Synthetic. */
const ENV_SHAPED = "4Tz7" + "qMv2" + "Hb9s" + "Xn5L" + "pR3d" + "Wy8k" + "Ge1c" + "Ju6a";
const ENV_SHAPED_ALT = "6Nf2" + "kQw8" + "Zr4m" + "Ds9t" + "Bv1y" + "Lh7p" + "Xc3g" + "Ae5j" + "Tu0q";
/**
 * Documentation filler in which `abcdef` and `1234567890` stand as their own words — the
 * only form real docs use, and the form the PLACEHOLDER filter must still recognise. It
 * passes `looksHighEntropy`, so a test asserting it is ignored exercises the placeholder
 * filter itself rather than the entropy gate.
 */
const WORD_BOUNDED_FILLER = "abcdef-abcdef-abcdef-1234567890-abcdef";

const FAKE = {
  discord: "https://discord.com/api/webhooks/" + ("41159" + "2088173" + "20401") + "/" + "A1b2".repeat(17),
  linear: "lin_" + "api_" + "9f3c7d2e" + "4b1a6058" + "c7e29d41" + "8ab35f6027d1",
  clerk: "sk_" + "live_" + "7Qb2" + "Xr9m" + "T4kL" + "8vZc" + "1Np6" + "Ys3W" + "5Jd0",
  aws: "AK" + "IA" + "J7QX4M2NB6VKD3PZ",
  jwt: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "eyJzdWIiOiI5MDIxNzc0MSIsIm5hbWUiOiJhIn0", "K7dQ2mXpR4vB9nT6"].join("."),
  postgres: "postgres" + "ql://neondb_owner:" + "npg_8Kq2VxR7mTd4" + "@ep-cool-frost-a4x9.us-east-2.aws.neon.tech/neondb",
  literal: 'const authToken = "' + "9c4Ba7Xq2Ln6Ptv3Rd8Kf1Zy5Mw0Ej7Hs4Qb2Uc6" + '";',
  vapid: "VAPID_PRIVATE_" + "KEY=" + VAPID_SHAPED,
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

  // ── Regression fixtures for the three gaps the 23 Nov 2026 audit reproduced ─────────
  // Each gap let the gate stay green while blind, so each gets a fixture that fails if the
  // gap reopens: a realistic-shaped synthetic secret that MUST be reported, plus a genuine
  // placeholder of the same shape that must NOT be.
  const rulesFor = (text: string) => scanContent("scratch.ts", text).map((f) => f.rule);

  // GAP-1 / VGC-350: there was no VAPID rule at all, so a committed push private key was
  // invisible — and its name matches none of the generic rule's other words either.
  it("detects a hardcoded VAPID private key without firing on the public key", () => {
    expect(rulesFor("VAPID_PRIVATE_" + "KEY=" + VAPID_SHAPED)).toContain("vapid-private-key");
    expect(rulesFor('const vapidPrivateKey = "' + VAPID_SHAPED + '";')).toContain("vapid-private-key");

    // The 87-char public key is served to the browser on purpose (api/user/push), and
    // .env.example carries both names with empty values. Neither may be reported.
    expect(scanContent(".env.example", "VAPID_PUBLIC_" + "KEY=" + VAPID_PUBLIC_SHAPED)).toEqual([]);
    expect(
      scanContent(
        ".env.example",
        ["VAPID_PUBLIC_KEY=", "VAPID_PRIVATE_KEY=", "VAPID_SUBJECT=https://pokemonvgcteamreport.com"].join("\n"),
      ),
    ).toEqual([]);
    expect(scanContent(".env.example", "VAPID_PRIVATE_" + "KEY=<your-vapid-private-key>")).toEqual([]);
  });

  // GAP-2: the generic rule required quotes, so `NAME=value` — the shape a real secret is
  // pasted in, and the shape .env.example is deliberately left in scope for — matched
  // nothing. All five names below returned no match before the fix.
  it("detects unquoted env-shaped secret assignments", () => {
    const names = [
      "CLERK_WEBHOOK_SIGNING_SECRET",
      "POSTHOG_PERSONAL_API_KEY",
      "UPSTASH_REDIS_REST_TOKEN",
      "RESEND_API_KEY",
      "VAPID_PRIVATE_KEY",
    ];
    const missed = names.filter(
      (name) => !rulesFor(name + "=" + ENV_SHAPED_ALT).includes("hardcoded-credential-literal"),
    );
    expect(missed).toEqual([]);
    // Shell `export`, and a trailing inline comment, are both still the same shape.
    expect(rulesFor("export CRON_SECRET=" + ENV_SHAPED + "   # production value")).toContain(
      "hardcoded-credential-literal",
    );

    // The real unquoted placeholders in .env.example must stay silent.
    expect(
      scanContent(
        ".env.example",
        [
          "CLERK_WEBHOOK_SIGNING_SECRET=<your-clerk-webhook-signing-secret>",
          "UPSTASH_REDIS_REST_TOKEN=your-upstash-rest-token",
          "POSTHOG_PERSONAL_API_KEY=<your-posthog-personal-api-key>",
          "POSTHOG_WEBHOOK_SECRET=your-posthog-webhook-secret",
          "CRON_SECRET=your-cron-secret-here",
          "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_xxxxxxxxxxxxxxxxxxxxxxxx",
          "DISCORD_BOT_TOKEN=your-discord-bot-token",
        ].join("\n"),
      ),
    ).toEqual([]);
  });

  // GAP-3: `abcdef` / `1234567890` were unanchored in PLACEHOLDER, so any real token
  // CONTAINING either run was silently whitelisted. The audit reproduced it with a
  // Linear-shaped key; this fixture is the same shape with invented digits.
  it("does not whitelist a real-shaped token that merely contains abcdef", () => {
    const linearWithEmbeddedFiller =
      "lin_" + "api_" + "5d82f7c3" + "9b41e60a" + "abcdef72" + "c4e19d38" + "8af25b61";
    expect(rulesFor('const key = "' + linearWithEmbeddedFiller + '";')).toContain("linear-api-key");
    const tokenWithEmbeddedDigits = "AUTH_TOKEN=" + "Kq7" + "1234567890" + "Ve4Rm9Zt2Ls6Bx3Pn8Wd5Yj";
    expect(rulesFor(tokenWithEmbeddedDigits)).toContain("hardcoded-credential-literal");

    // Filler standing as its own word is still documentation, and still ignored.
    expect(scanContent("docs/setup.md", "AUTH_TOKEN=" + WORD_BOUNDED_FILLER)).toEqual([]);
    expect(scanContent("docs/setup.md", 'const apiKey = "' + WORD_BOUNDED_FILLER + '";')).toEqual([]);
  });
});
