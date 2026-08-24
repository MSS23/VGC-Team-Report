// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./render-hook";
import { useTeamReport, readRestorableDraft } from "@/hooks/useTeamReport";

const PASTE = "Pikachu @ Light Ball\nAbility: Static\n- Protect";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("useTeamReport paste persistence", () => {
  it("persists a parsed user paste with the 'user' source marker", async () => {
    const hook = renderHook(() => useTeamReport());
    // parseTeam lazy-loads the analyze-team chunk, so parsing lands a tick later
    await act(async () => {
      hook.current.setPaste(PASTE);
      hook.current.parseTeam(PASTE);
    });
    await vi.waitFor(() => {
      expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
      expect(localStorage.getItem("vgc-team-paste-source-v2")).toBe("user");
      // Save timestamp gates restore — entries without one are evicted.
      expect(Number(localStorage.getItem("vgc-team-paste-saved-at-v2"))).toBeGreaterThan(0);
    });
  });

  // Regression: a published report resurfaced as a local "draft" on the next
  // signed-out visit because the source marker stayed "user" after publish.
  it("markPastePublished flips the source marker so mount-restore skips it", async () => {
    const hook = renderHook(() => useTeamReport());
    await act(async () => {
      hook.current.setPaste(PASTE);
      hook.current.parseTeam(PASTE);
    });
    await vi.waitFor(() => {
      expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
    });
    act(() => {
      hook.current.markPastePublished();
    });
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBe("published");
    // The published copy is snapshotted so restore can compare content later.
    expect(localStorage.getItem("vgc-team-paste-published-v2")).toBe(PASTE);
    // The paste itself stays — editing after publish re-marks it "user".
    expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
  });

  it("markPastePublished is a no-op when nothing is stored", () => {
    const hook = renderHook(() => useTeamReport());
    act(() => {
      hook.current.markPastePublished();
    });
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-published-v2")).toBeNull();
  });
});

describe("readRestorableDraft", () => {
  const seed = (over: Record<string, string | null> = {}) => {
    const entries: Record<string, string | null> = {
      "vgc-team-paste-v2": PASTE,
      "vgc-team-paste-source-v2": "user",
      "vgc-team-paste-saved-at-v2": String(Date.now()),
      "vgc-team-paste-published-v2": null,
      ...over,
    };
    for (const [key, value] of Object.entries(entries)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  };

  it("restores a fresh, unpublished user draft", () => {
    seed();
    expect(readRestorableDraft()).toBe(PASTE);
    expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
  });

  it("restores a draft that diverged from the published copy", () => {
    seed({ "vgc-team-paste-published-v2": PASTE + "\n- Thunderbolt" });
    expect(readRestorableDraft()).toBe(PASTE);
  });

  // Regression: an already-published team resurfaced as "this draft only
  // lives on this device" when the source marker was re-clobbered to "user"
  // without the paste actually changing. Content comparison against the
  // published snapshot catches this regardless of the marker.
  it("evicts a paste identical to the published copy even under a 'user' marker", () => {
    seed({ "vgc-team-paste-published-v2": PASTE });
    expect(readRestorableDraft()).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-v2")).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBeNull();
  });

  // Regression: entries written before publish tracking existed carried a
  // "user" marker even for published teams, and restored forever. No save
  // timestamp ⇒ legacy entry ⇒ evict.
  it("evicts legacy entries that lack a save timestamp", () => {
    seed({ "vgc-team-paste-saved-at-v2": null });
    expect(readRestorableDraft()).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-v2")).toBeNull();
  });

  it("evicts drafts older than the TTL", () => {
    const fortyDaysAgo = Date.now() - 40 * 24 * 60 * 60 * 1000;
    seed({ "vgc-team-paste-saved-at-v2": String(fortyDaysAgo) });
    expect(readRestorableDraft()).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-v2")).toBeNull();
  });

  it("evicts entries with a 'published' source marker", () => {
    seed({ "vgc-team-paste-source-v2": "published" });
    expect(readRestorableDraft()).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-v2")).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-published-v2")).toBeNull();
    expect(localStorage.getItem("vgc-team-paste-saved-at-v2")).toBeNull();
  });

  it("returns null without evicting anything when no paste is stored", () => {
    localStorage.setItem("vgc-team-paste-published-v2", PASTE);
    expect(readRestorableDraft()).toBeNull();
  });
});
