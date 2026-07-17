// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderHook } from "./render-hook";

// A single mutable object backs the useShareUrl mock so individual tests can
// flip flags (e.g. isEditingUnlocked) before rendering.
const shareUrl = {
  isSharedView: false,
  isSharePending: false,
  sharedState: null,
  shareId: null,
  editKeyFromUrl: null,
  copyShareUrl: vi.fn(async () => ({ ok: true })),
  freshShare: vi.fn(async () => ({ ok: true })),
  autoSave: vi.fn(async () => ({ ok: true })),
  shareStatus: "idle",
  urlWarning: null,
  decodeFailed: false,
  exitSharedView: vi.fn(),
  isEditingUnlocked: false,
  isOwner: false,
  sessionShareId: null,
  lastShareResult: null,
  openShareSheetForUrl: vi.fn(),
  getEditUrl: () => null,
  hasExistingShare: false,
  clearStoredShare: vi.fn(),
  fetchedIsPublic: null,
  fetchedIsUnlisted: null,
  fetchedCollaborators: [],
  autoSaveStatus: "idle",
  forkedFrom: null,
  forkReport: vi.fn(),
  redactedFields: [],
};

vi.mock("@/hooks/useShareUrl", () => ({ useShareUrl: () => shareUrl }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isSignedIn: true }) }));
vi.mock("@/components/providers/PostHogProvider", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

import { useShareFlow } from "@/hooks/useShareFlow";

const t = { copying: "…", copied: "Copied", updated: "Updated", failed: "Failed", share: "Share" };
const analysis = { pokemon: [{ parsed: { species: "Garchomp" } }] };

function mount(opts: Record<string, unknown> = {}) {
  return renderHook(() =>
    useShareFlow({
      analysis: analysis as never,
      isSampleTeam: false,
      buildShareState: (opts.buildShareState as never) ?? (() => ({ creatorName: "Trainer", tags: {} }) as never),
      getActiveDraftId: opts.getActiveDraftId as never,
      t: t as never,
      onSaveStart: opts.onSaveStart as never,
      onSaveEnd: opts.onSaveEnd as never,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  shareUrl.isEditingUnlocked = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useShareFlow", () => {
  it("wraps a reshare in the save-suppression bracket (§1-B)", async () => {
    const onSaveStart = vi.fn();
    const onSaveEnd = vi.fn();
    const hook = mount({ onSaveStart, onSaveEnd });

    await act(async () => {
      hook.current.handleReshare();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(shareUrl.copyShareUrl).toHaveBeenCalledTimes(1);
    expect(onSaveStart).toHaveBeenCalledTimes(1);
    expect(onSaveEnd).toHaveBeenCalledTimes(1);
  });

  it("blocks share when creatorName is missing and never fires a save", async () => {
    const hook = mount({ buildShareState: () => ({ creatorName: "", tags: {} }) });

    await act(async () => {
      await hook.current.handleShareClick();
    });

    expect(hook.current.creatorRequired).toBe(true);
    expect(shareUrl.copyShareUrl).not.toHaveBeenCalled();
  });

  it("shares when a creatorName is present", async () => {
    const hook = mount({ buildShareState: () => ({ creatorName: "Trainer", tags: {} }) });

    await act(async () => {
      await hook.current.handleShareClick();
    });

    expect(hook.current.creatorRequired).toBe(false);
    expect(shareUrl.copyShareUrl).toHaveBeenCalledTimes(1);
    expect(shareUrl.copyShareUrl).toHaveBeenCalledWith(expect.anything(), false, true, undefined);
  });

  it("publishes only the active draft", async () => {
    const hook = mount({ getActiveDraftId: () => "draft-current" });

    await act(async () => {
      await hook.current.handleShareClick();
    });

    expect(shareUrl.copyShareUrl).toHaveBeenCalledWith(expect.anything(), false, true, "draft-current");
  });

  it("autosaves after the 3s debounce once editing is unlocked", () => {
    vi.useFakeTimers();
    shareUrl.isEditingUnlocked = true;
    mount();

    expect(shareUrl.autoSave).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(shareUrl.autoSave).toHaveBeenCalledTimes(1);
  });
});
