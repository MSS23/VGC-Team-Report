// @vitest-environment jsdom
/**
 * Regression test for BUG-SHARE-BASELINE-ORDER: fetching a share whose stored
 * row carries extra/unknown keys raised a spurious collaboration conflict.
 *
 * `useShareUrl`'s fetch path used to assign `baselineRef.current = state as
 * ShareableState` four lines *before* `parseFetchedShareState` validated that
 * same object. `ShareableStateSchema` is a `z.object()`, so validation strips
 * unknown keys (a legacy `replays` array is the documented example in
 * `url-codec.schemas.ts`), while `editorFingerprint` enumerates every key it is
 * handed. The baseline therefore carried keys the editor's working state never
 * had, the two fingerprints could not match, and `receiveRemote` reported the
 * user's untouched report as diverged on the first remote update — every time,
 * for that report.
 *
 * The baseline is now captured from the validated state, so the guard below
 * fails loudly if the ordering is ever reversed again.
 */
import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { renderHook } from "./render-hook";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("s=abcd1234") }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, userId: "owner" }) }));
import { useShareUrl } from "../useShareUrl";

/** What the editor works with — exactly the keys the schema keeps. */
const VALIDATED = { paste: "Pikachu\n- Protect", notes: {}, matchupPlans: [], creatorName: "Trainer" };

let hook: ReturnType<typeof renderHook<ReturnType<typeof useShareUrl>>>;

async function mountWithBody(body: Record<string, unknown>) {
  window.history.replaceState({}, "", "/?s=abcd1234");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));
  hook = renderHook(useShareUrl);
  // The fetch path `await import()`s the zod schemas before it settles, so
  // poll rather than sleeping a fixed interval — the first transform of zod in
  // a cold vitest worker is comfortably slower than that.
  for (let i = 0; i < 100; i++) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    if (hook.current.isSharedView || hook.current.decodeFailed) break;
  }
}

afterEach(() => { hook?.unmount(); vi.unstubAllGlobals(); });

it("does not raise a spurious conflict when the stored share carries unknown keys", async () => {
  await mountWithBody({
    ...VALIDATED,
    // Keys outside ShareableStateSchema, as `normalizeReportData`'s
    // `return { ...rest }` spread delivers them from the jsonb row.
    replays: ["https://example.com/replay"],
    legacyWidgetState: { collapsed: true },
    _editable: true, _isOwner: true, _isUnlisted: true, _isPublic: false,
    _editToken: "token", _version: 1,
  });

  // The viewer only ever saw the stripped state.
  expect(hook.current.sharedState).not.toBeNull();
  expect(hook.current.sharedState as unknown as Record<string, unknown>).not.toHaveProperty("replays");

  // A teammate's update arrives and the user has changed nothing locally, so
  // `local` is the validated state the editor was seeded with.
  let accepted = false;
  act(() => { accepted = hook.current.receiveRemote({ ...VALIDATED, teamSummary: "Teammate" }, 2, VALIDATED); });

  expect(accepted).toBe(true);
  expect(hook.current.conflict).toBeNull();
  expect(hook.current.getVersion()).toBe(2);
});

it("leaves no baseline or version behind when the fetched body fails validation", async () => {
  await mountWithBody({ paste: "Pikachu\n- Protect", notes: { "0": 42 }, matchupPlans: [], _version: 7 });

  expect(hook.current.decodeFailed).toBe(true);
  expect(hook.current.sharedState).toBeNull();
  // Version was never adopted from a body the viewer rejected, and the empty
  // baseline cannot manufacture a conflict for a report that never loaded.
  expect(hook.current.getVersion()).toBe(0);
  let accepted = false;
  act(() => { accepted = hook.current.receiveRemote({ ...VALIDATED, teamSummary: "Teammate" }, 1, VALIDATED); });
  expect(accepted).toBe(true);
  expect(hook.current.conflict).toBeNull();
});
