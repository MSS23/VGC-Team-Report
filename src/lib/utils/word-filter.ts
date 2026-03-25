// Basic profanity/slur filter. This is a minimal list — extend as needed.
// Patterns are tested as whole words (word boundaries) to reduce false positives.
const BLOCKED_PATTERNS = [
  /\bass(?:hole)?\b/i,
  /\bbitch\b/i,
  /\bbastard\b/i,
  /\bcunt\b/i,
  /\bdick(?:head)?\b/i,
  /\bfag(?:got)?\b/i,
  /\bfuck(?:ing|er|ed|s)?\b/i,
  /\bn[i1]gg(?:a|er|ers)?\b/i,
  /\bsh[i1]t(?:ty|head|s)?\b/i,
  /\bslut\b/i,
  /\bwh[o0]re\b/i,
  /\bretard(?:ed)?\b/i,
  /\bk[iy]s\b/i,
  /\bkill\s*your\s*self\b/i,
  /\bdie\s+irl\b/i,
  /\bstfu\b/i,
  /\bgtfo\b/i,
];

/** Returns true if the text contains blocked words. */
export function containsBlockedWords(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}
