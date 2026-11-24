// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEYS,
  STORAGE_KEY_BUILDERS,
  readStorage,
  readStorageJSON,
  removeStorage,
  writeStorage,
  writeStorageJSON,
} from "@/lib/utils/safe-storage";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function blockStorage() {
  const err = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(err);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(err);
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(err);
}

describe("safe-storage strings", () => {
  it("round-trips and removes", () => {
    expect(writeStorage("k", "v")).toBe(true);
    expect(readStorage("k")).toBe("v");
    expect(removeStorage("k")).toBe(true);
    expect(readStorage("k")).toBeNull();
  });

  it("swallows blocked storage", () => {
    blockStorage();
    expect(readStorage("k")).toBeNull();
    expect(writeStorage("k", "v")).toBe(false);
    expect(removeStorage("k")).toBe(false);
  });
});

describe("safe-storage JSON", () => {
  it("parses stored JSON", () => {
    localStorage.setItem("k", '{"a":1}');
    expect(readStorageJSON("k", {})).toEqual({ a: 1 });
  });

  it("returns the fallback for missing, empty, bad or unreadable values", () => {
    const fallback = { roles: {} };
    expect(readStorageJSON("missing", fallback)).toBe(fallback);
    localStorage.setItem("empty", "");
    expect(readStorageJSON("empty", fallback)).toBe(fallback);
    localStorage.setItem("bad", "{nope");
    expect(readStorageJSON("bad", fallback)).toBe(fallback);
    blockStorage();
    expect(readStorageJSON("bad", fallback)).toBe(fallback);
  });

  it("writes the same string as the inline JSON.stringify call", () => {
    expect(writeStorageJSON("k", ["a", "b"])).toBe(true);
    expect(localStorage.getItem("k")).toBe('["a","b"]');
  });

  it("reports quota and stringify failures", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(writeStorageJSON("k", cyclic)).toBe(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(writeStorageJSON("k", { a: 1 })).toBe(false);
  });
});

// Changing any of these orphans users' saved data, so pin them verbatim.
describe("storage key strings", () => {
  it("match the inline keys exactly", () => {
    expect(STORAGE_KEYS).toMatchInlineSnapshot(`
      {
        "championsBannerDismissed": "vgc-champions-banner-dismissed",
        "darkMode": "vgc-dark-mode",
        "displayName": "vgc-display-name",
        "draftId": "vgc-draft-id",
        "genTheme": "vgc-gen-theme",
        "hasVisited": "vgc-has-visited",
        "hideStatColorNote": "vgc.display.hideStatColorNote",
        "installDismissed": "vgc-install-dismissed",
        "internalUser": "vgc-internal-user",
        "notificationPreferencesLegacy": "vgc-notification-preferences",
        "pasteHintSeen": "vgc-paste-hint-seen",
        "pushOwner": "vgc-push-owner",
        "reportLang": "vgc-report-lang",
        "sessionId": "vgc-session-id",
        "shareTokens": "vgc-share-tokens",
        "swipeHintSeen": "vgc-swipe-hint-seen",
        "teamPaste": "vgc-team-paste-v2",
        "teamPastePublished": "vgc-team-paste-published-v2",
        "teamPasteSavedAt": "vgc-team-paste-saved-at-v2",
        "teamPasteSource": "vgc-team-paste-source-v2",
        "visited": "vgc-visited",
        "walkthroughSeen": "vgc-walkthrough-seen",
        "whatsNewSeen": "vgc-whats-new-v10",
      }
    `);
  });

  it("builds per-team keys from sorted species, like the hooks do", () => {
    const team = ["incineroar", "amoonguss"];
    expect(STORAGE_KEY_BUILDERS.calcs(team)).toBe("vgc-calcs-v2-amoonguss,incineroar");
    expect(STORAGE_KEY_BUILDERS.meta(team)).toBe("vgc-meta-v2-amoonguss,incineroar");
    expect(STORAGE_KEY_BUILDERS.notes(team)).toBe("vgc-notes-v2-amoonguss,incineroar");
    expect(STORAGE_KEY_BUILDERS.matchupPlans(team)).toBe("vgc-matchup-plans-v2-amoonguss,incineroar");
    expect(STORAGE_KEY_BUILDERS.hiddenSlides(team)).toBe("vgc-hidden-slides-v2-amoonguss,incineroar");
    expect(team).toEqual(["incineroar", "amoonguss"]);
    expect(STORAGE_KEY_BUILDERS.shareCtaDismissed("abc")).toBe("vgc-share-cta-dismissed:abc");
  });
});
