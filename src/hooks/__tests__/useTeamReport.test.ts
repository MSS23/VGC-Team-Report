// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./render-hook";
import { useTeamReport } from "@/hooks/useTeamReport";

const PASTE = "Pikachu @ Light Ball\nAbility: Static\n- Protect";

// parseTeam lazy-loads analyze-team, which drags pokemon.ts (~243 kB) and
// dex-subset.json (~130 kB) through vite's transform on first use. On an idle
// machine that lands well inside vi.waitFor's 1000 ms default, but under a
// contended worker pool it does not, so the whole file went red only when the
// full suite ran busy — the classic "passes alone, fails in CI" shape. The
// wait is for a lazy chunk, not for application logic, so give it real
// headroom rather than letting load decide whether the suite is green.
const CHUNK_LOAD_TIMEOUT = { timeout: 15_000 };

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
    }, CHUNK_LOAD_TIMEOUT);
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
    }, CHUNK_LOAD_TIMEOUT);
    act(() => {
      hook.current.markPastePublished();
    });
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBe("published");
    // The paste itself stays — editing after publish re-marks it "user".
    expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
  });

  it("markPastePublished is a no-op when nothing is stored", () => {
    const hook = renderHook(() => useTeamReport());
    act(() => {
      hook.current.markPastePublished();
    });
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBeNull();
  });
});
