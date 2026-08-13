// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "./render-hook";
import { useTeamReport } from "@/hooks/useTeamReport";

const PASTE = "Pikachu @ Light Ball\nAbility: Static\n- Protect";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("useTeamReport paste persistence", () => {
  it("persists a parsed user paste with the 'user' source marker", () => {
    const hook = renderHook(() => useTeamReport());
    act(() => {
      hook.current.setPaste(PASTE);
      hook.current.parseTeam(PASTE);
    });
    expect(localStorage.getItem("vgc-team-paste-v2")).toBe(PASTE);
    expect(localStorage.getItem("vgc-team-paste-source-v2")).toBe("user");
  });

  // Regression: a published report resurfaced as a local "draft" on the next
  // signed-out visit because the source marker stayed "user" after publish.
  it("markPastePublished flips the source marker so mount-restore skips it", () => {
    const hook = renderHook(() => useTeamReport());
    act(() => {
      hook.current.setPaste(PASTE);
      hook.current.parseTeam(PASTE);
    });
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
