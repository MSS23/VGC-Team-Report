/**
 * SSR-safe localStorage access that swallows the same failures the inline
 * call sites swallow today: no `window` (server render), storage blocked
 * (private browsing, disabled site data — access throws SecurityError),
 * quota exceeded on write, and unparseable JSON on read.
 *
 * Writes return whether they succeeded, for the few call sites that branch
 * on a failed write.
 */

/**
 * Every fixed localStorage key the app uses, copied verbatim from the code.
 * Never rename a value: users' saved data lives under these exact strings.
 */
export const STORAGE_KEYS = {
  darkMode: "vgc-dark-mode",
  genTheme: "vgc-gen-theme",
  reportLang: "vgc-report-lang",
  sessionId: "vgc-session-id",
  teamPaste: "vgc-team-paste-v2",
  teamPasteSource: "vgc-team-paste-source-v2",
  teamPastePublished: "vgc-team-paste-published-v2",
  teamPasteSavedAt: "vgc-team-paste-saved-at-v2",
  draftId: "vgc-draft-id",
  shareTokens: "vgc-share-tokens",
  displayName: "vgc-display-name",
  internalUser: "vgc-internal-user",
  pushOwner: "vgc-push-owner",
  notificationPreferencesLegacy: "vgc-notification-preferences",
  hideStatColorNote: "vgc.display.hideStatColorNote",
  installDismissed: "vgc-install-dismissed",
  swipeHintSeen: "vgc-swipe-hint-seen",
  walkthroughSeen: "vgc-walkthrough-seen",
  whatsNewSeen: "vgc-whats-new-v10",
  // Two different keys, both live: WhatsNewModal/PasteInput use `hasVisited`,
  // PasteInput's "How it works" collapse uses `visited`.
  hasVisited: "vgc-has-visited",
  visited: "vgc-visited",
  pasteHintSeen: "vgc-paste-hint-seen",
  championsBannerDismissed: "vgc-champions-banner-dismissed",
} as const;

/** Builders for the per-team and per-share keys, matching the inline templates exactly. */
const teamSuffix = (speciesKeys: string[]) => [...speciesKeys].sort().join(",");
export const STORAGE_KEY_BUILDERS = {
  calcs: (speciesKeys: string[]) => `vgc-calcs-v2-${teamSuffix(speciesKeys)}`,
  meta: (speciesKeys: string[]) => `vgc-meta-v2-${teamSuffix(speciesKeys)}`,
  notes: (speciesKeys: string[]) => `vgc-notes-v2-${teamSuffix(speciesKeys)}`,
  matchupPlans: (speciesKeys: string[]) => `vgc-matchup-plans-v2-${teamSuffix(speciesKeys)}`,
  hiddenSlides: (speciesKeys: string[]) => `vgc-hidden-slides-v2-${teamSuffix(speciesKeys)}`,
  shareCtaDismissed: (shareId: string) => `vgc-share-cta-dismissed:${shareId}`,
} as const;

/** Stored string, or null when absent, on the server, or when storage throws. */
export function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parsed JSON, or `fallback` when the value is missing, empty, unparseable or
 * unreadable — the `stored ? JSON.parse(stored) : fallback` + catch pattern.
 * The result is not validated; callers that migrate or check shape still must.
 */
export function readStorageJSON<T>(key: string, fallback: T): T {
  const stored = readStorage(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

/** JSON.stringify then write; false on failure (including a value that cannot be stringified). */
export function writeStorageJSON(key: string, value: unknown): boolean {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }
  return writeStorage(key, serialized);
}
