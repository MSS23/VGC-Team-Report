// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./render-hook";
import { useAutoDraft } from "@/hooks/useAutoDraft";

const reportState = {
  paste: "Pikachu @ Light Ball\nAbility: Static\n- Protect",
  notes: {},
  matchupPlans: [],
};
const analysis = { pokemon: [{ parsed: { species: "Pikachu" } }] };

function mount() {
  return renderHook(() => useAutoDraft({
    isSignedIn: true,
    analysis: analysis as never,
    isSampleTeam: false,
    isSharedView: false,
    buildShareState: () => reportState,
  }));
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useAutoDraft", () => {
  it("autosaves a new report and remembers its draft ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "draft-new" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const hook = mount();

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // VGC-267: in-session autosaves must NOT set keepalive — browsers cap
    // keepalive bodies at 64 KiB, which silently broke saves of large
    // reports. Only the exit flush (pagehide test below) uses keepalive.
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ keepalive: false });
    expect(hook.current.draftId).toBe("draft-new");
    expect(hook.current.status).toBe("saved");
    expect(localStorage.getItem("vgc-draft-id")).toBe("draft-new");
    hook.unmount();
  });

  it("updates the draft the user explicitly resumed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "draft-resumed", updated: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const hook = mount();

    act(() => hook.current.setActiveDraft("draft-resumed"));
    await act(async () => { await hook.current.saveDraft(); });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string)).toMatchObject({ draftId: "draft-resumed" });
    expect(hook.current.draftId).toBe("draft-resumed");
    hook.unmount();
  });

  it("surfaces a recoverable save error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Draft storage is unavailable" }),
    }));
    const hook = mount();

    let result: Awaited<ReturnType<typeof hook.current.saveDraft>> | undefined;
    await act(async () => { result = await hook.current.saveDraft(); });

    expect(result).toEqual({ ok: false, error: "Draft storage is unavailable" });
    expect(hook.current.status).toBe("error");
    expect(hook.current.error).toBe("Draft storage is unavailable");
    hook.unmount();
  });

  it("flushes a keepalive draft save when the page is being left", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "draft-exit" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const hook = mount();

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ keepalive: true });
    hook.unmount();
  });
});
