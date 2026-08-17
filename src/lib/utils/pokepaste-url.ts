/**
 * PokePaste URL detection, validation and normalisation.
 *
 * Shared by the browser (paste input detects a pasted URL) and the server
 * (`/api/pokepaste` validates the user-supplied URL before fetching it).
 *
 * SECURITY: this is the allowlist that guards a user-supplied-URL fetch, i.e.
 * an SSRF surface. Two rules make it safe:
 *
 *   1. The host is compared for EXACT equality against `pokepast.es` (or its
 *      `www.` alias) after parsing with `new URL()`. A substring or regex
 *      match would be defeated by `pokepast.es.evil.com`, `evil.com/pokepast.es`
 *      or `evil.com?pokepast.es`.
 *   2. Nothing from the user's string is interpolated into the outbound URL.
 *      Only the paste id survives, and only after matching a strict character
 *      class, so path traversal / scheme smuggling cannot escape the host.
 */

/** The one host we will ever make an outbound request to. */
export const POKEPASTE_HOST = "pokepast.es";

/** Paste ids are short alphanumeric slugs; anything else is not a paste. */
const PASTE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Exact-match host allowlist. Compares whole hostnames, never substrings.
 * Accepts the bare host and the `www.` alias; a trailing root dot and casing
 * are normalised away because both resolve to the same host.
 */
export function isAllowedPokePasteHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return host === POKEPASTE_HOST || host === `www.${POKEPASTE_HOST}`;
}

export interface NormalizedPokePasteUrl {
  /** The paste id on its own, e.g. `"abc123"`. */
  id: string;
  /** Canonical page URL — `https://pokepast.es/<id>`. */
  htmlUrl: string;
  /** Canonical plain-text URL — `https://pokepast.es/<id>/raw`. */
  rawUrl: string;
}

/**
 * Parse a user-supplied string into a canonical PokePaste URL, or return
 * `null` if it is not one.
 *
 * Accepts the shapes people actually paste:
 *   - `https://pokepast.es/abc123`
 *   - `http://pokepast.es/abc123`      (upgraded to https — we never fetch http)
 *   - `pokepast.es/abc123`             (no scheme)
 *   - `www.pokepast.es/abc123`
 *   - any of the above with a trailing `/`, `/raw` or `/raw/`
 *   - query strings and fragments, which are dropped
 */
export function normalizePokePasteUrl(input: string): NormalizedPokePasteUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // A Showdown paste contains whitespace/newlines; a URL never does. Bailing
  // early also stops us from prepending a scheme to arbitrary prose.
  if (/\s/.test(trimmed)) return null;

  // Add a scheme only when there is none at all. `//host/path` is treated as
  // scheme-relative, matching browser behaviour.
  const hasScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(trimmed);
  const candidate = hasScheme
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, "")}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  // Only web schemes. `file:`, `gopher:`, `data:` etc. are rejected outright;
  // `http:` is accepted as input but canonicalised to https below, so the
  // request we actually make is always https.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  // Exact host allowlist — see the module comment.
  if (!isAllowedPokePasteHost(parsed.hostname)) return null;

  // Non-default ports are not pokepast.es; refuse them rather than guessing.
  if (parsed.port && parsed.port !== "443" && parsed.port !== "80") return null;

  // Embedded credentials (`https://evil.com@pokepast.es/x`) are never part of
  // a real paste link and only serve to confuse readers of the URL.
  if (parsed.username || parsed.password) return null;

  // Strip a trailing `/raw` (with or without slash) and any trailing slash,
  // then require what remains to be exactly one path segment: the paste id.
  const id = parsed.pathname
    .replace(/\/raw\/?$/i, "")
    .replace(/^\/+|\/+$/g, "");

  if (!PASTE_ID_PATTERN.test(id)) return null;

  // Rebuilt from the validated id only — no user text reaches the wire.
  return {
    id,
    htmlUrl: `https://${POKEPASTE_HOST}/${id}`,
    rawUrl: `https://${POKEPASTE_HOST}/${id}/raw`,
  };
}

/** True when the input is a PokePaste URL we are willing to fetch. */
export function isPokePasteUrl(input: string): boolean {
  return normalizePokePasteUrl(input) !== null;
}

// ── Import failure taxonomy ─────────────────────────────────────
// Every failure mode gets its own message. A generic "something went wrong"
// leaves the user with no idea whether to fix their link or just retry.

export type PokePasteErrorKind =
  | "invalid-url"
  | "not-found"
  | "rate-limited"
  | "timeout"
  | "upstream"
  | "empty-team";

const ERROR_MESSAGES: Record<PokePasteErrorKind, string> = {
  "invalid-url":
    "That doesn't look like a PokePaste link. Expected something like https://pokepast.es/abc123.",
  "not-found":
    "We couldn't find that paste — it may have been deleted, or the link may have a typo.",
  "rate-limited":
    "Too many imports from this connection. Wait a minute and try again.",
  timeout:
    "PokePaste took too long to respond. Try again in a moment, or paste the team text directly.",
  upstream:
    "PokePaste isn't responding right now. Try again shortly, or paste the team text directly.",
  "empty-team":
    "We fetched that paste but found no Pokemon in it. Check the link points to a team export.",
};

export function pokePasteErrorMessage(kind: PokePasteErrorKind): string {
  return ERROR_MESSAGES[kind];
}

/** An import failure carrying the specific reason, for UI messaging. */
export class PokePasteImportError extends Error {
  readonly kind: PokePasteErrorKind;

  constructor(kind: PokePasteErrorKind, message?: string) {
    super(message ?? pokePasteErrorMessage(kind));
    this.name = "PokePasteImportError";
    this.kind = kind;
  }
}

/** Map an HTTP status from our proxy route onto an error kind. */
export function errorKindForStatus(status: number): PokePasteErrorKind {
  if (status === 404) return "not-found";
  if (status === 429) return "rate-limited";
  if (status === 504 || status === 408) return "timeout";
  if (status === 400 || status === 422) return "invalid-url";
  return "upstream";
}
